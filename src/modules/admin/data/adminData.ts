/**
 * The admin panel's data contract.
 *
 * These types describe exactly what `GET /admin/dataset` and the admin write
 * endpoints send back, so the panel is typed against the API rather than
 * against a fixture. Every figure the dashboards show is derived from this
 * shape by `lib/analytics`.
 *
 * Timeline fields are epoch milliseconds, matching the API. The data itself
 * lives in MongoDB - see the backend's `src/modules/admin`. The seeded history
 * is created with `npm run admin:seed`; there is deliberately no generator on
 * this side any more, because a second copy could quietly disagree with the
 * server.
 */

export const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ */
/*  Orders                                                            */
/* ------------------------------------------------------------------ */

/** Fulfilment pipeline: accept the order, ship it, deliver it - or cancel it. */
export type AdminOrderStatus =
    | 'Approval'
    | 'Approved'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled';

/** Canonical pipeline order — used for charts, filters and legends. */
export const ADMIN_ORDER_STATUSES: AdminOrderStatus[] = [
    'Approval',
    'Approved',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
];

/** Statuses that still need someone to act. */
export const OPEN_STATUSES: AdminOrderStatus[] = ['Approval', 'Approved', 'Shipped', 'Out for Delivery'];

/** Statuses where the parcel is physically moving. */
export const IN_TRANSIT_STATUSES: AdminOrderStatus[] = ['Shipped', 'Out for Delivery'];

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'COD' | 'Wallet';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Credit Card', 'Debit Card', 'COD', 'Wallet'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['Paid', 'Pending', 'Failed', 'Refunded'];

/** How far an admin-processed refund on a cancelled order has got. */
export type RefundStatus = 'Pending' | 'Completed';

export const REFUND_STATUSES: RefundStatus[] = ['Pending', 'Completed'];

/**
 * Reasons an admin can pick from when cancelling an order.
 *
 * The API validates against this same list, so a value that is not here is
 * rejected with a 422 rather than silently stored.
 */
export const CANCELLATION_REASONS = [
    'Payment verification failed',
    'Customer requested cancellation',
    'Item out of stock',
    'Duplicate order',
    'Delivery address unserviceable',
] as const;

export type CancellationReason = (typeof CANCELLATION_REASONS)[number];

export type ReturnReason =
    | 'Damaged in transit'
    | 'Wrong item shipped'
    | 'Quality not as expected'
    | 'Changed my mind'
    | 'Other';

export const RETURN_REASONS: ReturnReason[] = [
    'Damaged in transit',
    'Wrong item shipped',
    'Quality not as expected',
    'Changed my mind',
    'Other',
];

export type ReturnStatus = 'Requested' | 'Processing' | 'Approved' | 'Rejected';

export const RETURN_STATUSES: ReturnStatus[] = ['Requested', 'Processing', 'Approved', 'Rejected'];

export type AdminOrderItem = {
    productId: string;
    name: string;
    brand: string;
    image: string;
    /** A built-in category id, or one the admin added. */
    category: string;
    qty: number;
    price: number;
    mrp: number;
};

export type AdminOrder = {
    id: string;
    customerId: string;
    customer: string;
    email: string;
    city: string;
    /** Checked out without an account. */
    isGuest: boolean;
    /** Placed on this storefront in this browser (from the real order store). */
    isLive: boolean;
    placedAt: number;
    placedOn: string;
    status: AdminOrderStatus;
    payment: PaymentMethod;
    paymentStatus: PaymentStatus;
    /** Net amount payable, shipping and discounts included. */
    amount: number;
    subtotal: number;
    shipping: number;
    discount: number;
    couponCode?: string;
    items: AdminOrderItem[];
    courier?: string;
    trackingId?: string;
    /** Past its expected delivery window and still not delivered. */
    delayed: boolean;
    refund: number;
    returnReason?: ReturnReason;
    /** Contact number the customer checked out with. */
    phone: string;
    /** Full delivery address, on one line. */
    address: string;
    /** Customer-uploaded proof of payment — only online payments have one. */
    paymentScreenshot?: string;
    /** Who cleared the payment, and when. The API stamps both, never the client. */
    approvedAt?: number;
    approvedBy?: string;
    /** Cancellation audit trail, set once the order is cancelled. */
    cancelledAt?: number;
    cancellationReason?: string;
    /** Refund trail — the screenshot only exists once the refund is processed. */
    refundScreenshot?: string;
    refundedAt?: number;
    refundStatus?: RefundStatus;
};

/* ------------------------------------------------------------------ */
/*  Customers, returns, reviews, coupons, stock                       */
/* ------------------------------------------------------------------ */

export type AdminCustomer = {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    joinedAt: number;
    isGuest: boolean;
};

export type AdminReturn = {
    id: string;
    orderId: string;
    customer: string;
    city: string;
    productName: string;
    image: string;
    reason: ReturnReason;
    requestedAt: number;
    status: ReturnStatus;
    refundAmount: number;
    refunded: boolean;
};

export type AdminReview = {
    id: string;
    productId: string;
    productName: string;
    image: string;
    customer: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: number;
    helpful: number;
    status: 'Published' | 'Pending';
};

/** A reply the store published under a review. */
export type ReviewReply = {
    message: string;
    at: number;
    /** Display name of the admin who sent it. */
    by: string;
};

/** A review as the moderation screen sees it: the row plus any reply. */
export type ModeratedReview = AdminReview & { reply?: ReviewReply };

export type AdminCoupon = {
    code: string;
    label: string;
    kind: 'percent' | 'flat';
    value: number;
    /** Minimum cart value the code applies to. */
    minOrder: number;
    status: 'Active' | 'Scheduled' | 'Expired';
    expiresOn: string;
    /** Rolled up from the orders by the seed. */
    used: number;
    discountGiven: number;
};

export type AdminRestock = {
    productId: string;
    productName: string;
    units: number;
    at: number;
};

/** Everything `GET /admin/dataset` returns, in one object. */
export type AdminDataset = {
    generatedAt: number;
    orders: AdminOrder[];
    customers: AdminCustomer[];
    returns: AdminReturn[];
    reviews: ModeratedReview[];
    coupons: AdminCoupon[];
    restocks: AdminRestock[];
};
