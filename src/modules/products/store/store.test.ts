import { beforeEach, describe, expect, it } from 'vitest';
import type { CatalogProduct } from '../api/productApi';
import {
    MAX_QTY,
    cartCouponStore,
    cartItemCount,
    cartMrpTotal,
    cartStore,
    cartSubtotal,
    cartTotal,
    couponDiscount,
    discountForAmount,
    wishlistStore,
    type CartCoupon,
    type WishlistEntry,
} from './store';

/**
 * The cart no longer reads a shipped catalogue - products arrive from the API -
 * so these fixtures stand in for what the API serves, including the quantity
 * breaks that now travel with a product record.
 */
const base: CatalogProduct = {
    id: 'premium-handmade-decorative-paper',
    sku: 'WB-PAPER-001',
    name: 'Premium Handmade Decorative Paper Sheets',
    brand: 'PaperCraft',
    category: 'paper-craft',
    rating: 4.8,
    reviewCount: 1248,
    price: 249,
    mrp: 399,
    available: true,
    hidden: false,
    stock: 120,
    image: 'https://example.test/paper.jpg',
    hoverImage: 'https://example.test/paper-hover.jpg',
    description: 'Hand-pressed decorative paper with a smooth matte finish.',
    highlights: ['Premium handmade quality paper'],
};

const flagship: CatalogProduct = {
    ...base,
    bulkTiers: [
        { minQty: 1, maxQty: 9, unitPrice: 249 },
        { minQty: 10, maxQty: 49, unitPrice: 237 },
        { minQty: 50, maxQty: 99, unitPrice: 232 },
        { minQty: 100, maxQty: 499, unitPrice: 229 },
        { minQty: 500, maxQty: null, unitPrice: 227 },
    ],
};

const pastel: CatalogProduct = {
    ...base,
    id: 'matte-pastel-paper-pack',
    sku: 'WB-PAPER-002',
    name: 'Matte Pastel Paper Sheets',
    price: 199,
    mrp: 299,
    bulkTiers: undefined,
};

const ribbon: CatalogProduct = {
    ...pastel,
    id: 'decorative-ribbon-spool',
    sku: 'WB-CRAFT-006',
    name: 'Decorative Craft Ribbon Spool',
    price: 129,
    mrp: 199,
    available: false,
    stock: 0,
};

const SAVE5: CartCoupon = {
    code: 'SAVE5',
    kind: 'percent',
    value: 5,
    label: '5% OFF',
    minOrder: 0,
};
const PREPAID100: CartCoupon = {
    code: 'PREPAID100',
    kind: 'flat',
    value: 100,
    label: '₹100 OFF',
    minOrder: 0,
};
/** Percent code with a minimum basket, like PAPER10 on the live store. */
const PAPER10: CartCoupon = {
    code: 'PAPER10',
    kind: 'percent',
    value: 10,
    label: '10% OFF',
    minOrder: 499,
};

const wishlistEntry = (p: CatalogProduct, available = p.available): WishlistEntry => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.image,
    price: p.price,
    mrp: p.mrp,
    rating: p.rating,
    available,
});

beforeEach(() => {
    cartStore.clear();
    wishlistStore.clear();
});

