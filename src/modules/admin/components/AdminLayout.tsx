import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    BarChart3,
    Bell,
    ChevronDown,
    ClipboardList,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Settings,
    Star,
    Store,
    Ticket,
    Truck,
    Users,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { useCatalog } from '@/modules/products/store/catalogStore';
import adminConst from '../consts/adminConst';
import { ORDER_STATUS_SLUGS } from '../consts/orderConst';
import { OPEN_STATUSES, type AdminOrderStatus } from '../data/adminData';
import { useAdminFeed } from '../hooks/useAdminFeed';
import { buildAlerts, inventoryAnalytics, resolveRange } from '../lib/analytics';
import { adminSessionStore, useAdminSession } from '../store/sessionStore';
import { useAdminSettings } from '../store/settingsStore';

type NavLeaf = { label: string; to: string; end?: boolean; badge?: number };

type NavEntry = {
    key: string;
    label: string;
    icon: ComponentType<{ size?: number | string }>;
    /** Single destination, or `base` + `items` for a collapsible group. */
    to?: string;
    end?: boolean;
    base?: string;
    items?: NavLeaf[];
};

const route = adminConst.route;

/** Longest matching destination wins, so nested pages get their own title. */
function titleFor(pathname: string, nav: NavEntry[]): string {
    let best = { title: 'Admin', length: -1 };
    nav.forEach((entry) => {
        const leaves: NavLeaf[] = entry.items ?? (entry.to ? [{ label: entry.label, to: entry.to }] : []);
        leaves.forEach((leaf) => {
            if (leaf.to.length > best.length && (pathname === leaf.to || pathname.startsWith(`${leaf.to}/`))) {
                best = { title: leaf.label, length: leaf.to.length };
            }
        });
    });
    return best.title;
}

