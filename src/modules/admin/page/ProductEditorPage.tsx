import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgePercent, Check, Plus, Save, Store, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import { FALLBACK_IMAGE } from '@/lib/image';
import { inr } from '@/lib/format';
import type {
    CatalogProduct,
    ProductBadge,
    ProductInput,
    ProductSpecs,
} from '@/modules/products/api/productApi';
import {
    useAdminProduct,
    useAdminProducts,
    useCatalogCategories,
    useCoupons,
    useCreateCategory,
    useCreateProduct,
    useUpdateProduct,
} from '@/modules/products/api/useProducts';
import { AdminButton, Field, Panel, PanelHeader, TextArea, TextInput, Toggle } from '../components/AdminUI';
import { ProductEditorSkeleton } from '@/components/ui/skeletons';
import DropZone from '../components/DropZone';
import ProductPreview from '../components/ProductPreview';
import adminConst from '../consts/adminConst';

const route = adminConst.route;
const NEW_CATEGORY = '__new-category';

const BADGE_OPTIONS = [
    { value: 'none', label: 'No badge' },
    { value: 'SALE', label: 'Sale' },
    { value: 'BESTSELLER', label: 'Bestseller' },
    { value: 'NEW', label: 'New arrival' },
];

const PACKAGING_OPTIONS = [
    { value: 'Sealed', label: 'Sealed pack' },
    { value: 'Standard', label: 'Standard wrap' },
];

/** SKU prefixes per category, continuing the seed's `WB-PAPER-001` convention. */
const CATEGORY_SKU_PREFIX: Record<string, string> = {
    'paper-craft': 'PAPER',
    'home-decor': 'DECOR',
    lighting: 'LIGHT',
    clocks: 'CLOCK',
};

/**
 * The next free SKU for a category.
 *
 * The API needs a unique SKU on create, and it is not something a shopkeeper
 * should have to invent by hand - so it is derived from the category and the
 * highest number already in use.
 */
