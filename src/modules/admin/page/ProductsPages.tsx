import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, PackagePlus, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr } from '@/lib/format';
import {
    useAdminProducts,
    useCatalogCategories,
    useUpdateProduct,
} from '@/modules/products/api/useProducts';
import type { CatalogProduct } from '@/modules/products/api/productApi';
import { AdminButton, AdminTabs, PageHeader, Panel, PanelHeader, StockPill, VisibilityPill } from '../components/AdminUI';
import CategoryCatalogueDialog from '../components/CategoryCatalogueDialog';
import LibraryCataloguesPanel from '../components/LibraryCataloguesPanel';
import BarList from '../components/charts/BarList';
import DataTable from '../components/DataTable';
import RangePicker from '../components/RangePicker';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import type { AdminOrder } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { inRange, inventoryAnalytics, rangeLabel, salesByCategory } from '../lib/analytics';
import { useAdminSettings } from '../store/settingsStore';

const route = adminConst.route;

/** Units and revenue per brand, from non-cancelled orders in the window. */
function salesByBrand(orders: AdminOrder[], range: { from: number; to: number }) {
    const map = new Map<string, { units: number; revenue: number }>();
    orders.forEach((order) => {
        if (!inRange(order.placedAt, range)) return;
        if (order.status === 'Cancelled') return;
        order.items.forEach((item) => {
            const row = map.get(item.brand) ?? { units: 0, revenue: 0 };
            row.units += item.qty;
            row.revenue += item.price * item.qty;
            map.set(item.brand, row);
        });
    });
    return map;
}

/* ------------------------------------------------------------------ */
/*  Categories                                                        */
/* ------------------------------------------------------------------ */