const isWithin = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export default function AdminLayout() {
    const signedIn = useAdminSession();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const settings = useAdminSettings();
    const products = useCatalog();
    const { dataset, orders, returns } = useAdminFeed();
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const [drawerOpen, setDrawerOpen] = useState(false);

    /** Counts that make the sidebar useful at a glance. */
    const counts = useMemo(() => {
        const range = resolveRange('30d');
        const recent = orders.filter((order) => order.placedAt >= range.from);
        const inventory = inventoryAnalytics(products, dataset.restocks, settings.lowStockThreshold);
        const openReturns = returns.filter(
            (entry) => (entry.status === 'Requested' || entry.status === 'Processing') && entry.requestedAt >= range.from
        ).length;

        const byStatus = (status: AdminOrderStatus) =>
            recent.filter((order) => order.status === status).length;

        return {
            openOrders: recent.filter((order) => OPEN_STATUSES.includes(order.status)).length,
            byStatus,
            openReturns,
            lowStock: inventory.lowStock.length + inventory.outOfStock.length,
            pendingReviews: dataset.reviews.filter((review) => review.status === 'Pending').length,
            alerts: buildAlerts(orders, inventory, returns, range).length,
        };
    }, [orders, dataset, returns, products, settings.lowStockThreshold]);

    const nav: NavEntry[] = useMemo(
        () => [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, to: route.adminPage, end: true },
            {
                key: 'products',
                label: 'Products',
                icon: Package,
                base: route.productsPage,
                items: [
                    { label: 'All Products', to: route.productsPage, end: true },
                    { label: 'Add Product', to: route.addProductPage },
                    { label: 'Categories', to: route.categoriesPage },
                    { label: 'Brands', to: route.brandsPage },
                    { label: 'Inventory', to: route.inventoryPage, badge: counts.lowStock },
                ],
            },
            {
                key: 'orders',
                label: 'Orders',
                icon: ClipboardList,
                base: route.ordersPage,
                items: [
                    { label: 'All Orders', to: route.ordersPage, end: true, badge: counts.openOrders },
                    ...ORDER_STATUS_SLUGS.map((entry) => ({
                        label: entry.label,
                        to: route.orderStatusPage(entry.slug),
                        badge: counts.byStatus(entry.status),
                    })),
                    { label: 'Returns', to: route.returnsPage, badge: counts.openReturns },
                ],
            },
            { key: 'customers', label: 'Customers', icon: Users, to: route.customersPage },
            {
                key: 'shipping',
                label: 'Shipping',
                icon: Truck,
                base: route.shippingPage,
                items: [
                    { label: 'Shipments', to: route.shippingPage, end: true },
                    { label: 'Tracking', to: route.trackingPage },
                    { label: 'Courier Settings', to: route.couriersPage },
                ],
            },
            {
                key: 'payments',
                label: 'Payments',
                icon: CreditCard,
                base: route.paymentsPage,
                items: [
                    { label: 'Transactions', to: route.paymentsPage, end: true },
                    { label: 'Refunds', to: route.refundsPage },
                    { label: 'Failed Payments', to: route.failedPaymentsPage },
                ],
            },
            {
                key: 'analytics',
                label: 'Analytics',
                icon: BarChart3,
                base: '/admin/analytics',
                items: [
                    { label: 'Sales', to: route.analyticsSalesPage, end: true },
                    { label: 'Customers', to: route.analyticsCustomersPage },
                    { label: 'Products', to: route.analyticsProductsPage },
                    { label: 'Reports', to: route.reportsPage },
                ],
            },
            { key: 'coupons', label: 'Coupons & Offers', icon: Ticket, to: route.couponsPage },
            { key: 'reviews', label: 'Reviews', icon: Star, to: route.reviewsPage, badge: counts.pendingReviews },
            { key: 'notifications', label: 'Notifications', icon: Bell, to: route.notificationsPage, badge: counts.alerts },
            { key: 'settings', label: 'Settings', icon: Settings, to: route.settingsPage },
        ],
        [counts]
    );

    const title = titleFor(pathname, nav);

    useEffect(() => {
        document.title = `${title} · WishBox Admin`;
        return () => {
            document.title = 'WishBox';
        };
    }, [title]);

    if (!signedIn) {
        return <Navigate to={route.signInPage} replace />;
    }

    function signOut() {
        adminSessionStore.signOut();
        toast('Signed out of admin');
        navigate(route.signInPage);
    }

    function toggleGroup(key: string, open: boolean) {
        setOverrides((current) => ({ ...current, [key]: !open }));
    }

    const tree = (
        <NavTree
            nav={nav}
            pathname={pathname}
            overrides={overrides}
            onToggle={toggleGroup}
            onNavigate={() => setDrawerOpen(false)}
        />
    );

    return (
        <div
            className="min-h-screen w-full md:flex"
            style={{
                backgroundColor: Theme.colors.background,
                fontFamily: Theme.Typography.fontFamily,
                color: Theme.colors.text,
            }}
        >
            {/* Sidebar — desktop */}
            <aside
                className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col overflow-y-auto border-r md:flex"
                style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
            >
                <div className="px-5 py-5">
                    <p
                        className="text-lg font-bold"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.primaryDark }}
                    >
                        {settings.storeName}
                    </p>
                    <p
                        className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        Admin panel
                    </p>
                </div>

                {tree}

                <div className="mt-auto border-t p-3" style={{ borderColor: Theme.colors.border }}>
                    <NavLink
                        to="/"
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5"
                        style={{ color: Theme.colors.textLight }}
                    >
                        <Store size={15} />
                        View storefront
                    </NavLink>
                    <button
                        type="button"
                        onClick={signOut}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-black/5"
                        style={{ color: Theme.colors.textLight }}
                    >
                        <LogOut size={15} />
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header
                    className="sticky top-0 z-40 border-b"
                    style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
                >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(true)}
                                aria-label="Open admin menu"
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border md:hidden"
                                style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                            >
                                <Menu size={16} />
                            </button>
                            <p className="truncate text-sm font-bold md:text-base">{title}</p>
                            <span
                                className="hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] sm:inline-block"
                                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}
                            >
                                Demo mode
                            </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <NavLink
                                to={route.notificationsPage}
                                className="relative grid h-8 w-8 place-items-center rounded-lg border transition-colors hover:bg-black/5"
                                style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                                aria-label={`Notifications (${counts.alerts})`}
                            >
                                <Bell size={15} />
                                {counts.alerts > 0 && (
                                    <span
                                        className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold"
                                        style={{ backgroundColor: Theme.colors.accentDark, color: Theme.colors.white }}
                                    >
                                        {counts.alerts > 9 ? '9+' : counts.alerts}
                                    </span>
                                )}
                            </NavLink>
                            <NavLink
                                to="/"
                                className="hidden items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70 lg:inline-flex"
                                style={{ color: Theme.colors.textLight }}
                            >
                                <Store size={14} />
                                Storefront
                            </NavLink>
                            <button
                                type="button"
                                onClick={signOut}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
                                style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                            >
                                <LogOut size={13} />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Close admin menu"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <div
                        className="absolute left-0 top-0 flex h-full w-[268px] flex-col overflow-y-auto"
                        style={{ backgroundColor: Theme.colors.surface }}
                    >
                        <div className="flex items-center justify-between px-4 py-4">
                            <p
                                className="text-base font-bold"
                                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.primaryDark }}
                            >
                                {settings.storeName}
                            </p>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Close admin menu"
                                className="grid h-8 w-8 place-items-center rounded-lg border"
                                style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                            >
                                <X size={15} />
                            </button>
                        </div>
                        {tree}
                        <div className="mt-auto border-t p-3" style={{ borderColor: Theme.colors.border }}>
                            <NavLink
                                to="/"
                                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium"
                                style={{ color: Theme.colors.textLight }}
                            >
                                <Store size={15} />
                                View storefront
                            </NavLink>
                            <button
                                type="button"
                                onClick={signOut}
                                className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium"
                                style={{ color: Theme.colors.textLight }}
                            >
                                <LogOut size={15} />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Nav tree (shared by the sidebar and the mobile drawer)             */
