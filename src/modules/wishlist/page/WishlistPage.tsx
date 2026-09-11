import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronDown,
  Heart,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { cartStore, wishlistStore } from '@/modules/products/store/store';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type WishlistItem = {
  id: number;
  name: string;
  brand: string;
  rating: number;
  price: number;
  mrp: number;
  discountPercent: number;
  emi: number;
  image: string;
  available: boolean;
};

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

/* ------------------------------------------------------------------ */
/*  Seed wishlist — real catalogue imagery (paper & craft store)        */
/* ------------------------------------------------------------------ */

const INITIAL_ITEMS: WishlistItem[] = [
  {
    id: 1,
    name: 'Premium Handmade Decorative Paper Sheets',
    brand: 'PaperCraft',
    rating: 5,
    price: 249,
    mrp: 399,
    discountPercent: 37,
    emi: 25,
    image:
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&h=750&fit=crop',
    available: true,
  },
  {
    id: 11,
    name: 'Matte Pastel Paper Sheets – Decorative Pack',
    brand: 'VibeCrafts',
    rating: 4,
    price: 199,
    mrp: 299,
    discountPercent: 33,
    emi: 20,
    image:
      'https://images.unsplash.com/photo-1528459199175-e5b1bbb10e30?w=600&h=750&fit=crop',
    available: true,
  },
  {
    id: 12,
    name: 'Gold Foil Wrapping Paper Roll',
    brand: 'ArtisanHome',
    rating: 5,
    price: 149,
    mrp: 249,
    discountPercent: 40,
    emi: 15,
    image:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=750&fit=crop',
    available: true,
  },
  {
    id: 13,
    name: 'Origami Paper – 200 Multi Color Sheets',
    brand: 'PaperCraft',
    rating: 5,
    price: 299,
    mrp: 499,
    discountPercent: 40,
    emi: 30,
    image:
      'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=600&h=750&fit=crop',
    available: true,
  },
  {
    id: 14,
    name: 'Handmade Paper Gift Bags – Set of 12',
    brand: 'Lume',
    rating: 4,
    price: 349,
    mrp: 599,
    discountPercent: 42,
    emi: 35,
    image:
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&h=750&fit=crop',
    available: true,
  },
  {
    id: 15,
    name: 'Premium Cardstock – 250 GSM',
    brand: 'Timeless',
    rating: 4,
    price: 229,
    mrp: 379,
    discountPercent: 40,
    emi: 23,
    image:
      'https://images.unsplash.com/photo-1452802447250-470a88ac82bc?w=600&h=750&fit=crop',
    available: true,
  },
  {
    id: 16,
    name: 'Decorative Craft Ribbon Spool',
    brand: 'ArtisanHome',
    rating: 3,
    price: 129,
    mrp: 199,
    discountPercent: 35,
    emi: 13,
    image:
      'https://images.unsplash.com/photo-1457365050282-c53d772ef8b2?w=600&h=750&fit=crop',
    available: false,
  },
  {
    id: 17,
    name: 'Rose Gold Shimmer Paper Sheets',
    brand: 'PaperCraft',
    rating: 4,
    price: 259,
    mrp: 399,
    discountPercent: 35,
    emi: 26,
    image:
      'https://images.unsplash.com/photo-1598367818977-038df1068a97?w=600&h=750&fit=crop',
    available: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Config + helpers                                                   */
/* ------------------------------------------------------------------ */

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'Featured',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  name: 'Name (A–Z)',
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const themeVars = {
  '--c-surface-alt': Theme.colors.surfaceAlt,
  '--c-accent-dark': Theme.colors.accentDark,
  '--c-accent-soft': `color-mix(in srgb, ${Theme.colors.accent} 12%, ${Theme.colors.surface})`,
  '--c-primary': Theme.colors.primary,
  '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/* ------------------------------------------------------------------ */
/*  Micro components                                                   */
/* ------------------------------------------------------------------ */

const ThemedSkeleton = memo(function ThemedSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Skeleton
      className={cn('rounded-lg', className)}
      style={{ backgroundColor: Theme.colors.surfaceAlt }}
    />
  );
});

const WishlistCardSkeleton = memo(function WishlistCardSkeleton() {
  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.BorderRadius.lg,
        boxShadow: Theme.Shadow.md,
      }}
    >
      <ThemedSkeleton className="h-52 w-full rounded-none" />
      <div className="p-4">
        <ThemedSkeleton className="h-5 w-11/12" />
        <ThemedSkeleton className="mt-2 h-5 w-2/3" />
        <ThemedSkeleton className="mt-3 h-3 w-1/3" />
        <div className="mt-3 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <ThemedSkeleton key={i} className="h-4 w-4" />
          ))}
          <ThemedSkeleton className="ml-1 h-3.5 w-8" />
        </div>
        <div className="mt-3 flex items-baseline flex-wrap gap-x-2">
          <ThemedSkeleton className="h-6 w-24" />
          <ThemedSkeleton className="h-4 w-14" />
          <ThemedSkeleton className="h-4 w-16" />
        </div>
        <ThemedSkeleton className="mt-3 h-3 w-40" />
      </div>
    </div>
  );
});
/* ------------------------------------------------------------------ */
/*  Modern wishlist card                                               */
/* ------------------------------------------------------------------ */

