/**
 * The orders placed in *this browser*, as the admin panel sees them.
 *
 * The admin pipeline itself is server-owned - `GET /admin/dataset` serves it and
 * `PATCH /admin/orders/:id` changes it. Orders placed on this storefront are the
 * one exception: they are kept in localStorage and never reach the API, so they
 * are merged into the panel here.
 *
 * A live order's *pipeline* status belongs to the storefront's own order store,
 * so the customer's History page moves with it. The admin-only fields that store
 * has nowhere to put - who approved it, the courier, the refund proof - are held
 * in an override map below. Both are merged on read, so nothing invents success.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { orderTotal, type Order, type OrderStatus } from '@/modules/history/data/historyData';
import { ordersStore, useOrders } from '@/modules/history/store/store';
import type {
    AdminOrder,
    AdminOrderStatus,
    PaymentMethod,
    RefundStatus,
} from '../data/adminData';
import type { AdminOrderPatch } from '../api/adminApi';

const OVERRIDES_KEY = 'wishbox.admin.live-orders.v1';
const OVERRIDES_VERSION = 1;
const LIVE_PREFIX = '#WB-';

/**
 * What the store keeps for one live order: the API's patchable fields plus the
 * audit fields the API would have stamped had it seen the order.
 */
export type LiveOrderPatch = AdminOrderPatch & {
    approvedAt?: number;
    approvedBy?: string;
    cancelledAt?: number;
    refundedAt?: number;
    refundStatus?: RefundStatus;
};

type OverrideState = {
    version: number;
    patches: Record<string, LiveOrderPatch>;
};

function initialOverrides(): OverrideState {
    const stored = readStoredJSON<OverrideState | null>(OVERRIDES_KEY, null);
    if (stored && stored.version === OVERRIDES_VERSION && stored.patches) return stored;
    return { version: OVERRIDES_VERSION, patches: {} };
}

const overrides = createStore<OverrideState>(initialOverrides(), OVERRIDES_KEY);

export const isLiveOrder = (id: string): boolean => id.startsWith(LIVE_PREFIX);

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

/** Contact detail the storefront never captures, so a live order still reads like any other. */
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

/** Lays a live order's stored admin changes on top of what the storefront holds. */
function withOverrides(order: AdminOrder, patches: Record<string, LiveOrderPatch>): AdminOrder {
    const patch = patches[order.id];
    if (!patch) return order;

    // The pipeline status is owned by the storefront store, not by this map.
    const rest = { ...patch };
    delete rest.status;
    return { ...order, ...rest };
}

export const liveOrderOverride = {
    subscribe: overrides.subscribe,

    /**
     * Records what an admin did to a live order.
     *
     * The server is not involved (it has never seen this order), so the audit
     * fields it would normally stamp are stamped here, using the same rules.
     */
    apply(id: string, patch: AdminOrderPatch, actor: string): void {
        if (patch.status) {
            ordersStore.setStatus(id, TO_CUSTOMER_STATUS[patch.status]);
        }

        const now = Date.now();
        const fields: LiveOrderPatch = {};

        if (patch.status) fields.status = patch.status;
        if (patch.courier) fields.courier = patch.courier;
        if (patch.trackingId) fields.trackingId = patch.trackingId;
        if (patch.cancellationReason) fields.cancellationReason = patch.cancellationReason;

        if (patch.status === 'Approved') {
            fields.approvedAt = now;
            fields.approvedBy = actor;
        }
        if (patch.status === 'Cancelled') {
            fields.cancelledAt = now;
            fields.refundStatus = 'Pending';
        }
        if (patch.refundScreenshot) {
            fields.refundScreenshot = patch.refundScreenshot;
            fields.refundedAt = now;
            fields.refundStatus = 'Completed';
        }

        overrides.set((state) => ({ ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...fields } } }));
    },

    /** The admin changes recorded for one order. */
    get(id: string): LiveOrderPatch | undefined {
        return overrides.get().patches[id];
    },

    /** One order with its stored admin changes applied - what the panel renders. */
    resolve(order: AdminOrder): AdminOrder {
        return withOverrides(order, overrides.get().patches);
    },
};

/** The orders placed in this browser, with their admin changes applied. */
export function useLiveOrders(): AdminOrder[] {
    const state = useSyncExternalStore(overrides.subscribe, overrides.get, overrides.get);
    const live = useOrders();

    return useMemo(
        () => live.map(mapLiveOrder).map((order) => withOverrides(order, state.patches)),
        [live, state]
    );
}
