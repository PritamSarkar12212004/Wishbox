import { describe, expect, it } from 'vitest';
import type { CatalogProduct } from '../api/productApi';
import { ALL_CATEGORIES, countByCategory, filterAndSort, matchesQuery } from './useCatalogFilters';

/**
 * These fixtures describe the shape the API serves, not a shipped catalogue -
 * there is no shipped catalogue any more. Keeping them local means the filter
 * tests exercise the functions rather than the seed data of the day.
 */
const product = (overrides: Partial<CatalogProduct> & Pick<CatalogProduct, 'id' | 'name'>): CatalogProduct => ({
    sku: `WB-${overrides.id.toUpperCase()}`,
    brand: 'PaperCraft',
    category: 'paper-craft',
    rating: 4.5,
    reviewCount: 100,
    price: 249,
    mrp: 399,
    available: true,
    hidden: false,
    stock: 10,
    image: 'https://example.test/main.jpg',
    hoverImage: 'https://example.test/hover.jpg',
    description: 'Hand-pressed decorative paper with a smooth matte finish.',
    highlights: ['Premium handmade quality paper'],
    ...overrides,
});

const origami = product({
    id: 'origami-paper-200-sheets',
    name: 'Origami Paper – 200 Multi Colour Sheets',
    description: 'Two hundred crisp square sheets.',
    highlights: ['200 sheets, 20 colours'],
    rating: 4.9,
    price: 299,
    mrp: 499,
});
const rose = product({
    id: 'rose-gold-shimmer-paper',
    name: 'Rose Gold Shimmer Paper Sheets',
    description: 'Fine shimmer that does not shed glitter.',
    price: 259,
});
const foil = product({
    id: 'gold-foil-wrapping-roll',
    name: 'Gold Foil Wrapping Paper Roll',
    description: 'Matte kraft paper with a soft gold foil pattern.',
    highlights: ['FSC-certified paper'],
    price: 149,
});
const clock = product({
    id: 'wooden-wall-clock',
    name: 'Elegant Wooden Wall Clock',
    category: 'clocks',
    brand: 'Timeless',
    price: 2999,
    mrp: 4500,
});
const hidden = product({
    id: 'unpublished-test',
    name: 'Unpublished Test Product',
    hidden: true,
    price: 99,
});

const CATALOG: CatalogProduct[] = [origami, rose, foil, clock];

describe('matchesQuery', () => {
    it('matches name, brand, category and highlights, case-insensitively', () => {
        expect(matchesQuery(origami, 'ORIGAMI')).toBe(true);
        expect(matchesQuery(origami, 'papercraft')).toBe(true);
        expect(matchesQuery(origami, '  paper-craft  ')).toBe(true);
        expect(matchesQuery(origami, '200 sheets')).toBe(true);
        expect(matchesQuery(origami, 'zzz')).toBe(false);
        expect(matchesQuery(origami, '   ')).toBe(true);
    });

    it('reaches descriptions and highlights', () => {
        expect(matchesQuery(rose, 'glitter')).toBe(true);
        expect(matchesQuery(foil, 'FSC')).toBe(true);
    });
});

describe('filterAndSort', () => {
    it('filters by category', () => {
        const list = filterAndSort(CATALOG, 'paper-craft', 'featured');
        expect(list.length).toBe(3);
        expect(list.every((p) => p.category === 'paper-craft')).toBe(true);
        expect(filterAndSort(CATALOG, ALL_CATEGORIES, 'featured')).toHaveLength(CATALOG.length);
    });

    it('sorts by price and rating without mutating the input', () => {
        const ascending = filterAndSort(CATALOG, ALL_CATEGORIES, 'price-asc');
        expect(ascending.map((p) => p.price)).toEqual(
            CATALOG.map((p) => p.price).sort((a, b) => a - b)
        );

        const descending = filterAndSort(CATALOG, ALL_CATEGORIES, 'price-desc');
        expect(descending.map((p) => p.price)).toEqual(
            CATALOG.map((p) => p.price).sort((a, b) => b - a)
        );

        const rated = filterAndSort(CATALOG, ALL_CATEGORIES, 'rating');
        expect(rated.map((p) => p.rating)).toEqual(CATALOG.map((p) => p.rating).sort((a, b) => b - a));
    });

    it('excludes unpublished products from listings and counts', () => {
        const products = [hidden, origami];

        expect(filterAndSort(products, ALL_CATEGORIES, 'featured').map((p) => p.id)).toEqual([
            origami.id,
        ]);
        expect(countByCategory(ALL_CATEGORIES, '', products)).toBe(1);
    });

    it('combines category and query', () => {
        const wooden = filterAndSort(CATALOG, 'clocks', 'featured', 'wooden');
        expect(wooden.map((p) => p.id)).toEqual(['wooden-wall-clock']);

        expect(filterAndSort(CATALOG, 'clocks', 'featured', 'origami')).toHaveLength(0);
    });
});

describe('countByCategory', () => {
    it('counts the products passed in and respects the query', () => {
        expect(countByCategory(ALL_CATEGORIES, '', CATALOG)).toBe(CATALOG.length);
        expect(countByCategory('clocks', '', CATALOG)).toBe(1);
        expect(countByCategory('paper-craft', 'origami', CATALOG)).toBe(1);
        expect(countByCategory(ALL_CATEGORIES, 'origami', CATALOG)).toBe(1);
        expect(countByCategory(ALL_CATEGORIES, '', [])).toBe(0);
    });
});
