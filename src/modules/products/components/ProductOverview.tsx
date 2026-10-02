import { memo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Ruler, Layers, Droplets, Shield } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import type { CatalogProduct } from '../data/catalogData';
import { discountPercent } from '../data/catalogData';
import type { PaperDetail } from '../data/detailData';
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

const PAPER_CRAFT_USES = [
    'Gift wrapping',
    'Wedding decoration',
    'Birthday decoration',
    'Scrapbooking',
    'DIY crafts',
    'Festival decoration',
    'Event decoration',
    'Handmade cards',
];

function Description({ product, detail }: { product: CatalogProduct; detail: PaperDetail | null }) {
    const [expanded, setExpanded] = useState(false);
    const paperStory =
        'Every sheet is cut by hand, dried flat and individually inspected to deliver a consistent, premium finish. The fibre blends rich texture with reliable strength, so the paper behaves beautifully whether you fold, cut or glue it.';

    return (
        <Panel>
            <SectionHeader title="About this product" icon={Shield} />
            <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: Theme.colors.textLight }}>
                <p>{product.description}</p>
                {detail && (
                    <AnimatePresence initial={false}>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                className="overflow-hidden space-y-3"
                            >
                                <p>{paperStory}</p>
                                <p className="font-semibold" style={{ color: Theme.colors.text }}>
                                    Perfect for:
                                </p>
                                <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                    {PAPER_CRAFT_USES.map((use) => (
                                        <li key={use} className="flex items-center gap-2">
                                            <Check size={13} strokeWidth={3} style={{ color: Theme.colors.accent }} />
                                            {use}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
            {detail && (
                <button
                    type="button"
                    onClick={() => setExpanded((open) => !open)}
                    aria-expanded={expanded}
                    className="mt-3 flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                    style={{ color: Theme.colors.primaryDark }}
                >
                    {expanded ? 'Read less' : 'Read more'}
                    <ChevronDown
                        size={14}
                        className="transition-transform"
                        style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                    />
                </button>
            )}
        </Panel>
    );
}

function Specifications({ product, detail }: { product: CatalogProduct; detail: PaperDetail | null }) {
    const rows = detail
        ? detail.specifications
        : [
              { label: 'Brand', value: product.brand },
              { label: 'Category', value: product.category.replace('-', ' ') },
              { label: 'Rating', value: `${product.rating} / 5 · ${product.reviewCount.toLocaleString('en-IN')} reviews` },
              { label: 'Availability', value: product.available ? (product.stock <= 10 ? `Only ${product.stock} left` : 'In stock') : 'Out of stock' },
              { label: 'Price', value: inr(product.price) },
              { label: 'MRP', value: inr(product.mrp) },
              { label: 'Discount', value: `${discountPercent(product)}% off` },
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
                        <dd className="font-medium text-right capitalize" style={{ color: Theme.colors.text }}>
                            {spec.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </Panel>
    );
}

function SizeGuide({ items }: { items: PaperDetail['sizeGuide'] }) {
    return (
        <Panel>
            <SectionHeader title="Paper Size Guide" icon={Ruler} />
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center items-start">
                {items.map((size) => (
                    <div
                        key={size.label}
                        className="flex w-full flex-col items-center rounded-xl border p-3 text-center"
                        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
                    >
                        <div
                            className="mt-2 rounded-sm"
                            style={{
                                width: '42px',
                                height: size.width && size.height ? `${Math.round(((42 * size.height) / size.width) * 100) / 100}px` : '42px',
                                maxHeight: '56px',
                                backgroundColor: Theme.colors.borderStrong,
                            }}
                        />
                        <span className="mt-2.5 text-sm font-bold" style={{ color: Theme.colors.text }}>
                            {size.label}
                        </span>
                        {size.width && size.height ? (
                            <span className="text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                                {size.width} × {size.height} inch
                            </span>
                        ) : (
                            <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                Available
                            </span>
                        )}
                        <span className="text-[10px]" style={{ color: Theme.colors.textMuted }}>
                            {size.note}
                        </span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function GsmGuide({ items }: { items: PaperDetail['gsmGuide'] }) {
    return (
        <Panel>
            <SectionHeader title="GSM Guide" icon={Droplets} />
            <div className="mt-5 flex items-end gap-5">
                {items.map((guide) => (
                    <div key={guide.range} className="flex flex-1 flex-col items-center gap-2.5">
                        <div className="w-full rounded-md" style={{ height: guide.height, backgroundColor: guide.color }} />
                        <span className="text-xs font-semibold" style={{ color: Theme.colors.text }}>
                            {guide.range}
                        </span>
                        <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {guide.label}
                        </span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

const ProductOverview = memo(function ProductOverview({
    product,
    detail,
}: {
    product: CatalogProduct;
    detail: PaperDetail | null;
}) {
    return (
        <div id="overview" className="flex flex-col gap-5">
            <Highlights items={detail ? detail.highlights : product.highlights} />
            <Description product={product} detail={detail} />
            <Specifications product={product} detail={detail} />
            {detail && <SizeGuide items={detail.sizeGuide} />}
            {detail && <GsmGuide items={detail.gsmGuide} />}
        </div>
    );
});

export default ProductOverview;
