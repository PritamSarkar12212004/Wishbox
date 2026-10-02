import { useMemo, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { inr } from '@/lib/format';
import { FALLBACK_IMAGE } from '@/lib/image';
import productConst from '@/modules/products/consts/productConst';
import {
    FLAGSHIP_PRODUCT_ID,
    type CatalogProduct,
    type ProductBadge,
    type ProductCategoryId,
} from '@/modules/products/data/catalogData';
import { catalogStore, useCatalog, type NewProductInput } from '@/modules/products/store/catalogStore';
import {
    AdminButton,
    Field,
    PageHeader,
    Panel,
    StockPill,
    TextArea,
    TextInput,
    VisibilityPill,
} from '../components/AdminUI';

const LOW_STOCK_THRESHOLD = 5;

const CATEGORY_OPTIONS = productConst.categories
    .filter((category) => category.value !== 'all')
    .map((category) => ({ value: category.value, label: category.label }));

const STATUS_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'published', label: 'Published' },
    { value: 'hidden', label: 'Unpublished' },
    { value: 'out', label: 'Out of stock' },
    { value: 'low', label: 'Low stock (≤ 5)' },
];

const BADGE_OPTIONS = [
    { value: 'none', label: 'No badge' },
    { value: 'SALE', label: 'SALE' },
    { value: 'BESTSELLER', label: 'BESTSELLER' },
    { value: 'NEW', label: 'NEW' },
];

const categoryLabel = (value: ProductCategoryId) =>
    productConst.categories.find((category) => category.value === value)?.label ?? value;

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

type ProductForm = {
    name: string;
    brand: string;
    category: ProductCategoryId;
    price: string;
    mrp: string;
    stock: string;
    rating: string;
    reviewCount: string;
    image: string;
    hoverImage: string;
    description: string;
    highlights: string;
    badge: string;
    available: boolean;
    hidden: boolean;
};

const EMPTY_FORM: ProductForm = {
    name: '',
    brand: '',
    category: 'paper-craft',
    price: '',
    mrp: '',
    stock: '10',
    rating: '4.5',
    reviewCount: '0',
    image: '',
    hoverImage: '',
    description: '',
    highlights: '',
    badge: 'none',
    available: true,
    hidden: false,
};

function toForm(product: CatalogProduct): ProductForm {
    return {
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: String(product.price),
        mrp: String(product.mrp),
        stock: String(product.stock),
        rating: String(product.rating),
        reviewCount: String(product.reviewCount),
        image: product.image,
        hoverImage: product.hoverImage,
        description: product.description,
        highlights: product.highlights.join('\n'),
        badge: product.badge ?? 'none',
        available: product.available,
        hidden: product.hidden ?? false,
    };
}

