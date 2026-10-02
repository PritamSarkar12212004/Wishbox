/**
 * Cart & wishlist stores.
 *
 * Real item stores (not counters): cart and wishlist pages, header badges,
 * product cards and the PDP all read and write the same state, persisted to
 * localStorage so a refresh keeps the shopper's selections.
 *
 * Built on useSyncExternalStore so any component can subscribe without a
 * context provider, and kept as plain arrays so snapshots stay immutable.
 */

import { useSyncExternalStore } from 'react';
import { FLAGSHIP_PRODUCT_ID, type CatalogProduct } from '../data/catalogData';
import { findBulkTier, type Coupon } from '../data/detailData';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Anything that can be put in the cart — catalogue products and wishlist rows. */
export type Purchasable = Pick<
    CatalogProduct,
    'id' | 'name' | 'brand' | 'image' | 'price' | 'mrp' | 'rating'
>;

export type CartLine = {
    id: string;
    name: string;
    brand: string;
    image: string;
    /** Unit price actually charged (may include a bulk-tier discount). */
    price: number;
    /** Unit list price, used for the strike-through and savings maths. */
    mrp: number;
    rating: number;
    qty: number;
};

export type WishlistEntry = {
    id: string;
    name: string;
    brand: string;
    image: string;
    price: number;
    mrp: number;
    rating: number;
    available: boolean;
};

type Listener = () => void;

/** Cart-level coupon — applies to the whole cart subtotal and is persisted with it. */
export type CartCoupon = Coupon & { code: string };

const CART_KEY = 'wishbox.cart.v1';
const COUPON_KEY = 'wishbox.coupon.v1';
const WISHLIST_KEY = 'wishbox.wishlist.v1';
const canUseStorage = typeof window !== 'undefined' && 'localStorage' in window;

/* ------------------------------------------------------------------ */
/*  Persistence helpers                                                */
/* ------------------------------------------------------------------ */

function readJSON<T>(key: string, fallback: T): T {
    if (!canUseStorage) return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        // Corrupt payload — start clean rather than crash the app.
        return fallback;
    }
}

function writeJSON(key: string, value: unknown): void {
    if (!canUseStorage) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage may be full or blocked (private mode); the store still works in-memory.
    }
}

/* ------------------------------------------------------------------ */
/*  Tiny persistent store                                              */
/* ------------------------------------------------------------------ */

type Store<T> = {
    get: () => T;
    set: (updater: (current: T) => T) => void;
    subscribe: (listener: Listener) => () => void;
};

