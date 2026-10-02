import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
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
    CheckCircle2,
    X,
    Sparkles,
    ShoppingCart,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { alphaHex } from '@/lib/color';
import { inr } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CatalogProduct } from '../data/catalogData';
import { OFFERS, type ColorOption, type Offer, type PaperDetail } from '../data/detailData';
import { MAX_QTY } from '../store/store';
import type { usePurchase } from '../hooks/usePurchase';

const OFFER_ICONS: Record<Offer['icon'], typeof Tag> = {
    tag: Tag,
    gift: Gift,
    truck: Truck,
    card: CreditCard,
};

const IN_STOCK = { text: 'In Stock', color: '#2E7D5B' };
const LOW_STOCK = { text: 'Only a few left', color: '#B85C38' };
const OUT_OF_STOCK = { text: 'Out of Stock', color: '#B3261E' };

function stockInfo(product: CatalogProduct) {
    if (!product.available) return OUT_OF_STOCK;
    if (product.stock <= 10) return { ...LOW_STOCK, text: `Only ${product.stock} left` };
    return IN_STOCK;
}

type ProductInfoProps = {
    product: CatalogProduct;
    /** Present only for the flagship paper product (variants, bulk pricing, guides). */
    detail: PaperDetail | null;
    purchase: ReturnType<typeof usePurchase>;
    selectedColor: ColorOption | null;
    onColorChange: (color: ColorOption) => void;
    wishlisted: boolean;
    onToggleWishlist: () => void;
};

