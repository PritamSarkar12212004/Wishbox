import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOG_BY_ID, FLAGSHIP_PRODUCT_ID, type CatalogProduct } from '../data/catalogData';
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

function product(id: string): CatalogProduct {
    const found = CATALOG_BY_ID[id];
    if (!found) throw new Error(`Missing catalog fixture: ${id}`);
    return found;
}

const flagship = product(FLAGSHIP_PRODUCT_ID); // ₹249, bulk tiers from 10 packs
const pastel = product('matte-pastel-paper-pack'); // ₹199
const ribbon = product('decorative-ribbon-spool'); // unavailable

const PAPER10: CartCoupon = { code: 'PAPER10', type: 'percent', value: 10, label: '10% OFF' };
const PREPAID100: CartCoupon = { code: 'PREPAID100', type: 'flat', value: 100, label: '₹100 OFF' };

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

    it('reprices the flagship line from bulk tiers as quantity changes', () => {
        cartStore.add(flagship, 1);
        expect(cartStore.getSnapshot()[0]?.price).toBe(249);

        cartStore.setQty(flagship.id, 10);
        expect(cartStore.getSnapshot()[0]?.price).toBe(237);

        cartStore.setQty(flagship.id, 100);
        expect(cartStore.getSnapshot()[0]?.price).toBe(229);

        cartStore.setQty(flagship.id, 500);
        expect(cartStore.getSnapshot()[0]?.price).toBe(227);
    });

    it('keeps the catalogue price for products without bulk tiers', () => {
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
        expect(discountForAmount(249, PAPER10)).toBe(25); // 24.9 rounded
        expect(discountForAmount(249, PREPAID100)).toBe(100);
        expect(discountForAmount(60, PREPAID100)).toBe(60);
        expect(discountForAmount(249, null)).toBe(0);
    });

    it('applies the coupon at cart level and clears with the cart', () => {
        cartStore.add(pastel, 2);
        cartCouponStore.apply(PAPER10);

        const lines = cartStore.getSnapshot();
        expect(cartCouponStore.getSnapshot()).toEqual(PAPER10);
        expect(couponDiscount(lines, cartCouponStore.getSnapshot())).toBe(
            Math.round(pastel.price * 2 * 0.1)
        );
        expect(cartTotal(lines, cartCouponStore.getSnapshot())).toBe(
            pastel.price * 2 - Math.round(pastel.price * 2 * 0.1)
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
