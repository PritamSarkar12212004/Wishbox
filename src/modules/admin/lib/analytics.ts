/**
 * Analytics over the admin demo dataset.
 *
 * Pure functions — every number on the dashboard is derived here so the cards,
 * charts and tables can never disagree with each other. Orders placed on the
 * storefront are merged in upstream by `adminOrdersStore`, which means these
 * helpers work on one flat `AdminOrder[]` regardless of where it came from.
 */

import { formatCategory } from '@/modules/products/lib/category';
import type { CatalogProduct } from '@/modules/products/data/catalogData';
import {
    ADMIN_ORDER_STATUSES,
    DAY_MS,
    IN_TRANSIT_STATUSES,
    OPEN_STATUSES,
    PAYMENT_METHODS,
    RETURN_REASONS,
    RETURN_STATUSES,
    type AdminCustomer,
    type AdminOrder,
    type AdminOrderStatus,
    type AdminRestock,
    type AdminReturn,
    type PaymentMethod,
    type ReturnReason,
    type ReturnStatus,
} from '../data/adminData';

/* ------------------------------------------------------------------ */
/*  Date ranges                                                       */
/* ------------------------------------------------------------------ */

export type RangeKey = 'today' | '7d' | '30d' | '3m' | '1y' | 'custom';

export type DateRange = { from: number; to: number };

export const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '3m', label: '3 months' },
    { value: '1y', label: '1 year' },
    { value: 'custom', label: 'Custom' },
];

const startOfDay = (time: number) => {
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
};

/** Day-aligned ranges keep the chart buckets tidy. */
export function resolveRange(key: RangeKey, now = Date.now(), custom?: DateRange): DateRange {
    const today = startOfDay(now);
    switch (key) {
        case 'today':
            return { from: today, to: now };
        case '7d':
            return { from: today - 6 * DAY_MS, to: now };
        case '30d':
            return { from: today - 29 * DAY_MS, to: now };
        case '3m':
            return { from: today - 89 * DAY_MS, to: now };
        case '1y':
            return { from: today - 364 * DAY_MS, to: now };
        case 'custom':
            return custom ?? { from: today - 29 * DAY_MS, to: now };
    }
}

/** The equally long window immediately before `range` — powers every "% vs previous". */
export function previousRange(range: DateRange): DateRange {
    const span = range.to - range.from;
    return { from: range.from - span, to: range.from };
}

export const inRange = (time: number, range: DateRange) => time >= range.from && time <= range.to;

export function rangeLabel(key: RangeKey, range: DateRange): string {
    if (key !== 'custom') return RANGE_OPTIONS.find((option) => option.value === key)?.label ?? 'Period';
    return `${DAY_LABEL.format(range.from)} – ${DAY_LABEL.format(range.to)}`;
}

/* ------------------------------------------------------------------ */
/*  Money helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Revenue actually earned: cancellations and refunds earn nothing, and a
 * returned order nets off whatever was refunded.
 */
export function netAmount(order: AdminOrder): number {
    if (order.status === 'Cancelled' || order.status === 'Refunded') return 0;
    if (order.status === 'Returned') return Math.max(order.amount - order.refund, 0);
    return order.amount;
}

export const orderUnits = (order: AdminOrder) => order.items.reduce((sum, item) => sum + item.qty, 0);

export function percentChange(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return ((current - previous) / previous) * 100;
}

/* ------------------------------------------------------------------ */
/*  Indexes                                                           */
/* ------------------------------------------------------------------ */

export type OrderIndex = {
    /** First order date per registered customer id. */
    firstOrderAt: Map<string, number>;
    /** Lifetime revenue per registered customer id. */
    lifetimeRevenue: Map<string, number>;
    orderCount: Map<string, number>;
};