function ProductInfo({
    product,
    detail,
    purchase,
    selectedColor,
    onColorChange,
    wishlisted,
    onToggleWishlist,
}: ProductInfoProps) {
    const [offersOpen, setOffersOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [buying, setBuying] = useState(false);
    const addTimer = useRef<number | null>(null);
    const buyTimer = useRef<number | null>(null);

    useEffect(
        () => () => {
            if (addTimer.current) window.clearTimeout(addTimer.current);
            if (buyTimer.current) window.clearTimeout(buyTimer.current);
        },
        []
    );

    const size = detail?.sizes.find((option) => option.available) ?? null;
    const gsm = detail?.gsms.find((option) => option.available) ?? null;
    const pack = detail?.packs[0] ?? null;
    const stock = stockInfo(product);
    const unitWord = detail ? 'pack' : 'unit';

    function handleAddToCart() {
        purchase.addToCart();
        setJustAdded(true);
        if (addTimer.current) window.clearTimeout(addTimer.current);
        addTimer.current = window.setTimeout(() => setJustAdded(false), 1600);
    }

    function handleBuyNow() {
        purchase.buyNow();
        setBuying(true);
        if (buyTimer.current) window.clearTimeout(buyTimer.current);
        buyTimer.current = window.setTimeout(() => setBuying(false), 900);
    }

    async function shareProduct() {
        const url = window.location.href;
        const text = `${product.name} — ${inr(purchase.payableTotal)} at WishBox`;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: product.name, text, url });
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
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Brand + category + SKU */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold" style={{ color: Theme.colors.primaryDark }}>
                        {product.brand}
                    </span>
                    <span style={{ color: Theme.colors.borderStrong }}>•</span>
                    <Link
                        to={`/shop?category=${product.category}`}
                        className="hover:underline"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        {product.category.replace('-', ' ')}
                    </Link>
                </div>
                <span
                    className="text-xs font-medium uppercase tracking-wide rounded-full border px-2.5 py-1"
                    style={{ color: Theme.colors.textMuted, borderColor: Theme.colors.border }}
                >
                    {product.sku}
                </span>
            </div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-2xl lg:text-[28px] font-bold leading-snug tracking-tight"
                style={{ color: Theme.colors.text }}
            >
                {product.name}
            </motion.h1>

            {/* Rating + stock */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="group flex items-center gap-1.5">
                    <span
                        className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: Theme.colors.primaryDark }}
                    >
                        {product.rating}
                        <Star size={11} fill="currentColor" className="opacity-90" />
                    </span>
                    <span
                        className="text-sm underline decoration-dotted underline-offset-4 group-hover:text-black transition-colors"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        {product.reviewCount.toLocaleString('en-IN')} Ratings
                    </span>
                </span>
                <span
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ color: stock.color, backgroundColor: alphaHex(stock.color, 14) }}
                >
                    <Check size={12} strokeWidth={3} />
                    {stock.text}
                </span>
            </div>

            {/* Price */}
            <div
                className="rounded-2xl border p-4"
                style={{
                    borderColor: Theme.colors.border,
                    backgroundColor: Theme.colors.surface,
                    boxShadow: Theme.Shadow.sm,
                }}
            >
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={purchase.payableTotal}
                            initial={{ opacity: 0.4, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            className="text-[26px] md:text-[27px] lg:text-[32px] font-extrabold tracking-tight"
                            style={{ color: Theme.colors.text }}
                        >
                            {inr(purchase.payableTotal)}
                        </motion.span>
                    </AnimatePresence>
                    <span className="text-base line-through" style={{ color: Theme.colors.textMuted }}>
                        {inr(purchase.mrpTotal)}
                    </span>
                    {purchase.discountPercent > 0 && (
                        <span
                            className="rounded-md px-1.5 py-0.5 text-xs font-bold text-white"
                            style={{ backgroundColor: Theme.colors.accent }}
                        >
                            {purchase.discountPercent}% OFF
                        </span>
                    )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 font-medium" style={{ color: '#2E7D5B' }}>
                        <Sparkles size={14} />
                        You save {inr(purchase.totalSaving)}
                    </span>
                    {pack && (
                        <span style={{ color: Theme.colors.textMuted }}>
                            {inr(pack.perSheet)} / sheet
                        </span>
                    )}
                    {purchase.bulkTier && purchase.bulkTier.discountPct > 0 && (
                        <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                        >
                            {purchase.bulkTier.discountPct}% bulk discount applied
                        </span>
                    )}
                    {purchase.appliedCoupon && (
                        <span
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: alphaHex('#2E7D5B', 14), color: '#2E7D5B' }}
                        >
                            <Check size={12} strokeWidth={3} />
                            {purchase.appliedCoupon.code} applied · {purchase.appliedCoupon.label}
                        </span>
                    )}
                </div>
                <p className="mt-1.5 text-xs" style={{ color: Theme.colors.textMuted }}>
                    Inclusive of all taxes
                </p>
            </div>

            {/* Colour — flagship only */}
            {detail && selectedColor && (
                <div className="space-y-2.5">
                    <span className="block text-sm font-medium" style={{ color: Theme.colors.text }}>
                        Color: <span className="font-semibold">{selectedColor.name}</span>
                    </span>
                    <div role="radiogroup" aria-label="Select color" className="flex flex-wrap gap-2.5">
                        {detail.colors.map((color) => {
                            const selected = color.name === selectedColor.name;
                            return (
                                <button
                                    key={color.name}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    aria-label={`${color.name} color`}
                                    disabled={!color.available}
                                    onClick={() => onColorChange(color)}
                                    title={color.name}
                                    className={cn(
                                        'relative h-9 w-9 rounded-full outline-none transition-all duration-200',
                                        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/40',
                                        selected && 'ring-2 ring-offset-2',
                                        !color.available && 'cursor-not-allowed opacity-35'
                                    )}
                                    style={{
                                        backgroundColor: color.hex,
                                        border: `1px solid ${Theme.colors.borderStrong}`,
                                        ...(selected ? { ['--tw-ring-color' as string]: Theme.colors.primaryDark } : {}),
                                    }}
                                >
                                    {selected && (
                                        <Check
                                            size={16}
                                            className="absolute inset-0 m-auto"
                                            style={{ color: color.name === 'Silver' ? '#6B5D55' : 'white' }}
                                        />
                                    )}
                                    {!color.available && (
                                        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -rotate-45 bg-black/50" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Size / GSM / Pack — flagship only, shown read-only */}
            {detail && size && (
                <VariantGroup label="Size">
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
                    >
                        <span className="text-sm font-medium" style={{ color: Theme.colors.text }}>
                            {size.label}
                        </span>
                        <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                            {size.widthInch}&quot; × {size.heightInch}&quot;
                        </span>
                    </div>
                </VariantGroup>
            )}

            {detail && gsm && (
                <VariantGroup
                    label={
                        <span className="flex items-center gap-1.5">
                            Paper Thickness (GSM)
                            <Info
                                size={13}
                                tabIndex={0}
                                className="cursor-help"
                                aria-label="GSM means Grams per Square Meter. Higher GSM generally indicates thicker and heavier paper."
                            />
                        </span>
                    }
                >
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
                    >
                        <span className="text-sm font-medium" style={{ color: Theme.colors.text }}>
                            {gsm.value} GSM
                        </span>
                        <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                            {gsm.value >= 200
                                ? 'Heavyweight — ideal for cards & décor'
                                : gsm.value >= 120
                                  ? 'Medium weight — perfect for crafts & gifting'
                                  : 'Lightweight — good for printing'}
                        </span>
                    </div>
                </VariantGroup>
            )}

            {detail && pack && (
                <VariantGroup label="Pack Size">
                    <div
                        className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
                    >
                        <span className="text-sm font-medium" style={{ color: Theme.colors.text }}>
                            {pack.sheets} Sheets
                        </span>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: Theme.colors.text }}>
                            {inr(pack.packPrice)}
                        </span>
                    </div>
                </VariantGroup>
            )}

            {/* Quantity */}
            <div
                className="rounded-2xl border p-4"
                style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div>
                        <span className="block text-sm font-medium" style={{ color: Theme.colors.text }}>
                            Quantity
                        </span>
                        <div className="mt-2 flex items-center overflow-hidden rounded-xl border" style={{ borderColor: Theme.colors.border }}>
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={purchase.qty <= 1}
                                onClick={() => purchase.setQty(purchase.qty - 1)}
                                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
                            >
                                <Minus size={16} />
                            </button>
                            <div
                                className="flex h-11 min-w-14 items-center justify-center px-2 text-lg font-bold tabular-nums"
                                style={{ color: Theme.colors.text }}
                                aria-live="polite"
                            >
                                {purchase.qty}
                            </div>
                            <button
                                type="button"
                                aria-label="Increase quantity"
                                disabled={purchase.qty >= MAX_QTY}
                                onClick={() => purchase.setQty(purchase.qty + 1)}
                                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm space-y-0.5">
                        <p className="font-semibold" style={{ color: Theme.colors.text }}>
                            {purchase.qty} {unitWord}
                            {purchase.qty > 1 ? 's' : ''} selected
                        </p>
                        <p style={{ color: Theme.colors.textMuted }}>
                            {pack ? `${pack.sheets} sheets per pack · ` : ''}
                            {inr(purchase.unitPrice)} each
                        </p>
                        <AnimatePresence mode="wait">
                            {purchase.bulkTier && purchase.bulkTier.discountPct > 0 && purchase.qty >= 10 ? (
                                <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="font-medium"
                                    style={{ color: '#2E7D5B' }}
                                >
                                    {purchase.bulkTier.discountPct}% bulk discount applied
                                </motion.p>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Bulk pricing table — flagship only */}
            {detail && (
                <div
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
                >
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: Theme.colors.border }}>
                        <Tag size={15} style={{ color: Theme.colors.accent }} />
                        <h2 className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            Bulk Pricing
                        </h2>
                        <span className="ml-auto text-xs" style={{ color: Theme.colors.textMuted }}>
                            per pack
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[290px] text-sm">
                            <thead>
                                <tr className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                    <th scope="col" className="px-4 py-2 text-left font-medium">
                                        Quantity
                                    </th>
                                    <th scope="col" className="py-2 text-right font-medium">
                                        Price / Pack
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-right font-medium">
                                        Savings
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {detail.bulkTiers.map((tier) => {
                                    const active =
                                        tier.max === null
                                            ? purchase.qty >= tier.min
                                            : purchase.qty >= tier.min && purchase.qty <= tier.max;
                                    return (
                                        <tr
                                            key={tier.min}
                                            aria-current={active ? 'true' : undefined}
                                            className="text-sm"
                                            style={
                                                active
                                                    ? { backgroundColor: Theme.colors.primaryLight, color: Theme.colors.text }
                                                    : { color: Theme.colors.textLight }
                                            }
                                        >
                                            <td className="px-4 py-2">
                                                <span className="flex items-center gap-2">
                                                    {active && <Check size={13} style={{ color: Theme.colors.primaryDark }} />}
                                                    {tier.max === null
                                                        ? `${tier.min}+`
                                                        : `${tier.min}–${tier.max}`}
                                                </span>
                                            </td>
                                            <td className={`py-2 text-right tabular-nums ${active ? 'font-bold' : ''}`}>
                                                {inr(tier.unitPrice)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {tier.discountPct > 0 ? `${tier.discountPct}% off` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {purchase.qty >= 10 && (
                        <p
                            className="border-t px-4 py-2.5 text-xs font-medium"
                            style={{ borderColor: Theme.colors.border, color: '#2E7D5B' }}
                        >
                            You save {inr(purchase.mrpTotal - purchase.payableTotal)} with bulk pricing across{' '}
                            {purchase.qty} packs.
                        </p>
                    )}
                </div>
            )}

            {/* Offers + coupon */}
            <div
                className="rounded-2xl border p-4"
                style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
            >
                <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: Theme.colors.text }}>
                        <Gift size={15} style={{ color: Theme.colors.accent }} />
                        Available Offers
                    </h2>
                    <button
                        type="button"
                        onClick={() => setOffersOpen((open) => !open)}
                        aria-expanded={offersOpen}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-black/5"
                        style={{ color: Theme.colors.primaryDark }}
                    >
                        {offersOpen ? 'Hide offers' : `View all (${OFFERS.length} offers)`}
                        <ChevronDown
                            size={13}
                            className="transition-transform"
                            style={{ transform: offersOpen ? 'rotate(180deg)' : undefined }}
                        />
                    </button>
                </div>
                <ul className="mt-3 flex flex-col gap-2.5">
                    {OFFERS.slice(0, offersOpen ? OFFERS.length : 2).map((offer) => {
                        const Icon = OFFER_ICONS[offer.icon];
                        return (
                            <li
                                key={offer.title}
                                className="flex items-start gap-2.5 rounded-xl border border-dashed px-3 py-2.5"
                                style={{ borderColor: Theme.colors.borderStrong, backgroundColor: 'rgba(250,246,240,0.4)' }}
                            >
                                <Icon size={17} className="mt-0.5 shrink-0" style={{ color: Theme.colors.accent }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium" style={{ color: Theme.colors.text }}>
                                        {offer.title}
                                    </p>
                                    <p className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                        {offer.description}
                                    </p>
                                </div>
                                {offer.code && (
                                    <button
                                        type="button"
                                        onClick={() => purchase.applyCoupon(offer.code)}
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

                {purchase.appliedCoupon ? (
                    <div
                        className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                        style={{
                            backgroundColor: alphaHex('#2E7D5B', 12),
                            border: `1px solid ${alphaHex('#2E7D5B', 35)}`,
                        }}
                    >
                        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#2E7D5B' }}>
                            <CheckCircle2 size={16} />
                            {purchase.appliedCoupon.code} applied · {purchase.appliedCoupon.label}
                            {purchase.couponDiscount > 0 && (
                                <span className="text-xs font-medium">(save {inr(purchase.couponDiscount)})</span>
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={purchase.removeCoupon}
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
                            <Tag
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: Theme.colors.textMuted }}
                            />
                            <input
                                type="text"
                                value={purchase.couponInput}
                                onChange={(event) => purchase.setCouponInput(event.target.value.toUpperCase())}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') purchase.applyCoupon();
                                }}
                                placeholder="Enter coupon code"
                                aria-label="Enter coupon code"
                                className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm uppercase outline-none transition-colors focus:border-black/40 focus:ring-2 focus:ring-black/15"
                                style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => purchase.applyCoupon()}
                            className="flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition-all duration-200 active:scale-[0.97]"
                            style={{ backgroundColor: Theme.colors.primaryDark }}
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>

            {/* Buy actions */}
            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!product.available}
                    className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-bold text-white transition-all duration-200 active:scale-[0.98] shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: Theme.colors.primary, boxShadow: Theme.Shadow.sm }}
                >
                    {justAdded ? <CheckCircle2 size={18} /> : <ShoppingCart size={18} />}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={`${justAdded}-${purchase.subtotal}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {justAdded ? 'Added to cart' : `Add to Cart · ${inr(purchase.payableTotal)}`}
                        </motion.span>
                    </AnimatePresence>
                </button>
                <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!product.available}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-all duration-200 active:scale-[0.98] shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                        backgroundColor: buying ? Theme.colors.primaryDark : Theme.colors.accent,
                        color: Theme.colors.white,
                        boxShadow: Theme.Shadow.sm,
                    }}
                >
                    {buying ? 'Order placed' : 'Buy Now'}
                </button>
            </div>

            {/* Wishlist + share */}
            <div className="flex items-center justify-between gap-3 text-sm">
                <button
                    type="button"
                    onClick={onToggleWishlist}
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
                        onClick={() => setShareOpen((open) => !open)}
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
                                        window.open(
                                            `https://wa.me/?text=${encodeURIComponent(`${product.name} — ${inr(purchase.subtotal)}`)}`,
                                            '_blank',
                                            'noopener,noreferrer'
                                        );
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
                                        void shareProduct();
                                        setShareOpen(false);
                                    }}
                                    disabled={typeof navigator.share !== 'function'}
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
            <span className="block text-sm font-medium" style={{ color: Theme.colors.text }}>
                {label}
            </span>
            {children}
        </div>
    );
}

export default memo(ProductInfo);
