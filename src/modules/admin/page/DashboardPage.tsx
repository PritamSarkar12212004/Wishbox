import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Ban,
    IndianRupee,
    Package,
    Plus,
    RotateCcw,
    ShoppingBag,
    Timer,
    Truck,
    Users,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr, inrCompact } from '@/lib/format';
import { useCatalog } from '@/modules/products/store/catalogStore';
import { AdminButton, AdminStatusChip, Panel, PanelHeader, PageHeader } from '../components/AdminUI';
import BarList from '../components/charts/BarList';
import DonutChart from '../components/charts/DonutChart';
import TrendChart from '../components/charts/TrendChart';
import DataTable from '../components/DataTable';
import OrderDetailDialog from '../components/OrderDetailDialog';
import RangePicker from '../components/RangePicker';
import StatCard from '../components/StatCard';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import { PAYMENT_COLORS } from '../consts/paymentConst';
import type { AdminOrder } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import {
    buildSeries,
    computeMetrics,
    customerAnalytics,
    deliveryAnalytics,
    inventoryAnalytics,
    paymentAnalytics,
    percentChange,
    previousRange,
    rangeLabel,
    resolveRange,
    returnsAnalytics,
    salesByCategory,
    statusBreakdown,
    topProducts,
} from '../lib/analytics';
import { useAdminSettings } from '../store/settingsStore';

const route = adminConst.route;

