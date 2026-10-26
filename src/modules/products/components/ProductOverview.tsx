import { memo, type ReactNode } from 'react';
import { Check, Layers, Shield } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import type { CatalogProduct } from '../api/productApi';
import { discountPercent } from '../lib/pricing';
import { formatCategory } from '../lib/category';
import { inr } from '@/lib/format';

function SectionHeader({ title, icon: Icon }: { title: string; icon: typeof Check }) {
    return (
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight" style={{ color: Theme.colors.text }}>
            {Icon && <Icon size={18} style={{ color: Theme.colors.primaryDark }} />}
            {title}
        </h2>
    );
}

function Panel({ children }: { children: ReactNode }) {
    return (
        <section
            className="rounded-2xl border p-5 md:p-6"
            style={{
                borderColor: Theme.colors.border,
                backgroundColor: Theme.colors.surface,
                boxShadow: Theme.Shadow.sm,
            }}
        >
            {children}
        </section>
    );
}

function Highlights({ items }: { items: string[] }) {
    if (items.length === 0) return null;

    return (
        <Panel>
            <SectionHeader title="Product Highlights" icon={Check} />
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {items.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2.5 text-sm" style={{ color: Theme.colors.textLight }}>
                        <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: Theme.colors.primaryLight }}
                        >
                            <Check size={12} strokeWidth={3} style={{ color: Theme.colors.primaryDark }} />
                        </span>
                        {highlight}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

function Description({ product }: { product: CatalogProduct }) {
    return (
        <Panel>
            <SectionHeader title="About this product" icon={Shield} />
            <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: Theme.colors.textLight }}>
                <p>{product.description}</p>
            </div>
        </Panel>
    );
}

function Specifications({ product }: { product: CatalogProduct }) {
    const rows = [
        { label: 'Brand', value: product.brand },
        { label: 'Category', value: formatCategory(product.category) },
        { label: 'Rating', value: `${product.rating} / 5 · ${product.reviewCount.toLocaleString('en-IN')} reviews` },
        {
            label: 'Availability',
            value: product.available
                ? product.stock <= 10
                    ? `Only ${product.stock} left`
                    : 'In stock'
                : 'Out of stock',
        },
        { label: 'Price', value: inr(product.price) },
        { label: 'MRP', value: inr(product.mrp) },
        { label: 'Discount', value: `${discountPercent(product)}% off` },
        // Admin-authored specifications, shown only when they were filled in.
        ...(product.specs?.height ? [{ label: 'Height', value: product.specs.height }] : []),
        ...(product.specs?.width ? [{ label: 'Width', value: product.specs.width }] : []),
        ...(product.specs?.gsm ? [{ label: 'Paper GSM', value: product.specs.gsm }] : []),
        ...(product.specs?.packaging ? [{ label: 'Packaging', value: product.specs.packaging }] : []),
        ...(product.offer ? [{ label: 'Offer', value: `${product.offer.label} · ${product.offer.code}` }] : []),
        { label: 'SKU', value: product.sku },
    ];

    return (
        <Panel>
            <SectionHeader title="Specifications" icon={Layers} />
            <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {rows.map((spec) => (
                    <div
                        key={spec.label}
                        className="flex items-center justify-between gap-4 border-b py-2.5 text-sm last:border-b-0"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        <dt style={{ color: Theme.colors.textMuted }}>{spec.label}</dt>
                        {/* Values are free text from the admin editor — shown exactly as typed. */}
                        <dd className="font-medium text-right" style={{ color: Theme.colors.text }}>
                            {spec.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </Panel>
    );
}

const ProductOverview = memo(function ProductOverview({ product }: { product: CatalogProduct }) {
    return (
        <div id="overview" className="flex flex-col gap-5">
            <Highlights items={product.highlights} />
            <Description product={product} />
            <Specifications product={product} />
        </div>
    );
});

export default ProductOverview;
