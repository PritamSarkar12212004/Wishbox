import { beforeEach, describe, expect, it } from 'vitest';
import { ordersStore } from '@/modules/history/store/store';
import type { AdminOrder } from '../data/adminData';
import { isLiveOrder, liveOrderOverride } from './adminOrdersStore';

/**
 * The only admin data still kept in the browser is the admin's own actions on
 * orders placed here — those never reach the API. Two things have to hold: the
 * shopper's History page moves with them (via the storefront's store), and the
 * audit fields the server would have stamped are stamped locally instead.
 */

/** An order the storefront fixtures ship with. */
const LIVE_ID = '#WB-1128';

const statusOf = (id: string) => ordersStore.getSnapshot().find((order) => order.id === id)?.status;

beforeEach(() => {
    ordersStore.reset();
});

describe('live-order admin changes', () => {
    it('knows which ids belong to this browser', () => {
        expect(isLiveOrder(LIVE_ID)).toBe(true);
        expect(isLiveOrder('#ORD2422')).toBe(false);
    });

    it('records an approval and who made it', () => {
        liveOrderOverride.apply(LIVE_ID, { status: 'Approved' }, 'Pritam Sarkar');

        const patch = liveOrderOverride.get(LIVE_ID);
        expect(patch?.status).toBe('Approved');
        expect(patch?.approvedBy).toBe('Pritam Sarkar');
        expect(typeof patch?.approvedAt).toBe('number');
    });

    it('moves the customer-facing order too, so the shopper sees the change', () => {
        liveOrderOverride.apply(LIVE_ID, { status: 'Shipped' }, 'Pritam Sarkar');

        expect(statusOf(LIVE_ID)).toBe('Shipped');
    });

    it('folds Out for Delivery onto the storefront’s Shipped stage', () => {
        liveOrderOverride.apply(LIVE_ID, { status: 'Out for Delivery' }, 'Pritam Sarkar');

        expect(statusOf(LIVE_ID)).toBe('Shipped');
    });

    it('records the courier and AWB alongside the status', () => {
        liveOrderOverride.apply(
            LIVE_ID,
            { status: 'Shipped', courier: 'Blue Dart', trackingId: 'BD12345678' },
            'Pritam Sarkar'
        );

        expect(liveOrderOverride.get(LIVE_ID)).toMatchObject({
            courier: 'Blue Dart',
            trackingId: 'BD12345678',
        });
    });

    it('opens a refund when the order is cancelled, and closes it with the screenshot', () => {
        liveOrderOverride.apply(
            LIVE_ID,
            { status: 'Cancelled', cancellationReason: 'Duplicate order' },
            'Pritam Sarkar'
        );
        expect(liveOrderOverride.get(LIVE_ID)).toMatchObject({
            status: 'Cancelled',
            cancellationReason: 'Duplicate order',
            refundStatus: 'Pending',
        });

        liveOrderOverride.apply(LIVE_ID, { refundScreenshot: 'data:image/png;base64,AAAA' }, 'Pritam Sarkar');
        expect(liveOrderOverride.get(LIVE_ID)).toMatchObject({
            refundStatus: 'Completed',
            refundScreenshot: 'data:image/png;base64,AAAA',
        });
        expect(typeof liveOrderOverride.get(LIVE_ID)?.refundedAt).toBe('number');
    });

    it('leaves the pipeline status to the storefront store when resolving', () => {
        // A recorded status must never win over the store, or the customer's
        // History page and the admin sheet could disagree.
        liveOrderOverride.apply(LIVE_ID, { status: 'Shipped' }, 'Pritam Sarkar');
        ordersStore.setStatus(LIVE_ID, 'Delivered');

        const seeded = { id: LIVE_ID, status: 'Delivered' } as unknown as AdminOrder;
        expect(liveOrderOverride.resolve(seeded).status).toBe('Delivered');
    });
});
