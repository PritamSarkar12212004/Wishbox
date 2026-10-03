import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr, inrCompact } from '@/lib/format';
import { useCatalog } from '@/modules/products/store/catalogStore';
import { AdminButton, PageHeader, Panel, PanelHeader, StockPill } from '../components/AdminUI';
import BarList from '../components/charts/BarList';
import DonutChart from '../components/charts/DonutChart';
import TrendChart from '../components/charts/TrendChart';
import DataTable from '../components/DataTable';
import RangePicker from '../components/RangePicker';
import Tile from '../components/Tile';
import { PAYMENT_COLORS } from '../consts/paymentConst';
import type { AdminOrder } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import {
    buildSeries,
    computeMetrics,
    customerAnalytics,
    inRange,
    netAmount,
    paymentAnalytics,
    percentChange,
    previousRange,
    rangeLabel,
    salesByCategory,
    topProducts,
} from '../lib/analytics';
import { downloadCsv } from '../lib/csv';

/** Revenue and order counts per city, cancellations excluded. */
function salesByCity(orders: AdminOrder[], range: { from: number; to: number }) {
    const map = new Map<string, { orders: number; revenue: number }>();
    orders.forEach((order) => {
        if (!inRange(order.placedAt, range)) return;
        const entry = map.get(order.city) ?? { orders: 0, revenue: 0 };
        entry.orders += 1;
        entry.revenue += netAmount(order);
        map.set(order.city, entry);
    });
    return [...map.entries()]
        .map(([city, entry]) => ({ city, ...entry }))
        .sort((a, b) => b.revenue - a.revenue);
}

/* ------------------------------------------------------------------ */
/*  Sales                                                             */
/* ------------------------------------------------------------------ */