/* ------------------------------------------------------------------ */

function NavTree({
    nav,
    pathname,
    overrides,
    onToggle,
    onNavigate,
}: {
    nav: NavEntry[];
    pathname: string;
    overrides: Record<string, boolean>;
    onToggle: (key: string, open: boolean) => void;
    onNavigate: () => void;
}) {
    return (
        <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-3" aria-label="Admin">
            {nav.map((entry) => {
                const active = entry.base ? isWithin(pathname, entry.base) : isWithin(pathname, entry.to ?? '');
                const open = overrides[entry.key] ?? active;

                if (!entry.items) {
                    return (
                        <NavLink
                            key={entry.key}
                            to={entry.to ?? route.adminPage}
                            end={entry.end}
                            onClick={onNavigate}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
                            style={({ isActive }) => ({
                                backgroundColor: isActive ? Theme.colors.surfaceAlt : 'transparent',
                                color: isActive ? Theme.colors.primaryDark : Theme.colors.textLight,
                                fontWeight: isActive ? 600 : 500,
                            })}
                        >
                            <entry.icon size={16} />
                            {entry.label}
                        </NavLink>
                    );
                }

                const Icon = entry.icon;
                return (
                    <div key={entry.key}>
                        <button
                            type="button"
                            onClick={() => onToggle(entry.key, open)}
                            aria-expanded={open}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-black/5"
                            style={{
                                color: active ? Theme.colors.primaryDark : Theme.colors.textLight,
                                fontWeight: active ? 600 : 500,
                            }}
                        >
                            <Icon size={16} />
                            <span className="flex-1 text-left">{entry.label}</span>
                            <ChevronDown
                                size={14}
                                className="transition-transform duration-200"
                                style={{ transform: open ? 'none' : 'rotate(-90deg)' }}
                            />
                        </button>

                        {open && (
                            <ul className="mt-0.5 mb-1 flex flex-col gap-0.5 pl-3">
                                {entry.items.map((leaf) => (
                                    <li key={leaf.to}>
                                        <NavLink
                                            to={leaf.to}
                                            end={leaf.end}
                                            onClick={onNavigate}
                                            className="flex items-center gap-2 rounded-lg py-1.5 pl-3 pr-2 text-[13px] transition-colors"
                                            style={({ isActive }) => ({
                                                backgroundColor: isActive ? Theme.colors.surfaceAlt : 'transparent',
                                                color: isActive ? Theme.colors.primaryDark : Theme.colors.textMuted,
                                                fontWeight: isActive ? 600 : 500,
                                            })}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="h-1 w-1 shrink-0 rounded-full"
                                                style={{ backgroundColor: 'currentColor', opacity: 0.5 }}
                                            />
                                            <span className="min-w-0 flex-1 truncate">{leaf.label}</span>
                                            {leaf.badge !== undefined && leaf.badge > 0 && (
                                                <span
                                                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                                                    style={{
                                                        backgroundColor: Theme.colors.surfaceAlt,
                                                        color: Theme.colors.textLight,
                                                    }}
                                                >
                                                    {leaf.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
