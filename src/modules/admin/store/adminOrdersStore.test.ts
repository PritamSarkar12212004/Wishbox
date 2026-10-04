import { beforeEach, describe, expect, it } from 'vitest';
import adminConst from '../consts/adminConst';
import { NEXT_STATUSES, nextStatusOptions } from '../consts/orderConst';
import { CANCELLATION_REASONS, getAdminDataset } from '../data/adminData';
import {
    approvalStateOf,
    decodeOrderId,
    hasShipment,
    isOrderDetailsPath,
    refundStatusOf,
} from '../lib/orderDetail';
import { adminOrdersStore } from './adminOrdersStore';

/**
 * The order sheet's back end.
 *
 * There is no server, so `adminOrdersStore` is the source of truth the sheet
 * renders — these tests pin the approve / cancel / refund contract and the
 * fixture fields the detail screen depends on.
 */

const dataset = getAdminDataset();

function awaitingApproval() {
    const found = dataset.orders.find((order) => order.status === 'Approval');
    if (!found) throw new Error('Expected a fixture order awaiting approval');
    return found;
}

beforeEach(() => {
    adminOrdersStore.reset();
});

describe('order sheet fixtures', () => {
    it('gives every order a contact number and a delivery address in its city', () => {
        const sample = dataset.orders.slice(0, 80);
        expect(sample).toHaveLength(80);
        sample.forEach((order) => {
            expect(order.phone).toMatch(/^\+91 \d{5} \d{5}$/);
            expect(order.address).toContain(order.city);
            expect(order.address).toMatch(/\d{6}$/);
        });
    });

    it('never attaches a payment screenshot to a cash-on-delivery order', () => {
        const cod = dataset.orders.filter((order) => order.payment === 'COD');
        expect(cod.length).toBeGreaterThan(0);
        expect(cod.every((order) => !order.paymentScreenshot)).toBe(true);
    });

    it('covers both screenshot states, so the empty state is reachable', () => {
        expect(dataset.orders.some((order) => Boolean(order.paymentScreenshot))).toBe(true);
        expect(dataset.orders.some((order) => !order.paymentScreenshot)).toBe(true);
    });

    it('leaves a cancelled order either refund-pending or refund-completed', () => {
        const cancelled = dataset.orders.filter((order) => order.status === 'Cancelled');
        expect(cancelled.length).toBeGreaterThan(0);

        cancelled.forEach((order) => {
            expect(order.cancelledAt).toBeTypeOf('number');
            expect(order.cancellationReason).toBeTruthy();
            expect(['Pending', 'Completed']).toContain(refundStatusOf(order));
        });

        // A completed refund always carries its proof; a pending one never does.
        cancelled.forEach((order) => {
            if (refundStatusOf(order) === 'Completed') {
                expect(order.refundScreenshot).toBeTruthy();
                expect(order.refundedAt).toBeTypeOf('number');
            } else {
                expect(order.refundScreenshot).toBeUndefined();
            }
        });
    });

    it('reads orders past the approval gate as already approved', () => {
        const shipped = dataset.orders.find((order) => order.status === 'Shipped');
        if (!shipped) throw new Error('Expected a shipped fixture order');
        expect(approvalStateOf(shipped)).toBe('approved');
        expect(approvalStateOf(awaitingApproval())).toBe('pending');
    });
});

describe('admin order actions', () => {
    it('approving parks the order in the Approved stage and stamps who approved it', () => {
        const pending = awaitingApproval();
        expect(approvalStateOf(adminOrdersStore.resolve(pending))).toBe('pending');

        adminOrdersStore.approve(pending.id, 'admin@wishbox.in');

        const approved = adminOrdersStore.resolve(pending);
        // Approving is not shipping — the parcel is handed over as a separate move.
        expect(approved.status).toBe('Approved');
        expect(approved.approvedBy).toBe('admin@wishbox.in');
        expect(approved.approvedAt).toBeTypeOf('number');
        expect(approvalStateOf(approved)).toBe('approved');
        expect(approved.courier).toBeUndefined();
    });

    it('records the courier and AWB when the approved order is shipped', () => {
        const pending = awaitingApproval();
        adminOrdersStore.approve(pending.id, 'admin@wishbox.in');
        expect(adminOrdersStore.resolve(pending).status).toBe('Approved');

        adminOrdersStore.setStatus(pending.id, 'Shipped');
        adminOrdersStore.setShipping(pending.id, { courier: 'Blue Dart', trackingId: 'BD12345678' });

        const shipped = adminOrdersStore.resolve(pending);
        expect(shipped.status).toBe('Shipped');
        expect(shipped.courier).toBe('Blue Dart');
        expect(shipped.trackingId).toBe('BD12345678');
        expect(hasShipment(shipped)).toBe(true);
    });

    it('cancelling opens a pending refund that the screenshot upload then closes', () => {
        const pending = awaitingApproval();
        const reason = CANCELLATION_REASONS[2];

        adminOrdersStore.cancel(pending.id, reason);

        let cancelled = adminOrdersStore.resolve(pending);
        expect(cancelled.status).toBe('Cancelled');
        expect(cancelled.cancellationReason).toBe(reason);
        expect(cancelled.cancelledAt).toBeTypeOf('number');
        expect(refundStatusOf(cancelled)).toBe('Pending');
        expect(cancelled.refundScreenshot).toBeUndefined();
        expect(approvalStateOf(cancelled)).toBe('cancelled');

        adminOrdersStore.setRefundScreenshot(pending.id, 'data:image/png;base64,AAAA');

        cancelled = adminOrdersStore.resolve(pending);
        expect(refundStatusOf(cancelled)).toBe('Completed');
        expect(cancelled.refundScreenshot).toBe('data:image/png;base64,AAAA');
        expect(cancelled.refundedAt).toBeTypeOf('number');
    });

    it('keeps a separate override per order and drops them all on reset', () => {
        const [first, second] = dataset.orders.filter((order) => order.status === 'Approval');
        if (!first || !second) throw new Error('Expected two fixture orders awaiting approval');

        adminOrdersStore.approve(first.id, 'admin@wishbox.in');
        adminOrdersStore.cancel(second.id, CANCELLATION_REASONS[0]);

        expect(adminOrdersStore.resolve(first).status).toBe('Approved');
        expect(adminOrdersStore.resolve(second).status).toBe('Cancelled');

        adminOrdersStore.reset();

        expect(adminOrdersStore.resolve(first).status).toBe('Approval');
        expect(adminOrdersStore.resolve(second).status).toBe('Approval');
        expect(adminOrdersStore.resolve(first).approvedAt).toBeUndefined();
    });

    it('returns untouched orders exactly as seeded', () => {
        const shipped = dataset.orders.find((order) => order.status === 'Shipped');
        if (!shipped) throw new Error('Expected a shipped fixture order');
        expect(adminOrdersStore.resolve(shipped)).toBe(shipped);
    });
});

