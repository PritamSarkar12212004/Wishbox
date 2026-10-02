/**
 * Order history store.
 *
 * Seeded with the demo fixtures, then extended by real checkouts: the cart's
 * "Buy Now" and the PDP's "Buy Now" flows write orders here, so the History
 * page reflects what the shopper actually bought on this device. Persisted to
 * localStorage with cross-tab sync, mirroring the cart/wishlist store.
 */

import { useSyncExternalStore } from 'react';
import { ORDER_HISTORY, type Order, type OrderItem } from '../data/historyData';

const ORDERS_KEY = 'wishbox.orders.v1';
const canUseStorage = typeof window !== 'undefined' && 'localStorage' in window;

/** Demo fulfilment details attached to orders placed in this storefront. */
export const DEMO_ADDRESS = 'Ananya Sharma · 123 Craft Lane, Jaipur, Rajasthan 302001';
export const DEMO_PAYMENT = 'Demo checkout';

function readOrders(): Order[] {
    if (!canUseStorage) return ORDER_HISTORY;
    try {
        const raw = window.localStorage.getItem(ORDERS_KEY);
        return raw ? (JSON.parse(raw) as Order[]) : ORDER_HISTORY;
    } catch {
        // Corrupt payload — fall back to the demo fixtures.
        return ORDER_HISTORY;
    }
}

function persistOrders(next: Order[]): void {
    if (!canUseStorage) return;
    try {
        window.localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {
        // Storage may be full or blocked; the store still works in-memory.
    }
}

let orders: Order[] = readOrders();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (canUseStorage) {
    window.addEventListener('storage', (event) => {
        if (event.key !== ORDERS_KEY || event.newValue === null) return;
        try {
            orders = JSON.parse(event.newValue) as Order[];
            emit();
        } catch {
            /* ignore malformed cross-tab writes */
        }
    });
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
});

/** Continues the #WB-#### sequence the fixtures start. */
function nextOrderId(current: Order[]): string {
    const highest = current.reduce((max, order) => {
        const match = /^#WB-(\d+)$/.exec(order.id);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 1000);
    return `#WB-${highest + 1}`;
}

export type PlaceOrderInput = {
    items: OrderItem[];
    /** Coupon discount already applied to the cart subtotal. */
    discount?: number;
    payment?: string;
    address?: string;
    shipping?: number;
};

/** Creates an order and puts it at the top of the history. */
export function placeOrder({
    items,
    discount,
    payment = DEMO_PAYMENT,
    address = DEMO_ADDRESS,
    shipping = 0,
}: PlaceOrderInput): Order {
    const order: Order = {
        id: nextOrderId(orders),
        placedOn: DATE_FORMAT.format(new Date()),
        status: 'Processing',
        payment,
        address,
        shipping,
        discount: discount && discount > 0 ? discount : undefined,
        items,
    };
    orders = [order, ...orders];
    persistOrders(orders);
    emit();
    return order;
}

/** Restores the fixture seed — used by tests and a future "clear history" action. */
export function resetOrderHistory(): void {
    orders = ORDER_HISTORY;
    persistOrders(orders);
    emit();
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Snapshot-first store API — also what the React hook subscribes to. */
export const ordersStore = {
    subscribe,
    getSnapshot: () => orders,
    placeOrder,
    reset: resetOrderHistory,
};

export function useOrders(): Order[] {
    return useSyncExternalStore(
        ordersStore.subscribe,
        ordersStore.getSnapshot,
        ordersStore.getSnapshot
    );
}
