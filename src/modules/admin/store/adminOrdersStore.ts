/**
 * The admin's single source of orders.
 *
 * Two feeds are merged:
 *  1. The seeded demo year from `adminData` — gives the dashboards real volume.
 *  2. Orders actually placed on this storefront (the customer-facing order
 *     store), mapped into the admin shape so admin never lags behind.
 *
 * Status changes route to the right place: demo orders keep their override here
 * (localStorage), while live orders are written straight back to the storefront
 * order store so the customer History page updates too.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { orderTotal, type Order, type OrderStatus } from '@/modules/history/data/historyData';
import { ordersStore, useOrders } from '@/modules/history/store/store';
import {
    getAdminDataset,
    type AdminOrder,
    type AdminOrderStatus,
    type PaymentMethod,
} from '../data/adminData';

const OVERRIDES_KEY = 'wishbox.admin.orders.v1';
const OVERRIDES_VERSION = 1;
const LIVE_PREFIX = '#WB-';

type OverrideState = {
    version: number;
    statuses: Record<string, AdminOrderStatus>;
};

function initialOverrides(): OverrideState {
    const stored = readStoredJSON<OverrideState | null>(OVERRIDES_KEY, null);
    if (stored && stored.version === OVERRIDES_VERSION && stored.statuses) return stored;
    return { version: OVERRIDES_VERSION, statuses: {} };
}

const overrides = createStore<OverrideState>(initialOverrides(), OVERRIDES_KEY);

export const isLiveOrder = (id: string) => id.startsWith(LIVE_PREFIX);

/** The admin pipeline is wider than the storefront's four customer-facing states. */
const TO_CUSTOMER_STATUS: Record<AdminOrderStatus, OrderStatus> = {
    Pending: 'Processing',
    Processing: 'Processing',
    Packed: 'Processing',
    Shipped: 'Shipped',
    'Out for Delivery': 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
    Returned: 'Cancelled',
    Refunded: 'Cancelled',
};

/** Live orders keep the four storefront statuses selectable in the admin UI. */
export const CUSTOMER_STATUSES: OrderStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

/** Net banking is rare here and groups with the prepaid card rail. */
function paymentMethodOf(payment: string): PaymentMethod {
    if (/cod|cash on delivery/i.test(payment)) return 'COD';
    if (/wallet/i.test(payment)) return 'Wallet';
    if (/debit/i.test(payment)) return 'Debit Card';
    if (/visa|master|credit|card|banking/i.test(payment)) return 'Credit Card';
    return 'UPI';
}

function mapLiveOrder(order: Order): AdminOrder {
    const cancelled = order.status === 'Cancelled';
    return {
        id: order.id,
        customerId: 'live',
        customer: 'Ananya Sharma',
        email: 'ananya.sharma@example.com',
        city: 'Jaipur',
        isGuest: false,
        isLive: true,
        placedAt: Number.isNaN(new Date(order.placedOn).getTime())
            ? Date.now()
            : new Date(order.placedOn).getTime(),
        placedOn: order.placedOn,
        status: order.status,
        payment: paymentMethodOf(order.payment),
        paymentStatus: cancelled ? 'Refunded' : order.payment === 'Cash on Delivery' ? 'Pending' : 'Paid',
        amount: orderTotal(order),
        subtotal: order.items.reduce((sum, item) => sum + item.price * item.qty, 0),
        shipping: order.shipping,
        discount: order.discount ?? 0,
        items: order.items.map((item) => ({
            productId: item.id,
            name: item.name,
            brand: item.brand,
            image: item.image,
            category: 'paper-craft',
            qty: item.qty,
            price: item.price,
            mrp: item.mrp,
        })),
        delayed: false,
        refund: 0,
    };
}

export const adminOrdersStore = {
    subscribe: overrides.subscribe,

    /** Demo order → local override; live order → the storefront order store. */
    setStatus(id: string, status: AdminOrderStatus): void {
        if (isLiveOrder(id)) {
            ordersStore.setStatus(id, TO_CUSTOMER_STATUS[status]);
            return;
        }
        overrides.set((state) => ({
            ...state,
            statuses: { ...state.statuses, [id]: status },
        }));
    },

    /** Drops every demo status change, returning the seeded pipeline. */
    reset(): void {
        overrides.set(() => ({ version: OVERRIDES_VERSION, statuses: {} }));
    },

    /** Which statuses the UI should offer for a given order. */
    statusOptionsFor(order: Pick<AdminOrder, 'isLive'>): AdminOrderStatus[] {
        return order.isLive
            ? (CUSTOMER_STATUSES as AdminOrderStatus[])
            : ([
                  'Pending',
                  'Processing',
                  'Packed',
                  'Shipped',
                  'Out for Delivery',
                  'Delivered',
                  'Cancelled',
                  'Returned',
                  'Refunded',
              ] as AdminOrderStatus[]);
    },
};

/** Demo orders with admin status changes applied. */
function useDemoOrders(): AdminOrder[] {
    const state = useSyncExternalStore(
        adminOrdersStore.subscribe,
        overrides.get,
        overrides.get
    );
    return useMemo(() => {
        const dataset = getAdminDataset();
        const changed = Object.keys(state.statuses).length;
        if (changed === 0) return dataset.orders;
        return dataset.orders.map((order) => {
            const next = state.statuses[order.id];
            return next && next !== order.status ? { ...order, status: next } : order;
        });
    }, [state]);
}

export function useAdminOrders(): AdminOrder[] {
    const demo = useDemoOrders();
    const live = useOrders();

    return useMemo(
        () => [...live.map(mapLiveOrder), ...demo].sort((a, b) => b.placedAt - a.placedAt),
        [live, demo]
    );
}
