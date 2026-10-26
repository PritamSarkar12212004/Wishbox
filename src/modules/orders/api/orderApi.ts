import { authedRequest } from '@/modules/auth/api/authApi';

/**
 * The shopper's orders, from the API.
 *
 * There is one orders collection behind this and the admin panel: the order a
 * shopper places *is* the record an admin approves and ships, so a status change
 * needs no sync step and no local merge. The totals here were computed by the
 * server from the product records - nothing in this file decides a price.
 */

export type ApiOrderStatus =
    | 'Approval'
    | 'Approved'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled';

export type ApiOrderItem = {
    productId: string;
    name: string;
    brand: string;
    image: string;
    category: string;
    qty: number;
    price: number;
    mrp: number;
};

export type ApiOrder = {
    id: string;
    customerId: string;
    customer: string;
    email: string;
    city: string;
    isGuest: boolean;
    placedAt: number;
    placedOn: string;
    status: ApiOrderStatus;
    payment: string;
    paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
    amount: number;
    subtotal: number;
    shipping: number;
    discount: number;
    couponCode?: string;
    items: ApiOrderItem[];
    courier?: string;
    trackingId?: string;
    delayed: boolean;
    refund: number;
    phone: string;
    address: string;
    paymentScreenshot?: string;
};

export type ApiReturnReason =
    | 'Damaged in transit'
    | 'Wrong item shipped'
    | 'Quality not as expected'
    | 'Changed my mind'
    | 'Other';

/** The reasons the API accepts. The dialog offers exactly these. */
export const RETURN_REASONS: ApiReturnReason[] = [
    'Damaged in transit',
    'Wrong item shipped',
    'Quality not as expected',
    'Changed my mind',
    'Other',
];

export type ApiReturn = {
    id: string;
    orderId: string;
    customer: string;
    city: string;
    productName: string;
    image: string;
    reason: ApiReturnReason;
    requestedAt: number;
    status: 'Requested' | 'Processing' | 'Approved' | 'Rejected';
    refundAmount: number;
    refunded: boolean;
};

/** What checkout sends: products and quantities, never prices. */
export type PlaceOrderInput = {
    items: Array<{ productId: string; qty: number }>;
    /** A saved address… */
    addressId?: string;
    /** …or one typed at checkout. */
    address?: {
        address1: string;
        address2: string;
        city: string;
        state: string;
        pincode: string;
    };
    /** Offline rails only until a payment gateway is wired up. */
    payment?: 'COD' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet';
    couponCode?: string;
    paymentScreenshot?: string;
};

export const orderApi = {
    place(input: PlaceOrderInput): Promise<ApiOrder> {
        return authedRequest<ApiOrder>('/orders', { method: 'POST', body: input });
    },

    list(): Promise<ApiOrder[]> {
        return authedRequest<ApiOrder[]>('/orders');
    },

    get(id: string): Promise<ApiOrder> {
        return authedRequest<ApiOrder>(`/orders/${encodeURIComponent(id)}`);
    },

    requestReturn(input: {
        orderId: string;
        reason: ApiReturnReason;
        note?: string;
    }): Promise<ApiReturn> {
        return authedRequest<ApiReturn>(`/orders/${encodeURIComponent(input.orderId)}/returns`, {
            method: 'POST',
            body: { reason: input.reason, note: input.note?.trim() || undefined },
        });
    },

    returns(): Promise<ApiReturn[]> {
        return authedRequest<ApiReturn[]>('/returns');
    },
};