export function CategoriesPage() {
    const products = useAdminProducts();
    const categories = useCatalogCategories();
    const { orders } = useAdminFeed();
    const settings = useAdminSettings();
    const { key, setKey, range, setCustom } = useAdminRange('30d');
    const [catalogueFor, setCatalogueFor] = useState<string | null>(null);
    /* Two jobs on one screen: a catalogue per category, or the files that belong
       to no category at all. */
    const [tab, setTab] = useState<'categories' | 'library'>('categories');
    const editingCategory = categories.find((category) => category.id === catalogueFor);

    const view = useMemo(() => {
        const sales = new Map(salesByCategory(orders, range).map((row) => [row.category, row]));
        return categories
            .map((category) => {
                const id = category.id;
                const inCategory = products.filter((product) => product.category === id);
                const live = inCategory.filter((product) => !product.hidden);
                const sale = sales.get(id);
                return {
                    id,
                    label: category.label,
                    products: inCategory.length,
                    live: live.length,
                    stock: live.reduce((sum, product) => sum + product.stock, 0),
                    lowStock: live.filter(
                        (product) => product.available && product.stock <= settings.lowStockThreshold
                    ).length,
                    outOfStock: inCategory.filter((product) => !product.available).length,
                    units: sale?.units ?? 0,
                    revenue: sale?.revenue ?? 0,
                };
            });
    }, [categories, products, orders, range, settings.lowStockThreshold]);

    return (
        <div>
            <PageHeader
                title="Categories"
                description={
                    tab === 'categories'
                        ? `Catalogue shape and demand per category · ${rangeLabel(key, range)}.`
                        : 'Catalogues without a category — lookbooks, trade lists and gift guides.'
                }
            >
                <AdminTabs
                    label="Catalogue sections"
                    value={tab}
                    onChange={(value) => setTab(value as 'categories' | 'library')}
                    tabs={[
                        { value: 'categories', label: 'Categories' },
                        { value: 'library', label: 'Other catalogues' },
                    ]}
                />
                {tab === 'categories' && (
                    <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                )}
            </PageHeader>

            {tab === 'library' ? (
                <LibraryCataloguesPanel />
            ) : (
            /* Stacked, not side by side: this table is wider than a split column, so a
                two-column layout clipped its last columns behind a scrollbar. */
            <div className="flex flex-col gap-6">
                <Panel>
                    <PanelHeader title="Revenue by category" meta={rangeLabel(key, range)} />
                    <BarList
                        rows={view.map((row) => ({
                            label: row.label,
                            value: row.revenue,
                            meta: `${row.units} units`,
                        }))}
                        format={inr}
                        emptyLabel="No sales in this period."
                    />
                </Panel>

                <div>
                    <PanelHeader
                        title="Category health"
                        meta="Catalogue size, stock and sales for every category"
                    />
                    <DataTable
                        minWidth={720}
                        rows={view}
                        rowKey={(row) => row.id}
                        emptyTitle="No categories"
                        columns={[
                            {
                                key: 'category',
                                header: 'Category',
                                render: (row) => (
                                    <div>
                                        <p className="text-[13px] font-bold">{row.label}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.products} products · {row.live} live
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'stock',
                                header: 'In stock',
                                align: 'right',
                                render: (row) => <span className="text-xs tabular-nums">{compactCount(row.stock)} units</span>,
                            },
                            {
                                key: 'alerts',
                                header: 'Alerts',
                                align: 'right',
                                render: (row) => (
                                    <span className="text-xs tabular-nums">
                                        {row.lowStock} low · {row.outOfStock} out
                                    </span>
                                ),
                            },
                            {
                                key: 'units',
                                header: 'Sold',
                                align: 'right',
                                hideBelow: 'sm',
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
                                key: 'catalogue',
                                header: 'Catalogue',
                                align: 'right',
                                render: (row) => (
                                    <AdminButton onClick={() => setCatalogueFor(row.id)}>
                                        {(categories.find((category) => category.id === row.id)?.catalogue ||
                                            (categories.find((category) => category.id === row.id)?.catalogues?.length ?? 0) > 0)
                                            ? 'Manage'
                                            : 'Upload'}
                                    </AdminButton>
                                ),
                            },
                        ]}
                    />
                    <Panel className="mt-4 p-4">
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Categories come from the storefront filter bar — a product always belongs to exactly one, so
                            revenue here can never double count. Each category can carry multiple PDF/Word catalogues;
                            upload each file separately and shoppers get an individual download card for each one.
                        </p>
                    </Panel>
                </div>
            </div>
            )}

            {editingCategory && (
                <CategoryCatalogueDialog
                    key={editingCategory.id}
                    category={editingCategory}
                    open
                    onOpenChange={(next) => !next && setCatalogueFor(null)}
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Brands                                                            */
/* ------------------------------------------------------------------ */

export function BrandsPage() {
    const products = useAdminProducts();
    const { orders } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const rows = useMemo(() => {
        const sales = salesByBrand(orders, range);
        const names = [...new Set(products.map((product) => product.brand))];
        return names
            .map((brand) => {
                const inBrand = products.filter((product) => product.brand === brand);
                const sale = sales.get(brand);
                return {
                    brand,
                    products: inBrand.length,
                    live: inBrand.filter((product) => !product.hidden).length,
                    rating: inBrand.reduce((sum, product) => sum + product.rating, 0) / Math.max(inBrand.length, 1),
                    reviews: inBrand.reduce((sum, product) => sum + product.reviewCount, 0),
                    stock: inBrand.reduce((sum, product) => sum + product.stock, 0),
                    units: sale?.units ?? 0,
                    revenue: sale?.revenue ?? 0,
                };
            })
            .sort((a, b) => b.revenue - a.revenue);
    }, [products, orders, range]);

    return (
        <div>
            <PageHeader title="Brands" description={`Supplier performance across the catalogue · ${rangeLabel(key, range)}.`}>
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <DataTable
                minWidth={860}
                rows={rows}
                rowKey={(row) => row.brand}
                emptyTitle="No brands"
                columns={[
                    {
                        key: 'brand',
                        header: 'Brand',
                        render: (row) => (
                            <div>
                                <p className="text-[13px] font-bold">{row.brand}</p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {row.products} products · {row.live} live
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: 'rating',
                        header: 'Rating',
                        align: 'right',
                        render: (row) => (
                            <span className="text-xs tabular-nums">
                                {row.rating.toFixed(1)} <span style={{ color: Theme.colors.textMuted }}>★</span>
                            </span>
                        ),
                    },
                    {
                        key: 'reviews',
                        header: 'Reviews',
                        align: 'right',
                        hideBelow: 'md',
                        render: (row) => <span className="text-xs tabular-nums">{compactCount(row.reviews)}</span>,
                    },
                    {
                        key: 'stock',
                        header: 'Stock',
                        align: 'right',
                        hideBelow: 'sm',
                        render: (row) => <span className="text-xs tabular-nums">{compactCount(row.stock)}</span>,
                    },
                    {
                        key: 'units',
                        header: `Sold · ${rangeLabel(key, range)}`,
                        align: 'right',
                        render: (row) => <span className="text-xs tabular-nums">{compactCount(row.units)}</span>,
                    },
                    {
                        key: 'revenue',
                        header: 'Revenue',
                        align: 'right',
                        render: (row) => <span className="text-[13px] font-bold tabular-nums">{inr(row.revenue)}</span>,
                    },
                ]}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Inventory                                                         */
/* ------------------------------------------------------------------ */

export function InventoryPage() {
    const products = useAdminProducts();
    const settings = useAdminSettings();
    const { dataset } = useAdminFeed();
    const updateProduct = useUpdateProduct();

    const inventory = useMemo(
        () => inventoryAnalytics(products, dataset.restocks, settings.lowStockThreshold),
        [products, dataset.restocks, settings.lowStockThreshold]
    );

    async function restock(product: CatalogProduct, units = 25) {
        const nextStock = product.stock + units;
        try {
            await updateProduct.mutateAsync({
                slug: product.id,
                patch: { stock: nextStock, available: true },
            });
            toast.success(`${product.name} restocked`, {
                description: `+${units} units · now ${nextStock} in stock`,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not restock');
        }
    }

    return (
        <div>
            <PageHeader
                title="Inventory"
                description={`${inventory.live} live products · low stock at or below ${settings.lowStockThreshold} units. Restocking here updates the storefront immediately.`}
            >
                <Link to={route.productsPage}>
                    <AdminButton>Manage catalogue</AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Products" value={String(inventory.total)} hint={`${inventory.live} published`} />
                </Panel>
                <Panel>
                    <Tile label="Out of stock" value={String(inventory.outOfStock.length)} tone="bad" hint="Buy buttons hidden" />
                </Panel>
                <Panel>
                    <Tile
                        label="Low stock"
                        value={String(inventory.lowStock.length)}
                        tone="warn"
                        hint={`At or below ${settings.lowStockThreshold}`}
                    />
                </Panel>
                <Panel>
                    <Tile
                        label="Recently restocked"
                        value={String(inventory.recentlyRestocked.length)}
                        tone="good"
                        hint="Last 21 days"
                    />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Panel className="self-start">
                    <PanelHeader
                        title="Low stock"
                        meta={`${inventory.lowStock.length} live products need reordering`}
                        action={<TriangleAlert size={15} style={{ color: Theme.colors.secondary }} />}
                    />
                    <ul>
                        {inventory.lowStock.map((product) => (
                                <li
                                    key={product.id}
                                    className="flex flex-wrap items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5"
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
                                        <p className="mt-0.5 text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                            {product.sku} · {product.stock} in stock
                                        </p>
                                    </div>
                                    <AdminButton variant="primary" onClick={() => restock(product)}>
                                        <PackagePlus size={13} />
                                        Restock +25
                                    </AdminButton>
                            </li>
                        ))}
                        {inventory.lowStock.length === 0 && (
                            <li className="px-4 py-8 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                Every live product is well stocked.
                            </li>
                        )}
                    </ul>
                </Panel>

                <div className="flex flex-col gap-6">
                    <Panel>
                        <PanelHeader
                            title="Out of stock"
                            meta={`${inventory.outOfStock.length} products cannot be bought`}
                            action={<Boxes size={15} style={{ color: Theme.colors.accentDark }} />}
                        />
                        <ul>
                            {inventory.outOfStock.map((product) => (
                                <li
                                    key={product.id}
                                    className="flex flex-wrap items-center gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5"
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
                                        <p className="mt-0.5 text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                            {product.sku}
                                        </p>
                                    </div>
                                    <AdminButton onClick={() => restock(product, 20)}>Mark in stock</AdminButton>
                            </li>
                        ))}
                        {inventory.outOfStock.length === 0 && (
                            <li className="px-4 py-8 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                Nothing is out of stock right now.
                            </li>
                        )}
                        </ul>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Recently restocked" meta="Last 21 days of deliveries into stock" />
                        <ul>
                            {inventory.recentlyRestocked.slice(0, 6).map((entry) => (
                                <li
                                    key={`${entry.product.id}-${entry.at}`}
                                    className="flex items-center gap-3 border-t px-4 py-2.5 first:border-t-0 sm:px-5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <img
                                        src={entry.product.image}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold">{entry.product.name}</p>
                                        <p className="mt-0.5 text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                            +{entry.units} units ·{' '}
                                            {new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(entry.at)}
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <StockPill available={entry.product.available} />
                                        <VisibilityPill hidden={Boolean(entry.product.hidden)} />
                                    </div>
                                </li>
                            ))}
                            {inventory.recentlyRestocked.length === 0 && (
                                <li className="px-4 py-8 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                    No restocks logged recently.
                                </li>
                            )}
                        </ul>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
