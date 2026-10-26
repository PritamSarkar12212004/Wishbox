import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, Plus, Users } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount } from '@/lib/format';
import { useAdminProducts } from '@/modules/products/api/useProducts';
import { AdminButton, Panel, PanelHeader, PageHeader } from '../components/AdminUI';
import StatCard from '../components/StatCard';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import { useAdminFeed } from '../hooks/useAdminFeed';
import { inventoryAnalytics } from '../lib/analytics';
import { useAdminSettings } from '../store/settingsStore';

const route = adminConst.route;

/**
 * The panel's home: the catalogue and the people.
 *
 * Orders and sales are switched off while those flows are rebuilt, so this
 * screen deliberately carries no revenue, order, payment or delivery panel.
 * A dashboard of zeros would read as a broken shop rather than a quiet one, so
 * everything here is computed from the catalogue and the account list - both of
 * which are live.
 */
export default function DashboardPage() {
    const { dataset } = useAdminFeed();
    const settings = useAdminSettings();
    const products = useAdminProducts();

    const inventory = useMemo(
        () =>
            inventoryAnalytics(products, dataset.restocks, settings.lowStockThreshold),
        [products, dataset.restocks, settings.lowStockThreshold]
    );

    const registeredCustomers = useMemo(
        () => dataset.customers.filter((customer) => !customer.isGuest).length,
        [dataset.customers]
    );

    return (
        <div>
            <PageHeader
                title="Dashboard"
                description="Catalogue health and the registered shoppers, read live from the API."
            >
                <Link to={route.addProductPage} className="shrink-0">
                    <AdminButton variant="primary">
                        <Plus size={14} />
                        Add product
                    </AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <StatCard
                    icon={Users}
                    label="Registered customers"
                    value={compactCount(registeredCustomers)}
                    sub="Guest checkouts are never counted"
                    to={route.customersPage}
                />
                <StatCard
                    icon={Package}
                    label="Products"
                    value={compactCount(inventory.total)}
                    sub={`${inventory.live} live · ${inventory.outOfStock.length} out of stock`}
                    to={route.inventoryPage}
                />
            </div>

            <Panel className="mt-6">
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
    );
}
