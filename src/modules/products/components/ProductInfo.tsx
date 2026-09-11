import { useState, memo, useMemo, useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Star,
    Check,
    Minus,
    Plus,
    Truck,
    Tag,
    Gift,
    CreditCard,
    Heart,
    Share2,
    Copy,
    MessageCircle,
    ChevronDown,
    Info,
    Loader2,
    CheckCircle2,
    X,
    Sparkles,
    ShoppingCart,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import type { ColorOption, Offer } from '../data/productData';
import {
    PRODUCT,
    COLORS,
    SIZES,
    GSMS,
    PACKS,
    BULK_TIERS,
    OFFERS,
    COUPONS,
    inr,
} from '../data/productData';
import { cartStore, wishlistStore } from '../store/store';
import { cn } from '@/lib/utils';

type Props = {
    selectedColor: ColorOption;
    onColorChange: (c: ColorOption) => void;
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
    'in-stock': { text: 'In Stock', color: '#2E7D5B' },
    'low-stock': { text: 'Only a few left', color: '#B85C38' },
    'out-of-stock': { text: 'Out of Stock', color: '#B3261E' },
    'coming-soon': { text: 'Coming Soon', color: '#7A6F5D' },
};

const OFFER_ICONS: Record<Offer['icon'], typeof Tag> = {
    tag: Tag,
    gift: Gift,
    truck: Truck,
    card: CreditCard,
};

function ProductInfo({ selectedColor, onColorChange }: Props) {
    // Size / GSM / Pack Size are shown read-only (fixed preselected values).
    const [qty, setQty] = useState(1);
    const [offersOpen, setOffersOpen] = useState(false);
    const [cartState, setCartState] = useState<'idle' | 'adding' | 'added'>('idle');
    const [buyState, setBuyState] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string;
        type: 'percent' | 'flat';
        value: number;
        label: string;
    } | null>(null);

    const size = SIZES[2]; // 12 × 18 inch (read-only display)
    const gsm = GSMS[2]; // 150 GSM (read-only display)
    const pack = PACKS[0]; // 10 Sheets (read-only display)

    const tier = useMemo(
        () => BULK_TIERS.find((t) => qty >= t.min && (t.max === null || qty <= t.max)) ?? BULK_TIERS[0],
        [qty]
    );
    const unitPrice = tier.unitPrice;
    const total = unitPrice * qty;
    const mrpTotal = PRODUCT.mrp * qty;
    const saving = mrpTotal - total;
    const couponDiscount = appliedCoupon
        ? appliedCoupon.type === 'percent'
            ? Math.round((total * appliedCoupon.value) / 100)
            : Math.min(appliedCoupon.value, total)
        : 0;
    const payableTotal = Math.max(total - couponDiscount, 0);
    const totalSaving = saving + couponDiscount;
    const discountPercent = Math.round((1 - payableTotal / mrpTotal) * 100);
    const stockLabel = STATUS_LABEL[PRODUCT.stockStatus];

    const applyCoupon = useCallback((rawCode?: string) => {
        const code = (rawCode ?? couponInput).trim().toUpperCase();
        if (!code) {
            toast.error('Please enter a coupon code');
            return;
        }
        const coupon = COUPONS[code];
        if (coupon) {
            setAppliedCoupon({ code, ...coupon });
            toast.success(`Coupon ${code} applied · ${coupon.label}`);
        } else {
            toast.error(`Coupon "${code}" is invalid`);
        }
    }, [couponInput]);

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponInput('');
        toast.success('Coupon removed');
    }, []);

    const toggleWishlist = useCallback(() => {
        setWishlisted((v) => {
            wishlistStore.add(v ? -1 : 1);
            toast.success(v ? 'Removed from wishlist' : 'Added to wishlist', { description: PRODUCT.title });
            return !v;
        });
    }, []);

    const handleAddToCart = useCallback(() => {
        setCartState('adding');
        window.setTimeout(() => {
            setCartState('added');
            cartStore.add(qty);
            toast.success(`${qty} pack${qty > 1 ? 's' : ''} added to cart`, {
                description: `${PRODUCT.title} · ${inr(payableTotal)}`,
            });
            window.setTimeout(() => setCartState('idle'), 1800);
        }, 700);
    }, [qty, payableTotal]);

    const handleBuyNow = useCallback(() => {
        setBuyState(true);
        window.setTimeout(() => {
            setBuyState(false);
            cartStore.add(qty);
            toast.success('Order placed (demo checkout)', {
                description: 'Great choice! This is a mock checkout.',
            });
        }, 900);
    }, [qty]);

    const shareProduct = useCallback(async () => {
        const url = window.location.href;
        const text = `${PRODUCT.title} — ${inr(payableTotal)} at PaperCraft`;
        if (navigator.share) {
            try {
                await navigator.share({ title: PRODUCT.title, text, url });
                return;
            } catch {
                /* user cancelled */
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard');
        } catch {
            toast.error('Could not copy link');
        }
    }, [payableTotal]);

    return (
        <div className="flex flex-col gap-6">
            {/* Brand + category */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold" style={{ color: Theme.colors.primaryDark }}>
                        {PRODUCT.brand}
                    </span>
                    <span style={{ color: Theme.colors.borderStrong }}>•</span>
                    <Link to="/shop" className="hover:underline" style={{ color: Theme.colors.textMuted }}>
                        {PRODUCT.category}
                    </Link>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide rounded-full border px-2.5 py-1"
                    style={{ color: Theme.colors.textMuted, borderColor: Theme.colors.border }}>
                    {PRODUCT.sku}
                </span>
            </div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-2xl md:text-[28px] font-bold leading-snug tracking-tight"
                style={{ color: Theme.colors.text }}
            >
                {PRODUCT.title}
            </motion.h1>

            {/* Rating */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="group flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: Theme.colors.primaryDark }}>
                        {PRODUCT.rating}
                        <Star size={11} fill="currentColor" className="opacity-90" />
                    </span>
                    <span className="text-sm underline decoration-dotted underline-offset-4 group-hover:text-black transition-colors"
                        style={{ color: Theme.colors.textMuted }}>
                        {PRODUCT.reviewCount.toLocaleString('en-IN')} Ratings
                    </span>
                </span>
                <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ color: stockLabel.color, backgroundColor: alphaHex(stockLabel.color, 14) }}>
                    <Check size={12} strokeWidth={3} />
                    {stockLabel.text}
                    {PRODUCT.stockStatus === 'low-stock' && ` · ${PRODUCT.stock} left`}
                </span>
            </div>

            {/* Price */}
            <div className="rounded-2xl border p-4"
                style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface, boxShadow: Theme.Shadow.sm }}>
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={payableTotal}
                            initial={{ opacity: 0.4, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="text-[32px] font-extrabold tracking-tight"
                            style={{ color: Theme.colors.text }}
                        >
                            {inr(payableTotal)}
                        </motion.span>
                    </AnimatePresence>
                    <span className="text-base line-through" style={{ color: Theme.colors.textMuted }}>
                        {inr(mrpTotal)}
                    </span>
                    <span className="rounded-md px-1.5 py-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: Theme.colors.accent }}>
                        {discountPercent}% OFF
                    </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 font-medium" style={{ color: '#2E7D5B' }}>
                        <Sparkles size={14} />
                        You save {inr(totalSaving)}
                    </span>
                    <span style={{ color: Theme.colors.textMuted }}>
                        {inr(pack.perSheet)} / sheet
                    </span>
                    {unitPrice < pack.packPrice && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}>
                            {tier.discountPct}% bulk discount applied
                        </span>
                    )}
                    {appliedCoupon && (
                        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: alphaHex('#2E7D5B', 14), color: '#2E7D5B' }}>
                            <Check size={12} strokeWidth={3} />
                            {appliedCoupon.code} applied · {appliedCoupon.label}
                        </span>
                    )}
                </div>
                <p className="mt-1.5 text-xs" style={{ color: Theme.colors.textMuted }}>
                    Inclusive of all taxes
                </p>
            </div>
{/* Color */}
            <div className="space-y-2.5">
                <span className="block text-sm font-medium" style={{ color: Theme.colors.text }}>
                    Color: <span className="font-semibold">{selectedColor.name}</span>
                </span>
                <div role="radiogroup" aria-label="Select color" className="flex flex-wrap gap-2.5">
                    {COLORS.map((c) => {
                        const selected = c.name === selectedColor.name;
                        return (
                            <button
                                key={c.name}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                aria-label={`${c.name} color`}
                                disabled={!c.available}
                                onClick={() => onColorChange(c)}
                                title={c.name}
                                className={cn(
                                    'relative h-9 w-9 rounded-full outline-none transition-all duration-200',
                                    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/40',
                                    selected && 'ring-2 ring-offset-2',
                                    !c.available && 'cursor-not-allowed opacity-35'
                                )}
                                style={{
                                    backgroundColor: c.hex,
                                    border: `1px solid ${Theme.colors.borderStrong}`,
                                    ...(selected ? { ['--tw-ring-color' as string]: Theme.colors.primaryDark } : {}),
                                }}
                            >
                                {selected && (
                                    <Check size={16}
                                        className="absolute inset-0 m-auto"
                                        style={{ color: c.name === 'Silver' ? '#6B5D55' : 'white' }} />
                                )}
                                {!c.available && (
                                    <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-black/50" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {!selectedColor.available && (
                    <p className="text-xs font-medium" style={{ color: '#B3261E' }}>
                        This color is currently unavailable.
                    </p>
                )}
            </div>
{/* Size (read-only) */}
            <VariantGroup label="Size">
                <div className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                    <span className="text-sm font-medium" style={{ color: Theme.colors.text }}>{size.label}</span>
                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        {size.widthInch}&quot; × {size.heightInch}&quot;
                    </span>
                </div>
            </VariantGroup>
{/* GSM (read-only) */}
            <VariantGroup label={
                <span className="flex items-center gap-1.5">
                    Paper Thickness (GSM)
                    <Info
                        size={13}
                        tabIndex={0}
                        className="cursor-help"
                        aria-label="GSM means Grams per Square Meter. Higher GSM generally indicates thicker and heavier paper."
                    />
                </span>
            }>
                <div className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                    <span className="text-sm font-medium" style={{ color: Theme.colors.text }}>{gsm.value} GSM</span>
                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        {gsm.value >= 200
                            ? 'Heavyweight — ideal for cards & décor'
                            : gsm.value >= 120
                              ? 'Medium weight — perfect for crafts & gifting'
                              : 'Lightweight — good for printing'}
                    </span>
                </div>
            </VariantGroup>
{/* Pack size (read-only) */}
            <VariantGroup label="Pack Size">
                <div className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                    <span className="text-sm font-medium" style={{ color: Theme.colors.text }}>{pack.sheets} Sheets</span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: Theme.colors.text }}>
                        {inr(pack.packPrice)}
                    </span>
                </div>
            </VariantGroup>
{/* Quantity */}
            <div className="rounded-2xl border p-4" style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <span className="block text-sm font-medium" style={{ color: Theme.colors.text }}>Quantity</span>
                        <div className="mt-2 flex items-center overflow-hidden rounded-xl border" style={{ borderColor: Theme.colors.border }}>
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={qty <= 1}
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
                            >
                                <Minus size={16} />
                            </button>
                            <div className="flex h-11 min-w-14 items-center justify-center px-2 text-lg font-bold tabular-nums"
                                style={{ color: Theme.colors.text }} aria-live="polite">
                                {qty}
                            </div>
                            <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={qty >= 50}
                                onClick={() => setQty((q) => Math.min(50, q + 1))}
                                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm space-y-0.5">
                        <p className="font-semibold" style={{ color: Theme.colors.text }}>{qty} pack{qty > 1 ? 's' : ''} selected</p>
                        <p style={{ color: Theme.colors.textMuted }}>{pack.sheets} sheets per pack · {inr(unitPrice)} per pack</p>
                        <AnimatePresence mode="wait">
                            {qty >= BULK_TIERS[1].min ? (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="font-medium"
                                    style={{ color: '#2E7D5B' }}
                                >
                                    {tier.discountPct}% bulk discount applied
                                </motion.p>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
{/* Bulk pricing table */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: Theme.colors.border }}>
                    <Tag size={15} style={{ color: Theme.colors.accent }} />
                    <h2 className="text-sm font-semibold" style={{ color: Theme.colors.text }}>Bulk Pricing</h2>
                    <span className="ml-auto text-xs" style={{ color: Theme.colors.textMuted }}>per pack</span>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs" style={{ color: Theme.colors.textMuted }}>
                            <th scope="col" className="px-4 py-2 text-left font-medium">Quantity</th>
                            <th scope="col" className="py-2 text-right font-medium">Price / Pack</th>
                            <th scope="col" className="px-4 py-2 text-right font-medium">Savings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {BULK_TIERS.map((t) => {
                            const active = t.max === null ? qty >= t.min : qty >= t.min && qty <= t.max;
                            return (
                                <tr key={t.min}
                                    aria-current={active ? 'true' : undefined}
                                    className="text-sm"
                                    style={active ? { backgroundColor: Theme.colors.primaryLight, color: Theme.colors.text } : { color: Theme.colors.textLight }}>
                                    <td className="px-4 py-2">
                                        <span className="flex items-center gap-2">
                                            {active && <Check size={13} style={{ color: Theme.colors.primaryDark }} />}
                                            {t.min}–{t.max ?? '500+'}
                                        </span>
                                    </td>
                                    <td className={`py-2 text-right tabular-nums ${active ? 'font-bold' : ''}`}>
                                        {inr(t.unitPrice)}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {t.discountPct > 0 ? `${t.discountPct}% off` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {qty >= BULK_TIERS[1].min && (
                    <p className="border-t px-4 py-2.5 text-xs font-medium" style={{ borderColor: Theme.colors.border, color: '#2E7D5B' }}>
                        You save {inr(saving)} with bulk pricing across {qty} pack{qty > 1 ? 's' : ''}.
                    </p>
                )}
{/* Offers */}
            <div className="rounded-2xl border p-4" style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: Theme.colors.text }}>
                        <Gift size={15} style={{ color: Theme.colors.accent }} />
                        Available Offers
                    </h2>
                    <button
                        type="button"
                        onClick={() => setOffersOpen((v) => !v)}
                        aria-expanded={offersOpen}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-black/5"
                        style={{ color: Theme.colors.primaryDark }}
                    >
                        {offersOpen ? 'Hide offers' : `View all (${OFFERS.length} offers)`}
                        <ChevronDown size={13} className="transition-transform" style={{ transform: offersOpen ? 'rotate(180deg)' : undefined }} />
                    </button>
                </div>
                <ul className="mt-3 flex flex-col gap-2.5">
                    {OFFERS.slice(0, offersOpen ? OFFERS.length : 2).map((offer) => {
                        const Icon = OFFER_ICONS[offer.icon];
                        return (
                            <li key={offer.title} className="flex items-start gap-2.5 rounded-xl border border-dashed px-3 py-2.5"
                                style={{ borderColor: Theme.colors.borderStrong, backgroundColor: 'rgba(250,246,240,0.4)' }}>
                                <Icon size={17} className="mt-0.5 shrink-0" style={{ color: Theme.colors.accent }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium" style={{ color: Theme.colors.text }}>{offer.title}</p>
                                    <p className="text-xs" style={{ color: Theme.colors.textMuted }}>{offer.description}</p>
                                </div>
                                {offer.code && (
                                    <button
                                        type="button"
                                        onClick={() => applyCoupon(offer.code)}
                                        className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-opacity hover:opacity-80"
                                        style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                                        aria-label={`Apply coupon code ${offer.code}`}
                                        title={`Apply ${offer.code}`}
                                    >
                                        {offer.code}
                                        <Check size={12} strokeWidth={3} />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
                {appliedCoupon ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                        style={{ backgroundColor: alphaHex('#2E7D5B', 12), border: `1px solid ${alphaHex('#2E7D5B', 35)}` }}>
                        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#2E7D5B' }}>
                            <CheckCircle2 size={16} />
                            {appliedCoupon.code} applied · {appliedCoupon.label}
                            {couponDiscount > 0 && (
                                <span className="text-xs font-medium">(save {inr(couponDiscount)})</span>
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={removeCoupon}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors hover:bg-black/5"
                            style={{ color: Theme.colors.text }}
                        >
                            <X size={13} />
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="mt-3 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: Theme.colors.textMuted }} />
                            <input
                                type="text"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') applyCoupon();
                                }}
                                placeholder="Enter coupon code"
                                aria-label="Enter coupon code"
                                className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm uppercase outline-none transition-colors focus:border-black/40 focus:ring-2 focus:ring-black/15"
                                style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => applyCoupon()}
                            className="flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition-all duration-200 active:scale-[0.97]"
                            style={{ backgroundColor: Theme.colors.primaryDark }}
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={cartState === 'adding'}
                    className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-bold text-white transition-all duration-200 active:scale-[0.98] shadow-md disabled:opacity-90"
                    style={{ backgroundColor: Theme.colors.primary, boxShadow: Theme.Shadow.sm }}
                >
                    {cartState === 'adding' ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : cartState === 'added' ? (
                        <CheckCircle2 size={18} />
                    ) : (
                        <ShoppingCart size={18} />
                    )}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={`${cartState}-${total}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {cartState === 'added' ? 'Added to cart' : `Add to Cart · ${inr(total)}`}
                        </motion.span>
                    </AnimatePresence>
                </button>
                <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-all duration-200 active:scale-[0.98] shadow-md"
                    style={{
                        backgroundColor: buyState ? Theme.colors.primaryDark : Theme.colors.accent,
                        color: Theme.colors.white,
                        boxShadow: Theme.Shadow.sm,
                    }}
                >
                    {buyState ? <Loader2 size={18} className="animate-spin" /> : 'Buy Now'}
                </button>
            </div>
            </div>
{/* Wishlist + Share */}
            <div className="flex items-center justify-between gap-3 text-sm">
                <button
                    type="button"
                    onClick={toggleWishlist}
                    aria-pressed={wishlisted}
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200 active:scale-95"
                    style={{ color: wishlisted ? Theme.colors.accent : Theme.colors.text }}
                >
                    <motion.span
                        key={wishlisted ? 'on' : 'off'}
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                        <Heart size={18} fill={wishlisted ? Theme.colors.accent : 'none'} />
                    </motion.span>
                    {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShareOpen((v) => !v)}
                        aria-expanded={shareOpen}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2"
                        style={{ color: Theme.colors.text }}
                    >
                        <Share2 size={17} />
                        Share
                    </button>
                    <AnimatePresence>
                        {shareOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.14 }}
                                className="absolute bottom-full right-0 mb-2 z-30 w-48 rounded-xl border bg-white p-1.5 shadow-lg"
                                style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.lg }}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.open(`https://wa.me/?text=${encodeURIComponent(`${PRODUCT.title} — ${inr(total)}`)}`, '_blank');
                                        setShareOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                                    style={{ color: Theme.colors.text }}
                                >
                                    <MessageCircle size={15} style={{ color: '#25D366' }} />
                                    WhatsApp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success('Link copied to clipboard');
                                        setShareOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                                    style={{ color: Theme.colors.text }}
                                >
                                    <Copy size={15} />
                                    Copy Link
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        shareProduct();
                                        setShareOpen(false);
                                    }}
                                    disabled={!navigator.share}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-40"
                                    style={{ color: Theme.colors.text }}
                                >
                                    <Share2 size={15} />
                                    System Share
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function VariantGroup({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <div className="space-y-2.5">
            <span className="block text-sm font-medium" style={{ color: Theme.colors.text }}>{label}</span>
            {children}
        </div>
    );
}

export function alphaHex(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

export default memo(ProductInfo);