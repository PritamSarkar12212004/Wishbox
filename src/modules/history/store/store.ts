/**
 * Order history store.
 *
 * Seeded with the demo fixtures, extended by real checkouts and managed from
 * the admin panel: placing orders, advancing status (Processing → Shipped →
 * Delivered) and cancellations all write here, so the storefront History page
 * reflects exactly what the admin did. Persisted to localStorage with
 * cross-tab sync, mirroring the cart/wishlist store.
 */

import { useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { ORDER_HISTORY, type Order, type OrderItem, type OrderStatus } from '../data/historyData';

const ORDERS_KEY = 'wishbox.orders.v1';

/** Demo fulfilment details attached to orders placed in this storefront. */
export const DEMO_ADDRESS = 'Ananya Sharma · 123 Craft Lane, Jaipur, Rajasthan 302001';
export const DEMO_PAYMENT = 'Demo checkout';

const orders = createStore<Order[]>(readStoredJSON<Order[]>(ORDERS_KEY, ORDER_HISTORY), ORDERS_KEY);

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
        id: nextOrderId(orders.get()),
        placedOn: DATE_FORMAT.format(new Date()),
        status: 'Processing',
        payment,
        address,
        shipping,
        discount: discount && discount > 0 ? discount : undefined,
        items,
    };
    orders.set((current) => [order, ...current]);
    return order;
}

/** Admin action: move an order through fulfilment, or cancel it. */
export function setOrderStatus(id: string, status: OrderStatus): void {
    orders.set((current) =>
        current.map((order) => (order.id === id ? { ...order, status } : order))
    );
}

/** Restores the fixture seed — used by tests and the admin "reset" action. */
export function resetOrderHistory(): void {
    orders.set(() => ORDER_HISTORY);
}

/** Snapshot-first store API — also what the React hook subscribes to. */
export const ordersStore = {
    subscribe: orders.subscribe,
    getSnapshot: orders.get,
    placeOrder,
    setStatus: setOrderStatus,
    reset: resetOrderHistory,
};

export function useOrders(): Order[] {
    return useSyncExternalStore(
        ordersStore.subscribe,
        ordersStore.getSnapshot,
        ordersStore.getSnapshot
    );
}