export default function DashboardPage() {
    const { dataset, orders, returns: returnRequests, index } = useAdminFeed();
    const settings = useAdminSettings();
    const products = useCatalog();
    const { now, key, setKey, range, setCustom } = useAdminRange('30d');
    const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
    const [selected, setSelected] = useState<AdminOrder | null>(null);

    const view = useMemo(() => {
        const previous = previousRange(range);

        return {
            current: computeMetrics(orders, range, index),
            before: computeMetrics(orders, previous, index),
            today: computeMetrics(orders, resolveRange('today', now), index),
            series: buildSeries(orders, range),
            status: statusBreakdown(orders, range),
            categories: salesByCategory(orders, range),
            top: topProducts(orders, range, products, 5),
            inventory: inventoryAnalytics(products, dataset.restocks, settings.lowStockThreshold, now),
            customers: customerAnalytics(orders, range, dataset.customers, index),
            payments: paymentAnalytics(orders, range, returnRequests),
            delivery: deliveryAnalytics(orders, range),
            returns: returnsAnalytics(returnRequests, range),
            recent: orders.slice(0, 6),
        };
    }, [orders, range, index, products, dataset, returnRequests, settings.lowStockThreshold, now]);

    const { current, before, today, series, status, categories, top, inventory, customers, payments, delivery, returns, recent } = view;

    const delta = (now_: number, then: number) => percentChange(now_, then);
    const periodLabel = rangeLabel(key, range);

    return (
        <div>
            <PageHeader
                title="Dashboard"
                description={`${periodLabel} · every number is computed from the live catalogue and order feed.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={(next) => setCustom(next)} />
                <Link to={route.addProductPage}>
                    <AdminButton variant="primary">
                        <Plus size={14} />
                        Add product
                    </AdminButton>
                </Link>
            </PageHeader>

            {/* ── KPI row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <StatCard
                    icon={IndianRupee}
                    label="Total revenue"
                    value={inr(current.revenue)}
                    delta={delta(current.revenue, before.revenue)}
                    sub={`${inr(today.revenue)} today`}
                    spark={series.map((point) => point.revenue)}
                    to={route.analyticsSalesPage}
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Total orders"
                    value={compactCount(current.orders)}
                    delta={delta(current.orders, before.orders)}
                    sub={`${today.orders} placed today`}
                    spark={series.map((point) => point.orders)}
                    to={route.ordersPage}
                />
                <StatCard
                    icon={Users}
                    label="Customers"
                    value={compactCount(current.customers)}
                    delta={delta(current.customers, before.customers)}
                    sub={`${current.newCustomers} new · ${inr(customers.lifetimeValue)} lifetime value`}
                    to={route.customersPage}
                />
                <StatCard
                    icon={Package}
                    label="Products"
                    value={String(inventory.total)}
                    sub={`${inventory.live} live · ${inventory.outOfStock.length} out of stock`}
                    to={route.inventoryPage}
                />
                <StatCard
                    icon={Timer}
                    label="Pending orders"
                    value={compactCount(current.pending)}
                    delta={delta(current.pending, before.pending)}
                    invertDelta
                    sub="Pending + processing"
                    to={route.orderStatusPage('pending')}
                />
                <StatCard
                    icon={Truck}
                    label="In transit"
                    value={compactCount(current.inTransit)}
                    delta={delta(current.inTransit, before.inTransit)}
                    sub={`${delivery.delayed.length} delayed shipments`}
                    to={route.trackingPage}
                />
                <StatCard
                    icon={RotateCcw}
                    label="Returns"
                    value={compactCount(current.returns)}
                    delta={delta(current.returns, before.returns)}
                    invertDelta
                    sub={`${returns.open} open · ${inr(returns.refundPending)} refund pending`}
                    to={route.returnsPage}
                />
                <StatCard
                    icon={Ban}
                    label="Cancelled"
                    value={compactCount(current.cancelled)}
                    delta={delta(current.cancelled, before.cancelled)}
                    invertDelta
                    sub={`${((current.orders > 0 ? current.cancelled / current.orders : 0) * 100).toFixed(1)}% of orders`}
                    to={route.orderStatusPage('cancelled')}
                />
            </div>

            {/* ── Revenue trend ──────────────────────────────────── */}
            <Panel className="mt-6">
                <PanelHeader
                    title={metric === 'revenue' ? 'Revenue over time' : 'Orders over time'}
                    meta={`${periodLabel} vs the previous period`}
                    action={
                        <div className="flex items-center gap-1.5">
                            {(['revenue', 'orders'] as const).map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setMetric(option)}
                                    className="rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                                    style={{
                                        borderColor: metric === option ? 'transparent' : Theme.colors.border,
                                        backgroundColor: metric === option ? Theme.colors.text : Theme.colors.surface,
                                        color: metric === option ? Theme.colors.background : Theme.colors.text,
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    }
                />
                <div className="px-4 py-4 sm:px-5">
                    <TrendChart
                        points={series.map((point) => ({
                            label: point.label,
                            value: metric === 'revenue' ? point.revenue : point.orders,
                            previous: metric === 'revenue' ? point.prevRevenue : point.prevOrders,
                            bars: metric === 'revenue' ? point.orders : undefined,
                        }))}
                        format={metric === 'revenue' ? inrCompact : compactCount}
                        barFormat={compactCount}
                        barLabel="Orders placed"
                    />
                </div>
            </Panel>

            {/* ── Pipeline + category mix ────────────────────────── */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <Panel>
                    <PanelHeader
                        title="Order status"
                        meta={`${compactCount(current.orders)} orders in ${periodLabel.toLowerCase()}`}
                        action={
                            <Link
                                to={route.ordersPage}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                All orders
                                <ArrowRight size={13} />
                            </Link>
                        }
                    />
                    <BarList
                        rows={status.map((row) => ({
                            label: row.status,
                            value: row.count,
                            meta: `${row.share.toFixed(0)}%`,
                        }))}
                        format={compactCount}
                    />
                </Panel>

                <Panel>
                    <PanelHeader title="Sales by category" meta="Revenue split across the catalogue" />
                    <BarList
                        rows={categories.map((row) => ({
                            label: row.label,
                            value: row.revenue,
                            meta: `${row.units} units`,
                        }))}
                        format={inr}
                        emptyLabel="No category sales in this period."
                    />
                </Panel>
            </div>

            {/* ── Recent orders ──────────────────────────────────── */}
            <div className="mt-6">
                <PanelHeader
                    title="Recent orders"
                    meta={`${compactCount(orders.length)} orders all time`}
                    action={
                        <Link
                            to={route.ordersPage}
                            className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                            style={{ color: Theme.colors.accentDark }}
                        >
                            Open orders
                            <ArrowRight size={13} />
                        </Link>
                    }
                />
                <DataTable
                    columns={[
                        {
                            key: 'order',
                            header: 'Order',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-[13px] font-bold">{order.id}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {order.placedOn}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'customer',
                            header: 'Customer',
                            hideBelow: 'sm',
                            render: (order: AdminOrder) => (
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold">{order.customer}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {order.city}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'amount',
                            header: 'Amount',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <span className="text-[13px] font-bold tabular-nums">{inr(order.amount)}</span>
                            ),
                        },
                        {
                            key: 'payment',
                            header: 'Payment',
                            hideBelow: 'md',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-xs">{order.payment}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {order.paymentStatus}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (order: AdminOrder) => <AdminStatusChip status={order.status} />,
                        },
                        {
                            key: 'action',
                            header: '',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <AdminButton onClick={() => setSelected(order)}>View</AdminButton>
                            ),
                        },
                    ]}
                    rows={recent}
                    rowKey={(order) => order.id}
                    minWidth={880}
                />
            </div>

            {/* ── Top products + inventory ───────────────────────── */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <Panel>
                    <PanelHeader
                        title="Top selling products"
                        meta="By revenue, cancellations excluded"
                        action={
                            <Link
                                to={route.analyticsProductsPage}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                Full report
                                <ArrowRight size={13} />
                            </Link>
                        }
                    />
                    <BarList
                        rows={top.map((row, position) => ({
                            label: `#${position + 1} ${row.name}`,
                            value: row.revenue,
                            meta: `${row.units} sold · ${row.stock} left`,
                            image: row.image,
                        }))}
                        format={inr}
                        emptyLabel="No sales in this period."
                    />
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Inventory alert"
                        meta={`Low stock at or below ${settings.lowStockThreshold} units`}
                        action={
                            <Link
                                to={route.inventoryPage}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                Manage
                                <ArrowRight size={13} />
                            </Link>
                        }
                    />
                    <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: Theme.colors.border }}>
                        <Tile label="Out of stock" value={String(inventory.outOfStock.length)} tone="bad" />
                        <Tile label="Low stock" value={String(inventory.lowStock.length)} tone="warn" />
                        <Tile label="Restocked" value={String(inventory.recentlyRestocked.length)} />
                    </div>
                    <ul>
                        {inventory.lowStock.slice(0, 4).map((product) => (
                            <li
                                key={product.id}
                                className="flex items-center gap-3 border-t px-4 py-2.5 sm:px-5"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <img
                                    src={product.image}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold">{product.name}</p>
                                    <p className="mt-0.5 text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                        {product.sku}
                                    </p>
                                </div>
                                <span
                                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                                    style={{
                                        backgroundColor: `color-mix(in srgb, ${Theme.colors.accent} 18%, ${Theme.colors.surface})`,
                                        color: Theme.colors.accentDark,
                                    }}
                                >
                                    {product.stock} left
                                </span>
                            </li>
                        ))}
                        {inventory.lowStock.length === 0 && (
                            <li className="px-4 py-6 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                Every live product is well stocked.
                            </li>
                        )}
                    </ul>
                </Panel>
            </div>

            {/* ── Customers ──────────────────────────────────────── */}
            <Panel className="mt-6">
                <PanelHeader
                    title="Customer analytics"
                    meta={`${periodLabel} · registered shoppers, guest checkouts excluded from customer counts`}
                    action={
                        <Link
                            to={route.customersPage}
                            className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                            style={{ color: Theme.colors.accentDark }}
                        >
                            Customer list
                            <ArrowRight size={13} />
                        </Link>
                    }
                />
                <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-6" style={{ backgroundColor: Theme.colors.border }}>
                    <Tile label="Total customers" value={compactCount(customers.total)} />
                    <Tile label="New" value={`+${compactCount(customers.newCustomers)}`} tone="good" />
                    <Tile label="Returning" value={`${customers.recurringShare.toFixed(0)}%`} />
                    <Tile label="Guest orders" value={`${customers.guestShare.toFixed(0)}%`} />
                    <Tile label="Avg order value" value={inr(customers.averageOrderValue)} />
                    <Tile label="Lifetime value" value={inr(customers.lifetimeValue)} />
                </div>
            </Panel>

            {/* ── Payments + delivery ────────────────────────────── */}
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Panel>
                    <PanelHeader
                        title="Payment analytics"
                        meta="Method mix and settlement"
                        action={
                            <Link
                                to={route.paymentsPage}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                Transactions
                                <ArrowRight size={13} />
                            </Link>
                        }
                    />
                    <div className="px-4 py-5 sm:px-5">
                        <DonutChart
                            centerValue={inrCompact(payments.collected)}
                            centerLabel="Collected"
                            segments={payments.methods.map((row) => ({
                                label: row.method,
                                value: row.count,
                                color: PAYMENT_COLORS[row.method],
                            }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ backgroundColor: Theme.colors.border }}>
                        <Tile label="Successful" value={inrCompact(payments.collected)} tone="good" />
                        <Tile label="Pending" value={inrCompact(payments.pending)} tone="warn" />
                        <Tile label="Failed" value={inrCompact(payments.failed)} tone="bad" />
                        <Tile label="Refunded" value={inrCompact(payments.refundedAmount)} />
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Delivery overview"
                        meta={`${delivery.inTransit} in the courier network`}
                        action={
                            <Link
                                to={route.trackingPage}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                {delivery.delayed.length} delayed
                                <ArrowRight size={13} />
                            </Link>
                        }
                    />
                    <BarList
                        rows={delivery.rows.map((row) => ({
                            label: row.label,
                            value: row.count,
                        }))}
                        format={compactCount}
                    />
                </Panel>
            </div>

            {/* ── Returns ────────────────────────────────────────── */}
            <Panel className="mt-6">
                <PanelHeader
                    title="Returns & refunds"
                    meta={`${returns.total} requests in ${periodLabel.toLowerCase()}`}
                    action={
                        <Link
                            to={route.returnsPage}
                            className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                            style={{ color: Theme.colors.accentDark }}
                        >
                            Review returns
                            <ArrowRight size={13} />
                        </Link>
                    }
                />
                <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ backgroundColor: Theme.colors.border }}>
                    {returns.byStatus.map((row) => (
                        <Tile
                            key={row.status}
                            label={row.status}
                            value={String(row.count)}
                            tone={row.status === 'Rejected' ? 'bad' : row.status === 'Approved' ? 'good' : undefined}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-1 border-t lg:grid-cols-2" style={{ borderColor: Theme.colors.border }}>
                    <BarList
                        rows={returns.byReason.map((row) => ({
                            label: row.reason,
                            value: row.count,
                            meta: inr(row.refunded),
                        }))}
                        format={compactCount}
                        emptyLabel="No returns in this period."
                    />
                    <div className="grid grid-cols-2 gap-px border-t lg:border-l lg:border-t-0" style={{ backgroundColor: Theme.colors.border, borderColor: Theme.colors.border }}>
                        <Tile label="Refund pending" value={inr(returns.refundPending)} tone="warn" />
                        <Tile label="Refunded" value={inr(returns.refunded)} tone="good" />
                    </div>
                </div>
            </Panel>

            <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
