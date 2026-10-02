import { describe, expect, it } from 'vitest';
import { CATALOG, CATALOG_BY_ID } from '../data/catalogData';
import { ALL_CATEGORIES, countByCategory, filterAndSort, matchesQuery } from './useCatalogFilters';

describe('matchesQuery', () => {
    it('matches name, brand, category and highlights, case-insensitively', () => {
        const origami = CATALOG_BY_ID['origami-paper-200-sheets'];
        if (!origami) throw new Error('Missing catalog fixture');

        expect(matchesQuery(origami, 'ORIGAMI')).toBe(true);
        expect(matchesQuery(origami, 'papercraft')).toBe(true);
        expect(matchesQuery(origami, '  paper-craft  ')).toBe(true);
        expect(matchesQuery(origami, '200 sheets')).toBe(true);
        expect(matchesQuery(origami, 'zzz')).toBe(false);
        expect(matchesQuery(origami, '   ')).toBe(true);
    });

    it('reaches descriptions and highlights', () => {
        const rose = CATALOG_BY_ID['rose-gold-shimmer-paper'];
        const foil = CATALOG_BY_ID['gold-foil-wrapping-roll'];
        if (!rose || !foil) throw new Error('Missing catalog fixture');

        expect(matchesQuery(rose, 'glitter')).toBe(true);
        expect(matchesQuery(foil, 'FSC')).toBe(true);
    });
});

describe('filterAndSort', () => {
    it('filters by category', () => {
        const list = filterAndSort(CATALOG, 'paper-craft', 'featured');
        expect(list.length).toBeGreaterThan(0);
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
        const unpublished = { ...CATALOG[0], id: 'unpublished-test', hidden: true };
        const products = [unpublished, CATALOG[1]];

        expect(filterAndSort(products, ALL_CATEGORIES, 'featured').map((p) => p.id)).toEqual([
            CATALOG[1].id,
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
    it('counts the catalogue and respects the query', () => {
        expect(countByCategory(ALL_CATEGORIES)).toBe(CATALOG.length);
        expect(countByCategory('clocks')).toBe(CATALOG.filter((p) => p.category === 'clocks').length);
        expect(countByCategory('paper-craft', 'origami')).toBe(1);
        expect(countByCategory(ALL_CATEGORIES, 'origami')).toBe(1);
        // Counts run against the live catalogue passed in, not just the seed.
        expect(countByCategory(ALL_CATEGORIES, '', [])).toBe(0);
    });
});