type WishlistCardProps = {
  item: WishlistItem;
  onMoveToCart: (item: WishlistItem) => void;
  onRemove: (item: WishlistItem) => void;
  onNotify: (item: WishlistItem) => void;
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
            'h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105',
            !item.available && 'opacity-60 saturate-50'
          )}
        />

        {/* Discount badge */}
        {item.discountPercent > 0 && (
          <span
            className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white"
            style={{ backgroundColor: Theme.colors.accent }}
          >
            −{item.discountPercent}%
          </span>
        )}

        {/* Out-of-stock chip */}
        {!item.available && (
          <span
            className="absolute inset-x-0 bottom-0 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.12em]"
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
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full shadow-sm transition-all hover:scale-110 hover:bg-[var(--c-accent-soft)] hover:text-[var(--c-accent-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25"
        style={{
          backgroundColor: Theme.colors.surface,
          color: Theme.colors.textMuted,
        }}
      >
        <X size={15} />
      </button>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Link
          to={`/product/${item.id}`}
          className="line-clamp-2 text-lg font-semibold leading-snug transition-colors hover:text-[var(--c-accent-dark)]"
          style={{ color: Theme.colors.text }}
        >
          {item.name}
        </Link>
        <p style={{ color: Theme.colors.textLight }} className="mt-1 text-sm">
          By {item.brand}
        </p>
        <div className="mt-2 flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              style={{
                color: i < fullStars ? Theme.colors.gold : Theme.colors.border,
                fill: i < fullStars ? Theme.colors.gold : 'none',
              }}
              className={i < fullStars ? 'fill-current' : ''}
            />
          ))}
          <span style={{ color: Theme.colors.textMuted }} className="ml-1 text-sm">
            ({item.rating})
          </span>
        </div>
        <div className="mt-3 flex items-baseline flex-wrap">
          <span style={{ color: Theme.colors.text }} className="text-xl font-bold">
            ₹{item.price.toLocaleString()}
          </span>
          <span style={{ color: Theme.colors.textMuted }} className="ml-2 text-sm line-through">
            ₹{item.mrp.toLocaleString()}
          </span>
          <span style={{ color: Theme.colors.accent }} className="ml-2 text-sm font-semibold">
            {item.discountPercent}% off
          </span>
        </div>

        {/* ── Actions ── */}
        <div className="mt-auto pt-3">
          {item.available ? (
            <button
              type="button"
              onClick={() => onMoveToCart(item)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: Theme.colors.primaryDark,
                boxShadow: Theme.Shadow.sm,
              }}
            >
              <ShoppingCart size={14} />
              Move to Cart
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNotify(item)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-[13px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)]"
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
        style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
      >
        Your wishlist is empty
      </h2>
      <p className="mt-2 text-sm" style={{ color: Theme.colors.textMuted }}>
        Tap the heart on any product you love — it will wait for you here.
      </p>
      <Link
        to="/"
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

type WishlistPageProps = {
  loading?: boolean;
};

export default function WishlistPage({ loading }: WishlistPageProps = {}) {
  const [items, setItems] = useState<WishlistItem[]>(INITIAL_ITEMS);
  const [sort, setSort] = useState<SortKey>('featured');
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);

  useEffect(() => {
    if (loading !== undefined) return;
    const t = window.setTimeout(() => setIsSimulatedLoading(false), 900);
    return () => window.clearTimeout(t);
  }, [loading]);

  const showSkeleton = (loading ?? isSimulatedLoading) && items.length > 0;

  /* ---- sorted view ---- */
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

  const totalValue = items.reduce((s, i) => s + i.price, 0);
  const totalSavings = items.reduce((s, i) => s + (i.mrp - i.price), 0);

  /* ---- handlers ---- */
  function moveToCart(item: WishlistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    wishlistStore.add(-1);
    cartStore.add(1);
    toast.success(`${item.name} moved to cart`);
  }

  function removeItem(item: WishlistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    wishlistStore.add(-1);
    toast.success(`${item.name} removed from wishlist`);
  }

  function notifyMe(item: WishlistItem) {
    toast.success(`We'll notify you when ${item.name} is back in stock`);
  }

  function addAllToCart() {
    const available = items.filter((i) => i.available);
    if (available.length === 0) {
      toast.error('Nothing available to move right now');
      return;
    }
    const unavailable = items.length - available.length;
    setItems((prev) => prev.filter((i) => !i.available));
    wishlistStore.add(-available.length);
    cartStore.add(available.length);
    toast.success(
      unavailable > 0
        ? `${available.length} moved to cart · ${unavailable} still out of stock`
        : `${available.length} item${available.length > 1 ? 's' : ''} moved to cart`
    );
  }

  function clearWishlist() {
    wishlistStore.add(-items.length);
    setItems([]);
    toast('Wishlist cleared');
  }

  const isEmpty = items.length === 0 && !showSkeleton;
  return (
    <div
      className="min-h-screen w-full"
      style={{ ...themeVars, backgroundColor: Theme.colors.background }}
    >
      <div className="w-full px-4 py-8 sm:py-10">
        {/* ── Header ──────────────────────────────────────── */}
        <header className="mb-8">
          <Link
            to="/"
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
                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
              >
                Your Wishlist
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: Theme.colors.textMuted }}>
                {isEmpty
                  ? 'Nothing saved yet'
                  : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                {totalSavings > 0 && !isEmpty && (
                  <>
                    {' '}·{' '}
                    <span style={{ color: Theme.colors.primaryDark, fontWeight: 600 }}>
                      Save {inr(totalSavings)} on wishlist
                    </span>
                  </>
                )}
              </p>
            </div>

            {!isEmpty && !showSkeleton && (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Sort */}
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
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
                  style={{
                    backgroundColor: Theme.colors.text,
                    color: Theme.colors.background,
                  }}
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
        ) : showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 15 }).map((_, i) => (
              <WishlistCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
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
        {!isEmpty && !showSkeleton && (
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
                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
              >
                {inr(totalValue)}
              </p>
            </div>
            <Link
              to="/"
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