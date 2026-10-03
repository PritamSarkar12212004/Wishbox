import { memo, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Bookmark,
    Lock,
    Minus,
    Plus,
    ShoppingBag,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import {
    MAX_QTY,
    cartCouponStore,
    cartItemCount,
    cartMrpTotal,
    cartStore,
    cartSubtotal,
    couponDiscount,
    useCartCoupon,
    useCartLines,
    wishlistStore,
    type CartLine,
} from '@/modules/products/store/store';
import { placeOrder } from '@/modules/history/store/store';
import { LOGIN_REASONS } from '@/modules/auth/data/authData';
import { loginGate } from '@/modules/auth/store/loginGate';

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

const Stars = memo(function Stars({ rating }: { rating: number }) {
    const full = Math.floor(rating);
    return (
        <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={12}
                    aria-hidden="true"
                    style={{
                        color: i < full ? Theme.colors.gold : Theme.colors.border,
                        fill: i < full ? Theme.colors.gold : 'none',
                    }}
                />
            ))}
            <span className="ml-1 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                {rating.toFixed(1)}
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
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
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
                disabled={qty >= MAX_QTY}
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
/*  Cart item row — editorial list style                               */
/* ------------------------------------------------------------------ */

type CartItemRowProps = {
    item: CartLine;
    index: number;
    onQty: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onSave: (id: string) => void;
};

const CartItemRow = memo(function CartItemRow({
    item,
    index,
    onQty,
    onRemove,
    onSave,
}: CartItemRowProps) {
    const lineTotal = item.price * item.qty;
    const lineOriginal = item.mrp * item.qty;
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
            >
                <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-24 w-24 object-cover transition-transform duration-500 group-hover:scale-105 sm:h-28 sm:w-28"
                />
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
                        <div className="mt-1.5">
                            <Stars rating={item.rating} />
                        </div>

                        {/* Desktop: inline actions */}
                        <div className="mt-4 hidden items-center gap-4 sm:flex">
                            <QtyStepper qty={item.qty} onChange={(delta) => onQty(item.id, delta)} />

                            <div className="h-4 w-px" style={{ backgroundColor: Theme.colors.border }} />

                            <button
                                type="button"
                                onClick={() => onSave(item.id)}
                                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--c-accent-dark)]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                <Bookmark size={13} />
                                Save for later
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
                        {lineSavings > 0 && (
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
                    <QtyStepper qty={item.qty} onChange={(delta) => onQty(item.id, delta)} />
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
                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
            >
                Your cart is empty
            </h2>
            <p className="mt-2 text-sm" style={{ color: Theme.colors.textMuted }}>
                Add something you love — your picks will show up here.
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

export default function CartPage() {
    const lines = useCartLines();
    const coupon = useCartCoupon();
    const navigate = useNavigate();

    const { subtotal, savings, discount, total } = useMemo(() => {
        const nextSubtotal = cartSubtotal(lines);
        const nextDiscount = couponDiscount(lines, coupon);
        return {
            subtotal: nextSubtotal,
            savings: cartMrpTotal(lines) - nextSubtotal,
            discount: nextDiscount,
            total: Math.max(nextSubtotal - nextDiscount, 0),
        };
    }, [lines, coupon]);
    const itemCount = cartItemCount(lines);
    const isEmpty = lines.length === 0;

    function updateQty(id: string, delta: number) {
        const line = lines.find((item) => item.id === id);
        if (!line) return;
        cartStore.setQty(id, line.qty + delta);
    }

    function removeItem(id: string) {
        const removed = lines.find((item) => item.id === id);
        cartStore.remove(id);
        if (removed) toast.success(`${removed.name} removed`);
    }

    /* Saving for later writes the wishlist, so it asks for an account first. */
    function saveForLater(id: string) {
        const line = lines.find((item) => item.id === id);
        if (!line) return;
        loginGate.require(() => {
            wishlistStore.add({
                id: line.id,
                name: line.name,
                brand: line.brand,
                image: line.image,
                price: line.price,
                mrp: line.mrp,
                rating: line.rating,
                available: true,
            });
            cartStore.remove(id);
            toast.success(`${line.name} saved for later`);
        }, LOGIN_REASONS.wishlist);
    }

    function clearCart() {
        cartStore.clear();
        toast('Cart cleared');
    }

    function removeCoupon() {
        cartCouponStore.clear();
        toast('Coupon removed');
    }

    /* Checkout is account-only: the gate verifies first, then places the order. */
    function handleBuy() {
        loginGate.require(() => {
            const order = placeOrder({ items: lines, discount });
            cartStore.clear();
            toast.success(`Order ${order.id} placed`, {
                description: 'Demo checkout — no payment is taken.',
            });
            navigate('/history');
        }, LOGIN_REASONS.placeOrder);
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
                                Your Cart
                            </h1>
                            <p className="mt-1.5 text-sm" style={{ color: Theme.colors.textMuted }}>
                                {isEmpty
                                    ? 'Nothing here yet'
                                    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                                {savings > 0 && !isEmpty && (
                                    <>
                                        {' '}
                                        ·{' '}
                                        <span style={{ color: Theme.colors.primaryDark, fontWeight: 600 }}>
                                            Saving {inr(savings)}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>

                        {!isEmpty && (
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
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_300px] md:gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
                        {/* Items column */}
                        <section aria-label="Cart items">
                            {lines.map((line, index) => (
                                <CartItemRow
                                    key={line.id}
                                    item={line}
                                    index={index}
                                    onQty={updateQty}
                                    onRemove={removeItem}
                                    onSave={saveForLater}
                                />
                            ))}

                            <div
                                className="mt-2 flex justify-center border-t pt-6"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <Link
                                    to="/shop"
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
                        </section>

                        {/* Summary column — sidebar from tablet up, stacked below the items on phones */}
                        <aside className="md:sticky md:top-24 md:self-start">
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
                                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
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
                                        {coupon && discount > 0 && (
                                            <div className="flex items-center justify-between">
                                                <dt style={{ color: Theme.colors.textLight }}>
                                                    Coupon{' '}
                                                    <span style={{ color: Theme.colors.primaryDark, fontWeight: 600 }}>
                                                        {coupon.code}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={removeCoupon}
                                                        aria-label={`Remove coupon ${coupon.code}`}
                                                        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full align-middle transition-colors hover:bg-[var(--c-surface-alt)]"
                                                        style={{ color: Theme.colors.textMuted }}
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </dt>
                                                <dd
                                                    className="font-medium tabular-nums"
                                                    style={{ color: Theme.colors.primaryDark }}
                                                >
                                                    − {inr(discount)}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <dt style={{ color: Theme.colors.textLight }}>Delivery</dt>
                                            <dd className="font-medium" style={{ color: Theme.colors.primaryDark }}>
                                                Free
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
                                            <p
                                                className="mt-0.5 text-3xl font-bold tabular-nums leading-none"
                                                style={{
                                                    fontFamily: Theme.Typography.headingFamily,
                                                    color: Theme.colors.text,
                                                }}
                                            >
                                                {inr(total)}
                                            </p>
                                        </div>
                                        {savings > 0 && (
                                            <span
                                                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                                                style={{
                                                    backgroundColor: 'var(--c-accent-soft)',
                                                    color: Theme.colors.accentDark,
                                                }}
                                            >
                                                Save {inr(savings)}
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

                                    <p className="mt-3 text-center text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        Demo checkout — no payment is taken.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