export function buildOrderIndex(orders: AdminOrder[]): OrderIndex {
    const firstOrderAt = new Map<string, number>();
    const lifetimeRevenue = new Map<string, number>();
    const orderCount = new Map<string, number>();

    orders.forEach((order) => {
        if (order.isGuest) return;
        const existing = firstOrderAt.get(order.customerId);
        if (existing === undefined || order.placedAt < existing) {
            firstOrderAt.set(order.customerId, order.placedAt);
        }
        lifetimeRevenue.set(order.customerId, (lifetimeRevenue.get(order.customerId) ?? 0) + netAmount(order));
        orderCount.set(order.customerId, (orderCount.get(order.customerId) ?? 0) + 1);
    });

    return { firstOrderAt, lifetimeRevenue, orderCount };
}

/* ------------------------------------------------------------------ */
/*  Headline numbers                                                  */
/* ------------------------------------------------------------------ */

export type Metrics = {
    revenue: number;
    orders: number;
    customers: number;
    newCustomers: number;
    averageOrderValue: number;
    units: number;
    pending: number;
    inTransit: number;
    returns: number;
    cancelled: number;
};

export function computeMetrics(orders: AdminOrder[], range: DateRange, index: OrderIndex): Metrics {
    const inWindow = orders.filter((order) => inRange(order.placedAt, range));

    let revenue = 0;
    let units = 0;
    let pending = 0;
    let inTransit = 0;
    let cancelled = 0;
    const customerIds = new Set<string>();

    inWindow.forEach((order) => {
        revenue += netAmount(order);
        units += orderUnits(order);
        if (OPEN_STATUSES.includes(order.status)) pending += 1;
        if (IN_TRANSIT_STATUSES.includes(order.status)) inTransit += 1;
        if (order.status === 'Cancelled') cancelled += 1;
        if (!order.isGuest) customerIds.add(order.customerId);
    });

    const newCustomers = [...customerIds].filter((id) => {
        const first = index.firstOrderAt.get(id);
        return first !== undefined && inRange(first, range);
    }).length;

    return {
        revenue,
        orders: inWindow.length,
        customers: customerIds.size,
        newCustomers,
        averageOrderValue: inWindow.length > 0 ? Math.round(revenue / inWindow.length) : 0,
        units,
        pending,
        inTransit,
        cancelled,
        returns: inWindow.filter((order) => order.status === 'Returned' || order.status === 'Refunded').length,
    };
}

/* ------------------------------------------------------------------ */
/*  Time series                                                       */
/* ------------------------------------------------------------------ */

export type SeriesPoint = {
    at: number;
    label: string;
    revenue: number;
    orders: number;
    prevRevenue: number;
    prevOrders: number;
};

const DAY_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const hourLabel = (hour: number) => `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? 'am' : 'pm'}`;

