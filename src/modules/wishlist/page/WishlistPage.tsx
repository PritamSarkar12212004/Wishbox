import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bell, ChevronDown, Heart, ShoppingCart, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    useWishlistEntries,
    wishlistStore,
    type WishlistEntry,
} from '@/modules/products/store/store';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

const SORT_LABELS: Record<SortKey, string> = {
    featured: 'Featured',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    name: 'Name (A–Z)',
};

const themeVars = {
    '--c-surface-alt': Theme.colors.surfaceAlt,
    '--c-accent-dark': Theme.colors.accentDark,
    '--c-accent-soft': `color-mix(in srgb, ${Theme.colors.accent} 12%, ${Theme.colors.surface})`,
    '--c-primary': Theme.colors.primary,
    '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/* ------------------------------------------------------------------ */
/*  Wishlist card                                                      */
/* ------------------------------------------------------------------ */

type WishlistCardProps = {
    item: WishlistEntry;
    onMoveToCart: (item: WishlistEntry) => void;
    onRemove: (item: WishlistEntry) => void;
    onNotify: (item: WishlistEntry) => void;
};

const WishlistCard = memo(function WishlistCard({
    item,
    onMoveToCart,
    onRemove,
    onNotify,
}: WishlistCardProps) {
    const fullStars = Math.floor(item.rating);

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden"
            style={{
                backgroundColor: Theme.colors.surface,
                borderRadius: Theme.BorderRadius.lg,
                boxShadow: Theme.Shadow.md,
            }}
        >
            {/* ── Image ── */}
            <Link
                to={`/product/${item.id}`}
                className="relative block overflow-hidden"
                aria-label={`View ${item.name}`}
            >
                <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                        'h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-52',
                        !item.available && 'opacity-60 saturate-50'
                    )}
                />

                {item.mrp > item.price && (
                    <span
                        className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white sm:left-2 sm:top-2 sm:px-2 sm:text-[10px]"
                        style={{ backgroundColor: Theme.colors.accent }}
                    >
                        −{Math.round((1 - item.price / item.mrp) * 100)}%
                    </span>
                )}

                {!item.available && (
                    <span
                        className="absolute inset-x-0 bottom-0 py-1 text-center text-[9px] font-bold uppercase tracking-[0.1em] sm:py-1.5 sm:text-[11px] sm:tracking-[0.12em]"
                        style={{
                            backgroundColor: 'rgba(44, 36, 32, 0.72)',
                            color: Theme.colors.background,
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        Out of stock
                    </span>
                )}
            </Link>

            {/* ── Remove (top-right) ── */}
            <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Remove ${item.name} from wishlist`}
                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full shadow-sm transition-all hover:scale-110 hover:bg-[var(--c-accent-soft)] hover:text-[var(--c-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25 sm:right-2 sm:top-2 sm:h-8 sm:w-8"
                style={{ backgroundColor: Theme.colors.surface, color: Theme.colors.textMuted }}
            >
                <X size={14} />
            </button>

            {/* ── Body ── */}
            <div className="flex min-h-0 flex-1 flex-col p-2.5 sm:p-4">
                <Link
                    to={`/product/${item.id}`}
                    className="line-clamp-2 min-h-9 text-[13px] font-semibold leading-snug transition-colors hover:text-[var(--c-accent-dark)] sm:min-h-[42px] sm:text-lg"
                    style={{ color: Theme.colors.text }}
                >
                    {item.name}
                </Link>
                <p style={{ color: Theme.colors.textLight }} className="mt-0.5 text-[11px] sm:mt-1 sm:text-sm">
                    By {item.brand}
                </p>
                <div className="mt-1.5 flex items-center sm:mt-2" aria-label={`Rated ${item.rating} out of 5`}>
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            size={13}
                            aria-hidden="true"
                            style={{
                                color: i < fullStars ? Theme.colors.gold : Theme.colors.border,
                                fill: i < fullStars ? Theme.colors.gold : 'none',
                            }}
                            className={i < fullStars ? 'fill-current' : ''}
                        />
                    ))}
                    <span style={{ color: Theme.colors.textMuted }} className="ml-1 text-[10px] sm:text-sm">
                        ({item.rating})
                    </span>
                </div>
                <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-2 sm:gap-x-2 sm:pt-3">
                    <span style={{ color: Theme.colors.text }} className="text-sm font-bold tabular-nums sm:text-xl">
                        {inr(item.price)}
                    </span>
                    <span style={{ color: Theme.colors.textMuted }} className="text-[10px] line-through sm:text-sm">
                        {inr(item.mrp)}
                    </span>
                </div>

                {/* ── Actions ── */}
                <div className="pt-2.5 sm:pt-3">
                    {item.available ? (
                        <button
                            type="button"
                            onClick={() => onMoveToCart(item)}
                            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-white transition-all duration-200 active:scale-[0.98] sm:h-10 sm:gap-2 sm:text-[13px]"
                            style={{ backgroundColor: Theme.colors.primaryDark, boxShadow: Theme.Shadow.sm }}
                        >
                            <ShoppingCart size={14} />
                            Move to Cart
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onNotify(item)}
                            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-[11px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)] sm:h-10 sm:gap-2 sm:text-[13px]"
                            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                        >
                            <Bell size={14} />
                            Notify Me
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
});

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyWishlist() {
    return (
        <div
            className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center"
            style={{
                backgroundColor: Theme.colors.surface,
                borderRadius: Theme.BorderRadius.xl,
                boxShadow: Theme.Shadow.sm,
            }}
        >
            <div
                className="mb-5 grid h-16 w-16 place-items-center rounded-full"
                style={{ backgroundColor: Theme.colors.surfaceAlt }}
            >
                <Heart size={26} style={{ color: Theme.colors.accentDark }} />
            </div>
            <h2
                className="text-2xl font-bold"
                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
            >
                Your wishlist is empty
            </h2>
            <p className="mt-2 text-sm" style={{ color: Theme.colors.textMuted }}>
                Tap the heart on any product you love — it will wait for you here.
            </p>
            <Link
                to="/shop"
                className="group mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{
                    background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                    color: Theme.colors.background,
                    boxShadow: Theme.Shadow.md,
                }}
            >
                Start shopping
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WishlistPage() {
    const items = useWishlistEntries();
    const [sort, setSort] = useState<SortKey>('featured');

    const sortedItems = useMemo(() => {
        const list = [...items];
        switch (sort) {
            case 'price-asc':
                return list.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return list.sort((a, b) => b.price - a.price);
            case 'name':
                return list.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return list;
        }
    }, [items, sort]);

    const totalValue = items.reduce((sum, item) => sum + item.price, 0);
    const totalSavings = items.reduce((sum, item) => sum + (item.mrp - item.price), 0);
    const isEmpty = items.length === 0;

    function moveToCart(item: WishlistEntry) {
        wishlistStore.moveToCart(item.id);
        toast.success(`${item.name} moved to cart`);
    }

    function removeItem(item: WishlistEntry) {
        wishlistStore.remove(item.id);
        toast.success(`${item.name} removed from wishlist`);
    }

    function notifyMe(item: WishlistEntry) {
        toast.success(`We'll notify you when ${item.name} is back in stock`);
    }

    function addAllToCart() {
        const { moved, skipped } = wishlistStore.moveAllToCart();
        if (moved === 0) {
            toast.error('Nothing available to move right now');
            return;
        }
        toast.success(
            skipped > 0
                ? `${moved} moved to cart · ${skipped} still out of stock`
                : `${moved} item${moved > 1 ? 's' : ''} moved to cart`
        );
    }

    function clearWishlist() {
        wishlistStore.clear();
        toast('Wishlist cleared');
    }

    return (
        <div
            className="min-h-screen w-full"
            style={{ ...themeVars, backgroundColor: Theme.colors.background }}
        >
            <div className="w-full px-4 py-8 sm:py-10 md:px-6 lg:px-8">
                {/* ── Header ──────────────────────────────────────── */}
                <header className="mb-8">
                    <Link
                        to="/shop"
                        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--c-accent-dark)]"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        <ArrowLeft size={13} />
                        Continue shopping
                    </Link>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1
                                className="text-3xl font-bold tracking-tight sm:text-4xl"
                                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                            >
                                Your Wishlist
                            </h1>
                            <p className="mt-1.5 text-sm" style={{ color: Theme.colors.textMuted }}>
                                {isEmpty
                                    ? 'Nothing saved yet'
                                    : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                                {totalSavings > 0 && !isEmpty && (
                                    <>
                                        {' '}
                                        ·{' '}
                                        <span style={{ color: Theme.colors.primaryDark, fontWeight: 600 }}>
                                            Save {inr(totalSavings)} on wishlist
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>

                        {!isEmpty && (
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="relative">
                                    <select
                                        value={sort}
                                        onChange={(event) => setSort(event.target.value as SortKey)}
                                        aria-label="Sort wishlist"
                                        className="w-full appearance-none rounded-full border bg-transparent py-2 pl-3.5 pr-9 text-xs font-medium outline-none transition-colors focus:border-black/40 focus:ring-2 focus:ring-black/15"
                                        style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                                    >
                                        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                                            <option key={key} value={key}>
                                                {SORT_LABELS[key]}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown
                                        size={14}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: Theme.colors.textMuted }}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={addAllToCart}
                                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-transform hover:-translate-y-0.5"
                                    style={{ backgroundColor: Theme.colors.text, color: Theme.colors.background }}
                                >
                                    <ShoppingCart size={13} />
                                    Add all to cart
                                </button>

                                <button
                                    type="button"
                                    onClick={clearWishlist}
                                    className="text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--c-accent-dark)]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* ── Body ────────────────────────────────────────── */}
                {isEmpty ? (
                    <EmptyWishlist />
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5">
                        {sortedItems.map((item) => (
                            <WishlistCard
                                key={item.id}
                                item={item}
                                onMoveToCart={moveToCart}
                                onRemove={removeItem}
                                onNotify={notifyMe}
                            />
                        ))}
                    </div>
                )}

                {/* ── Footer strip ────────────────────────────────── */}
                {!isEmpty && (
                    <div
                        className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-6 py-5"
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                            boxShadow: Theme.Shadow.sm,
                        }}
                    >
                        <div>
                            <p
                                className="text-[11px] font-medium uppercase tracking-[0.14em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                Wishlist value
                            </p>
                            <p
                                className="mt-0.5 text-2xl font-bold tabular-nums leading-none"
                                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                            >
                                {inr(totalValue)}
                            </p>
                        </div>
                        <Link
                            to="/shop"
                            className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--c-accent-dark)]"
                            style={{ color: Theme.colors.accentDark }}
                        >
                            Keep browsing
                            <ArrowRight
                                size={14}
                                className="transition-transform group-hover:translate-x-0.5"
                            />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
