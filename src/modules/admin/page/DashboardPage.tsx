import { useMemo, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Package, Plus, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import { orderQty, orderTotal } from '@/modules/history/data/historyData';
import { useOrders } from '@/modules/history/store/store';
import { useCatalog } from '@/modules/products/store/catalogStore';
import { AdminButton, OrderStatusChip, Panel, PanelHeader, PageHeader } from '../components/AdminUI';
import adminConst from '../consts/adminConst';

const LOW_STOCK_THRESHOLD = 5;

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
}: {
    icon: ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
    label: string;
    value: string;
    sub: string;
}) {
    return (
        <Panel className="p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        {label}
                    </p>
                    <p
                        className="mt-1.5 truncate text-2xl font-bold tabular-nums"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                    >
                        {value}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        {sub}
                    </p>
                </div>
                <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                >
                    <Icon size={17} />
                </span>
            </div>
        </Panel>
    );
}

export default function DashboardPage() {
    const orders = useOrders();
    const products = useCatalog();

    const activeOrders = useMemo(
        () => orders.filter((order) => order.status !== 'Cancelled'),
        [orders]
    );
    const revenue = activeOrders.reduce((sum, order) => sum + orderTotal(order), 0);
    const unitsSold = activeOrders.reduce((count, order) => count + orderQty(order), 0);
    const averageOrder = activeOrders.length > 0 ? Math.round(revenue / activeOrders.length) : 0;

    const publishedProducts = products.filter((product) => !product.hidden);
    const unpublishedCount = products.length - publishedProducts.length;
    const lowStock = publishedProducts
        .filter((product) => product.available && product.stock <= LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock);

    /** Units and revenue per product across every non-cancelled order. */
    const topSellers = useMemo(() => {
        const rows = new Map<string, { id: string; name: string; image: string; units: number; revenue: number }>();
        activeOrders.forEach((order) => {
            order.items.forEach((item) => {
                const row = rows.get(item.id) ?? {
                    id: item.id,
                    name: item.name,
                    image: item.image,
                    units: 0,
                    revenue: 0,
                };
                row.units += item.qty;
                row.revenue += item.price * item.qty;
                rows.set(item.id, row);
            });
        });
        return [...rows.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [activeOrders]);
    const topRevenue = topSellers[0]?.revenue ?? 0;

    const recentOrders = orders.slice(0, 5);

    return (
        <div>
            <PageHeader
                title="Dashboard"
                description="Storefront performance from this browser — orders and products live in localStorage."
            >
                <Link to={adminConst.route.productsPage}>
                    <AdminButton variant="primary">
                        <Plus size={14} />
                        Add product
                    </AdminButton>
                </Link>
                <Link to={adminConst.route.ordersPage}>
                    <AdminButton>Manage orders</AdminButton>
                </Link>
            </PageHeader>

            {/* ── KPI row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <StatCard
                    icon={Wallet}
                    label="Revenue"
                    value={inr(revenue)}
                    sub={`${activeOrders.length} paid orders · avg ${inr(averageOrder)}`}
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Orders"
                    value={String(orders.length)}
                    sub={`${orders.length - activeOrders.length} cancelled`}
                />
                <StatCard icon={TrendingUp} label="Units sold" value={String(unitsSold)} sub="Across all orders" />
                <StatCard
                    icon={Package}
                    label="Published products"
                    value={String(publishedProducts.length)}
                    sub={`${unpublishedCount} unpublished · ${lowStock.length} low stock`}
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    {/* ── Top sellers ─────────────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Top sellers"
                            meta="By revenue across non-cancelled orders"
                            action={
                                <Link
                                    to={adminConst.route.productsPage}
                                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                    style={{ color: Theme.colors.accentDark }}
                                >
                                    All products
                                    <ArrowRight size={13} />
                                </Link>
                            }
                        />
                        <ul className="divide-y" style={{ borderColor: Theme.colors.border }}>
                            {topSellers.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex items-center gap-3 px-4 py-3 sm:px-5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <img
                                        src={row.image}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold sm:text-[13px]">
                                            {row.name}
                                        </p>
                                        <div
                                            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                                            style={{ backgroundColor: Theme.colors.surfaceAlt }}
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${topRevenue > 0 ? Math.max((row.revenue / topRevenue) * 100, 4) : 0}%`,
                                                    backgroundColor: Theme.colors.primary,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-xs font-bold tabular-nums">{inr(row.revenue)}</p>
                                        <p className="text-[10px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.units} unit{row.units === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                            {topSellers.length === 0 && (
                                <li className="px-4 py-6 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                    No sales yet.
                                </li>
                            )}
                        </ul>
                    </Panel>

                    {/* ── Recent orders ───────────────────────────── */}
                    <Panel>
                        <PanelHeader
                            title="Recent orders"
                            meta={`${orders.length} total`}
                            action={
                                <Link
                                    to={adminConst.route.ordersPage}
                                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                    style={{ color: Theme.colors.accentDark }}
                                >
                                    Open orders
                                    <ArrowRight size={13} />
                                </Link>
                            }
                        />
                        <ul>
                            {recentOrders.map((order) => (
                                <li
                                    key={order.id}
                                    className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold sm:text-[13px]">{order.id}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {order.placedOn} · {orderQty(order)} item
                                            {orderQty(order) === 1 ? '' : 's'} · {order.payment}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold tabular-nums">
                                            {order.status === 'Cancelled' ? 'Refunded' : inr(orderTotal(order))}
                                        </span>
                                        <OrderStatusChip status={order.status} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>

                {/* ── Right column ────────────────────────────────── */}
                <div className="flex flex-col gap-6">
                    <Panel>
                        <PanelHeader
                            title="Low stock"
                            meta={`${lowStock.length} live product${lowStock.length === 1 ? '' : 's'} at or below ${LOW_STOCK_THRESHOLD} units`}
                        />
                        <ul>
                            {lowStock.map((product) => (
                                <li
                                    key={product.id}
                                    className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <img
                                        src={product.image}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold">{product.name}</p>
                                        <p className="mt-0.5 text-[10px]" style={{ color: Theme.colors.textMuted }}>
                                            {product.sku}
                                        </p>
                                    </div>
                                    <span
                                        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                        style={{
                                            backgroundColor: 'color-mix(in srgb, ' + Theme.colors.accent + ' 18%, ' + Theme.colors.surface + ')',
                                            color: Theme.colors.accentDark,
                                        }}
                                    >
                                        <AlertTriangle size={11} />
                                        {product.stock} left
                                    </span>
                                </li>
                            ))}
                            {lowStock.length === 0 && (
                                <li className="px-4 py-6 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                    Every live product is well stocked.
                                </li>
                            )}
                        </ul>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Catalogue" meta="Live storefront snapshot" />
                        <dl className="grid grid-cols-2 gap-px" style={{ backgroundColor: Theme.colors.border }}>
                            {[
                                { label: 'Total products', value: products.length },
                                { label: 'Published', value: publishedProducts.length },
                                { label: 'Unpublished', value: unpublishedCount },
                                { label: 'Out of stock', value: products.filter((p) => !p.available).length },
                            ].map((row) => (
                                <div
                                    key={row.label}
                                    className="px-4 py-3.5"
                                    style={{ backgroundColor: Theme.colors.surface }}
                                >
                                    <dt
                                        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        {row.label}
                                    </dt>
                                    <dd className="mt-1 text-lg font-bold tabular-nums">{row.value}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="px-4 py-3 sm:px-5">
                            <Link
                                to={adminConst.route.productsPage}
                                className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                style={{ color: Theme.colors.accentDark }}
                            >
                                Manage catalogue
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
