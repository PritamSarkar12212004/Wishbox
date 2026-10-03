/**
 * Deterministic demo dataset for the admin panel.
 *
 * The storefront is frontend-only, so an admin dashboard would otherwise have
 * almost nothing to chart — a handful of fixture orders and 13 products. This
 * module generates a stable, seeded year of trading activity (orders,
 * customers, returns, reviews, coupons and restocks) that the dashboards read.
 *
 * Two rules keep it honest:
 *  1. It is generated in memory and never persisted, so demo volume can never
 *     leak into the customer-facing order history.
 *  2. Every product reference resolves from the real CATALOG, so names, prices
 *     and images can never drift from the storefront.
 *
 * Orders placed on the storefront in this browser are merged on top of this
 * dataset by `adminOrdersStore`, so admin views still reflect real activity.
 */

import { CATALOG, type CatalogProduct } from '@/modules/products/data/catalogData';

export const DAY_MS = 86_400_000;

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Fulfilment pipeline: accept the order, ship it, deliver it — or cancel it. */
export type AdminOrderStatus =
    | 'Approval'
    | 'Shipped'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Cancelled';

/** Canonical pipeline order — used for charts, filters and legends. */
export const ADMIN_ORDER_STATUSES: AdminOrderStatus[] = [
    'Approval',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
];

/** Statuses that still need someone to act. */
export const OPEN_STATUSES: AdminOrderStatus[] = ['Approval', 'Shipped', 'Out for Delivery'];

/** Statuses where the parcel is physically moving. */
export const IN_TRANSIT_STATUSES: AdminOrderStatus[] = ['Shipped', 'Out for Delivery'];

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'COD' | 'Wallet';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

export const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Credit Card', 'Debit Card', 'COD', 'Wallet'];

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
};

export type AdminCustomer = {
    id: string;
    name: string;
    email: string;
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

export type AdminCoupon = {
    code: string;
    label: string;
    kind: 'percent' | 'flat';
    value: number;
    /** Minimum cart value the code applies to. */
    minOrder: number;
    status: 'Active' | 'Scheduled' | 'Expired';
    expiresOn: string;
    /** Aggregated from the demo orders below. */
    used: number;
    discountGiven: number;
};

export type AdminRestock = {
    productId: string;
    productName: string;
    units: number;
    at: number;
};

export type AdminDataset = {
    generatedAt: number;
    orders: AdminOrder[];
    customers: AdminCustomer[];
    returns: AdminReturn[];
    reviews: AdminReview[];
    coupons: AdminCoupon[];
    restocks: AdminRestock[];
};

/* ------------------------------------------------------------------ */
/*  Seeded random                                                     */
/* ------------------------------------------------------------------ */

type Rng = {
    next: () => number;
    int: (min: number, max: number) => number;
    pick: <T>(list: readonly T[]) => T;
    chance: (probability: number) => boolean;
    weighted: <T>(entries: ReadonlyArray<readonly [T, number]>) => T;
};

/** mulberry32 — tiny, fast and stable across reloads for a fixed seed. */
function createRng(seed: number): Rng {
    let state = seed >>> 0;
    const next = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
        next,
        int: (min, max) => min + Math.floor(next() * (max - min + 1)),
        pick: (list) => list[Math.floor(next() * list.length)],
        chance: (probability) => next() < probability,
        weighted: (entries) => {
            const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
            let roll = next() * total;
            for (const [value, weight] of entries) {
                roll -= weight;
                if (roll <= 0) return value;
            }
            return entries[entries.length - 1][0];
        },
    };
}

/* ------------------------------------------------------------------ */
/*  Pools                                                             */
/* ------------------------------------------------------------------ */

const FIRST_NAMES = [
    'Aarav', 'Ananya', 'Rahul', 'Priya', 'Rohit', 'Sneha', 'Amit', 'Neha', 'Vikram', 'Kavya',
    'Arjun', 'Meera', 'Sanjay', 'Divya', 'Karan', 'Pooja', 'Nikhil', 'Riya', 'Manish', 'Ishita',
    'Aditya', 'Shreya', 'Rajesh', 'Tanvi', 'Varun', 'Nisha', 'Siddharth', 'Anjali', 'Harsh', 'Deepika',
    'Kabir', 'Preeti', 'Mohit', 'Sakshi', 'Gaurav', 'Ritika', 'Yash', 'Aisha', 'Devansh', 'Sanya',
];

const LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Mehta', 'Singh', 'Kaur',
    'Bose', 'Chopra', 'Joshi', 'Kapoor', 'Malhotra', 'Rao', 'Das', 'Banerjee', 'Kulkarni', 'Menon',
    'Shetty', 'Agarwal', 'Trivedi', 'Bhatt', 'Sinha', 'Pillai', 'Desai', 'Ghosh', 'Yadav', 'Mishra',
];

const CITIES: ReadonlyArray<readonly [string, number]> = [
    ['Mumbai', 4],
    ['Delhi', 4],
    ['Bengaluru', 3.5],
    ['Jaipur', 3],
    ['Pune', 2.5],
    ['Hyderabad', 2.5],
    ['Chennai', 2],
    ['Kolkata', 2],
    ['Ahmedabad', 2],
    ['Lucknow', 1.5],
    ['Gurugram', 1.5],
    ['Indore', 1],
];

const COURIERS: ReadonlyArray<readonly [string, number]> = [
    ['Delhivery', 3],
    ['Blue Dart', 2.2],
    ['Ekart', 2],
    ['XpressBees', 1.6],
    ['India Post', 1],
];

const COURIER_PREFIX: Record<string, string> = {
    Delhivery: 'DLV',
    'Blue Dart': 'BD',
    Ekart: 'EK',
    XpressBees: 'XB',
    'India Post': 'IP',
};

const PAYMENT_WEIGHTS: ReadonlyArray<readonly [PaymentMethod, number]> = [
    ['UPI', 48],
    ['Credit Card', 22],
    ['Debit Card', 12],
    ['COD', 15],
    ['Wallet', 3],
];

/** Relative demand by category — paper craft is the volume business. */
const CATEGORY_POPULARITY: Record<string, number> = {
    'paper-craft': 5.2,
    'home-decor': 2.1,
    lighting: 1.6,
    clocks: 1.1,
};

/** Categories the admin invents later still sell — at an average rate. */
const DEFAULT_CATEGORY_POPULARITY = 1.6;

const CATALOG_POOL = CATALOG.map((product) => ({
    product,
    // Cheaper products turn over faster than the flagship decor pieces.
    weight:
        (CATEGORY_POPULARITY[product.category] ?? DEFAULT_CATEGORY_POPULARITY) /
        Math.sqrt(product.price / 200),
}));

const REVIEW_TITLES: Record<number, string[]> = {
    5: ['Exactly as described', 'Beautiful finish', 'Will order again', 'Great value'],
    4: ['Very good quality', 'Looks lovely', 'Happy with it'],
    3: ['Decent for the price', 'Okay, not perfect', 'Average'],
    2: ['Expected better', 'Packaging was weak', 'Colour is off'],
    1: ['Arrived damaged', 'Not as shown', 'Disappointed'],
};

const REVIEW_BODIES: Record<number, string[]> = {
    5: [
        'The texture is lovely and it folded cleanly for my invitations. Packaging kept every sheet flat.',
        'Ordered twice now — colours are consistent and the finish photographs beautifully.',
        'Genuinely premium paper. Used it for gift wrapping and everyone asked where it was from.',
    ],
    4: [
        'Good quality overall. A couple of sheets had slight edge marks but the rest were perfect.',
        'Nice matte finish and true to the photos. Delivery took a little longer than promised.',
        'Works well for crafting. Would have liked slightly thicker GSM.',
    ],
    3: [
        'Usable but thinner than I expected. Fine for practice, not for premium gifting.',
        'Product is okay; the packaging arrived slightly dented though nothing was damaged.',
    ],
    2: [
        'Colour is noticeably duller than the product photos suggested.',
        'Two sheets were creased. Replacement process was straightforward at least.',
    ],
    1: ['Arrived with a torn pack and several sheets unusable.'],
};