function nextSku(category: string, products: CatalogProduct[]): string {
    const highest = products.reduce((max, product) => {
        const match = /-(\d+)$/.exec(product.sku);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const derived = category
        .split(/[-_]/)
        .map((part) => part.slice(0, 5).toUpperCase())
        .join('')
        .replace(/[^A-Z0-9]/g, '');
    const prefix = CATEGORY_SKU_PREFIX[category] ?? (derived || 'GEN');
    return `WB-${prefix}-${String(highest + 1).padStart(3, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Form                                                              */
/* ------------------------------------------------------------------ */

type EditorForm = {
    name: string;
    category: string;
    badge: string;
    price: string;
    mrp: string;
    stock: string;
    offerCode: string;
    highlights: string[];
    description: string;
    rating: string;
    reviewCount: string;
    height: string;
    width: string;
    gsm: string;
    packaging: 'Sealed' | 'Standard';
    image: string;
    hoverImage: string;
    gallery: string[];
    videoUrl: string;
};

const EMPTY_FORM: EditorForm = {
    name: '',
    category: 'paper-craft',
    badge: 'none',
    price: '',
    mrp: '',
    stock: '10',
    offerCode: '',
    highlights: [''],
    description: '',
    rating: '4.5',
    reviewCount: '0',
    height: '',
    width: '',
    gsm: '',
    packaging: 'Sealed',
    image: '',
    hoverImage: '',
    gallery: [],
    videoUrl: '',
};

function toForm(product: CatalogProduct): EditorForm {
    return {
        name: product.name,
        category: product.category,
        badge: product.badge ?? 'none',
        price: String(product.price),
        mrp: String(product.mrp),
        stock: String(product.stock),
        offerCode: product.offer?.code ?? '',
        highlights: product.highlights.length > 0 ? product.highlights : [''],
        description: product.description,
        rating: String(product.rating),
        reviewCount: String(product.reviewCount),
        height: product.specs?.height ?? '',
        width: product.specs?.width ?? '',
        gsm: product.specs?.gsm ?? '',
        packaging: product.specs?.packaging ?? 'Sealed',
        image: product.image,
        hoverImage: product.hoverImage,
        gallery: product.gallery ?? [],
        videoUrl: product.videoUrl ?? '',
    };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const numberOr = (value: string, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Every rule the shop depends on, checked before a save. The first problem is
 * echoed in the sticky bar; all of them are listed in a toast.
 */
function validateForm(form: EditorForm): string[] {
    const issues: string[] = [];
    const price = numberOr(form.price);
    const rating = numberOr(form.rating, 4.5);

    if (!form.name.trim()) issues.push('Give the product a name.');
    if (price <= 0) issues.push('Selling price must be greater than ₹0.');
    if (form.mrp.trim() && numberOr(form.mrp) < price) {
        issues.push(`MRP cannot be lower than the selling price (${inr(price)}).`);
    }
    if (!form.stock.trim() || !Number.isFinite(Number(form.stock)) || Number(form.stock) < 0) {
        issues.push('Total stock must be a whole number of 0 or more.');
    }
    if (rating < 0 || rating > 5) issues.push('Rating must sit between 0 and 5.');
    if (form.reviewCount.trim() && (!Number.isFinite(Number(form.reviewCount)) || Number(form.reviewCount) < 0)) {
        issues.push('Review count must be 0 or more.');
    }
    if (!form.image.trim()) issues.push('Add a main photo so the listing card has an image.');
    if (form.videoUrl.trim() && !/^https?:\/\//i.test(form.videoUrl.trim())) {
        issues.push('Product video must be a full http(s) link.');
    }
    return issues;
}

/**
 * Normalises a form that already passed validation into storefront-ready values.
 * Visibility, stock state and brand come from the product itself — the editor no
 * longer asks for them.
 */
function buildInput(
    form: EditorForm,
    carried: Pick<CatalogProduct, 'brand' | 'available' | 'hidden'>,
    offerLabels: Record<string, string>,
    sku: string
): ProductInput {
    const name = form.name.trim();
    const price = Math.round(numberOr(form.price));
    const mrpRaw = Math.round(numberOr(form.mrp, price));
    const mrp = mrpRaw >= price ? mrpRaw : price;
    const image = form.image.trim() || FALLBACK_IMAGE;

    const specs: ProductSpecs = {
        height: form.height.trim() || undefined,
        width: form.width.trim() || undefined,
        gsm: form.gsm.trim() || undefined,
        packaging: form.packaging,
    };

    return {
        name,
        sku,
        brand: carried.brand,
        category: form.category,
        rating: clamp(numberOr(form.rating, 0), 0, 5),
        reviewCount: Math.max(0, Math.round(numberOr(form.reviewCount))),
        price,
        mrp,
        badge: form.badge === 'none' ? undefined : (form.badge as ProductBadge),
        available: carried.available,
        hidden: carried.hidden,
        stock: Math.max(0, Math.round(numberOr(form.stock))),
        image,
        hoverImage: form.hoverImage.trim() || image,
        description: form.description.trim() || 'Handmade with care in our Jaipur studio.',
        highlights: form.highlights.map((line) => line.trim()).filter(Boolean),
        gallery: form.gallery.map((src) => src.trim()).filter(Boolean),
        videoUrl: form.videoUrl.trim() || undefined,
        specs,
        offer: form.offerCode
            ? { code: form.offerCode, label: offerLabels[form.offerCode] ?? 'Offer' }
            : undefined,
    };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

/**
 * The route shell.
 *
 * The product is fetched before the form is mounted, and the form is keyed by
 * its id, so the fields are initialised from real data rather than from an
 * empty draft that would then need syncing.
 */
export default function ProductEditorPage() {
    const { id } = useParams<{ id: string }>();
    const productQuery = useAdminProduct(id);

    if (id) {
        if (productQuery.isLoading) {
            return <ProductEditorSkeleton />;
        }
        if (productQuery.error || !productQuery.data) {
            return (
                <Panel className="mx-auto max-w-lg p-8 text-center">
                    <p className="text-sm font-bold">Product not found</p>
                    <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                        “{id}” is not in the catalogue — it may have been deleted.
                    </p>
                    <Link to={route.productsPage} className="mt-4 inline-block">
                        <AdminButton variant="primary">Back to products</AdminButton>
                    </Link>
                </Panel>
            );
        }
        return <ProductEditorForm key={productQuery.data.id} product={productQuery.data} />;
    }

    return <ProductEditorForm />;
}

function ProductEditorForm({ product }: { product?: CatalogProduct }) {
    const navigate = useNavigate();
    const categories = useCatalogCategories();
    const products = useAdminProducts();
    const coupons = useCoupons();
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const createCategory = useCreateCategory();

    /** The offer codes the cart actually accepts, straight from the API's table. */
    const offerLabels = useMemo(
        () => Object.fromEntries(coupons.map((coupon) => [coupon.code, coupon.label])),
        [coupons]
    );
    const defaultOfferCode = coupons[0]?.code ?? '';

    const editingId = product?.id;
    const [form, setForm] = useState<EditorForm>(() => (product ? toForm(product) : EMPTY_FORM));
    const [error, setError] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    /* Brand and visibility are not edited here, so an edit keeps what the product
       already had; a new product starts published and in stock. */
    const carriedBrand = product?.brand ?? 'WishBox';
    const carriedAvailable = product?.available ?? true;
    const carriedHidden = product?.hidden ?? false;

    const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
        setForm((current) => ({ ...current, [key]: value }));
        /* The bar should not keep shouting about a field that was just fixed. */
        setError('');
    };

    const price = Math.max(0, Math.round(numberOr(form.price)));
    const mrp = Math.max(price, Math.round(numberOr(form.mrp, price)));
    const savings = mrp - price;
    const savingsPercent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;

    /** The draft, shaped exactly like a catalogue product so the preview is faithful. */
    const previewProduct: CatalogProduct = useMemo(
        () => ({
            id: editingId ?? 'preview',
            sku: product?.sku ?? 'WB-PREVIEW-000',
            name: form.name.trim() || 'Product name appears here',
            brand: carriedBrand,
            category: form.category,
            rating: clamp(numberOr(form.rating, 0), 0, 5),
            reviewCount: Math.max(0, Math.round(numberOr(form.reviewCount))),
            price: price > 0 ? price : 1,
            mrp: mrp > 0 ? mrp : 1,
            badge: form.badge === 'none' ? undefined : (form.badge as ProductBadge),
            available: carriedAvailable,
            hidden: carriedHidden,
            stock: Math.max(0, Math.round(numberOr(form.stock))),
            image: form.image.trim() || FALLBACK_IMAGE,
            hoverImage: form.hoverImage.trim() || form.image.trim() || FALLBACK_IMAGE,
            description: form.description.trim(),
            highlights: form.highlights.map((line) => line.trim()).filter(Boolean),
            gallery: form.gallery.filter(Boolean),
            videoUrl: form.videoUrl.trim() || undefined,
            specs: {
                height: form.height.trim() || undefined,
                width: form.width.trim() || undefined,
                gsm: form.gsm.trim() || undefined,
                packaging: form.packaging,
            },
            offer: form.offerCode
                ? { code: form.offerCode, label: offerLabels[form.offerCode] ?? 'Offer' }
                : undefined,
            bulkTiers: product?.bulkTiers,
        }),
        [
            form,
            editingId,
            product?.sku,
            product?.bulkTiers,
            carriedBrand,
            carriedAvailable,
            carriedHidden,
            price,
            mrp,
            offerLabels,
        ]
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const issues = validateForm(form);
        if (issues.length > 0) {
            setError(issues[0]);
            toast.error(issues.length === 1 ? issues[0] : `Fix ${issues.length} things before saving`, {
                description: issues.length === 1 ? undefined : issues.join(' · '),
            });
            return;
        }

        setError('');
        const sku = product?.sku ?? nextSku(form.category, products);
        const input = buildInput(
            form,
            {
                brand: carriedBrand,
                available: carriedAvailable,
                hidden: carriedHidden,
            },
            offerLabels,
            sku
        );

        try {
            if (editingId) {
                await updateProduct.mutateAsync({ slug: editingId, patch: input });
                toast.success(`${input.name} updated`, {
                    description: 'Saved to the catalogue - the storefront is already showing it.',
                });
            } else {
                const created = await createProduct.mutateAsync(input);
                toast.success(`${created.name} added to the catalogue`, {
                    description: `ID ${created.id} · ${created.sku}`,
                });
            }
            navigate(route.productsPage);
        } catch (error) {
            // The API's refusal is written for a shopkeeper (duplicate SKU, a
            // category that vanished, a price below a quantity break).
            const message = error instanceof Error ? error.message : 'Could not save the product';
            setError(message);
            toast.error(message);
        }
    }

    async function addCategory() {
        const label = newCategory.trim();
        if (!label) return;
        try {
            const created = await createCategory.mutateAsync(label);
            update('category', created.id);
            setNewCategory('');
            setAddingCategory(false);
            toast.success(`“${created.label}” added as a category`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not add the category');
        }
    }

    const categoryOptions = [
        ...categories.map((category) => ({ value: category.id, label: category.label })),
        { value: NEW_CATEGORY, label: '＋ Add a new category' },
    ];

    const sectionBody = 'flex flex-col gap-4 px-4 py-4 sm:px-5';

    return (
        <form onSubmit={handleSubmit} noValidate className="pb-24">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <Link
                        to={route.productsPage}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors hover:opacity-70"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        <ArrowLeft size={13} />
                        Products
                    </Link>
                    <h1
                        className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl"
                        style={{ fontFamily: Theme.Typography.headingFamily }}
                    >
                        {editingId ? 'Edit product' : 'Add a product'}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                        {editingId
                            ? 'Changes go live on the storefront the moment you save.'
                            : 'Fill in the details on the left — the shopper’s view updates on the right as you type.'}
                    </p>
                </div>

                {editingId && (
                    <Link to={`/product/${editingId}`} target="_blank" rel="noreferrer">
                        <AdminButton>
                            <Store size={13} />
                            View on storefront
                        </AdminButton>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                {/* ── Left: the form ──────────────────────────────── */}
                <div className="flex flex-col gap-6">
                    <Panel>
                        <PanelHeader title="Product basics" meta="The name and category shoppers browse by" />
                        <div className={sectionBody}>
                            <Field label="Product name" hint="Shown on the card, the product page and in search.">
                                <TextInput
                                    value={form.name}
                                    onChange={(event) => update('name', event.target.value)}
                                    placeholder="Handmade Paper Lantern Set of 6"
                                    required
                                />
                            </Field>

                            <div className="grid max-w-xs grid-cols-1 gap-4">
                                <Field label="Badge" hint="A small flag on the listing card.">
                                    <SelectMenu
                                        variant="field"
                                        value={form.badge}
                                        options={BADGE_OPTIONS}
                                        onChange={(value) => update('badge', value)}
                                        label="Product badge"
                                    />
                                </Field>
                            </div>

                            <Field label="Category" hint="Drives the shop filters and category reports.">
                                <SelectMenu
                                    variant="field"
                                    value={form.category}
                                    options={categoryOptions}
                                    onChange={(value) => {
                                        if (value === NEW_CATEGORY) {
                                            setAddingCategory(true);
                                            return;
                                        }
                                        update('category', value);
                                        setAddingCategory(false);
                                    }}
                                    label="Product category"
                                    menuHeading="Choose a category"
                                />
                            </Field>

                            {addingCategory && (
                                <div
                                    className="flex flex-col gap-2 rounded-lg border p-3"
                                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
                                >
                                    <Field label="New category name" hint="Added to the shop filters too.">
                                        <TextInput
                                            value={newCategory}
                                            onChange={(event) => setNewCategory(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    addCategory();
                                                }
                                            }}
                                            placeholder="Gift Wrapping"
                                        />
                                    </Field>
                                    <div className="flex items-center gap-2">
                                        <AdminButton variant="primary" onClick={addCategory} disabled={!newCategory.trim()}>
                                            <Plus size={13} />
                                            Add category
                                        </AdminButton>
                                        <AdminButton onClick={() => setAddingCategory(false)}>Cancel</AdminButton>
                                    </div>
                                </div>
                            )}

                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Pricing & stock" meta="Savings are worked out from your MRP as you type" />
                        <div className={sectionBody}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Field label="Selling price (₹)" hint="What the shopper pays">
                                    <TextInput
                                        type="number"
                                        min={1}
                                        value={form.price}
                                        onChange={(event) => update('price', event.target.value)}
                                        required
                                    />
                                </Field>

                                <Field label="MRP (₹)" hint="Struck through on the card">
                                    <TextInput
                                        type="number"
                                        min={0}
                                        value={form.mrp}
                                        onChange={(event) => update('mrp', event.target.value)}
                                    />
                                </Field>

                                <Field label="Total stock (units)" hint="Drives the low-stock alerts">
                                    <TextInput
                                        type="number"
                                        min={0}
                                        value={form.stock}
                                        onChange={(event) => update('stock', event.target.value)}
                                    />
                                </Field>
                            </div>

                            <div
                                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl px-4 py-3"
                                style={{ backgroundColor: Theme.colors.surfaceAlt }}
                            >
                                <span className="inline-flex items-center gap-2 text-xs font-semibold">
                                    <Check size={14} style={{ color: Theme.colors.primaryDark }} />
                                    Shopper saves
                                    <span className="tabular-nums" style={{ color: Theme.colors.primaryDark }}>
                                        {inr(savings)}
                                    </span>
                                    {savings > 0 && (
                                        <span
                                            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                            style={{ backgroundColor: Theme.colors.primary, color: Theme.colors.white }}
                                        >
                                            {savingsPercent}% off
                                        </span>
                                    )}
                                </span>
                                <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    MRP {inr(mrp)} · selling {inr(price)}
                                    {savings === 0 ? ' · selling at full price' : ''}
                                </span>
                            </div>
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader
                            title="Offer"
                            meta="Switch the offer on or off for this product"
                            action={<BadgePercent size={15} style={{ color: Theme.colors.primaryDark }} />}
                        />
                        <div className={sectionBody}>
                            <Toggle
                                checked={form.offerCode !== ''}
                                onChange={(next) => update('offerCode', next ? defaultOfferCode : '')}
                                label="Offer on this product"
                                hint="Applied to the cart at checkout. Switch it off to sell at the plain price."
                            />
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Highlights" meta="Short bullets shown beside the price" />
                        <div className={sectionBody}>
                            <ul className="flex flex-col gap-2">
                                {form.highlights.map((highlight, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <TextInput
                                            value={highlight}
                                            onChange={(event) =>
                                                update(
                                                    'highlights',
                                                    form.highlights.map((value, position) =>
                                                        position === index ? event.target.value : value
                                                    )
                                                )
                                            }
                                            placeholder={
                                                index === 0 ? 'Hand-pressed 250 GSM paper' : 'Add another highlight'
                                            }
                                            aria-label={`Highlight ${index + 1}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                update(
                                                    'highlights',
                                                    form.highlights.filter((_, position) => position !== index)
                                                )
                                            }
                                            aria-label={`Remove highlight ${index + 1}`}
                                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors hover:bg-black/5"
                                            style={{ color: Theme.colors.accentDark }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div>
                                <AdminButton onClick={() => update('highlights', [...form.highlights, ''])}>
                                    <Plus size={13} />
                                    Add highlight
                                </AdminButton>
                            </div>
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Description" meta="The paragraph under the highlights" />
                        <div className={sectionBody}>
                            <TextArea
                                rows={4}
                                value={form.description}
                                onChange={(event) => update('description', event.target.value)}
                                placeholder="Hand-pressed decorative paper with a smooth matte finish, made for gifting, crafting and event décor."
                            />
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader title="Specifications" meta="Rating, size and paper details for the product page" />
                        <div className={sectionBody}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Rating (out of 5)" hint="Shown with the review count on the card.">
                                    <TextInput
                                        type="number"
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        value={form.rating}
                                        onChange={(event) => update('rating', event.target.value)}
                                    />
                                </Field>
                                <Field label="Review count">
                                    <TextInput
                                        type="number"
                                        min={0}
                                        value={form.reviewCount}
                                        onChange={(event) => update('reviewCount', event.target.value)}
                                    />
                                </Field>
                                <Field label="Height" hint="Free text — any unit, e.g. 12 in or 30 cm.">
                                    <TextInput
                                        value={form.height}
                                        onChange={(event) => update('height', event.target.value)}
                                        placeholder="12 in"
                                    />
                                </Field>
                                <Field label="Width">
                                    <TextInput
                                        value={form.width}
                                        onChange={(event) => update('width', event.target.value)}
                                        placeholder="9 in"
                                    />
                                </Field>
                                <Field label="Paper GSM" hint="Leave blank for non-paper products.">
                                    <TextInput
                                        value={form.gsm}
                                        onChange={(event) => update('gsm', event.target.value)}
                                        placeholder="250 GSM"
                                    />
                                </Field>
                                <Field label="Packaging">
                                    <SelectMenu
                                        variant="field"
                                        value={form.packaging}
                                        options={PACKAGING_OPTIONS}
                                        onChange={(value) => update('packaging', value as EditorForm['packaging'])}
                                        label="Packaging"
                                    />
                                </Field>
                            </div>
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader
                            title="Media"
                            meta="Main and hover drive the listing card — every other photo joins the product gallery"
                        />
                        <div className={`${sectionBody} gap-6`}>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <DropZone
                                    label="Main photo"
                                    hint="The listing card and gallery lead with this shot."
                                    values={form.image ? [form.image] : []}
                                    onChange={(next) => update('image', next[0] ?? '')}
                                    maxKb={400}
                                    emptyLabel="Drop the main photo"
                                />
                                <DropZone
                                    label="Hover photo"
                                    hint="Swaps in when a shopper hovers the card. Falls back to the main photo."
                                    values={form.hoverImage ? [form.hoverImage] : []}
                                    onChange={(next) => update('hoverImage', next[0] ?? '')}
                                    maxKb={400}
                                    emptyLabel="Drop the hover photo"
                                />
                            </div>

                            <DropZone
                                label="Add more photos"
                                hint="Add as many as you like — they follow the main and hover shots in the product gallery."
                                values={form.gallery}
                                onChange={(next) => update('gallery', next)}
                                multiple
                                maxKb={400}
                                emptyLabel="Drop photos here, or click to browse"
                            />

                            <DropZone
                                label="Product video"
                                hint="A hosted MP4 or YouTube link — it becomes the last slide in the gallery."
                                values={form.videoUrl ? [form.videoUrl] : []}
                                onChange={(next) => update('videoUrl', next[0] ?? '')}
                                filesAllowed={false}
                                emptyLabel="Paste a video URL"
                            />

                            <p
                                className="rounded-lg px-3 py-2 text-[11px] leading-relaxed"
                                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textLight }}
                            >
                                Photos are saved with the product record (a hosted URL or an inline image), so they
                                appear on the storefront as soon as you save. Larger libraries should upload to your CDN
                                and paste the URL here instead.
                            </p>
                        </div>
                    </Panel>
                </div>

                {/* ── Right: the shopper's view ───────────────────── */}
                <div className="xl:sticky xl:top-24 xl:self-start">
                    <Panel className="p-4">
                        <ProductPreview product={previewProduct} />
                    </Panel>
                </div>
            </div>

            {/* ── Sticky action bar ───────────────────────────────── */}
            <div
                className="fixed inset-x-0 bottom-0 z-30 border-t md:left-[248px]"
                style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
            >
                <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
                    <p
                        className="min-w-0 text-[11px]"
                        role={error ? 'alert' : undefined}
                        style={{ color: error ? Theme.colors.accentDark : Theme.colors.textMuted }}
                    >
                        {error ||
                            (form.name.trim()
                                ? `${form.name.trim()} · ${inr(price)}${savings > 0 ? ` · ${savingsPercent}% off` : ''}`
                                : 'Add a name and a price to publish this product.')}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                        <AdminButton onClick={() => navigate(route.productsPage)}>Cancel</AdminButton>
                        <AdminButton type="submit" variant="primary">
                            <Save size={13} />
                            {editingId ? 'Save changes' : 'Add product'}
                        </AdminButton>
                    </div>
                </div>
            </div>
        </form>
    );
}