describe('cart', () => {
    it('merges duplicate lines and clamps quantities to 1–MAX_QTY', () => {
        cartStore.add(pastel, 2);
        cartStore.add(pastel, 1);
        expect(cartStore.getSnapshot()).toHaveLength(1);
        expect(cartStore.getSnapshot()[0]?.qty).toBe(3);

        cartStore.add(pastel, 0); // clamps to 1
        expect(cartStore.getSnapshot()[0]?.qty).toBe(4);

        cartStore.setQty(pastel.id, MAX_QTY * 10);
        expect(cartStore.getSnapshot()[0]?.qty).toBe(MAX_QTY);
    });

    it('reprices a line from its own bulk tiers as quantity changes', () => {
        cartStore.add(flagship, 1);
        expect(cartStore.getSnapshot()[0]?.price).toBe(249);

        cartStore.setQty(flagship.id, 10);
        expect(cartStore.getSnapshot()[0]?.price).toBe(237);

        cartStore.setQty(flagship.id, 100);
        expect(cartStore.getSnapshot()[0]?.price).toBe(229);

        cartStore.setQty(flagship.id, 500);
        expect(cartStore.getSnapshot()[0]?.price).toBe(227);
    });

    it('keeps the list price for products without bulk tiers', () => {
        cartStore.add(pastel, 1);
        cartStore.setQty(pastel.id, 50);
        expect(cartStore.getSnapshot()[0]?.price).toBe(pastel.price);
    });

    it('removes lines and reports totals', () => {
        cartStore.add(pastel, 2);
        cartStore.add(flagship, 1);
        expect(cartItemCount(cartStore.getSnapshot())).toBe(3);
        expect(cartSubtotal(cartStore.getSnapshot())).toBe(pastel.price * 2 + flagship.price);
        expect(cartMrpTotal(cartStore.getSnapshot())).toBe(pastel.mrp * 2 + flagship.mrp);

        cartStore.remove(pastel.id);
        expect(cartStore.getSnapshot()).toHaveLength(1);

        cartStore.clear();
        expect(cartStore.getSnapshot()).toHaveLength(0);
    });
});

describe('coupons', () => {
    it('computes percent and flat discounts, capped at the subtotal', () => {
        expect(discountForAmount(500, PAPER10)).toBe(50);
        expect(discountForAmount(249, PREPAID100)).toBe(100);
        expect(discountForAmount(60, PREPAID100)).toBe(60);
        expect(discountForAmount(249, null)).toBe(0);
    });

    it('ignores a coupon below its minimum basket', () => {
        // ₹249 of paper does not reach PAPER10's ₹499 minimum.
        expect(discountForAmount(249, PAPER10)).toBe(0);
        expect(discountForAmount(499, PAPER10)).toBe(50);
    });

    it('applies the coupon at cart level and clears with the cart', () => {
        cartStore.add(pastel, 3);
        cartCouponStore.apply(SAVE5);

        const lines = cartStore.getSnapshot();
        expect(cartCouponStore.getSnapshot()).toEqual(SAVE5);
        expect(couponDiscount(lines, cartCouponStore.getSnapshot())).toBe(
            Math.round(pastel.price * 3 * 0.05)
        );
        expect(cartTotal(lines, cartCouponStore.getSnapshot())).toBe(
            pastel.price * 3 - Math.round(pastel.price * 3 * 0.05)
        );

        cartStore.clear();
        expect(cartCouponStore.getSnapshot()).toBeNull();
    });
});

describe('wishlist', () => {
    it('toggles membership', () => {
        expect(wishlistStore.toggle(pastel)).toBe(true);
        expect(wishlistStore.has(pastel.id)).toBe(true);

        expect(wishlistStore.toggle(pastel)).toBe(false);
        expect(wishlistStore.has(pastel.id)).toBe(false);
    });

    it('moves only in-stock entries into the cart', () => {
        wishlistStore.add(wishlistEntry(ribbon, false));
        expect(wishlistStore.moveToCart(ribbon.id)).toBe(false);
        expect(wishlistStore.has(ribbon.id)).toBe(true);

        wishlistStore.toggle(pastel);
        expect(wishlistStore.moveToCart(pastel.id)).toBe(true);
        expect(wishlistStore.has(pastel.id)).toBe(false);
        expect(cartStore.getSnapshot()[0]?.id).toBe(pastel.id);
    });

    it('moves all in-stock entries and reports what was skipped', () => {
        wishlistStore.toggle(pastel);
        wishlistStore.toggle(flagship);
        wishlistStore.add(wishlistEntry(ribbon, false));

        expect(wishlistStore.moveAllToCart()).toEqual({ moved: 2, skipped: 1 });
        expect(wishlistStore.getSnapshot().map((entry) => entry.id)).toEqual([ribbon.id]);
        expect(cartItemCount(cartStore.getSnapshot())).toBe(2);
    });
});