/* ------------------------------------------------------------------ */
/*  Generation                                                        */
/* ------------------------------------------------------------------ */

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
});

const COUPON_SEED: Array<Omit<AdminCoupon, 'used' | 'discountGiven' | 'expiresOn'> & { expiresInDays: number }> = [
    { code: 'PAPER10', label: '10% off your first order', kind: 'percent', value: 10, minOrder: 499, status: 'Active', expiresInDays: 46 },
    { code: 'SAVE5', label: '5% off sitewide', kind: 'percent', value: 5, minOrder: 0, status: 'Active', expiresInDays: 12 },
    { code: 'PREPAID100', label: 'Flat ₹100 off prepaid orders', kind: 'flat', value: 100, minOrder: 999, status: 'Active', expiresInDays: 30 },
    { code: 'BULK9', label: '9% off bulk packs', kind: 'percent', value: 9, minOrder: 5000, status: 'Active', expiresInDays: 74 },
    { code: 'FESTIVE15', label: '15% festive season sale', kind: 'percent', value: 15, minOrder: 1499, status: 'Scheduled', expiresInDays: 95 },
    { code: 'WELCOME200', label: 'Flat ₹200 off the first order', kind: 'flat', value: 200, minOrder: 1999, status: 'Expired', expiresInDays: -18 },
];

const DISCOUNT_COUPONS = COUPON_SEED.filter((coupon) => coupon.status === 'Active' && coupon.kind === 'percent');

export const ADMIN_DATA_SEED = 20261002;

