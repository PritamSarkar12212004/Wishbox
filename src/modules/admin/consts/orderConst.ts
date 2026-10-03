import type { AdminOrderStatus } from '../data/adminData';

/** One slug per pipeline stage — drives the sidebar links and the orders tabs. */
export const ORDER_STATUS_SLUGS: Array<{ slug: string; status: AdminOrderStatus; label: string }> = [
    { slug: 'approval', status: 'Approval', label: 'Approval' },
    { slug: 'shipped', status: 'Shipped', label: 'Shipped' },
    { slug: 'out-for-delivery', status: 'Out for Delivery', label: 'Out for delivery' },
    { slug: 'delivered', status: 'Delivered', label: 'Delivered' },
    { slug: 'cancelled', status: 'Cancelled', label: 'Cancelled' },
];

export const statusForSlug = (slug?: string): AdminOrderStatus | undefined =>
    ORDER_STATUS_SLUGS.find((entry) => entry.slug === slug)?.status;

export const slugForStatus = (status: AdminOrderStatus): string =>
    ORDER_STATUS_SLUGS.find((entry) => entry.status === status)?.slug ?? 'approval';
