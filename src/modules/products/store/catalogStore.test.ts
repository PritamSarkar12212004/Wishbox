import { beforeEach, describe, expect, it } from 'vitest';
import { CATALOG } from '../data/catalogData';
import { catalogStore, type NewProductInput } from './catalogStore';

const baseInput: NewProductInput = {
    name: 'Handmade Paper Lantern',
    brand: 'PaperCraft',
    category: 'paper-craft',
    rating: 4.5,
    reviewCount: 12,
    price: 499,
    mrp: 699,
    available: true,
    stock: 20,
    image: 'https://example.com/lantern.jpg',
    hoverImage: 'https://example.com/lantern-2.jpg',
    description: 'Test product',
    highlights: ['Handmade'],
};

beforeEach(() => {
    catalogStore.reset();
});

describe('catalog store', () => {
    it('seeds from the static catalogue and resets back to it', () => {
        expect(catalogStore.getSnapshot()).toHaveLength(CATALOG.length);

        catalogStore.add(baseInput);
        expect(catalogStore.getSnapshot()).toHaveLength(CATALOG.length + 1);

        catalogStore.reset();
        expect(catalogStore.getSnapshot()).toHaveLength(CATALOG.length);
    });

    it('slugifies ids and continues the WB SKU sequence', () => {
        const created = catalogStore.add(baseInput);
        expect(created.id).toBe('handmade-paper-lantern');
        expect(created.sku).toBe('WB-PAPER-014'); // seed catalogue ends at 013

        const duplicate = catalogStore.add(baseInput);
        expect(duplicate.id).toBe('handmade-paper-lantern-2');
        expect(duplicate.sku).toBe('WB-PAPER-015');
    });

    it('updates fields without touching id or sku', () => {
        const created = catalogStore.add(baseInput);
        catalogStore.update(created.id, { name: 'Renamed Lantern', price: 599, stock: 3 });

        const updated = catalogStore.getSnapshot().find((product) => product.id === created.id);
        expect(updated?.name).toBe('Renamed Lantern');
        expect(updated?.price).toBe(599);
        expect(updated?.stock).toBe(3);
        expect(updated?.sku).toBe(created.sku);
    });

    it('unpublishes and republishes without touching stock', () => {
        const created = catalogStore.add(baseInput);

        catalogStore.toggleHidden(created.id);
        const hidden = catalogStore.getSnapshot().find((p) => p.id === created.id);
        expect(hidden?.hidden).toBe(true);
        expect(hidden?.available).toBe(true);

        catalogStore.toggleHidden(created.id);
        expect(catalogStore.getSnapshot().find((p) => p.id === created.id)?.hidden).toBe(false);
    });

    it('toggles availability and removes products', () => {
        const created = catalogStore.add(baseInput);

        catalogStore.toggleAvailability(created.id);
        expect(catalogStore.getSnapshot().find((p) => p.id === created.id)?.available).toBe(false);

        catalogStore.toggleAvailability(created.id);
        expect(catalogStore.getSnapshot().find((p) => p.id === created.id)?.available).toBe(true);

        catalogStore.remove(created.id);
        expect(catalogStore.getSnapshot().some((p) => p.id === created.id)).toBe(false);
    });
});
