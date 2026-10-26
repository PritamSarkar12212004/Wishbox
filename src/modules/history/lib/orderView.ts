import type { ApiOrder, ApiOrderStatus, ApiReturn } from '@/modules/orders/api/orderApi';

/**
 * The shopper-facing view of an order.
 *
 * The API's pipeline is wider than the four states the History page shows:
 * `Approval` and `Approved` are both "processing" to a shopper, and `Shipped`
 * and `Out for Delivery` are both "shipped". Everything else - ids, money,
 * dates - comes straight from the server record, which is why nothing here
 * recomputes a total the API already decided.
 */

export type OrderStatus = 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled';

export type OrderItem = {
    id: string;
    name: string;
    brand: string;
    image: string;
    qty: number;
    /** Price actually paid per unit. */
    price: number;
    /** Struck-through list price per unit. */
    mrp: number;
    rating: number;
};

export type Order = {
    id: string;
    placedOn: string;
    status: OrderStatus;
    payment: string;
    address: string;
    shipping: number;
    /** Coupon discount applied at checkout, when there was one. */
    discount?: number;
    items: OrderItem[];
};

export type ReturnStatus = 'Requested' | 'Processing' | 'Approved' | 'Rejected';

export type ReturnRequest = {
    id: string;
    orderId: string;
    productName: string;
    reason: string;
    status: ReturnStatus;
    refundAmount: number;
    requestedAt: number;
};

/** Four-step fulfilment track shown per order. */
export const TRACK_STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'] as const;

/** How many tracking steps are complete for a given status. */
export const STATUS_STEP: Record<OrderStatus, number> = {
    Processing: 2,
    Shipped: 3,
    Delivered: 4,
    Cancelled: 0,
};

const CUSTOMER_STATUS: Record<ApiOrderStatus, OrderStatus> = {
    Approval: 'Processing',
    Approved: 'Processing',
    Shipped: 'Shipped',
    'Out for Delivery': 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Cancelled',
};

export function toOrder(order: ApiOrder): Order {
    return {
        id: order.id,
        placedOn: order.placedOn,
        status: CUSTOMER_STATUS[order.status] ?? 'Processing',
        payment: order.payment,
        address: order.address,
        shipping: order.shipping,
        ...(order.discount > 0 ? { discount: order.discount } : {}),
        items: order.items.map((item) => ({
            id: item.productId,
            name: item.name,
            brand: item.brand,
            image: item.image,
            qty: item.qty,
            price: item.price,
            mrp: item.mrp,
            // The order snapshot does not carry a rating; the card only needs one
            // for presentation, and 0 renders as "not rated" rather than a lie.
            rating: 0,
        })),
    };
}

export function toReturn(request: ApiReturn): ReturnRequest {
    return {
        id: request.id,
        orderId: request.orderId,
        productName: request.productName,
        reason: request.reason,
        status: request.status,
        refundAmount: request.refundAmount,
        requestedAt: request.requestedAt,
    };
}

/** Units in the order (items × quantity). */
export const orderQty = (order: Order) => order.items.reduce((n, i) => n + i.qty, 0);

export const orderSubtotal = (order: Order) =>
    order.items.reduce((sum, i) => sum + i.price * i.qty, 0);

export const orderSavings = (order: Order) =>
    order.items.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0);

export const orderTotal = (order: Order) =>
    order.status === 'Cancelled'
        ? 0
        : Math.max(orderSubtotal(order) - (order.discount ?? 0), 0) + order.shipping;