function createStore<T>(initial: T, persistKey?: string): Store<T> {
    let value = initial;
    const listeners = new Set<Listener>();
    const emit = () => listeners.forEach((listener) => listener());

    if (canUseStorage && persistKey) {
        // Keep multiple tabs in sync when localStorage changes elsewhere.
        window.addEventListener('storage', (event) => {
            if (event.key !== persistKey || event.newValue === null) return;
            try {
                value = JSON.parse(event.newValue) as T;
                emit();
            } catch {
                /* ignore malformed cross-tab writes */
            }
        });
    }

    return {
        get: () => value,
        set: (updater) => {
            value = updater(value);
            if (persistKey) writeJSON(persistKey, value);
            emit();
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

/** Upper bound that keeps the advertised 500+ bulk tier reachable from both the PDP and the cart. */
export const MAX_QTY = 500;

const clampQty = (qty: number) => Math.min(MAX_QTY, Math.max(1, Math.round(qty) || 1));

/**
 * The flagship follows bulk tiers, so its line price is always derived from the
 * line quantity — editing the quantity in the cart can never hold a stale tier.
 */
const priceForQty = (productId: string, fallbackPrice: number, qty: number) =>
    productId === FLAGSHIP_PRODUCT_ID ? findBulkTier(qty).unitPrice : fallbackPrice;

/* ------------------------------------------------------------------ */
/*  Coupon                                                             */
/* ------------------------------------------------------------------ */

const coupon = createStore<CartCoupon | null>(
    readJSON<CartCoupon | null>(COUPON_KEY, null),
    COUPON_KEY
);

export const cartCouponStore = {
    subscribe: coupon.subscribe,
    getSnapshot: coupon.get,

    apply(next: CartCoupon) {
        coupon.set(() => next);
    },

    clear() {
        coupon.set(() => null);
    },
};

/* ------------------------------------------------------------------ */
/*  Cart                                                               */
/* ------------------------------------------------------------------ */

const cart = createStore<CartLine[]>(readJSON<CartLine[]>(CART_KEY, []), CART_KEY);

export const cartStore = {
    subscribe: cart.subscribe,
    getSnapshot: cart.get,

    /** Adds `qty` of a product, merging with an existing line. */
    add(product: Purchasable, qty = 1, unitPrice = product.price) {
        const addQty = clampQty(qty);
        cart.set((lines) => {
            const existing = lines.some((line) => line.id === product.id);
            if (existing) {
                return lines.map((line) => {
                    if (line.id !== product.id) return line;
                    const nextQty = clampQty(line.qty + addQty);
                    return { ...line, price: priceForQty(product.id, unitPrice, nextQty), qty: nextQty };
                });
            }
            return [
                ...lines,
                {
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    image: product.image,
                    price: unitPrice,
                    mrp: product.mrp,
                    rating: product.rating,
                    qty: addQty,
                },
            ];
        });
    },

    setQty(id: string, qty: number) {
        cart.set((lines) =>
            lines.map((line) => {
                if (line.id !== id) return line;
                const nextQty = clampQty(qty);
                return { ...line, qty: nextQty, price: priceForQty(line.id, line.price, nextQty) };
            })
        );
    },

    remove(id: string) {
        cart.set((lines) => lines.filter((line) => line.id !== id));
    },

    clear() {
        cart.set(() => []);
        cartCouponStore.clear();
    },
};

/* ------------------------------------------------------------------ */
/*  Wishlist                                                           */
/* ------------------------------------------------------------------ */

const toWishlistEntry = (product: CatalogProduct): WishlistEntry => ({
    id: product.id,
    name: product.name,
    brand: product.brand,
    image: product.image,
    price: product.price,
    mrp: product.mrp,
    rating: product.rating,
    available: product.available,
});

const wishlist = createStore<WishlistEntry[]>(
    readJSON<WishlistEntry[]>(WISHLIST_KEY, []),
    WISHLIST_KEY
);

export const wishlistStore = {
    subscribe: wishlist.subscribe,
    getSnapshot: wishlist.get,

    has(id: string) {
        return wishlist.get().some((entry) => entry.id === id);
    },

    /** Adds an entry directly (used when moving a cart line to the wishlist). */
    add(entry: WishlistEntry) {
        if (wishlist.get().some((item) => item.id === entry.id)) return;
        wishlist.set((entries) => [...entries, entry]);
    },

    /** Adds or removes a product; returns its new membership state. */
    toggle(product: CatalogProduct): boolean {
        const exists = wishlist.get().some((entry) => entry.id === product.id);
        if (exists) {
            wishlist.set((entries) => entries.filter((entry) => entry.id !== product.id));
            return false;
        }
        wishlist.set((entries) => [...entries, toWishlistEntry(product)]);
        return true;
    },

    remove(id: string) {
        wishlist.set((entries) => entries.filter((entry) => entry.id !== id));
    },

    clear() {
        wishlist.set(() => []);
    },

    /** Moves one in-stock entry into the cart. Returns false when unavailable. */
    moveToCart(id: string): boolean {
        const entry = wishlist.get().find((item) => item.id === id);
        if (!entry || !entry.available) return false;
        cartStore.add(entry);
        wishlist.set((entries) => entries.filter((item) => item.id !== id));
        return true;
    },

    /** Moves every in-stock entry into the cart, reporting what was skipped. */
    moveAllToCart(): { moved: number; skipped: number } {
        const entries = wishlist.get();
        const available = entries.filter((entry) => entry.available);
        available.forEach((entry) => cartStore.add(entry));
        if (available.length > 0) {
            wishlist.set((list) => list.filter((entry) => !entry.available));
        }
        return { moved: available.length, skipped: entries.length - available.length };
    },
};

/* ------------------------------------------------------------------ */
/*  React hooks & selectors                                            */
/* ------------------------------------------------------------------ */

export function useCartLines(): CartLine[] {
    return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getSnapshot);
}

export function useCartCount(): number {
    return useCartLines().reduce((count, line) => count + line.qty, 0);
}

export function useWishlistEntries(): WishlistEntry[] {
    return useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot, wishlistStore.getSnapshot);
}

export function useWishlistCount(): number {
    return useWishlistEntries().length;
}

export function useCartCoupon(): CartCoupon | null {
    return useSyncExternalStore(cartCouponStore.subscribe, cartCouponStore.getSnapshot, () => null);
}

export function useIsWishlisted(id: string): boolean {
    return useSyncExternalStore(
        wishlistStore.subscribe,
        () => wishlistStore.has(id),
        () => false
    );
}

/** Coupon maths shared by the PDP and the cart so the two can never disagree. */
export function discountForAmount(amount: number, applied: Coupon | null): number {
    if (!applied) return 0;
    return applied.type === 'percent'
        ? Math.round((amount * applied.value) / 100)
        : Math.min(applied.value, amount);
}

export const cartItemCount = (lines: CartLine[]) => lines.reduce((count, line) => count + line.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.price * line.qty, 0);
export const cartMrpTotal = (lines: CartLine[]) => lines.reduce((sum, line) => sum + line.mrp * line.qty, 0);
export const couponDiscount = (lines: CartLine[], applied: CartCoupon | null) =>
    discountForAmount(cartSubtotal(lines), applied);
export const cartTotal = (lines: CartLine[], applied: CartCoupon | null) =>
    Math.max(cartSubtotal(lines) - couponDiscount(lines, applied), 0);