export function AnalyticsSalesPage() {
    const { orders, index, returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const view = useMemo(() => {
        const previous = previousRange(range);
        return {
            current: computeMetrics(orders, range, index),
            before: computeMetrics(orders, previous, index),
            series: buildSeries(orders, range),
            categories: salesByCategory(orders, range),
            cities: salesByCity(orders, range).slice(0, 8),
            payments: paymentAnalytics(orders, range, returns),
        };
    }, [orders, range, index, returns]);

    return (
        <div>
            <PageHeader title="Sales analytics" description={`Revenue, mix and geography · ${rangeLabel(key, range)}.`}>
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile
                        label="Revenue"
                        value={inr(view.current.revenue)}
                        hint={`${percentChange(view.current.revenue, view.before.revenue)?.toFixed(1) ?? '—'}% vs previous`}
                    />
                </Panel>
                <Panel>
                    <Tile label="Orders" value={compactCount(view.current.orders)} hint={`${view.current.units} units`} />
                </Panel>
                <Panel>
                    <Tile label="Avg order value" value={inr(view.current.averageOrderValue)} tone="good" />
                </Panel>
                <Panel>
                    <Tile
                        label="Cancelled"
                        value={compactCount(view.current.cancelled)}
                        tone="bad"
                        hint={`${(
                            (view.current.orders > 0 ? view.current.cancelled / view.current.orders : 0) * 100
                        ).toFixed(1)}% of orders`}
                    />
                </Panel>
            </div>

            <Panel className="mt-6">
                <PanelHeader title="Revenue trend" meta={`${rangeLabel(key, range)} with order volume`} />
                <div className="px-4 py-4 sm:px-5">
                    <TrendChart
                        points={view.series.map((point) => ({
                            label: point.label,
                            value: point.revenue,
                            previous: point.prevRevenue,
                            bars: point.orders,
                        }))}
                        format={inrCompact}
                        barFormat={compactCount}
                        barLabel="Orders"
                    />
                </div>
            </Panel>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <Panel>
                    <PanelHeader title="By category" meta="Revenue share" />
                    <BarList
                        rows={view.categories.map((row) => ({
                            label: row.label,
                            value: row.revenue,
                            meta: `${row.units} units`,
                        }))}
                        format={inr}
                    />
                </Panel>
                <Panel>
                    <PanelHeader title="By city" meta="Top destinations" />
                    <BarList
                        rows={view.cities.map((row) => ({
                            label: row.city,
                            value: row.revenue,
                            meta: `${row.orders} orders`,
                        }))}
                        format={inr}
                    />
                </Panel>
                <Panel>
                    <PanelHeader title="By payment rail" meta="Order share" />
                    <div className="px-4 py-5 sm:px-5">
                        <DonutChart
                            centerValue={inrCompact(view.payments.collected)}
                            centerLabel="Collected"
                            segments={view.payments.methods.map((row) => ({
                                label: row.method,
                                value: row.count,
                                color: PAYMENT_COLORS[row.method],
                            }))}
                        />
                    </div>
                </Panel>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Customers                                                         */
/* ------------------------------------------------------------------ */

export function AnalyticsCustomersPage() {
    const { dataset, orders, index } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const analytics = useMemo(
        () => customerAnalytics(orders, range, dataset.customers, index),
        [orders, range, dataset.customers, index]
    );

    const top = useMemo(() => {
        return [...index.lifetimeRevenue.entries()]
            .map(([id, revenue]) => ({
                customer: dataset.customers.find((entry) => entry.id === id),
                revenue,
                orders: index.orderCount.get(id) ?? 0,
            }))
            .filter((row) => row.customer)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);
    }, [index, dataset.customers]);

    const cities = useMemo(() => salesByCity(orders, range).slice(0, 8), [orders, range]);

    return (
        <div>
            <PageHeader
                title="Customer analytics"
                description={`Acquisition, retention and value · ${rangeLabel(key, range)}.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
                <Panel>
                    <Tile label="Total" value={compactCount(analytics.total)} hint={`${analytics.activeCustomers} active`} />
                </Panel>
                <Panel>
                    <Tile label="New" value={`+${compactCount(analytics.newCustomers)}`} tone="good" />
                </Panel>
                <Panel>
                    <Tile label="Returning" value={`${analytics.recurringShare.toFixed(0)}%`} />
                </Panel>
                <Panel>
                    <Tile label="Guest orders" value={`${analytics.guestShare.toFixed(0)}%`} tone="warn" />
                </Panel>
                <Panel>
                    <Tile label="Avg order value" value={inr(analytics.averageOrderValue)} />
                </Panel>
                <Panel>
                    <Tile label="Lifetime value" value={inr(analytics.lifetimeValue)} tone="good" />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Panel>
                    <PanelHeader title="Highest lifetime value" meta="All orders, refunds netted off" />
                    <BarList
                        rows={top.map((row) => ({
                            label: row.customer?.name ?? 'Unknown',
                            value: row.revenue,
                            meta: `${row.orders} orders`,
                        }))}
                        format={inr}
                    />
                </Panel>
                <Panel>
                    <PanelHeader title="Premium cities" meta={rangeLabel(key, range)} />
                    <BarList
                        rows={cities.map((row) => ({
                            label: row.city,
                            value: row.revenue,
                            meta: `${row.orders} orders`,
                        }))}
                        format={inr}
                    />
                </Panel>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Products                                                          */
/* ------------------------------------------------------------------ */

export function AnalyticsProductsPage() {
    const { orders } = useAdminFeed();
    const products = useCatalog();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const rows = useMemo(() => {
        const sales = new Map<string, { units: number; revenue: number }>();
        orders.forEach((order) => {
            if (!inRange(order.placedAt, range)) return;
            if (order.status === 'Cancelled') return;
            order.items.forEach((item) => {
                const entry = sales.get(item.productId) ?? { units: 0, revenue: 0 };
                entry.units += item.qty;
                entry.revenue += item.price * item.qty;
                sales.set(item.productId, entry);
            });
        });

        return products
            .map((product) => ({
                product,
                units: sales.get(product.id)?.units ?? 0,
                revenue: sales.get(product.id)?.revenue ?? 0,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [products, orders, range]);

    const sold = rows.filter((row) => row.units > 0);
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);

    return (
        <div>
            <PageHeader title="Product analytics" description={`Sell-through and stock cover · ${rangeLabel(key, range)}.`}>
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Products sold" value={`${sold.length}/${rows.length}`} hint="At least one unit" />
                </Panel>
                <Panel>
                    <Tile label="Revenue" value={inr(revenue)} tone="good" />
                </Panel>
                <Panel>
                    <Tile
                        label="Avg revenue / product"
                        value={inr(rows.length > 0 ? revenue / rows.length : 0)}
                    />
                </Panel>
                <Panel>
                    <Tile
                        label="Stock cover"
                        value={`${sold.length > 0 ? Math.round(products.reduce((sum, product) => sum + product.stock, 0) / (sold.reduce((sum, row) => sum + row.units, 0) / 30)) : 0} days`}
                        hint="On hand ÷ daily sell-through"
                    />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                <Panel className="self-start">
                    <PanelHeader title="Best sellers" meta="Top 6 by revenue" />
                    <BarList
                        rows={topProducts(orders, range, products, 6).map((row, position) => ({
                            label: `#${position + 1} ${row.name}`,
                            value: row.revenue,
                            meta: `${row.units} sold · ${row.stock} left`,
                            image: row.image,
                        }))}
                        format={inr}
                        emptyLabel="No sales in this period."
                    />
                </Panel>

                <DataTable
                    minWidth={860}
                    rows={rows.slice(0, 40)}
                    rowKey={(row) => row.product.id}
                    emptyTitle="No products"
                    columns={[
                        {
                            key: 'product',
                            header: 'Product',
                            render: (row) => (
                                <div className="flex items-center gap-2.5">
                                    <img
                                        src={row.product.image}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold">{row.product.name}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.product.sku}
                                        </p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: 'units',
                            header: 'Sold',
                            align: 'right',
                            render: (row) => <span className="text-xs tabular-nums">{compactCount(row.units)}</span>,
                        },
                        {
                            key: 'revenue',
                            header: 'Revenue',
                            align: 'right',
                            render: (row) => (
                                <span className="text-[13px] font-bold tabular-nums">{inr(row.revenue)}</span>
                            ),
                        },
                        {
                            key: 'stock',
                            header: 'Stock',
                            align: 'right',
                            hideBelow: 'sm',
                            render: (row) => (
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs tabular-nums">{row.product.stock} left</span>
                                    <StockPill available={row.product.available} />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Reports                                                           */
/* ------------------------------------------------------------------ */

export function ReportsPage() {
    const { dataset, orders, index } = useAdminFeed();
    const products = useCatalog();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const metrics = useMemo(() => computeMetrics(orders, range, index), [orders, range, index]);
    const series = useMemo(() => buildSeries(orders, range), [orders, range]);
    const valuation = products.reduce((sum, product) => sum + product.stock * product.price, 0);

    const reports = [
        {
            id: 'sales-daily',
            title: 'Sales by day',
            description: 'Bucketed revenue, order count and the previous period alongside.',
            rows: series.length,
            build: () => [
                ['Bucket', 'Revenue', 'Orders', 'Previous revenue', 'Previous orders'],
                ...series.map((point) => [point.label, point.revenue, point.orders, point.prevRevenue, point.prevOrders]),
            ],
        },
        {
            id: 'orders',
            title: 'Order book',
            description: 'Every order in the window with status, payment rail and value.',
            rows: orders.filter((order) => inRange(order.placedAt, range)).length,
            build: () => [
                ['Order', 'Placed', 'Customer', 'City', 'Status', 'Payment', 'Payment status', 'Amount'],
                ...orders
                    .filter((order) => inRange(order.placedAt, range))
                    .map((order) => [
                        order.id,
                        order.placedOn,
                        order.customer,
                        order.city,
                        order.status,
                        order.payment,
                        order.paymentStatus,
                        order.amount,
                    ]),
            ],
        },
        {
            id: 'products',
            title: 'Product performance',
            description: 'Whole catalogue with stock, price and status for merchandising reviews.',
            rows: products.length,
            build: () => [
                ['SKU', 'Product', 'Brand', 'Category', 'Price', 'Stock', 'In stock', 'Published'],
                ...products.map((product) => [
                    product.sku,
                    product.name,
                    product.brand,
                    product.category,
                    product.price,
                    product.stock,
                    product.available ? 'yes' : 'no',
                    product.hidden ? 'no' : 'yes',
                ]),
            ],
        },
        {
            id: 'inventory',
            title: 'Inventory valuation',
            description: 'Stock on hand valued at selling price, for the finance close.',
            rows: products.length,
            build: () => [
                ['SKU', 'Product', 'Stock', 'Price', 'Stock value'],
                ...products.map((product) => [
                    product.sku,
                    product.name,
                    product.stock,
                    product.price,
                    product.stock * product.price,
                ]),
                ['', 'Total', '', '', valuation],
            ],
        },
        {
            id: 'customers',
            title: 'Customer value',
            description: 'Registered customers ranked by lifetime revenue.',
            rows: dataset.customers.filter((customer) => !customer.isGuest).length,
            build: () => [
                ['Customer', 'Email', 'City', 'Orders', 'Lifetime value'],
                ...[...index.lifetimeRevenue.entries()]
                    .map(([id, revenue]) => {
                        const customer = dataset.customers.find((entry) => entry.id === id);
                        return customer
                            ? [customer.name, customer.email, customer.city, index.orderCount.get(id) ?? 0, revenue]
                            : null;
                    })
                    .filter((row): row is (string | number)[] => row !== null)
                    .sort((a, b) => Number(b[4]) - Number(a[4])),
            ],
        },
        {
            id: 'returns',
            title: 'Returns register',
            description: 'Return requests with reason, decision and refund value.',
            rows: dataset.returns.length,
            build: () => [
                ['Return', 'Order', 'Customer', 'Reason', 'Status', 'Refund', 'Refunded'],
                ...dataset.returns.map((entry) => [
                    entry.id,
                    entry.orderId,
                    entry.customer,
                    entry.reason,
                    entry.status,
                    entry.refundAmount,
                    entry.refunded ? 'yes' : 'no',
                ]),
            ],
        },
    ];

    return (
        <div>
            <PageHeader
                title="Reports"
                description="Generated in the browser from the live catalogue and order feed — nothing is uploaded anywhere."
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Revenue" value={inr(metrics.revenue)} hint={rangeLabel(key, range)} />
                </Panel>
                <Panel>
                    <Tile label="Orders" value={compactCount(metrics.orders)} />
                </Panel>
                <Panel>
                    <Tile label="Customers" value={compactCount(metrics.customers)} hint={`${metrics.newCustomers} new`} />
                </Panel>
                <Panel>
                    <Tile label="Inventory value" value={inrCompact(valuation)} hint="At selling price" />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => (
                    <Panel key={report.id} className="flex h-full flex-col p-4">
                        <h2 className="text-sm font-bold">{report.title}</h2>
                        <p className="mt-1.5 flex-1 text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                            {report.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {compactCount(report.rows)} rows
                            </span>
                            <AdminButton
                                variant="primary"
                                onClick={() => {
                                    downloadCsv(`wishbox-${report.id}.csv`, report.build());
                                    toast.success(`${report.title} exported`, {
                                        description: 'Saved as a CSV in your downloads folder.',
                                    });
                                }}
                            >
                                <Download size={13} />
                                Download CSV
                            </AdminButton>
                        </div>
                    </Panel>
                ))}
            </div>
        </div>
    );
}
