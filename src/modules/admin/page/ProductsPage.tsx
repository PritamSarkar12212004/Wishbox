import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import SelectMenu from '@/components/ui/select-menu';
import { inr } from '@/lib/format';
import { discountPercent, type CatalogProduct } from '@/modules/products/data/catalogData';
import { formatCategory } from '@/modules/products/lib/category';
import { catalogStore, useCatalog, useCatalogCategories } from '@/modules/products/store/catalogStore';
import { AdminButton, PageHeader, Panel, StockPill, TextInput, VisibilityPill } from '../components/AdminUI';
import adminConst from '../consts/adminConst';
import { useAdminSettings } from '../store/settingsStore';

const route = adminConst.route;

const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'published', label: 'Published' },
    { value: 'hidden', label: 'Unpublished' },
    { value: 'out', label: 'Out of stock' },
    { value: 'low', label: 'Low stock' },
];

/** Product list. Editing happens on the full-screen editor route. */
export default function ProductsPage() {
    const products = useCatalog();
    const categories = useCatalogCategories();
    const settings = useAdminSettings();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [confirmDelete, setConfirmDelete] = useState<CatalogProduct | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        return products.filter((product) => {
            if (category !== 'all' && product.category !== category) return false;
            if (status === 'published' && product.hidden) return false;
            if (status === 'hidden' && !product.hidden) return false;
            if (status === 'out' && product.available) return false;
            if (status === 'low' && !(product.available && !product.hidden && product.stock <= settings.lowStockThreshold))
                return false;
            if (!query) return true;
            return [product.name, product.brand, product.sku].join(' ').toLowerCase().includes(query);
        });
    }, [products, search, category, status, settings.lowStockThreshold]);

    function togglePublished(product: CatalogProduct) {
        catalogStore.toggleHidden(product.id);
        toast.success(
            product.hidden ? `${product.name} is published again` : `${product.name} hidden from the storefront`
        );
    }

    function handleDelete() {
        if (!confirmDelete) return;
        catalogStore.remove(confirmDelete.id);
        toast.success(`${confirmDelete.name} deleted`);
        setConfirmDelete(null);
    }

    return (
        <div>
            <PageHeader
                title="All Products"
                description={`${products.length} products in the live catalogue. Edits appear on the storefront immediately.`}
            >
                <AdminButton onClick={() => setConfirmReset(true)}>
                    <RotateCcw size={14} />
                    Reset demo catalogue
                </AdminButton>
                <Link to={route.addProductPage}>
                    <AdminButton variant="primary">
                        <Plus size={14} />
                        Add product
                    </AdminButton>
                </Link>
            </PageHeader>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: Theme.colors.textMuted }}
                    />
                    <TextInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, brand or SKU"
                        className="pl-9"
                        aria-label="Search products"
                    />
                </div>
                <SelectMenu
                    className="shrink-0 sm:w-48"
                    value={category}
                    options={[
                        { value: 'all', label: 'All categories' },
                        ...categories.map((entry) => ({ value: entry.id, label: entry.label })),
                    ]}
                    onChange={setCategory}
                    label="Filter by category"
                />
                <SelectMenu
                    className="shrink-0 sm:w-44"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={setStatus}
                    label="Filter by status"
                />
            </div>

            <Panel>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px] text-left text-sm">
                        <thead>
                            <tr
                                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                <th scope="col" className="px-4 py-3 sm:px-5">Product</th>
                                <th scope="col" className="px-4 py-3">Category</th>
                                <th scope="col" className="px-4 py-3 text-right">Price</th>
                                <th scope="col" className="px-4 py-3 text-right">Stock</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                                <th scope="col" className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((product) => {
                                const discount = discountPercent(product);
                                return (
                                    <tr key={product.id} className="border-t" style={{ borderColor: Theme.colors.border }}>
                                        <td className="px-4 py-3 sm:px-5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={product.image}
                                                    alt=""
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-[13px] font-semibold">{product.name}</p>
                                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                                        {product.brand} · {product.sku}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{formatCategory(product.category)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[13px] font-bold tabular-nums">{inr(product.price)}</span>
                                                {discount > 0 && (
                                                    <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                                        <s>{inr(product.mrp)}</s> · {discount}% off
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums">
                                            {product.stock}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-start gap-1">
                                                <VisibilityPill hidden={Boolean(product.hidden)} />
                                                <StockPill available={product.available} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    to={`${route.productsPage}/${product.id}/edit`}
                                                    aria-label={`Edit ${product.name}`}
                                                    className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-black/5"
                                                    style={{ color: Theme.colors.textLight }}
                                                >
                                                    <Pencil size={14} />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => togglePublished(product)}
                                                    aria-label={
                                                        product.hidden
                                                            ? `Publish ${product.name}`
                                                            : `Unpublish ${product.name}`
                                                    }
                                                    className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-black/5"
                                                    style={{ color: Theme.colors.textLight }}
                                                >
                                                    {product.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDelete(product)}
                                                    aria-label={`Delete ${product.name}`}
                                                    className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-black/5"
                                                    style={{ color: Theme.colors.accentDark }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <p className="text-sm font-semibold">No products match these filters</p>
                                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                                            Try a different search, category or status.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>

            {/* ── Delete confirmation ─────────────────────────────── */}
            <Dialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                <DialogContent style={{ backgroundColor: Theme.colors.surface }}>
                    <DialogHeader>
                        <DialogTitle style={{ fontFamily: Theme.Typography.headingFamily }}>
                            Delete product?
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDelete
                                ? `“${confirmDelete.name}” will be removed from the storefront. Past orders keep their own snapshot, so order history is unaffected.`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <AdminButton onClick={() => setConfirmDelete(null)}>Cancel</AdminButton>
                        <AdminButton variant="danger" onClick={handleDelete}>
                            <Trash2 size={14} />
                            Delete
                        </AdminButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Reset confirmation ──────────────────────────────── */}
            <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
                <DialogContent style={{ backgroundColor: Theme.colors.surface }}>
                    <DialogHeader>
                        <DialogTitle style={{ fontFamily: Theme.Typography.headingFamily }}>
                            Reset the catalogue?
                        </DialogTitle>
                        <DialogDescription>
                            Every product edit, addition and deletion is discarded, restoring the original demo
                            catalogue. Storefront orders are not touched.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <AdminButton onClick={() => setConfirmReset(false)}>Cancel</AdminButton>
                        <AdminButton
                            variant="danger"
                            onClick={() => {
                                catalogStore.reset();
                                toast.success('Catalogue restored to the shipped demo data');
                                setConfirmReset(false);
                            }}
                        >
                            <RotateCcw size={14} />
                            Reset catalogue
                        </AdminButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
