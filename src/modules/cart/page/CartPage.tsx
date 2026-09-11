import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CartItem = {
  id: number;
  name: string;
  brand: string;
  rating: number;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  emi: number;
  qty: number;
  image: string;
};

/* ------------------------------------------------------------------ */
/*  Seed cart — matches ProductSections catalogue                      */
/* ------------------------------------------------------------------ */

const INITIAL_ITEMS: CartItem[] = [
  {
    id: 1,
    name: 'Modern Designer LED Round Wall Mirror',
    brand: 'VibeCrafts',
    rating: 4,
    price: 9999,
    discountedPrice: 5270,
    discountPercent: 47,
    emi: 254,
    qty: 1,
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=600&fit=crop',
  },
  {
    id: 3,
    name: 'Minimalist Desk Lamp',
    brand: 'Lume',
    rating: 5,
    price: 3200,
    discountedPrice: 2199,
    discountPercent: 31,
    emi: 110,
    qty: 2,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop',
  },
  {
    id: 4,
    name: 'Handmade Ceramic Vase Set',
    brand: 'ArtisanHome',
    rating: 3,
    price: 2800,
    discountedPrice: 1899,
    discountPercent: 32,
    emi: 95,
    qty: 1,
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&h=600&fit=crop',
  },
];

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const themeVars = {
  '--c-bg': Theme.colors.background,
  '--c-surface': Theme.colors.surface,
  '--c-surface-alt': Theme.colors.surfaceAlt,
  '--c-border': Theme.colors.border,
  '--c-text': Theme.colors.text,
  '--c-text-muted': Theme.colors.textMuted,
  '--c-accent': Theme.colors.accent,
  '--c-accent-dark': Theme.colors.accentDark,
  '--c-accent-soft': `color-mix(in srgb, ${Theme.colors.accent} 12%, ${Theme.colors.surface})`,
  '--c-primary': Theme.colors.primary,
  '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/* ------------------------------------------------------------------ */
/*  Micro components                                                   */
/* ------------------------------------------------------------------ */

const Stars = memo(function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          style={{
            color: i < full ? Theme.colors.gold : Theme.colors.border,
            fill: i < full ? Theme.colors.gold : 'none',
          }}
        />
      ))}
      <span className="ml-1 text-[11px]" style={{ color: Theme.colors.textMuted }}>
        {rating}.0
      </span>
    </div>
  );
});

const QtyStepper = memo(function QtyStepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border"
      style={{
        borderColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
      }}
    >
      <button
        type="button"
        onClick={() => onChange(-1)}
        disabled={qty <= 1}
        aria-label="Decrease quantity"
        className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--c-surface-alt)] disabled:cursor-not-allowed disabled:opacity-30"
        style={{ color: Theme.colors.text }}
      >
        <Minus size={13} />
      </button>
      <span
        className="w-7 text-center text-sm font-semibold tabular-nums"
        style={{ color: Theme.colors.text }}
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => onChange(1)}
        disabled={qty >= 99}
        aria-label="Increase quantity"
        className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--c-surface-alt)] disabled:cursor-not-allowed disabled:opacity-30"
        style={{ color: Theme.colors.text }}
      >
        <Plus size={13} />
      </button>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

const ThemedSkeleton = memo(function ThemedSkeleton({
  className,
  style,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <Skeleton
      className={cn('rounded-md', className)}
      style={{ backgroundColor: Theme.colors.surfaceAlt, ...style }}
      {...props}
    />
  );
});