describe('order detail routes', () => {
    it('round-trips ids that contain a URL fragment character', () => {
        expect(decodeOrderId(encodeURIComponent('#ORD1234'))).toBe('#ORD1234');
        expect(decodeOrderId(encodeURIComponent('#WB-1128'))).toBe('#WB-1128');
    });

    it('survives a missing or already-decoded param', () => {
        expect(decodeOrderId(undefined)).toBe('');
        expect(decodeOrderId('#ORD1234')).toBe('#ORD1234');
    });

    it('resolves a seeded order id through the real route path', () => {
        const order = dataset.orders[0];
        if (!order) throw new Error('Expected a seeded order');

        // The list links out with the encoded id; the sheet decodes it back.
        const path = adminConst.route.orderDetailsPage(order.id);
        const segment = path.split('/').pop();
        expect(decodeOrderId(segment)).toBe(order.id);

        // …and the decoded id still finds the order in the feed.
        expect(dataset.orders.find((entry) => entry.id === order.id)).toBe(order);
    });

    it('flags only the order sheet as full-bleed', () => {
        expect(isOrderDetailsPath('/admin/orders/view/%23ORD1234')).toBe(true);
        expect(isOrderDetailsPath('/admin/orders')).toBe(false);
        expect(isOrderDetailsPath('/admin/orders/approval')).toBe(false);
        expect(isOrderDetailsPath('/admin/orders/returns')).toBe(false);
    });
});

describe('the pipeline only offers actions', () => {
    it('only gives a courier to orders that have actually been handed over', () => {
        dataset.orders.forEach((order) => {
            const handedOver =
                order.status === 'Shipped' ||
                order.status === 'Out for Delivery' ||
                order.status === 'Delivered';
            expect(Boolean(order.courier)).toBe(handedOver);
        });
    });

    it('never offers Approval — sending an order back to the gate is not an action', () => {
        const targets = Object.values(NEXT_STATUSES).flat();
        expect(targets).not.toContain('Approval');
        expect(targets.length).toBeGreaterThan(0);
    });

    it('offers shipping as the only move once an order is approved', () => {
        expect(nextStatusOptions('Approved')).toEqual([{ value: 'Shipped', label: 'Mark as shipped' }]);
    });

    it('offers no move while pending, delivered or cancelled', () => {
        expect(nextStatusOptions('Approval')).toEqual([]);
        expect(nextStatusOptions('Delivered')).toEqual([]);
        expect(nextStatusOptions('Cancelled')).toEqual([]);
    });

    it('still carries a shipped parcel forward to delivery', () => {
        expect(nextStatusOptions('Shipped')).toEqual([
            { value: 'Out for Delivery', label: 'Mark out for delivery' },
            { value: 'Delivered', label: 'Mark as delivered' },
        ]);
        expect(nextStatusOptions('Out for Delivery')).toEqual([
            { value: 'Delivered', label: 'Mark as delivered' },
        ]);
    });

    it('treats an approved-but-unshipped order as having no parcel yet', () => {
        const approved = dataset.orders.find((order) => order.status === 'Approved');
        const shipped = dataset.orders.find((order) => order.status === 'Shipped');
        if (!approved || !shipped) throw new Error('Expected approved and shipped fixture orders');

        expect(approved.courier).toBeUndefined();
        expect(hasShipment(approved)).toBe(false);
        expect(approvalStateOf(approved)).toBe('approved');

        expect(hasShipment(shipped)).toBe(true);
    });
});
