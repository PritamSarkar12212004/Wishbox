import { useState } from 'react';
import { BadgePercent, Check, Star } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { emiFor, inr } from '@/lib/format';
import ProductCard from '@/modules/products/components/ProductCard';
import { discountPercent, type CatalogProduct } from '@/modules/products/data/catalogData';
import { formatCategory } from '@/modules/products/lib/category';

/**
 * "Exactly what the shopper sees".
 *
 * The listing card is the real `ProductCard` component, so the preview cannot
 * drift from the storefront; the product-page block below mirrors the PDP's
 * gallery, price, highlights and specification blocks.
 */
export default function ProductPreview({ product }: { product: CatalogProduct }) {
    const [active, setActive] = useState(0);

    const shots = [product.image, product.hoverImage, ...(product.gallery ?? [])].filter(Boolean);

    const current = shots[Math.min(active, shots.length - 1)] ?? product.image;
    const discount = discountPercent(product);
    const savings = Math.max(product.mrp - product.price, 0);
    const specs = [
        { label: 'Category', value: formatCategory(product.category) },
        ...(product.specs?.height ? [{ label: 'Height', value: product.specs.height }] : []),
        ...(product.specs?.width ? [{ label: 'Width', value: product.specs.width }] : []),
        ...(product.specs?.gsm ? [{ label: 'Paper GSM', value: product.specs.gsm }] : []),
        ...(product.specs?.packaging ? [{ label: 'Packaging', value: product.specs.packaging }] : []),
    ];

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-sm font-bold">Storefront preview</p>
                <p className="mt-0.5 text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                    Live as you type. The card is the real shop component; the block below mirrors the product page.
                </p>
            </div>

            {/* The actual listing card, kept non-interactive so preview clicks never navigate. */}
            <div className="pointer-events-none mx-auto w-full max-w-[290px]">
                <ProductCard product={product} />
            </div>

            <div
                className="rounded-xl border p-4"
                style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
            >
                <div
                    className="relative overflow-hidden rounded-lg"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, aspectRatio: '4 / 5' }}
                >
                    <img src={current} alt={product.name} className="h-full w-full object-cover" />

                    {discount > 0 && (
                        <span
                            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: Theme.colors.accent }}
                        >
                            −{discount}%
                        </span>
                    )}

                    {!product.available && (
                        <span
                            className="absolute inset-x-0 bottom-0 py-1 text-center text-[10px] font-bold uppercase tracking-[0.1em]"
                            style={{ backgroundColor: 'rgba(44, 36, 32, 0.72)', color: Theme.colors.background }}
                        >
                            Out of stock
                        </span>
                    )}
                </div>

                {shots.length > 1 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                        {shots.map((shot, index) => (
                            <li key={`${shot.slice(0, 20)}-${index}`}>
                                <button
                                    type="button"
                                    onClick={() => setActive(index)}
                                    aria-label={`View photo ${index + 1}`}
                                    className="h-11 w-11 overflow-hidden rounded-md transition-all"
                                    style={{
                                        border: `2px solid ${
                                            index === active ? Theme.colors.primaryDark : Theme.colors.border
                                        }`,
                                    }}
                                >
                                    <img src={shot} alt="" className="h-full w-full object-cover" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <p
                    className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: Theme.colors.textMuted }}
                >
                    {product.brand || 'Your brand'}
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug">
                    {product.name || 'Product name appears here'}
                </p>

                <div className="mt-1.5 flex items-center gap-1">
                    <Star size={13} style={{ color: Theme.colors.gold, fill: Theme.colors.gold }} />
                    <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>
                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        · {product.reviewCount.toLocaleString('en-IN')} reviews
                    </span>
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums">{inr(product.price)}</span>
                    {savings > 0 && (
                        <>
                            <span className="text-xs line-through" style={{ color: Theme.colors.textMuted }}>
                                {inr(product.mrp)}
                            </span>
                            <span className="text-xs font-bold" style={{ color: Theme.colors.primaryDark }}>
                                {discount}% off
                            </span>
                        </>
                    )}
                </div>

                <p className="mt-0.5 text-[11px]">
                    {savings > 0 ? (
                        <span style={{ color: Theme.colors.primaryDark }}>
                            The shopper saves {inr(savings)} on this item
                        </span>
                    ) : (
                        <span style={{ color: Theme.colors.textMuted }}>Selling at full price — no discount</span>
                    )}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                    EMI from {inr(emiFor(product.price))}/mo
                </p>

                <p className="mt-3 text-xs font-semibold">
                    {!product.available ? (
                        <span style={{ color: Theme.colors.accentDark }}>Out of stock</span>
                    ) : product.stock <= 10 ? (
                        <span style={{ color: Theme.colors.accentDark }}>Only {product.stock} left in stock</span>
                    ) : (
                        <span style={{ color: Theme.colors.primaryDark }}>In stock · {product.stock} units</span>
                    )}
                    {product.hidden && (
                        <span className="ml-2 font-normal" style={{ color: Theme.colors.textMuted }}>
                            · hidden from the storefront
                        </span>
                    )}
                </p>

                {product.offer && (
                    <div
                        className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2"
                        style={{ backgroundColor: Theme.colors.surfaceAlt }}
                    >
                        <BadgePercent size={15} style={{ color: Theme.colors.primaryDark, marginTop: 2 }} />
                        <div>
                            <p className="text-[11.5px] font-semibold">
                                {product.offer.label} · {product.offer.code}
                            </p>
                            <p className="text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                Applied at checkout on the cart
                            </p>
                        </div>
                    </div>
                )}

                {product.highlights.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                        {product.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-2 text-xs">
                                <Check size={13} style={{ color: Theme.colors.primaryDark, marginTop: 2 }} />
                                <span style={{ color: Theme.colors.textLight }}>{highlight}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {product.description && (
                    <p
                        className="mt-3 border-t pt-3 text-xs leading-relaxed"
                        style={{ borderColor: Theme.colors.border, color: Theme.colors.textLight }}
                    >
                        {product.description}
                    </p>
                )}

                {specs.length > 0 && (
                    <dl className="mt-3 flex flex-col">
                        {specs.map((spec) => (
                            <div
                                key={spec.label}
                                className="flex items-center justify-between gap-3 border-b py-1.5 text-[11px] last:border-b-0"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <dt style={{ color: Theme.colors.textMuted }}>{spec.label}</dt>
                                <dd className="text-right font-medium">{spec.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                {product.videoUrl && (
                    <p className="mt-3 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        Promo video attached — it appears as the last slide in the product gallery.
                    </p>
                )}
            </div>
        </div>
    );
}
