/**
 * Order-sheet derivations shared by the orders list and the details screen.
 *
 * Kept pure and separate from the components so the list badge and the sheet's
 * approval section can never disagree about where an order stands.
 */

import { IN_TRANSIT_STATUSES, type AdminOrder, type RefundStatus } from '../data/adminData';

/** Where an order sits in the approve → cancel lifecycle. */
export type ApprovalState = 'pending' | 'approved' | 'cancelled';

/**
 * `Approval` is the pipeline's pending stage: an order that has cleared it (or
 * carries an approval stamp) reads as approved, and a cancelled one wins over
 * everything else.
 */
export function approvalStateOf(order: AdminOrder): ApprovalState {
    if (order.status === 'Cancelled') return 'cancelled';
    if (order.approvedAt !== undefined || order.status !== 'Approval') return 'approved';
    return 'pending';
}

/** Refund progress for a cancelled order — falls back to the payment rail. */
export function refundStatusOf(order: AdminOrder): RefundStatus {
    if (order.refundStatus) return order.refundStatus;
    return order.paymentStatus === 'Refunded' ? 'Completed' : 'Pending';
}

/**
 * True once a parcel actually exists — i.e. the order has been handed to a
 * courier, so there is a courier and an AWB worth showing or editing.
 */
export const hasShipment = (order: AdminOrder) =>
    IN_TRANSIT_STATUSES.includes(order.status) || order.status === 'Delivered';

/** Full, human-readable delivery address, or a placeholder when one is missing. */
export const addressOf = (order: AdminOrder) => order.address?.trim() || 'No delivery address on file';

/**
 * The order sheet is the panel's only full-bleed screen: it owns the whole
 * content column so it sits flush against the sidebar instead of floating in a
 * centred, padded wrapper. Shared so the shell, its skeleton and the page all
 * agree on which route that is.
 */
export const isOrderDetailsPath = (pathname: string) => pathname.startsWith('/admin/orders/view/');

/**
 * Order ids contain `#` (a URL fragment delimiter), so they must be decoded back
 * out of the route param before they can be matched against the order feed.
 */
export function decodeOrderId(value?: string): string {
    if (!value) return '';
    try {
        return decodeURIComponent(value);
    } catch {
        // Already-decoded values with a stray '%' would throw — fall back to raw.
        return value;
    }
}