export function generateAdminDataset(seed = ADMIN_DATA_SEED, now = Date.now()): AdminDataset {
    const rng = createRng(seed);

    /* ── Customers ────────────────────────────────────────────────── */
    const customers: AdminCustomer[] = Array.from({ length: 520 }, (_, index) => {
        const first = rng.pick(FIRST_NAMES);
        const last = rng.pick(LAST_NAMES);
        const city = rng.weighted(CITIES);
        // Skew towards recent sign-ups so "new customers" is a real signal.
        const ageDays = Math.floor(600 * Math.pow(rng.next(), 1.7));
        return {
            id: `CUS-${String(1000 + index)}`,
            name: `${first} ${last}`,
            email: `${first}.${last}${index % 97}@example.com`.toLowerCase(),
            city,
            joinedAt: now - ageDays * DAY_MS - rng.int(0, 20) * 3_600_000,
            isGuest: rng.chance(0.3),
        };
    });

    const shoppers = customers.filter((customer) => !customer.isGuest);

    /* ── Orders: one pass per day, oldest first ───────────────────── */
    const orders: AdminOrder[] = [];
    let sequence = 1000;

    const STATUS_BY_AGE: Array<{ maxAge: number; weights: ReadonlyArray<readonly [AdminOrderStatus, number]> }> = [
        {
            maxAge: 2,
            weights: [['Approval', 76], ['Shipped', 18], ['Cancelled', 6]],
        },
        {
            maxAge: 5,
            weights: [['Approval', 24], ['Shipped', 44], ['Out for Delivery', 14], ['Delivered', 10], ['Cancelled', 8]],
        },
        {
            maxAge: 11,
            weights: [['Shipped', 24], ['Out for Delivery', 20], ['Delivered', 44], ['Approval', 6], ['Cancelled', 6]],
        },
        {
            maxAge: 22,
            weights: [['Delivered', 80], ['Shipped', 8], ['Out for Delivery', 5], ['Approval', 3], ['Cancelled', 4]],
        },
        {
            maxAge: Number.POSITIVE_INFINITY,
            weights: [['Delivered', 88], ['Cancelled', 6], ['Shipped', 3], ['Out for Delivery', 3]],
        },
    ];

    const statusFor = (ageDays: number): AdminOrderStatus =>
        rng.weighted(STATUS_BY_AGE.find((band) => ageDays <= band.maxAge)!.weights);

    /** A short run of offline time so "today" is not a perfectly even ribbon. */
    const hourPool = [9, 10, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22];

    for (let dayOffset = 364; dayOffset >= 0; dayOffset -= 1) {
        const dayStart = now - dayOffset * DAY_MS;
        const date = new Date(dayStart);
        const weekday = date.getDay();
        const progress = (364 - dayOffset) / 364;
        const weekdayFactor = weekday === 0 || weekday === 6 ? 1.14 : weekday === 2 || weekday === 3 ? 0.9 : 1;
        // A gentle festive lift over the last six weeks.
        const festive = dayOffset < 42 ? 1.32 : 1;
        const base = 2.2 + 3.1 * progress;
        const count = Math.max(0, Math.round(base * weekdayFactor * festive * (0.62 + rng.next() * 0.76)));

        for (let i = 0; i < count; i += 1) {
            // Today's orders only exist up to the current hour.
            const currentHour = new Date(now).getHours();
            const hour = dayOffset === 0 ? rng.int(0, currentHour) : rng.pick(hourPool);
            const minute = rng.int(0, 59);
            const placedAt = dayStart + hour * 3_600_000 + minute * 60_000;
            if (placedAt > now) continue;

            const isGuest = rng.chance(0.12);
            const customer = isGuest
                ? {
                      id: 'guest',
                      name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES).charAt(0)}.`,
                      email: 'guest checkout',
                      city: rng.weighted(CITIES),
                  }
                : rng.pick(shoppers);

            /* Line items */
            const lineCount = rng.weighted<number>([
                [1, 42],
                [2, 34],
                [3, 16],
                [4, 8],
            ]);
            const chosen = new Set<CatalogProduct>();
            while (chosen.size < lineCount) {
                chosen.add(rng.weighted(CATALOG_POOL.map((entry) => [entry.product, entry.weight] as const)));
            }

            const items: AdminOrderItem[] = [...chosen].map((product) => {
                // Cheap paper travels in bulk; decor pieces almost always singly.
                const qty =
                    product.category === 'paper-craft'
                        ? rng.weighted<number>([[1, 52], [2, 22], [3, 12], [5, 8], [10, 4], [25, 2]])
                        : rng.weighted<number>([[1, 86], [2, 14]]);
                return {
                    productId: product.id,
                    name: product.name,
                    brand: product.brand,
                    image: product.image,
                    category: product.category,
                    qty,
                    price: product.price,
                    mrp: product.mrp,
                };
            });

            const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

            let couponCode: string | undefined;
            let discount = 0;
            if (rng.chance(0.22)) {
                const eligible = DISCOUNT_COUPONS.filter((coupon) => subtotal >= coupon.minOrder);
                if (eligible.length > 0) {
                    const coupon = rng.pick(eligible);
                    couponCode = coupon.code;
                    discount = Math.round((subtotal * coupon.value) / 100);
                }
            }

            const shipping = rng.chance(0.78) ? 0 : 49;
            const status = statusFor(dayOffset);
            const payment = rng.weighted(PAYMENT_WEIGHTS);

            let paymentStatus: PaymentStatus;
            if (payment === 'COD') paymentStatus = status === 'Delivered' ? 'Paid' : 'Pending';
            else if (status === 'Cancelled') paymentStatus = 'Refunded';
            else paymentStatus = rng.weighted<PaymentStatus>([['Paid', 96], ['Pending', 2.5], ['Failed', 1.5]]);

            const inCourier = status !== 'Approval' && status !== 'Cancelled';
            const courier = inCourier ? rng.weighted(COURIERS) : undefined;
            const trackingId = courier
                ? `${COURIER_PREFIX[courier] ?? 'WB'}${rng.int(10_000_000, 99_999_999)}`
                : undefined;

            // Parcels past their window: shipped and still moving after a week.
            const delayed =
                (status === 'Shipped' && dayOffset > 7) ||
                (status === 'Out for Delivery' && dayOffset > 4);

            orders.push({
                id: `#ORD${sequence}`,
                customerId: customer.id,
                customer: customer.name,
                email: customer.email,
                city: customer.city,
                isGuest,
                isLive: false,
                placedAt,
                placedOn: DATE_FMT.format(placedAt),
                status,
                payment,
                paymentStatus,
                amount: Math.max(subtotal - discount, 0) + shipping,
                subtotal,
                shipping,
                discount,
                couponCode,
                items,
                courier,
                trackingId,
                delayed,
                refund: 0,
            });
            sequence += 1;
        }
    }

    orders.sort((a, b) => b.placedAt - a.placedAt);

    /* ── Returns & refunds ────────────────────────────────────────── */
    const returns: AdminReturn[] = [];
    let returnSequence = 5000;

    orders.forEach((order) => {
        if (order.status !== 'Delivered' || !rng.chance(0.06)) return;

        const item = order.items[0];
        const requestedAt = order.placedAt + rng.int(4, 16) * DAY_MS;

        const status = rng.weighted<ReturnStatus>([
            ['Requested', 52],
            ['Processing', 30],
            ['Approved', 12],
            ['Rejected', 6],
        ]);
        const refunded = status === 'Approved' && rng.chance(0.7);

        const reason = rng.weighted<ReturnReason>([
            ['Damaged in transit', 32],
            ['Wrong item shipped', 18],
            ['Quality not as expected', 22],
            ['Changed my mind', 21],
            ['Other', 7],
        ]);

        const refundAmount =
            status === 'Rejected' ? 0 : Math.round(order.amount * rng.weighted<number>([[1, 62], [0.5, 24], [0.8, 14]]));

        returns.push({
            id: `#RET-${returnSequence}`,
            orderId: order.id,
            customer: order.customer,
            city: order.city,
            productName: item.name,
            image: item.image,
            reason,
            requestedAt,
            status,
            refundAmount,
            refunded,
        });
        returnSequence += 1;

        order.returnReason = reason;
        if (refunded) {
            order.refund = refundAmount;
            order.paymentStatus = 'Refunded';
        }
    });

    returns.sort((a, b) => b.requestedAt - a.requestedAt);

    /* ── Reviews (from delivered orders) ──────────────────────────── */
    const reviews: AdminReview[] = [];
    let reviewSequence = 7000;

    orders.forEach((order) => {
        if (order.status !== 'Delivered' || !rng.chance(0.34)) return;
        const item = rng.pick(order.items);
        const rating = rng.weighted<number>([[5, 52], [4, 31], [3, 12], [2, 4], [1, 1]]);
        reviews.push({
            id: `#REV-${reviewSequence}`,
            productId: item.productId,
            productName: item.name,
            image: item.image,
            customer: order.customer,
            rating,
            title: rng.pick(REVIEW_TITLES[rating]),
            comment: rng.pick(REVIEW_BODIES[rating]),
            createdAt: order.placedAt + rng.int(3, 14) * DAY_MS,
            helpful: rng.int(0, 42),
            status: rng.chance(0.88) ? 'Published' : 'Pending',
        });
        reviewSequence += 1;
    });

    reviews.sort((a, b) => b.createdAt - a.createdAt);

    /* ── Coupons: usage aggregated from the orders above ─────────── */
    const coupons: AdminCoupon[] = COUPON_SEED.map(({ expiresInDays, ...coupon }) => {
        const usage = orders.filter((order) => order.couponCode === coupon.code);
        return {
            ...coupon,
            expiresOn: DATE_FMT.format(now + expiresInDays * DAY_MS),
            used: usage.length,
            discountGiven: usage.reduce((sum, order) => sum + order.discount, 0),
        };
    });

    /* ── Restock log ──────────────────────────────────────────────── */
    const restocks: AdminRestock[] = [];
    for (let monthBack = 11; monthBack >= 0; monthBack -= 1) {
        const entries = rng.int(2, 4);
        for (let i = 0; i < entries; i += 1) {
            const product = rng.pick(CATALOG);
            restocks.push({
                productId: product.id,
                productName: product.name,
                units: product.category === 'paper-craft' ? rng.int(40, 260) : rng.int(6, 40),
                at: now - monthBack * 30 * DAY_MS - rng.int(0, 18) * DAY_MS,
            });
        }
    }

    return { generatedAt: now, orders, customers, returns, reviews, coupons, restocks };
}

let cached: AdminDataset | undefined;

/** Generated once per page load — the seed makes it stable across reloads. */
export function getAdminDataset(): AdminDataset {
    cached ??= generateAdminDataset();
    return cached;
}
