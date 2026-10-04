import type { AdminOrderStatus } from '../data/adminData';

/** One slug per pipeline stage — drives the sidebar links and the orders tabs. */
export const ORDER_STATUS_SLUGS: Array<{ slug: string; status: AdminOrderStatus; label: string }> = [
    { slug: 'approval', status: 'Approval', label: 'Approval' },
    { slug: 'approved', status: 'Approved', label: 'Approved' },
    { slug: 'shipped', status: 'Shipped', label: 'Shipped' },
    { slug: 'out-for-delivery', status: 'Out for Delivery', label: 'Out for delivery' },
    { slug: 'delivered', status: 'Delivered', label: 'Delivered' },
    { slug: 'cancelled', status: 'Cancelled', label: 'Cancelled' },
];

export const statusForSlug = (slug?: string): AdminOrderStatus | undefined =>
    ORDER_STATUS_SLUGS.find((entry) => entry.slug === slug)?.status;

export const slugForStatus = (status: AdminOrderStatus): string =>
    ORDER_STATUS_SLUGS.find((entry) => entry.status === status)?.slug ?? 'approval';

/**
 * The moves an admin can actually make from where an order currently is.
 *
 * Keyed by the *current* status, and deliberately excludes `Approval`: sending a
 * placed order back to "awaiting approval" is not an action, and clearing the
 * approval is what the Approve button in the order sheet is for. A pending order
 * therefore has no status move here — it is approved or cancelled from the
 * payment-approval panel instead.
 *
 * `Approved → Shipped` is listed because that is the pipeline, but no menu
 * offers it: the order sheet's shipment form performs the move, and only once a
 * courier and an AWB are recorded. The remaining entries are the delivery moves
 * the sheet does offer, as buttons on a parcel that is already with a courier.
 */
export const NEXT_STATUSES: Partial<Record<AdminOrderStatus, AdminOrderStatus[]>> = {
    Approved: ['Shipped'],
    Shipped: ['Out for Delivery', 'Delivered'],
    'Out for Delivery': ['Delivered'],
};

/** Human labels for the moves above — the dropdown reads as actions, not states. */
export const STATUS_ACTION_LABELS: Partial<Record<AdminOrderStatus, string>> = {
    Approved: 'Mark as approved',
    Shipped: 'Mark as shipped',
    'Out for Delivery': 'Mark out for delivery',
    Delivered: 'Mark as delivered',
    Cancelled: 'Cancel order',
};

/** The moves available from `status`, as dropdown options labelled as actions. */
export function nextStatusOptions(status: AdminOrderStatus): Array<{ value: string; label: string }> {
    return (NEXT_STATUSES[status] ?? []).map((next) => ({
        value: next,
        label: STATUS_ACTION_LABELS[next] ?? next,
    }));
}
