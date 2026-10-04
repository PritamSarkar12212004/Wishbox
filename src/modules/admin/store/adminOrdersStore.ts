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
 *
 * Everything else an admin can do to a placed order — approving the payment,
 * cancelling it, attaching a refund screenshot — is stored in the same override
 * map. There is no server here, so this store *is* the backend: the UI renders
 * whatever it returns rather than inventing local success.
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
    type RefundStatus,
} from '../data/adminData';

const OVERRIDES_KEY = 'wishbox.admin.orders.v2';
const OVERRIDES_VERSION = 2;
const LIVE_PREFIX = '#WB-';

/** Everything an admin can change on an order after it was placed. */
export type AdminOrderPatch = {
    /** Demo orders only — a live order's status lives in the storefront store. */
    status?: AdminOrderStatus;
    approvedAt?: number;
    approvedBy?: string;
    cancelledAt?: number;
    cancellationReason?: string;
    refundScreenshot?: string;
    refundedAt?: number;
    refundStatus?: RefundStatus;
    /** Fulfilment details an admin fills in once the parcel is on its way. */
    courier?: string;
    trackingId?: string;
};

type OverrideState = {
    version: number;
    patches: Record<string, AdminOrderPatch>;
};

function initialOverrides(): OverrideState {
    const stored = readStoredJSON<OverrideState | null>(OVERRIDES_KEY, null);
    if (stored && stored.version === OVERRIDES_VERSION && stored.patches) return stored;
    return { version: OVERRIDES_VERSION, patches: {} };
}

const overrides = createStore<OverrideState>(initialOverrides(), OVERRIDES_KEY);

/** Merges one order's overrides, ignoring any field the caller left undefined. */
function patchOrder(id: string, fields: AdminOrderPatch): void {
    overrides.set((state) => {
        const clean: AdminOrderPatch = {};
        (Object.keys(fields) as Array<keyof AdminOrderPatch>).forEach((key) => {
            if (fields[key] !== undefined) {
                (clean as Record<string, unknown>)[key] = fields[key];
            }
        });
        return { ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...clean } } };
    });
}

export const isLiveOrder = (id: string) => id.startsWith(LIVE_PREFIX);

/** The admin pipeline is wider than the storefront's four customer-facing states. */
const TO_CUSTOMER_STATUS: Record<AdminOrderStatus, OrderStatus> = {
    Approval: 'Processing',
    /* Approved but not yet handed over still reads as "processing" to the shopper. */
    Approved: 'Processing',
    Shipped: 'Shipped',
    'Out for Delivery': 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

/** Storefront states fold into the admin pipeline: Processing reads as Approval. */
const TO_ADMIN_STATUS: Record<OrderStatus, AdminOrderStatus> = {
    Processing: 'Approval',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

/** Net banking is rare here and groups with the prepaid card rail. */
function paymentMethodOf(payment: string): PaymentMethod {
    if (/cod|cash on delivery/i.test(payment)) return 'COD';
    if (/wallet/i.test(payment)) return 'Wallet';
    if (/debit/i.test(payment)) return 'Debit Card';
    if (/visa|master|credit|card|banking/i.test(payment)) return 'Credit Card';
    return 'UPI';
}

/** Contact detail the storefront never captures, so a live order still reads like a demo one. */
const LIVE_CUSTOMER_PHONE = '+91 98200 41288';

function mapLiveOrder(order: Order): AdminOrder {
    const cancelled = order.status === 'Cancelled';
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return {
        id: order.id,
        customerId: 'live',
        customer: 'Ananya Sharma',
        email: 'ananya.sharma@example.com',
        // The storefront keeps "Name · Address"; the sheet shows the parts apart.
        address: order.address.includes(' · ')
            ? order.address.split(' · ').slice(1).join(' · ')
            : order.address,
        phone: LIVE_CUSTOMER_PHONE,
        city: 'Jaipur',
        isGuest: false,
        isLive: true,
        placedAt: Number.isNaN(new Date(order.placedOn).getTime())
            ? Date.now()
            : new Date(order.placedOn).getTime(),
        placedOn: order.placedOn,
        status: TO_ADMIN_STATUS[order.status] ?? 'Approval',
        payment: paymentMethodOf(order.payment),
        paymentStatus: cancelled ? 'Refunded' : order.payment === 'Cash on Delivery' ? 'Pending' : 'Paid',
        amount: orderTotal(order),
        subtotal,
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
        patchOrder(id, { status });
    },

    /**
     * Admin clears the payment: stamps who approved it and parks the order in the
     * `Approved` stage. Shipping it is a separate, deliberate move — that is what
     * lets the sheet offer "mark as shipped" only once the order is approved.
     */
    approve(id: string, approver: string): void {
        adminOrdersStore.setStatus(id, 'Approved');
        patchOrder(id, { approvedAt: Date.now(), approvedBy: approver });
    },

    /** Admin rejects the order — this opens the refund section straight after. */
    cancel(id: string, reason: string): void {
        adminOrdersStore.setStatus(id, 'Cancelled');
        patchOrder(id, { cancelledAt: Date.now(), cancellationReason: reason, refundStatus: 'Pending' });
    },

    /** Admin attaches proof of the refund they processed, which closes it out. */
    setRefundScreenshot(id: string, screenshot: string): void {
        patchOrder(id, { refundScreenshot: screenshot, refundedAt: Date.now(), refundStatus: 'Completed' });
    },

    /** Admin records (or corrects) the courier and AWB for a shipment. */
    setShipping(id: string, patch: Pick<AdminOrderPatch, 'courier' | 'trackingId'>): void {
        patchOrder(id, patch);
    },

    /** Drops every demo override, returning the seeded pipeline. */
    reset(): void {
        overrides.set(() => ({ version: OVERRIDES_VERSION, patches: {} }));
    },

    /** One order with its admin overrides applied — the value the sheet renders. */
    resolve(order: AdminOrder): AdminOrder {
        return withOverrides(order, overrides.get().patches);
    },
};

/** Lays an order's stored admin overrides on top of its seeded values. */
function withOverrides(order: AdminOrder, patches: Record<string, AdminOrderPatch>): AdminOrder {
    const patch = patches[order.id];
    if (!patch) return order;
    if (!isLiveOrder(order.id)) return { ...order, ...patch };

    // A live order's pipeline status is owned by the storefront store, not here.
    const rest = { ...patch };
    delete rest.status;
    return { ...order, ...rest };
}

export function useAdminOrders(): AdminOrder[] {
    const state = useSyncExternalStore(adminOrdersStore.subscribe, overrides.get, overrides.get);
    const live = useOrders();

    return useMemo(() => {
        const demo = getAdminDataset().orders.map((order) => withOverrides(order, state.patches));
        const liveOrders = live.map(mapLiveOrder).map((order) => withOverrides(order, state.patches));
        return [...liveOrders, ...demo].sort((a, b) => b.placedAt - a.placedAt);
    }, [state, live]);
}
