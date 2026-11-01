import ActionButton from '@/components/ui/action-button';
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Star,
    Check,
    Minus,
    Plus,
    Tag,
    Heart,
    Share2,
    Copy,
    MessageCircle,
    Sparkles,
    Lock,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { alphaHex } from '@/lib/color';
import { inr } from '@/lib/format';
import type { CatalogProduct } from '../api/productApi';
import { useProductReviews } from '../api/useProducts';
import { MAX_QTY } from '../store/store';
import { COMMERCE_COMING_SOON, COMMERCE_COMING_SOON_NOTE, COMMERCE_ENABLED } from '@/lib/commerce';
import type { usePurchase } from '../hooks/usePurchase';

const IN_STOCK = { text: 'In Stock', color: '#2E7D5B' };
const OUT_OF_STOCK = { text: 'Out of Stock', color: '#B3261E' };

/** Availability is the admin's own switch - the shop does not publish unit counts. */
function stockInfo(product: CatalogProduct) {
    return product.available ? IN_STOCK : OUT_OF_STOCK;
}

type ProductInfoProps = {
    product: CatalogProduct;
    purchase: ReturnType<typeof usePurchase>;
    wishlisted: boolean;
    onToggleWishlist: () => void;
};

function ProductInfo({
    product,
    purchase,
    wishlisted,
    onToggleWishlist,
}: ProductInfoProps) {
    const [shareOpen, setShareOpen] = useState(false);
    /** Stars are counted from the reviews, not copied off the product form. */
    const liveRating = useProductReviews(product.id).data?.summary;
    const ratingCount = liveRating ? liveRating.count : product.reviewCount;
    const ratingAverage = liveRating ? liveRating.average : product.rating;

    const stock = stockInfo(product);
    const bulkTiers = product.bulkTiers ?? [];
    /** Units the stepper moves by - the admin's bulk quantity, one when unset. */
    const step = Math.max(1, product.bulkQuantity ?? 1);
    const unitWord = step > 1 || bulkTiers.length > 0 ? 'pack' : 'unit';


    /** The product's canonical link, shared as text so every app keeps it. */
    const shareUrl = `${window.location.origin}/product/${product.id}`;

    async function shareProduct() {
        const url = shareUrl;
        const text = `${product.name} — ${inr(purchase.payableTotal)} at WishBox\n${url}`;
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

            {/* Rating + stock: the rating is the reviews' average, so it links there. */}
            <div className="flex flex-wrap items-center gap-3">
                <a href="#reviews" className="group flex items-center gap-1.5">
                    {ratingCount > 0 ? (
                        <>
                            <span
                                className="flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
                                style={{ backgroundColor: Theme.colors.primaryDark }}
                            >
                                {ratingAverage.toFixed(1)}
                                <Star size={11} fill="currentColor" className="opacity-90" />
                            </span>
                            <span
                                className="text-sm underline decoration-dotted underline-offset-4 group-hover:text-black transition-colors"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {ratingCount.toLocaleString('en-IN')}{' '}
                                {ratingCount === 1 ? 'review' : 'reviews'}
                            </span>
                        </>
                    ) : (
                        <span
                            className="text-sm underline decoration-dotted underline-offset-4 group-hover:text-black transition-colors"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            Be the first to review
                        </span>
                    )}
                </a>
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
                            <ActionButton
                                type="button"
                                aria-label="Decrease quantity"
                                disabled={purchase.qty <= step}
                                onClick={() => purchase.setQty(purchase.qty - step)}
                                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
                            >
                                <Minus size={16} />
                            </ActionButton>
                            <div
                                className="flex h-11 min-w-14 items-center justify-center px-2 text-lg font-bold tabular-nums"
                                style={{ color: Theme.colors.text }}
                                aria-live="polite"
                            >
                                {purchase.qty}
                            </div>
                            <ActionButton
                                type="button"
                                aria-label="Increase quantity"
                                disabled={purchase.qty + step > MAX_QTY}
                                onClick={() => purchase.setQty(purchase.qty + step)}
                                className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30"
                            >
                                <Plus size={16} />
                            </ActionButton>
                        </div>
                    </div>
                    <div className="text-sm space-y-0.5">
                        <p className="font-semibold" style={{ color: Theme.colors.text }}>
                            {purchase.qty} {unitWord}
                            {purchase.qty > 1 ? 's' : ''} selected
                        </p>
                        {step > 1 && (
                            <p style={{ color: Theme.colors.textMuted }}>Sold in packs of {step}</p>
                        )}
                        <p style={{ color: Theme.colors.textMuted }}>
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

            {/* Bulk pricing table — only when the product has quantity breaks */}
            {bulkTiers.length > 0 && (
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
                                {bulkTiers.map((tier) => {
                                    const active =
                                        tier.maxQty === null
                                            ? purchase.qty >= tier.minQty
                                            : purchase.qty >= tier.minQty && purchase.qty <= tier.maxQty;
                                    const saving =
                                        product.mrp > 0
                                            ? Math.max(0, Math.round((1 - tier.unitPrice / product.mrp) * 100))
                                            : 0;
                                    return (
                                        <tr
                                            key={tier.minQty}
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
                                                    {tier.maxQty === null
                                                        ? `${tier.minQty}+`
                                                        : `${tier.minQty}–${tier.maxQty}`}
                                                </span>
                                            </td>
                                            <td className={`py-2 text-right tabular-nums ${active ? 'font-bold' : ''}`}>
                                                {inr(tier.unitPrice)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {saving > 0 ? `${saving}% off` : '—'}
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

            {/* Cart action. Buy Now is deliberately absent: the direct-checkout
              * flow is being rebuilt, so nothing on this page places an order. */}
            {COMMERCE_ENABLED ? (
                <div className="flex flex-col gap-3">
                    <ActionButton
                        type="button"
                        onClick={purchase.addToCart}
                        disabled={!product.available}
                        className="flex h-[52px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-bold text-white transition-all duration-200 active:scale-[0.98] shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ backgroundColor: Theme.colors.primary, boxShadow: Theme.Shadow.sm }}
                    >
                        Add to Cart · {inr(purchase.payableTotal)}
                    </ActionButton>
                </div>
            ) : (
                <div
                    className="flex flex-col gap-1.5 rounded-xl border px-4 py-3.5"
                    style={{
                        borderColor: Theme.colors.borderStrong,
                        backgroundColor: Theme.colors.surfaceAlt,
                    }}
                >
                    <p
                        className="flex items-center gap-2 text-sm font-bold"
                        style={{ color: Theme.colors.text }}
                    >
                        <Lock size={15} style={{ color: Theme.colors.primaryDark }} />
                        {COMMERCE_COMING_SOON}
                    </p>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        {COMMERCE_COMING_SOON_NOTE}
                    </p>
                </div>
            )}

            {/* Wishlist + share */}
            <div className="flex items-center justify-between gap-3 text-sm">
                <ActionButton
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
                </ActionButton>
                <div className="relative">
                    <ActionButton
                        type="button"
                        onClick={() => setShareOpen((open) => !open)}
                        aria-expanded={shareOpen}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2"
                        style={{ color: Theme.colors.text }}
                    >
                        <Share2 size={17} />
                        Share
                    </ActionButton>
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
                                <ActionButton
                                    type="button"
                                    onClick={() => {
                                        // The link goes inside the text: WhatsApp on Android
                                        // drops a bare `url` field, which is why the chat used
                                        // to arrive with a title and nothing to tap.
                                        const text = `${product.name} — ${inr(purchase.payableTotal)} at WishBox\n${shareUrl}`;
                                        window.open(
                                            `https://wa.me/?text=${encodeURIComponent(text)}`,
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
                                </ActionButton>
                                <ActionButton
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl);
                                        toast.success('Link copied to clipboard');
                                        setShareOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                                    style={{ color: Theme.colors.text }}
                                >
                                    <Copy size={15} />
                                    Copy Link
                                </ActionButton>
                                <ActionButton
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
                                </ActionButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default memo(ProductInfo);
