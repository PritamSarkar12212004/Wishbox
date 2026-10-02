/**
 * Mock order history for the History page.
 *
 * Line items resolve from the shared product catalogue, so names, images and
 * prices can never drift from the storefront. Frontend-only: no backend.
 */

import { CATALOG_BY_ID } from '@/modules/products/data/catalogData';

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
    items: OrderItem[];
};

/** Short aliases keep the order fixtures readable. */
const PRODUCT_IDS = {
    mirror: 'led-round-wall-mirror',
    clock: 'wooden-wall-clock',
    lamp: 'minimalist-desk-lamp',
    vase: 'ceramic-vase-set',
    sheets: 'premium-handmade-decorative-paper',
    pastel: 'matte-pastel-paper-pack',
    foil: 'gold-foil-wrapping-roll',
    origami: 'origami-paper-200-sheets',
    giftbags: 'handmade-paper-gift-bags',
    cardstock: 'premium-cardstock-250gsm',
    ribbon: 'decorative-ribbon-spool',
    rose: 'rose-gold-shimmer-paper',
} as const;

const item = (key: keyof typeof PRODUCT_IDS, qty = 1): OrderItem => {
    const product = CATALOG_BY_ID[PRODUCT_IDS[key]];
    if (!product) {
        throw new Error(`Unknown product in order history fixture: ${PRODUCT_IDS[key]}`);
    }
    return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        qty,
        price: product.price,
        mrp: product.mrp,
        rating: product.rating,
    };
};

const ADDRESSES = [
    'Ananya Sharma · 123 Craft Lane, Jaipur, Rajasthan 302001',
    'Ananya Sharma · 22 Lake View Apartments, Mumbai, Maharashtra 400058',
    'Ananya Sharma · 5 Palm Grove, Bengaluru, Karnataka 560095',
];

const PAYMENTS = [
    'UPI · HDFC ••4821',
    'Visa ••4242',
    'Net Banking · ICICI',
    'Cash on Delivery',
];

/** Four-step fulfilment track shown per order. */
export const TRACK_STEPS = ['Placed', 'Packed', 'Shipped', 'Delivered'] as const;

/** How many tracking steps are complete for a given status. */
export const STATUS_STEP: Record<OrderStatus, number> = {
    Processing: 2,
    Shipped: 3,
    Delivered: 4,
    Cancelled: 0,
};

export const ORDER_HISTORY: Order[] = [
    {
        id: '#WB-1128',
        placedOn: 'Sep 18, 2026',
        status: 'Processing',
        payment: PAYMENTS[0],
        address: ADDRESSES[0],
        shipping: 0,
        items: [item('sheets', 2), item('foil', 3), item('ribbon', 2)],
    },
    {
        id: '#WB-1123',
        placedOn: 'Sep 11, 2026',
        status: 'Processing',
        payment: PAYMENTS[1],
        address: ADDRESSES[1],
        shipping: 0,
        items: [item('mirror'), item('vase')],
    },
    {
        id: '#WB-1119',
        placedOn: 'Sep 04, 2026',
        status: 'Shipped',
        payment: PAYMENTS[2],
        address: ADDRESSES[2],
        shipping: 0,
        items: [item('clock'), item('lamp'), item('cardstock', 2), item('origami')],
    },
    {
        id: '#WB-1112',
        placedOn: 'Aug 28, 2026',
        status: 'Shipped',
        payment: PAYMENTS[0],
        address: ADDRESSES[0],
        shipping: 49,
        items: [item('rose', 2)],
    },
    {
        id: '#WB-1104',
        placedOn: 'Aug 19, 2026',
        status: 'Delivered',
        payment: PAYMENTS[3],
        address: ADDRESSES[1],
        shipping: 0,
        items: [item('lamp'), item('pastel', 2)],
    },
    {
        id: '#WB-1096',
        placedOn: 'Aug 07, 2026',
        status: 'Delivered',
        payment: PAYMENTS[1],
        address: ADDRESSES[2],
        shipping: 0,
        items: [item('mirror'), item('giftbags'), item('ribbon', 3)],
    },
    {
        id: '#WB-1088',
        placedOn: 'Jul 26, 2026',
        status: 'Cancelled',
        payment: PAYMENTS[2],
        address: ADDRESSES[0],
        shipping: 0,
        items: [item('vase'), item('pastel')],
    },
    {
        id: '#WB-1079',
        placedOn: 'Jul 15, 2026',
        status: 'Delivered',
        payment: PAYMENTS[0],
        address: ADDRESSES[1],
        shipping: 49,
        items: [item('foil', 2)],
    },
    {
        id: '#WB-1067',
        placedOn: 'Jun 30, 2026',
        status: 'Delivered',
        payment: PAYMENTS[3],
        address: ADDRESSES[2],
        shipping: 0,
        items: [item('clock'), item('origami', 2)],
    },
    {
        id: '#WB-1055',
        placedOn: 'Jun 12, 2026',
        status: 'Delivered',
        payment: PAYMENTS[1],
        address: ADDRESSES[0],
        shipping: 0,
        items: [item('sheets', 4), item('cardstock', 2), item('ribbon'), item('giftbags')],
    },
];

/** Units in the order (items × quantity). */
export const orderQty = (order: Order) => order.items.reduce((n, i) => n + i.qty, 0);

export const orderSubtotal = (order: Order) =>
    order.items.reduce((sum, i) => sum + i.price * i.qty, 0);

export const orderSavings = (order: Order) =>
    order.items.reduce((sum, i) => sum + (i.mrp - i.price) * i.qty, 0);

export const orderTotal = (order: Order) =>
    order.status === 'Cancelled' ? 0 : orderSubtotal(order) + order.shipping;
