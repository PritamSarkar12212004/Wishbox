import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOG_BY_ID, type CatalogProduct } from '@/modules/products/data/catalogData';
import { ORDER_HISTORY, orderSubtotal, orderTotal, type OrderItem } from '../data/historyData';
import { ordersStore } from './store';

function product(id: string): CatalogProduct {
    const found = CATALOG_BY_ID[id];
    if (!found) throw new Error(`Missing catalog fixture: ${id}`);
    return found;
}

const toItem = (p: CatalogProduct, qty = 1): OrderItem => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    image: p.image,
    qty,
    price: p.price,
    mrp: p.mrp,
    rating: p.rating,
});

beforeEach(() => {
    ordersStore.reset();
});

describe('orders store', () => {
    it('seeds the history with the demo fixtures', () => {
        expect(ordersStore.getSnapshot()).toHaveLength(ORDER_HISTORY.length);
        expect(ordersStore.getSnapshot()[0]?.id).toBe(ORDER_HISTORY[0]?.id);
    });

    it('puts new orders at the top with the next sequential id', () => {
        const first = ordersStore.placeOrder({
            items: [toItem(product('matte-pastel-paper-pack'), 2)],
        });
        const second = ordersStore.placeOrder({
            items: [toItem(product('wooden-wall-clock'))],
        });

        expect(first.id).toBe('#WB-1129');
        expect(second.id).toBe('#WB-1130');
        expect(
            ordersStore
                .getSnapshot()
                .map((order) => order.id)
                .slice(0, 2)
        ).toEqual(['#WB-1130', '#WB-1129']);
        expect(ordersStore.getSnapshot()).toHaveLength(ORDER_HISTORY.length + 2);
    });

    it('records a coupon discount and nets it out of the order total', () => {
        const items = [toItem(product('matte-pastel-paper-pack'), 2)];
        const order = ordersStore.placeOrder({ items, discount: 39 });

        expect(order.discount).toBe(39);
        expect(orderSubtotal(order)).toBe(398); // 2 × ₹199
        expect(orderTotal(order)).toBe(359);
        expect(order.status).toBe('Processing');
    });

    it('omits zero-value discounts', () => {
        const order = ordersStore.placeOrder({
            items: [toItem(product('matte-pastel-paper-pack'))],
            discount: 0,
        });
        expect(order.discount).toBeUndefined();
    });

    it('keeps cancelled fixture orders at a zero total', () => {
        const cancelled = ordersStore.getSnapshot().find((order) => order.status === 'Cancelled');
        if (!cancelled) throw new Error('Expected a cancelled fixture order');
        expect(orderTotal(cancelled)).toBe(0);
    });
});