/** Bucket boundaries sized to the window: hours → days → weeks → months. */
function bucketStarts(range: DateRange): number[] {
    const span = range.to - range.from;
    const starts: number[] = [];

    if (span <= DAY_MS) {
        const dayStart = startOfDay(range.from);
        for (let hour = 0; hour < 24; hour += 1) {
            const at = dayStart + hour * 3_600_000;
            if (at > range.to) break;
            starts.push(at);
        }
        return starts;
    }

    if (span <= 31 * DAY_MS) {
        for (let at = startOfDay(range.from); at <= range.to; at += DAY_MS) starts.push(at);
        return starts;
    }

    if (span <= 120 * DAY_MS) {
        for (let at = startOfDay(range.from); at <= range.to; at += 7 * DAY_MS) starts.push(at);
        return starts;
    }

    const cursor = new Date(startOfDay(range.from));
    cursor.setDate(1);
    while (cursor.getTime() <= range.to) {
        starts.push(cursor.getTime());
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return starts;
}

function bucketLabel(at: number, granularity: 'hour' | 'day' | 'week' | 'month'): string {
    if (granularity === 'hour') return hourLabel(new Date(at).getHours());
    if (granularity === 'month') {
        const date = new Date(at);
        return `${MONTHS[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`;
    }
    return DAY_LABEL.format(at);
}

/** Last bucket start at or before `time` — binary search keeps months (uneven lengths) honest. */
function bucketIndex(starts: number[], time: number): number {
    let low = 0;
    let high = starts.length - 1;
    let found = -1;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (starts[mid] <= time) {
            found = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return found;
}

function granularityFor(starts: number[]): 'hour' | 'day' | 'week' | 'month' {
    if (starts.length < 2) return 'day';
    const step = starts[1] - starts[0];
    if (step <= 3_600_000) return 'hour';
    if (step <= DAY_MS) return 'day';
    if (step <= 7 * DAY_MS) return 'week';
    return 'month';
}

/** Current window bucketed, with the previous window's buckets aligned alongside. */
export function buildSeries(orders: AdminOrder[], range: DateRange): SeriesPoint[] {
    const starts = bucketStarts(range);
    if (starts.length === 0) return [];

    const granularity = granularityFor(starts);
    const prev = previousRange(range);
    const span = range.to - range.from;

    const points: SeriesPoint[] = starts.map((at) => ({
        at,
        label: bucketLabel(at, granularity),
        revenue: 0,
        orders: 0,
        prevRevenue: 0,
        prevOrders: 0,
    }));

    orders.forEach((order) => {
        if (inRange(order.placedAt, range)) {
            const index = bucketIndex(starts, order.placedAt);
            if (index >= 0) {
                points[index].revenue += netAmount(order);
                points[index].orders += 1;
            }
            return;
        }
        if (inRange(order.placedAt, prev)) {
            // Shift the previous window onto the current grid so buckets align.
            const index = bucketIndex(starts, order.placedAt + span);
            if (index >= 0) {
                points[index].prevRevenue += netAmount(order);
                points[index].prevOrders += 1;
            }
        }
    });

    return points;
}

/* ------------------------------------------------------------------ */
/*  Breakdowns                                                        */
/* ------------------------------------------------------------------ */

export type StatusRow = {
    status: AdminOrderStatus;
    count: number;
    amount: number;
    share: number;
};

export function statusBreakdown(orders: AdminOrder[], range: DateRange): StatusRow[] {
    const inWindow = orders.filter((order) => inRange(order.placedAt, range));
    const rows = ADMIN_ORDER_STATUSES.map((status) => ({
        status,
        count: 0,
        amount: 0,
        share: 0,
    }));

    inWindow.forEach((order) => {
        const row = rows.find((entry) => entry.status === order.status);
        if (!row) return;
        row.count += 1;
        row.amount += order.amount;
    });

    const total = inWindow.length;
    rows.forEach((row) => {
        row.share = total > 0 ? (row.count / total) * 100 : 0;
    });

    return rows;
}

export type ProductSalesRow = {
    productId: string;
    name: string;
    image: string;
    category: string;
    units: number;
    revenue: number;
    stock: number;
    available: boolean;
};

/**
 * Best sellers by revenue. Cancelled and refunded orders are excluded so the
 * table never credits a product for money the store did not keep.
 */
export function topProducts(
    orders: AdminOrder[],
    range: DateRange,
    products: CatalogProduct[],
    limit = 5
): ProductSalesRow[] {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const rows = new Map<string, ProductSalesRow>();

    orders.forEach((order) => {
        if (!inRange(order.placedAt, range)) return;
        if (order.status === 'Cancelled' || order.status === 'Refunded') return;
        order.items.forEach((item) => {
            const product = productsById.get(item.productId);
            const row = rows.get(item.productId) ?? {
                productId: item.productId,
                name: item.name,
                image: item.image,
                category: item.category,
                units: 0,
                revenue: 0,
                stock: product?.stock ?? 0,
                available: product?.available ?? true,
            };
            row.units += item.qty;
            row.revenue += item.price * item.qty;
            rows.set(item.productId, row);
        });
    });

    return [...rows.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export type CategorySalesRow = {
    category: string;
    label: string;
    units: number;
    revenue: number;
    share: number;
};

export function salesByCategory(orders: AdminOrder[], range: DateRange): CategorySalesRow[] {
    const rows = new Map<string, CategorySalesRow>();

    orders.forEach((order) => {
        if (!inRange(order.placedAt, range)) return;
        if (order.status === 'Cancelled' || order.status === 'Refunded') return;
        order.items.forEach((item) => {
            const row = rows.get(item.category) ?? {
                category: item.category,
                label: formatCategory(item.category),
                units: 0,
                revenue: 0,
                share: 0,
            };
            row.units += item.qty;
            row.revenue += item.price * item.qty;
            rows.set(item.category, row);
        });
    });

    const list = [...rows.values()].sort((a, b) => b.revenue - a.revenue);
    const total = list.reduce((sum, row) => sum + row.revenue, 0);
    list.forEach((row) => {
        row.share = total > 0 ? (row.revenue / total) * 100 : 0;
    });
    return list;
}

export type PaymentRow = {
    method: PaymentMethod;
    count: number;
    amount: number;
    share: number;
};

export type PaymentAnalytics = {
    methods: PaymentRow[];
    collected: number;
    pending: number;
    failed: number;
    refundedAmount: number;
    failedOrders: AdminOrder[];
};

export function paymentAnalytics(
    orders: AdminOrder[],
    range: DateRange,
    returns: AdminReturn[]
): PaymentAnalytics {
    const inWindow = orders.filter((order) => inRange(order.placedAt, range));
    const rows = PAYMENT_METHODS.map((method) => ({ method, count: 0, amount: 0, share: 0 }));

    inWindow.forEach((order) => {
        const row = rows.find((entry) => entry.method === order.payment);
        if (!row) return;
        row.count += 1;
        row.amount += order.amount;
    });
    const total = inWindow.length;
    rows.forEach((row) => {
        row.share = total > 0 ? (row.count / total) * 100 : 0;
    });

    return {
        methods: rows.sort((a, b) => b.count - a.count),
        collected: inWindow.filter((order) => order.paymentStatus === 'Paid').reduce((sum, order) => sum + order.amount, 0),
        pending: inWindow.filter((order) => order.paymentStatus === 'Pending').reduce((sum, order) => sum + order.amount, 0),
        failed: inWindow.filter((order) => order.paymentStatus === 'Failed').reduce((sum, order) => sum + order.amount, 0),
        refundedAmount: returns
            .filter((entry) => inRange(entry.requestedAt, range) && entry.refunded)
            .reduce((sum, entry) => sum + entry.refundAmount, 0),
        failedOrders: inWindow.filter((order) => order.paymentStatus === 'Failed'),
    };
}

export type DeliveryRow = { label: string; status: AdminOrderStatus; count: number };

export type DeliveryAnalytics = {
    rows: DeliveryRow[];
    delayed: AdminOrder[];
    awaitingPickup: number;
    delivered: number;
    inTransit: number;
};

const DELIVERY_STAGES: Array<{ label: string; status: AdminOrderStatus }> = [
    { label: 'Awaiting pack', status: 'Pending' },
    { label: 'Packed', status: 'Packed' },
    { label: 'Shipped', status: 'Shipped' },
    { label: 'Out for delivery', status: 'Out for Delivery' },
    { label: 'Delivered', status: 'Delivered' },
];

export function deliveryAnalytics(orders: AdminOrder[], range: DateRange): DeliveryAnalytics {
    const inWindow = orders.filter((order) => inRange(order.placedAt, range));
    const rows = DELIVERY_STAGES.map(({ label, status }) => ({
        label,
        status,
        count: inWindow.filter((order) => order.status === status).length,
    }));

    return {
        rows,
        delayed: inWindow.filter((order) => order.delayed),
        awaitingPickup: inWindow.filter((order) => order.status === 'Packed').length,
        delivered: inWindow.filter((order) => order.status === 'Delivered').length,
        inTransit: inWindow.filter((order) => IN_TRANSIT_STATUSES.includes(order.status)).length,
    };
}

export type ReturnsAnalytics = {
    byStatus: Array<{ status: ReturnStatus; count: number }>;
    byReason: Array<{ reason: ReturnReason; count: number; refunded: number }>;
    total: number;
    refundPending: number;
    refunded: number;
    open: number;
};

export function returnsAnalytics(returns: AdminReturn[], range: DateRange): ReturnsAnalytics {
    const inWindow = returns.filter((entry) => inRange(entry.requestedAt, range));

    return {
        byStatus: RETURN_STATUSES.map((status) => ({
            status,
            count: inWindow.filter((entry) => entry.status === status).length,
        })),
        byReason: RETURN_REASONS.map((reason) => ({
            reason,
            count: inWindow.filter((entry) => entry.reason === reason).length,
            refunded: inWindow
                .filter((entry) => entry.reason === reason && entry.refunded)
                .reduce((sum, entry) => sum + entry.refundAmount, 0),
        })),
        total: inWindow.length,
        refundPending: inWindow
            .filter((entry) => !entry.refunded && entry.status !== 'Rejected')
            .reduce((sum, entry) => sum + entry.refundAmount, 0),
        refunded: inWindow.filter((entry) => entry.refunded).reduce((sum, entry) => sum + entry.refundAmount, 0),
        open: inWindow.filter((entry) => entry.status === 'Requested' || entry.status === 'Processing').length,
    };
}

export type CustomerAnalytics = {
    total: number;
    newCustomers: number;
    returning: number;
    recurringShare: number;
    guestOrders: number;
    guestShare: number;
    averageOrderValue: number;
    lifetimeValue: number;
    activeCustomers: number;
};

export function customerAnalytics(
    orders: AdminOrder[],
    range: DateRange,
    customers: AdminCustomer[],
    index: OrderIndex
): CustomerAnalytics {
    const inWindow = orders.filter((order) => inRange(order.placedAt, range));
    const registered = customers.filter((customer) => !customer.isGuest);

    const activeIds = new Set(inWindow.filter((order) => !order.isGuest).map((order) => order.customerId));
    const newIds = new Set(
        [...activeIds].filter((id) => {
            const first = index.firstOrderAt.get(id);
            return first !== undefined && inRange(first, range);
        })
    );

    const revenue = inWindow.reduce((sum, order) => sum + netAmount(order), 0);
    const activeCustomers = index.lifetimeRevenue.size;

    return {
        total: registered.length,
        newCustomers: newIds.size,
        returning: activeIds.size - newIds.size,
        recurringShare: activeIds.size > 0 ? ((activeIds.size - newIds.size) / activeIds.size) * 100 : 0,
        guestOrders: inWindow.filter((order) => order.isGuest).length,
        guestShare: inWindow.length > 0 ? (inWindow.filter((order) => order.isGuest).length / inWindow.length) * 100 : 0,
        averageOrderValue: inWindow.length > 0 ? Math.round(revenue / inWindow.length) : 0,
        lifetimeValue:
            activeCustomers > 0
                ? Math.round([...index.lifetimeRevenue.values()].reduce((sum, value) => sum + value, 0) / activeCustomers)
                : 0,
        activeCustomers,
    };
}

/* ------------------------------------------------------------------ */
/*  Inventory                                                         */
/* ------------------------------------------------------------------ */

export type InventoryAnalytics = {
    total: number;
    live: number;
    outOfStock: CatalogProduct[];
    lowStock: CatalogProduct[];
    recentlyRestocked: Array<{ product: CatalogProduct; units: number; at: number }>;
};

export function inventoryAnalytics(
    products: CatalogProduct[],
    restocks: AdminRestock[],
    lowStockThreshold: number,
    now = Date.now()
): InventoryAnalytics {
    const live = products.filter((product) => !product.hidden);
    const byId = new Map(products.map((product) => [product.id, product]));

    return {
        total: products.length,
        live: live.length,
        outOfStock: products.filter((product) => !product.available),
        lowStock: live
            .filter((product) => product.available && product.stock <= lowStockThreshold)
            .sort((a, b) => a.stock - b.stock),
        recentlyRestocked: restocks
            .filter((entry) => entry.at >= now - 21 * DAY_MS)
            .sort((a, b) => b.at - a.at)
            .map((entry) => ({
                product: byId.get(entry.productId),
                units: entry.units,
                at: entry.at,
            }))
            .filter((entry): entry is { product: CatalogProduct; units: number; at: number } => Boolean(entry.product)),
    };
}

/* ------------------------------------------------------------------ */
/*  Alerts feed                                                       */
/* ------------------------------------------------------------------ */

export type AdminAlert = {
    id: string;
    kind: 'stock' | 'delivery' | 'return' | 'payment' | 'order';
    title: string;
    detail: string;
    at: number;
    href: string;
};

/** One derived alerts feed — the bell in the header and the page share it. */
export function buildAlerts(
    orders: AdminOrder[],
    inventory: InventoryAnalytics,
    returns: AdminReturn[],
    alertsRange: DateRange
): AdminAlert[] {
    const alerts: AdminAlert[] = [];

    inventory.outOfStock.slice(0, 4).forEach((product) => {
        alerts.push({
            id: `stock-out-${product.id}`,
            kind: 'stock',
            title: `${product.name} is out of stock`,
            detail: `${product.sku} · storefront buy buttons are hidden`,
            at: Date.now() - 2 * DAY_MS,
            href: '/admin/products/inventory',
        });
    });

    inventory.lowStock.slice(0, 4).forEach((product) => {
        alerts.push({
            id: `stock-low-${product.id}`,
            kind: 'stock',
            title: `Only ${product.stock} left of ${product.name}`,
            detail: `${product.sku} · reorder soon`,
            at: Date.now() - DAY_MS,
            href: '/admin/products/inventory',
        });
    });

    const delayed = orders.filter((order) => order.delayed && inRange(order.placedAt, alertsRange));
    if (delayed.length > 0) {
        alerts.push({
            id: 'delivery-delayed',
            kind: 'delivery',
            title: `${delayed.length} shipment${delayed.length === 1 ? '' : 's'} running late`,
            detail: `${delayed[0].id} was due earlier this week`,
            at: Date.now() - 6 * 3_600_000,
            href: '/admin/shipping/tracking',
        });
    }

    const openReturns = returns.filter(
        (entry) => (entry.status === 'Requested' || entry.status === 'Processing') && inRange(entry.requestedAt, alertsRange)
    );
    if (openReturns.length > 0) {
        alerts.push({
            id: 'returns-open',
            kind: 'return',
            title: `${openReturns.length} return request${openReturns.length === 1 ? '' : 's'} open`,
            detail: `${openReturns[0].orderId} · ${openReturns[0].reason}`,
            at: openReturns[0].requestedAt,
            href: '/admin/orders/returns',
        });
    }

    const failed = orders.filter((order) => order.paymentStatus === 'Failed' && inRange(order.placedAt, alertsRange));
    if (failed.length > 0) {
        alerts.push({
            id: 'payments-failed',
            kind: 'payment',
            title: `${failed.length} payment${failed.length === 1 ? '' : 's'} failed`,
            detail: `Worth ₹${failed.reduce((sum, order) => sum + order.amount, 0).toLocaleString('en-IN')}`,
            at: failed[0].placedAt,
            href: '/admin/payments/failed',
        });
    }

    const newest = orders.filter((order) => inRange(order.placedAt, alertsRange)).slice(0, 3);
    newest.forEach((order) => {
        alerts.push({
            id: `order-${order.id}`,
            kind: 'order',
            title: `New order ${order.id}`,
            detail: `${order.customer} · ${order.items.length} item${order.items.length === 1 ? '' : 's'}`,
            at: order.placedAt,
            href: '/admin/orders',
        });
    });

    return alerts.sort((a, b) => b.at - a.at);
}

export type { AdminOrder, AdminReturn, CatalogProduct };
