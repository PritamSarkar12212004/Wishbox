import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, Star } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { emiFor, inr } from '@/lib/format';
import { LOGIN_REASONS } from '@/modules/auth/data/authData';
import { loginGate } from '@/modules/auth/store/loginGate';
import { discountPercent, type CatalogProduct } from '../data/catalogData';
import { useIsWishlisted, wishlistStore } from '../store/store';

const ProductCard = memo(function ProductCard({ product }: { product: CatalogProduct }) {
    const liked = useIsWishlisted(product.id);
    const discount = discountPercent(product);

    /* Cards on the home and shop pages are account-gated too: the heart opens the
       login modal instead of silently writing to the wishlist. */
    function toggleWishlist(event: React.MouseEvent) {
        // The whole card is a link — don't navigate when only the heart is tapped.
        event.preventDefault();
        event.stopPropagation();
        loginGate.require(() => {
            const added = wishlistStore.toggle(product);
            toast.success(added ? 'Added to wishlist' : 'Removed from wishlist', {
                description: product.name,
            });
        }, LOGIN_REASONS.wishlist);
    }

    return (
        <Link
            to={`/product/${product.id}`}
            aria-label={`View ${product.name}`}
            style={{
                backgroundColor: Theme.colors.surface,
                borderRadius: Theme.BorderRadius.xl,
                border: `1px solid ${Theme.colors.border}`,
                boxShadow: Theme.Shadow.sm,
            }}
            className="group flex h-full cursor-pointer flex-col overflow-hidden outline-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-transparent focus-visible:ring-2 focus-visible:ring-black/25"
        >
            {/* Image — swaps to a second shot on hover */}
            <div
                className="relative h-40 w-full shrink-0 overflow-hidden sm:h-52 lg:h-52 xl:h-56"
                style={{ backgroundColor: Theme.colors.surfaceAlt }}
            >
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
                />
                <img
                    src={product.hoverImage}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full scale-105 object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />

                {discount > 0 && (
                    <span
                        className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-sm sm:left-2.5 sm:top-2.5 sm:px-2 sm:text-[10px]"
                        style={{ backgroundColor: Theme.colors.accent }}
                    >
                        −{discount}%
                    </span>
                )}

                {product.badge && (
                    <span
                        className="absolute bottom-2 left-1.5 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm sm:bottom-3 sm:left-2.5 sm:px-2.5 sm:text-[10px]"
                        style={
                            product.badge === 'SALE'
                                ? { backgroundColor: Theme.colors.text, color: Theme.colors.background }
                                : product.badge === 'BESTSELLER'
                                  ? { backgroundColor: Theme.colors.gold, color: Theme.colors.text }
                                  : { backgroundColor: Theme.colors.primaryDark, color: Theme.colors.background }
                        }
                    >
                        {product.badge === 'BESTSELLER'
                            ? 'Bestseller'
                            : product.badge === 'SALE'
                              ? 'Sale'
                              : 'New'}
                    </span>
                )}

                {!product.available && (
                    <span
                        className="absolute inset-x-0 bottom-0 z-10 py-1 text-center text-[9px] font-bold uppercase tracking-[0.1em] sm:py-1.5 sm:text-[11px]"
                        style={{ backgroundColor: 'rgba(44, 36, 32, 0.72)', color: Theme.colors.background }}
                    >
                        Out of stock
                    </span>
                )}

                <button
                    type="button"
                    onClick={toggleWishlist}
                    aria-pressed={liked}
                    aria-label={liked ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    className="absolute right-1.5 top-1.5 z-10 grid h-7 w-7 place-items-center rounded-full shadow-sm backdrop-blur transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        color: liked ? Theme.colors.accent : Theme.colors.textMuted,
                    }}
                >
                    <Heart size={14} className={liked ? 'fill-current' : undefined} />
                </button>

                <span
                    className="absolute bottom-2 right-2 hidden h-8 w-8 translate-y-2 place-items-center rounded-full opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:bottom-3 sm:right-3 sm:grid sm:h-9 sm:w-9"
                    style={{ backgroundColor: Theme.colors.surface, color: Theme.colors.text }}
                >
                    <ArrowUpRight size={16} />
                </span>
            </div>

            <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                <p
                    className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] sm:text-[11px] sm:tracking-[0.12em]"
                    style={{ color: Theme.colors.textMuted }}
                >
                    {product.brand}
                </p>
                <h3
                    style={{ color: Theme.colors.text }}
                    className="mt-1 line-clamp-2 min-h-9 text-[13px] font-semibold leading-snug transition-colors group-hover:text-[color:var(--card-accent)] sm:min-h-[42px] sm:text-[15px]"
                >
                    {product.name}
                </h3>

                <div className="mt-1.5 flex items-center gap-0.5 sm:mt-2 sm:gap-1">
                    <Star size={12} style={{ color: Theme.colors.gold, fill: Theme.colors.gold }} />
                    <span className="text-[11px] font-semibold sm:text-xs" style={{ color: Theme.colors.text }}>
                        {product.rating.toFixed(1)}
                    </span>
                    <span className="text-[10px] sm:text-xs" style={{ color: Theme.colors.textMuted }}>
                        · {product.reviewCount.toLocaleString('en-IN')}
                    </span>
                </div>

                <div
                    className="mt-auto flex flex-wrap items-baseline gap-x-1.5 border-t pt-2 sm:gap-x-2 sm:pt-3"
                    style={{ borderColor: Theme.colors.border }}
                >
                    <span className="text-sm font-bold tabular-nums sm:text-lg" style={{ color: Theme.colors.text }}>
                        {inr(product.price)}
                    </span>
                    <span className="text-[10px] line-through sm:text-xs" style={{ color: Theme.colors.textMuted }}>
                        {inr(product.mrp)}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-[9px] sm:text-[11px]" style={{ color: Theme.colors.primaryDark }}>
                    EMI from {inr(emiFor(product.price))}/mo
                </p>
            </div>
        </Link>
    );
});

export default ProductCard;
