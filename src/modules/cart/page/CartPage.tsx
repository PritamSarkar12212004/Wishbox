import ActionButton from '@/components/ui/action-button';
import { memo, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Bookmark,
    CheckCircle2,
    Download,
    FileText,
    MessageCircle,
    Minus,
    Plus,
    ShoppingBag,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
import { LOGIN_REASONS } from '@/modules/auth/data/authData';
import { loginGate } from '@/modules/auth/store/loginGate';
import { trackWishlistAdded } from '@/modules/wishlist/lib/trackWishlist';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import { quotationApi, type Quotation } from '@/modules/cart/api/quotationApi';
import {
    quotationKeys,
    useQuotationConfig,
    useQuotationDefaults,
} from '@/modules/cart/api/useQuotation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const themeVars = {
    '--c-surface-alt': Theme.colors.surfaceAlt,
    '--c-accent-dark': Theme.colors.accentDark,
    '--c-accent-soft': `color-mix(in srgb, ${Theme.colors.accent} 12%, ${Theme.colors.surface})`,
    '--c-primary': Theme.colors.primary,
    '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/** Quotation money keeps paise: a 9% split rarely lands on whole rupees. */
const inr2 = (value: number) =>
    `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    step,
    onChange,
}: {
    qty: number;
    /** Units per pack: the stepper moves by the product's bulk quantity. */
    step: number;
    onChange: (delta: number) => void;
}) {
    return (
        <div
            className="inline-flex items-center rounded-full border"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
        >
            <ActionButton
                type="button"
                onClick={() => onChange(-step)}
                disabled={qty <= step}
                aria-label="Decrease quantity"
                className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--c-surface-alt)] disabled:cursor-not-allowed disabled:opacity-30"
                style={{ color: Theme.colors.text }}
            >
                <Minus size={13} />
            </ActionButton>
            <span
                className="w-7 text-center text-sm font-semibold tabular-nums"
                style={{ color: Theme.colors.text }}
            >
                {qty}
            </span>
            <ActionButton
                type="button"
                onClick={() => onChange(step)}
                disabled={qty + step > MAX_QTY}
                aria-label="Increase quantity"
                className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--c-surface-alt)] disabled:cursor-not-allowed disabled:opacity-30"
                style={{ color: Theme.colors.text }}
            >
                <Plus size={13} />
            </ActionButton>
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
                            <QtyStepper qty={item.qty} step={item.bulkQuantity ?? 1} onChange={(delta) => onQty(item.id, delta)} />

                            <div className="h-4 w-px" style={{ backgroundColor: Theme.colors.border }} />

                            <ActionButton
                                type="button"
                                onClick={() => onSave(item.id)}
                                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--c-accent-dark)]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                <Bookmark size={13} />
                                Save for later
                            </ActionButton>

                            <ActionButton
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-[var(--c-accent-dark)]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                <Trash2 size={13} />
                                Remove
                            </ActionButton>
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
                    <ActionButton
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="absolute right-0 top-6 grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[var(--c-accent-soft)] hover:text-[var(--c-accent-dark)] sm:hidden"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        <X size={16} />
                    </ActionButton>
                </div>

                {/* Mobile: actions row */}
                <div className="mt-4 flex items-center gap-4 sm:hidden">
                    <QtyStepper qty={item.qty} step={item.bulkQuantity ?? 1} onChange={(delta) => onQty(item.id, delta)} />
                    <ActionButton
                        type="button"
                        onClick={() => onSave(item.id)}
                        className="flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        <Bookmark size={13} />
                        Save
                    </ActionButton>
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
    const quotationConfig = useQuotationConfig();
    const cgstRate = quotationConfig.data?.cgstRate ?? 0;
    const sgstRate = quotationConfig.data?.sgstRate ?? 0;

    const { subtotal, savings, discount, taxable, cgst, sgst, total } = useMemo(() => {
        const nextSubtotal = cartSubtotal(lines);
        const nextDiscount = couponDiscount(lines, coupon);
        // GST is charged on what the shopper actually pays, after any coupon.
        const nextTaxable = Math.max(nextSubtotal - nextDiscount, 0);
        const nextCgst = Math.round(nextTaxable * cgstRate) / 100;
        const nextSgst = Math.round(nextTaxable * sgstRate) / 100;
        return {
            subtotal: nextSubtotal,
            savings: cartMrpTotal(lines) - nextSubtotal,
            discount: nextDiscount,
            taxable: nextTaxable,
            cgst: nextCgst,
            sgst: nextSgst,
            total: nextTaxable + nextCgst + nextSgst,
        };
    }, [lines, coupon, cgstRate, sgstRate]);
    const itemCount = cartItemCount(lines);
    const isEmpty = lines.length === 0;
    const signedIn = useIsSignedIn();
    const [quotationOpen, setQuotationOpen] = useState(false);

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
            trackWishlistAdded(line.id);
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

    /** A quotation is sent to a WhatsApp number, so it needs an account first. */
    function requestQuotation() {
        if (!signedIn) {
            loginGate.require(
                () => setQuotationOpen(true),
                'Sign in to request a bulk quotation'
            );
            return;
        }
        setQuotationOpen(true);
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
                            <ActionButton
                                type="button"
                                onClick={clearCart}
                                className="text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--c-accent-dark)]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                Clear all
                            </ActionButton>
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
                                                {inr2(subtotal)}
                                            </dd>
                                        </div>
                                        {coupon && discount > 0 && (
                                            <div className="flex items-center justify-between">
                                                <dt style={{ color: Theme.colors.textLight }}>
                                                    Coupon{' '}
                                                    <span style={{ color: Theme.colors.primaryDark, fontWeight: 600 }}>
                                                        {coupon.code}
                                                    </span>
                                                    <ActionButton
                                                        type="button"
                                                        onClick={removeCoupon}
                                                        aria-label={`Remove coupon ${coupon.code}`}
                                                        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full align-middle transition-colors hover:bg-[var(--c-surface-alt)]"
                                                        style={{ color: Theme.colors.textMuted }}
                                                    >
                                                        <X size={11} />
                                                    </ActionButton>
                                                </dt>
                                                <dd
                                                    className="font-medium tabular-nums"
                                                    style={{ color: Theme.colors.primaryDark }}
                                                >
                                                    − {inr2(discount)}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <dt style={{ color: Theme.colors.textLight }}>
                                                CGST @ {cgstRate}%
                                            </dt>
                                            <dd className="font-medium tabular-nums" style={{ color: Theme.colors.text }}>
                                                {inr2(cgst)}
                                            </dd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <dt style={{ color: Theme.colors.textLight }}>
                                                SGST @ {sgstRate}%
                                            </dt>
                                            <dd className="font-medium tabular-nums" style={{ color: Theme.colors.text }}>
                                                {inr2(sgst)}
                                            </dd>
                                        </div>
                                    </dl>

                                    <p className="mt-2 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        GST is calculated on {inr2(taxable)} (after discount).
                                    </p>

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
                                                Total payable
                                            </p>
                                            <p
                                                className="mt-0.5 text-3xl font-bold tabular-nums leading-none"
                                                style={{
                                                    fontFamily: Theme.Typography.headingFamily,
                                                    color: Theme.colors.text,
                                                }}
                                            >
                                                {inr2(total)}
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

                                    {/* Bulk buyers ask for a priced quotation; the PDF
                                      * is generated, hosted and messaged by the API. */}
                                    <ActionButton
                                        type="button"
                                        onClick={requestQuotation}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                                        style={{
                                            background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                                            color: Theme.colors.background,
                                            boxShadow: Theme.Shadow.md,
                                        }}
                                    >
                                        <FileText size={15} />
                                        Send for Quotation
                                    </ActionButton>
                                    <p
                                        className="mt-3 text-center text-[11.5px] leading-relaxed"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        Bulk order? We&apos;ll send a GST quotation PDF on WhatsApp —
                                        no payment needed now.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            {quotationOpen && (
                <QuotationDialog
                    onClose={() => setQuotationOpen(false)}
                    lines={lines}
                    total={total}
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Quotation request                                                  */
/* ------------------------------------------------------------------ */

/**
 * "Send for Quotation".
 *
 * The cart sends product ids and quantities only: the API re-prices the basket,
 * applies the bulk tiers and the 9% + 9% GST, renders the PDF, hosts it, and
 * messages the shop and the buyer. What the shopper fills in is exactly the
 * buyer block of that PDF - name, address and WhatsApp number.
 */
function QuotationDialog({
    onClose,
    lines,
    total,
}: {
    onClose: () => void;
    lines: CartLine[];
    total: number;
}) {
    /**
     * Mounted fresh on every open, so the last quotation's buyer details are the
     * defaults the fields read while untouched. Typing over one is a local edit;
     * sending stores it on the new quotation, which is what makes the *next*
     * request open with the updated address.
     */
    const defaults = useQuotationDefaults();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [name, setName] = useState<string | null>(null);
    const [phone, setPhone] = useState<string | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState<Quotation | null>(null);

    const nameValue = name ?? defaults.data?.name ?? '';
    const phoneValue = phone ?? defaults.data?.phone ?? '';
    const addressValue = address ?? defaults.data?.address ?? '';

    async function submit() {
        const digits = phoneValue.replace(/\D/g, '');
        if (nameValue.trim().length < 2) {
            toast.error('Enter your name');
            return;
        }
        if (!/^[6-9]\d{9}$/.test(digits)) {
            toast.error('Enter a 10-digit WhatsApp number');
            return;
        }
        if (addressValue.trim().length < 10) {
            toast.error('Add the full delivery address');
            return;
        }

        setSending(true);
        try {
            const quotation = await quotationApi.create({
                items: lines.map((line) => ({ productId: line.id, qty: line.qty })),
                name: nameValue.trim(),
                phone: digits,
                address: addressValue.trim(),
            });
            setSent(quotation);
            // The basket has become a quotation: empty the cart and refresh the
            // shopper's quotation list, so the new record is already there when
            // they open it instead of waiting on a stale empty cache.
            cartStore.clear();
            void queryClient.invalidateQueries({ queryKey: quotationKeys.mine });
            void queryClient.invalidateQueries({ queryKey: quotationKeys.defaults });
            toast.success(`Quotation ${quotation.quotationNumber} sent on WhatsApp`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not send the quotation');
        } finally {
            setSending(false);
        }
    }

    const fieldStyle = {
        borderColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
        color: Theme.colors.text,
    };

    return (
        <Dialog open onOpenChange={(next) => !next && onClose()}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                {sent ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Quotation {sent.quotationNumber} is ready</DialogTitle>
                            <DialogDescription>
                                Sent to {sent.customer.phone} on WhatsApp, and to the shop.
                            </DialogDescription>
                        </DialogHeader>

                        <div
                            className="rounded-xl border px-4 py-3"
                            style={{
                                borderColor: Theme.colors.border,
                                backgroundColor: 'var(--c-surface-alt)',
                            }}
                        >
                            <p
                                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                Final amount incl. GST
                            </p>
                            <p
                                className="mt-1 text-2xl font-bold tabular-nums"
                                style={{ color: Theme.colors.text }}
                            >
                                {inr2(sent.total)}
                            </p>
                            <p
                                className="mt-1 text-[11px] leading-relaxed"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {sent.amountInWords}
                            </p>
                        </div>

                        <div
                            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            <span className="inline-flex items-center gap-1.5">
                                <MessageCircle size={12} />
                                {sent.whatsapp.customer.sent
                                    ? 'WhatsApp sent'
                                    : 'WhatsApp delayed — use the PDF'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 size={12} />
                                {sent.whatsapp.admin.sent ? 'Shop notified' : 'Shop copy pending'}
                            </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                            <a
                                href={sent.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold"
                                style={{
                                    borderColor: Theme.colors.borderStrong,
                                    color: Theme.colors.text,
                                }}
                            >
                                <Download size={13} />
                                Open PDF
                            </a>
                            <ActionButton
                                type="button"
                                onClick={() => {
                                    onClose();
                                    navigate('/quotations');
                                }}
                                className="rounded-full px-5 py-2 text-xs font-semibold"
                                style={{
                                    background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                                    color: Theme.colors.background,
                                }}
                            >
                                View quotations
                            </ActionButton>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Send for quotation</DialogTitle>
                            <DialogDescription>
                                We&apos;ll send a GST quotation PDF to your WhatsApp and to the shop.
                                No payment now.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-3">
                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    Full name
                                </span>
                                <input
                                    value={nameValue}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Name on the quotation"
                                    className="h-10 rounded-lg border px-3 text-sm outline-none"
                                    style={fieldStyle}
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    WhatsApp number
                                </span>
                                <input
                                    value={phoneValue}
                                    onChange={(event) => setPhone(event.target.value)}
                                    inputMode="numeric"
                                    maxLength={13}
                                    placeholder="10-digit number"
                                    className="h-10 rounded-lg border px-3 text-sm outline-none"
                                    style={fieldStyle}
                                />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    Delivery address <span style={{ color: Theme.colors.accentDark }}>*</span>
                                </span>
                                <textarea
                                    value={addressValue}
                                    onChange={(event) => setAddress(event.target.value)}
                                    rows={3}
                                    required
                                    aria-required="true"
                                    placeholder="Building, area, city, state, PIN code"
                                    className="rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none"
                                    style={fieldStyle}
                                />
                                <span className="text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                    Required — it goes on the quotation as the buyer's address.
                                </span>
                            </label>
                        </div>

                        <div
                            className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{ backgroundColor: 'var(--c-surface-alt)' }}
                        >
                            <div>
                                <p
                                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    Final amount incl. GST
                                </p>
                                <p
                                    className="mt-0.5 text-lg font-bold tabular-nums"
                                    style={{ color: Theme.colors.text }}
                                >
                                    {inr2(total)}
                                </p>
                            </div>
                            <p
                                className="max-w-[45%] text-right text-[10.5px] leading-snug"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                Rates are re-checked at the quantity in your cart.
                            </p>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
                            <ActionButton
                                type="button"
                                onClick={onClose}
                                className="rounded-full border px-4 py-2 text-xs font-semibold"
                                style={{
                                    borderColor: Theme.colors.borderStrong,
                                    color: Theme.colors.text,
                                }}
                            >
                                Cancel
                            </ActionButton>
                            <ActionButton
                                type="button"
                                onClick={submit}
                                disabled={sending}
                                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold disabled:opacity-60"
                                style={{
                                    background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                                    color: Theme.colors.background,
                                }}
                            >
                                {sending ? 'Sending…' : 'Send'}
                            </ActionButton>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