/** Validates the form and normalises it into storefront-ready values. */
function parseForm(form: ProductForm): { input: NewProductInput } | { error: string } {
    const name = form.name.trim();
    if (!name) return { error: 'Product name is required.' };

    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
        return { error: 'Price must be a positive number.' };
    }

    const mrpRaw = Number(form.mrp);
    const mrp = Number.isFinite(mrpRaw) && mrpRaw >= price ? Math.round(mrpRaw) : Math.round(price);

    const ratingRaw = Number(form.rating);
    const rating = Number.isFinite(ratingRaw) ? Math.min(5, Math.max(0, ratingRaw)) : 0;

    const image = form.image.trim() || FALLBACK_IMAGE;

    return {
        input: {
            name,
            brand: form.brand.trim() || 'WishBox',
            category: form.category,
            rating,
            reviewCount: Math.max(0, Math.round(Number(form.reviewCount) || 0)),
            price: Math.round(price),
            mrp,
            badge: form.badge === 'none' ? undefined : (form.badge as ProductBadge),
            available: form.available,
            hidden: form.hidden,
            stock: Math.max(0, Math.round(Number(form.stock) || 0)),
            image,
            hoverImage: form.hoverImage.trim() || image,
            description: form.description.trim() || 'Handmade with care in our Jaipur studio.',
            highlights: form.highlights
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
        },
    };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
    const products = useCatalog();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
    const [formError, setFormError] = useState('');

    const [confirmDelete, setConfirmDelete] = useState<CatalogProduct | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        return products.filter((product) => {
            if (category !== 'all' && product.category !== category) return false;
            if (status === 'published' && product.hidden) return false;
            if (status === 'hidden' && !product.hidden) return false;
            if (status === 'out' && product.available) return false;
            if (status === 'low' && !(product.available && !product.hidden && product.stock <= LOW_STOCK_THRESHOLD))
                return false;
            if (!query) return true;
            return [product.name, product.brand, product.sku].join(' ').toLowerCase().includes(query);
        });
    }, [products, search, category, status]);

    const tierPriced = editingId === FLAGSHIP_PRODUCT_ID;

    function openCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setEditorOpen(true);
    }

    function openEdit(product: CatalogProduct) {
        setEditingId(product.id);
        setForm(toForm(product));
        setFormError('');
        setEditorOpen(true);
    }

    function updateField<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const parsed = parseForm(form);
        if ('error' in parsed) {
            setFormError(parsed.error);
            return;
        }

        if (editingId) {
            catalogStore.update(editingId, parsed.input);
            toast.success(`${parsed.input.name} updated`);
        } else {
            const created = catalogStore.add(parsed.input);
            toast.success(`${created.name} added to the catalogue`, {
                description: `ID ${created.id} · ${created.sku}`,
            });
        }
        setEditorOpen(false);
    }

    function togglePublished(product: CatalogProduct) {
        catalogStore.toggleHidden(product.id);
        toast.success(
            product.hidden
                ? `${product.name} is published again`
                : `${product.name} hidden from the storefront`
        );
    }

    function handleDelete() {
        if (!confirmDelete) return;
        catalogStore.remove(confirmDelete.id);
        toast.success(`${confirmDelete.name} deleted`);
        setConfirmDelete(null);
    }

    function handleReset() {
        catalogStore.reset();
        toast.success('Catalogue restored to the shipped demo data');
        setConfirmReset(false);
    }

    return (
        <div>
            <PageHeader
                title="Products"
                description={`${products.length} products in the live catalogue. Edits appear on the storefront immediately.`}
            >
                <AdminButton onClick={() => setConfirmReset(true)}>
                    <RotateCcw size={14} />
                    Reset demo catalogue
                </AdminButton>
                <AdminButton variant="primary" onClick={openCreate}>
                    <Plus size={14} />
                    Add product
                </AdminButton>
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
                    className="shrink-0 sm:w-44"
                    value={category}
                    options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS]}
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
                    <table className="w-full min-w-[760px] text-left text-sm">
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
                            {visible.map((product) => (
                                <tr
                                    key={product.id}
                                    className="border-t"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <td className="px-4 py-3 sm:px-5">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={product.image}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-[13px] font-semibold">
                                                    {product.name}
                                                </p>
                                                <p
                                                    className="mt-0.5 text-[11px]"
                                                    style={{ color: Theme.colors.textMuted }}
                                                >
                                                    {product.brand} · {product.sku}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs" style={{ color: Theme.colors.textLight }}>
                                        {categoryLabel(product.category)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <p className="text-[13px] font-bold tabular-nums">
                                            {inr(product.price)}
                                        </p>
                                        {product.mrp > product.price && (
                                            <p
                                                className="text-[11px] line-through tabular-nums"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                {inr(product.mrp)}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span
                                            className="text-[13px] font-bold tabular-nums"
                                            style={{
                                                color:
                                                    product.stock <= LOW_STOCK_THRESHOLD
                                                        ? Theme.colors.accentDark
                                                        : Theme.colors.text,
                                            }}
                                        >
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-start gap-1">
                                            <VisibilityPill hidden={product.hidden ?? false} />
                                            <StockPill available={product.available} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(product)}
                                                aria-label={`Edit ${product.name}`}
                                                className="grid h-8 w-8 place-items-center rounded-lg transition-colors hover:bg-black/5"
                                                style={{ color: Theme.colors.textLight }}
                                            >
                                                <Pencil size={14} />
                                            </button>
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
                            ))}

                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <p className="text-sm font-semibold">No products match these filters</p>
                                        <p
                                            className="mt-1 text-xs"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            Try a different search, category or status.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>

            {/* ── Editor dialog ───────────────────────────────────── */}
            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent
                    className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
                    style={{ backgroundColor: Theme.colors.surface }}
                >
                    <DialogHeader>
                        <DialogTitle style={{ fontFamily: Theme.Typography.headingFamily }}>
                            {editingId ? 'Edit product' : 'Add product'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? `Changes save to the live catalogue as soon as you submit.`
                                : 'New products appear on the shop listing, search and home rails immediately.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {tierPriced && (
                            <p
                                className="rounded-lg border px-3 py-2 text-[11.5px] leading-relaxed"
                                style={{
                                    borderColor: Theme.colors.borderStrong,
                                    backgroundColor: Theme.colors.surfaceAlt,
                                    color: Theme.colors.textLight,
                                }}
                            >
                                This is the flagship product: colour/size variants, bulk tiers and guides come
                                from <code>detailData.ts</code>, so its price is managed there. Name, stock,
                                imagery and visibility are editable here.
                            </p>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Field label="Name">
                                    <TextInput
                                        value={form.name}
                                        onChange={(event) => updateField('name', event.target.value)}
                                        placeholder="Handmade Paper Lantern Set"
                                        required
                                    />
                                </Field>
                            </div>

                            <Field label="Brand">
                                <TextInput
                                    value={form.brand}
                                    onChange={(event) => updateField('brand', event.target.value)}
                                    placeholder="PaperCraft"
                                />
                            </Field>

                            <Field label="Category">
                                <SelectMenu
                                    variant="field"
                                    value={form.category}
                                    options={CATEGORY_OPTIONS}
                                    onChange={(value) => updateField('category', value as ProductCategoryId)}
                                    label="Product category"
                                />
                            </Field>

                            <Field
                                label="Price (₹)"
                                hint={tierPriced ? 'Tier-driven — edit BULK_TIERS in detailData.ts' : undefined}
                            >
                                <TextInput
                                    type="number"
                                    min={1}
                                    value={form.price}
                                    onChange={(event) => updateField('price', event.target.value)}
                                    disabled={tierPriced}
                                    required
                                />
                            </Field>

                            <Field label="MRP (₹)" hint="Falls back to the price when lower">
                                <TextInput
                                    type="number"
                                    min={0}
                                    value={form.mrp}
                                    onChange={(event) => updateField('mrp', event.target.value)}
                                    disabled={tierPriced}
                                />
                            </Field>

                            <Field label="Stock (units)">
                                <TextInput
                                    type="number"
                                    min={0}
                                    value={form.stock}
                                    onChange={(event) => updateField('stock', event.target.value)}
                                />
                            </Field>

                            <Field label="Rating (0–5)">
                                <TextInput
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    value={form.rating}
                                    onChange={(event) => updateField('rating', event.target.value)}
                                />
                            </Field>

                            <Field label="Review count">
                                <TextInput
                                    type="number"
                                    min={0}
                                    value={form.reviewCount}
                                    onChange={(event) => updateField('reviewCount', event.target.value)}
                                />
                            </Field>

                            <Field label="Badge">
                                <SelectMenu
                                    variant="field"
                                    value={form.badge}
                                    options={BADGE_OPTIONS}
                                    onChange={(value) => updateField('badge', value)}
                                    label="Product badge"
                                />
                            </Field>

                            <div className="sm:col-span-2">
                                <Field label="Image URL" hint="Leave blank to use the local placeholder">
                                    <TextInput
                                        value={form.image}
                                        onChange={(event) => updateField('image', event.target.value)}
                                        placeholder="https://images.unsplash.com/photo-…"
                                    />
                                </Field>
                            </div>

                            <div className="sm:col-span-2">
                                <Field label="Hover image URL" hint="Defaults to the main image">
                                    <TextInput
                                        value={form.hoverImage}
                                        onChange={(event) => updateField('hoverImage', event.target.value)}
                                    />
                                </Field>
                            </div>

                            <div className="sm:col-span-2">
                                <Field label="Description">
                                    <TextArea
                                        rows={3}
                                        value={form.description}
                                        onChange={(event) => updateField('description', event.target.value)}
                                    />
                                </Field>
                            </div>

                            <div className="sm:col-span-2">
                                <Field label="Highlights" hint="One per line">
                                    <TextArea
                                        rows={3}
                                        value={form.highlights}
                                        onChange={(event) => updateField('highlights', event.target.value)}
                                        placeholder={'Acid-free paper\nHand-pressed in Jaipur'}
                                    />
                                </Field>
                            </div>

                            <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:gap-8">
                                <label className="flex items-center gap-2.5 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={form.available}
                                        onChange={(event) => updateField('available', event.target.checked)}
                                        className="h-4 w-4 shrink-0 rounded"
                                        style={{ accentColor: Theme.colors.primaryDark }}
                                    />
                                    <span style={{ color: Theme.colors.text }}>In stock</span>
                                </label>

                                <label className="flex items-center gap-2.5 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={!form.hidden}
                                        onChange={(event) => updateField('hidden', !event.target.checked)}
                                        className="h-4 w-4 shrink-0 rounded"
                                        style={{ accentColor: Theme.colors.primaryDark }}
                                    />
                                    <span style={{ color: Theme.colors.text }}>
                                        Published on the storefront
                                    </span>
                                </label>
                            </div>
                        </div>

                        {formError && (
                            <p role="alert" className="text-xs font-medium" style={{ color: Theme.colors.accentDark }}>
                                {formError}
                            </p>
                        )}

                        <DialogFooter>
                            <AdminButton variant="ghost" onClick={() => setEditorOpen(false)}>
                                Cancel
                            </AdminButton>
                            <AdminButton type="submit" variant="primary">
                                {editingId ? 'Save changes' : 'Add product'}
                            </AdminButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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
                        <AdminButton variant="ghost" onClick={() => setConfirmDelete(null)}>
                            Cancel
                        </AdminButton>
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
                            Every product edit, addition and deletion is discarded, restoring the original
                            demo catalogue. Storefront orders are not touched.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <AdminButton variant="ghost" onClick={() => setConfirmReset(false)}>
                            Cancel
                        </AdminButton>
                        <AdminButton variant="danger" onClick={handleReset}>
                            <RotateCcw size={14} />
                            Reset catalogue
                        </AdminButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
