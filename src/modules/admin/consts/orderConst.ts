import type { AdminOrderStatus } from '../data/adminData';

/** One slug per pipeline stage — drives the sidebar links and the orders tabs. */
export const ORDER_STATUS_SLUGS: Array<{ slug: string; status: AdminOrderStatus; label: string }> = [
    { slug: 'pending', status: 'Pending', label: 'Pending' },
    { slug: 'processing', status: 'Processing', label: 'Processing' },
    { slug: 'packed', status: 'Packed', label: 'Packed' },
    { slug: 'shipped', status: 'Shipped', label: 'Shipped' },
    { slug: 'out-for-delivery', status: 'Out for Delivery', label: 'Out for delivery' },
    { slug: 'delivered', status: 'Delivered', label: 'Delivered' },
    { slug: 'cancelled', status: 'Cancelled', label: 'Cancelled' },
    { slug: 'returned', status: 'Returned', label: 'Returned' },
    { slug: 'refunded', status: 'Refunded', label: 'Refunded' },
];

export const statusForSlug = (slug?: string): AdminOrderStatus | undefined =>
    ORDER_STATUS_SLUGS.find((entry) => entry.slug === slug)?.status;

export const slugForStatus = (status: AdminOrderStatus): string =>
    ORDER_STATUS_SLUGS.find((entry) => entry.status === status)?.slug ?? 'pending';
