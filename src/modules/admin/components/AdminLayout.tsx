import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Package, Store } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import adminConst from '../consts/adminConst';
import { adminSessionStore, useAdminSession } from '../store/sessionStore';

const NAV_ITEMS = [
    { to: adminConst.route.adminPage, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: adminConst.route.productsPage, label: 'Products', icon: Package, end: false },
    { to: adminConst.route.ordersPage, label: 'Orders', icon: ClipboardList, end: false },
];

/** Longest match wins, so /admin/products is not labelled "Dashboard". */
const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
    { prefix: adminConst.route.productsPage, title: 'Products' },
    { prefix: adminConst.route.ordersPage, title: 'Orders' },
    { prefix: adminConst.route.adminPage, title: 'Dashboard' },
];

export default function AdminLayout() {
    const signedIn = useAdminSession();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const title = PAGE_TITLES.find((item) => pathname.startsWith(item.prefix))?.title ?? 'Admin';

    useEffect(() => {
        document.title = `${title} · WishBox Admin`;
        return () => {
            document.title = 'WishBox';
        };
    }, [title]);

    if (!signedIn) {
        return <Navigate to={adminConst.route.signInPage} replace />;
    }

    function signOut() {
        adminSessionStore.signOut();
        toast('Signed out of admin');
        navigate(adminConst.route.signInPage);
    }

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
                className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r md:flex"
                style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
            >
                <div className="px-5 py-5">
                    <p
                        className="text-lg font-bold"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.primaryDark }}
                    >
                        WishBox
                    </p>
                    <p
                        className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        Admin panel
                    </p>
                </div>

                <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors"
                            style={({ isActive }) => ({
                                backgroundColor: isActive ? Theme.colors.surfaceAlt : 'transparent',
                                color: isActive ? Theme.colors.primaryDark : Theme.colors.textLight,
                                fontWeight: isActive ? 600 : 500,
                            })}
                        >
                            <Icon size={16} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t p-3" style={{ borderColor: Theme.colors.border }}>
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
                            <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold md:hidden"
                                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                            >
                                WB
                            </span>
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
                                to="/"
                                className="hidden items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70 sm:inline-flex"
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
                                Sign out
                            </button>
                        </div>
                    </div>

                    {/* Mobile nav — the sidebar is desktop-only */}
                    <nav
                        className="flex gap-1 overflow-x-auto px-3 pb-2 [&::-webkit-scrollbar]:hidden md:hidden"
                        style={{ scrollbarWidth: 'none' }}
                        aria-label="Admin"
                    >
                        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={end}
                                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                                style={({ isActive }) => ({
                                    borderColor: isActive ? 'transparent' : Theme.colors.border,
                                    backgroundColor: isActive ? Theme.colors.text : Theme.colors.surface,
                                    color: isActive ? Theme.colors.background : Theme.colors.text,
                                })}
                            >
                                <Icon size={13} />
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </header>

                <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