const CartItemSkeleton = memo(function CartItemSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex gap-5 py-6"
      style={{ borderBottom: `1px solid ${Theme.colors.border}` }}
    >
      <ThemedSkeleton className="h-28 w-28 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <ThemedSkeleton className="h-3 w-20" />
        <ThemedSkeleton className="h-5 w-3/4" />
        <ThemedSkeleton className="h-3 w-1/4" />
        <ThemedSkeleton className="mt-4 h-8 w-32 rounded-full" />
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Cart item row — editorial list style                               */
/* ------------------------------------------------------------------ */

type CartItemRowProps = {
  item: CartItem;
  index: number;
  onQty: (id: number, delta: number) => void;
  onRemove: (id: number) => void;
  onSave: (id: number) => void;
};

const CartItemRow = memo(function CartItemRow({
  item,
  index,
  onQty,
  onRemove,
  onSave,
}: CartItemRowProps) {
  const lineTotal = item.discountedPrice * item.qty;
  const lineOriginal = item.price * item.qty;
  const lineSavings = lineOriginal - lineTotal;

  return (
    <article
      className="group relative flex gap-4 py-6 sm:gap-6"
      style={{ borderTop: index === 0 ? 'none' : `1px solid ${Theme.colors.border}` }}
    >
      {/* Image */}
      <Link
        to={`/product/${item.id}`}
        className="relative block shrink-0 overflow-hidden rounded-lg"
        style={{ borderRadius: Theme.BorderRadius.lg }}
      >
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-24 w-24 object-cover transition-transform duration-500 group-hover:scale-105 sm:h-28 sm:w-28"
        />
        {item.discountPercent > 0 && (
          <span
            className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
            style={{
              backgroundColor: Theme.colors.text,
              color: Theme.colors.background,
            }}
          >
            −{item.discountPercent}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: Theme.colors.textMuted }}
            >
              {item.brand}
            </p>
            <Link
              to={`/product/${item.id}`}
              className="mt-1 block text-base font-semibold leading-snug line-clamp-2 transition-colors hover:text-[var(--c-accent-dark)] sm:text-lg"
              style={{ color: Theme.colors.text }}
            >
              {item.name}
            </Link>
            <div className="mt-1.5 flex items-center gap-3">
              <Stars rating={item.rating} />
              <span
                className="hidden text-[11px] sm:inline"
                style={{ color: Theme.colors.textMuted }}
              >
                · EMI from ₹{item.emi}/mo
              </span>
            </div>

            {/* Desktop: inline actions */}
            <div className="mt-4 hidden items-center gap-4 sm:flex">
              <QtyStepper qty={item.qty} onChange={(d) => onQty(item.id, d)} />

              <div className="h-4 w-px" style={{ backgroundColor: Theme.colors.border }} />

              <button
                type="button"
                onClick={() => onSave(item.id)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--c-accent-dark)]"
                style={{ color: Theme.colors.textMuted }}
              >
                <Bookmark size={13} />
                Save
              </button>

              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--c-accent-dark)]"
                style={{ color: Theme.colors.textMuted }}
              >
                <Trash2 size={13} />
                Remove
              </button>
            </div>
          </div>

          {/* Price block (right aligned) */}
          <div className="flex shrink-0 flex-col items-end text-right">
            <span
              className="text-base font-bold tabular-nums sm:text-lg"
              style={{ color: Theme.colors.text }}
            >
              {inr(lineTotal)}
            </span>
            {item.discountPercent > 0 && (
              <>
                <span
                  className="mt-0.5 text-xs line-through tabular-nums"
                  style={{ color: Theme.colors.textMuted }}
                >
                  {inr(lineOriginal)}
                </span>
                <span
                  className="mt-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--c-accent-soft)',
                    color: Theme.colors.accentDark,
                  }}
                >
                  Save {inr(lineSavings)}
                </span>
              </>
            )}
          </div>

          {/* Mobile remove — floating top right */}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.name}`}
            className="absolute right-0 top-6 grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--c-accent-soft)] hover:text-[var(--c-accent-dark)] sm:hidden"
            style={{ color: Theme.colors.textMuted }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mobile: actions row */}
        <div className="mt-4 flex items-center gap-4 sm:hidden">
          <QtyStepper qty={item.qty} onChange={(d) => onQty(item.id, d)} />
          <button
            type="button"
            onClick={() => onSave(item.id)}
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: Theme.colors.textMuted }}
          >
            <Bookmark size={13} />
            Save
          </button>
        </div>
      </div>
    </article>
  );
});

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyCart() {
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
        <ShoppingBag size={24} style={{ color: Theme.colors.primaryDark }} />
      </div>
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
      >
        Your cart is empty
      </h2>
      <p className="mt-2 text-sm" style={{ color: Theme.colors.textMuted }}>
        Add something you love — your picks will show up here.
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

type CartPageProps = {
  loading?: boolean;
};

export default function CartPage({ loading }: CartPageProps = {}) {
  const [items, setItems] = useState<CartItem[]>(INITIAL_ITEMS);
  const [isSimulatedLoading, setIsSimulatedLoading] = useState(true);

  useEffect(() => {
    if (loading !== undefined) return;
    const t = window.setTimeout(() => setIsSimulatedLoading(false), 900);
    return () => window.clearTimeout(t);
  }, [loading]);

  const showSkeleton = (loading ?? isSimulatedLoading) && items.length > 0;

  /* ---- money math ---- */
  const { subtotal, total, totalSavings } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.discountedPrice * i.qty, 0);
    const mrp = items.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      subtotal: sub,
      total: sub,
      totalSavings: mrp - sub,
    };
  }, [items]);

  const itemCount = items.reduce((n, i) => n + i.qty, 0);

  /* ---- handlers ---- */
  function updateQty(id: number, delta: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.min(99, Math.max(1, i.qty + delta)) } : i))
    );
  }

  function removeItem(id: number) {
    const removed = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (removed) toast.success(`${removed.name} removed`);
  }

  function saveForLater(id: number) {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (item) toast.success(`${item.name} saved for later`);
  }

  function clearCart() {
    setItems([]);
    toast('Cart cleared');
  }

  function handleBuy() {
    toast.success('Redirecting to secure checkout…');
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
                Your Cart
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: Theme.colors.textMuted }}>
                {isEmpty
                  ? 'Nothing here yet'
                  : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                {totalSavings > 0 && !isEmpty && (
                  <>
                    {' '}·{' '}
                    <span style={{ color: Theme.colors.primaryDark, fontWeight: 600 }}>
                      Saving {inr(totalSavings)}
                    </span>
                  </>
                )}
              </p>
            </div>

            {!isEmpty && !showSkeleton && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--c-accent-dark)]"
                style={{ color: Theme.colors.textMuted }}
              >
                Clear all
              </button>
            )}
          </div>
        </header>

        {/* ── Body ────────────────────────────────────────── */}
        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
            {/* Items column */}
            <section aria-label="Cart items">
              {showSkeleton ? (
                Array.from({ length: 3 }).map((_, i) => <CartItemSkeleton key={i} />)
              ) : (
                items.map((item, index) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    onQty={updateQty}
                    onRemove={removeItem}
                    onSave={saveForLater}
                  />
                ))
              )}

              {!showSkeleton && (
                <div
                  className="mt-2 flex justify-center border-t pt-6"
                  style={{ borderColor: Theme.colors.border }}
                >
                  <Link
                    to="/"
                    className="group inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[var(--c-accent-dark)]"
                    style={{ color: Theme.colors.accentDark }}
                  >
                    <ArrowLeft
                      size={14}
                      className="transition-transform group-hover:-translate-x-0.5"
                    />
                    Add more items
                  </Link>
                </div>
              )}
            </section>

            {/* Summary column */}
            {!showSkeleton && (
              <aside className="lg:sticky lg:top-6 lg:self-start">
                <div
                  className="overflow-hidden"
                  style={{
                    backgroundColor: Theme.colors.surface,
                    borderRadius: Theme.BorderRadius.xl,
                    boxShadow: Theme.Shadow.md,
                  }}
                >
                  {/* Header strip */}
                  <div
                    className="px-6 py-5"
                    style={{
                      background: `linear-gradient(135deg, ${Theme.colors.surfaceAlt}, ${Theme.colors.surface})`,
                      borderBottom: `1px solid ${Theme.colors.border}`,
                    }}
                  >
                    <h2
                      className="text-lg font-bold"
                      style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                    >
                      Order Summary
                    </h2>
                    <p className="mt-0.5 text-xs" style={{ color: Theme.colors.textMuted }}>
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <div className="p-6">
                    {/* Totals */}
                    <dl className="flex flex-col gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <dt style={{ color: Theme.colors.textLight }}>Subtotal</dt>
                        <dd className="font-medium tabular-nums" style={{ color: Theme.colors.text }}>
                          {inr(subtotal)}
                        </dd>
                      </div>
                    </dl>

                    {/* Divider */}
                    <div
                      className="my-5"
                      style={{ borderTop: `1px dashed ${Theme.colors.border}` }}
                    />

                    {/* Total */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p
                          className="text-[11px] font-medium uppercase tracking-[0.14em]"
                          style={{ color: Theme.colors.textMuted }}
                        >
                          Total
                        </p>
                        <p className="mt-0.5 text-3xl font-bold tabular-nums leading-none"
                          style={{
                            fontFamily: Theme.Typography?.headingFamily,
                            color: Theme.colors.text,
                          }}
                        >
                          {inr(total)}
                        </p>
                      </div>
                      {totalSavings > 0 && (
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{
                            backgroundColor: 'var(--c-accent-soft)',
                            color: Theme.colors.accentDark,
                          }}
                        >
                          Save {inr(totalSavings)}
                        </span>
                      )}
                    </div>

                    {/* ── MASTER BUY BUTTON ─────────────────── */}
                    <button
                      type="button"
                      onClick={handleBuy}
                      className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 text-base font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      style={{
                        background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                        color: Theme.colors.background,
                        boxShadow: Theme.Shadow.lg,
                      }}
                    >
                      <Lock size={15} />
                      <span>Buy Now</span>
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </button>

                    {/* Secure note */}
                    <p
                      className="mt-3 flex items-center justify-center gap-1.5 text-[11px]"
                      style={{ color: Theme.colors.textMuted }}
                    >
                      <ShieldCheck size={12} style={{ color: Theme.colors.primary }} />
                      Secure 256-bit SSL encrypted checkout
                    </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}