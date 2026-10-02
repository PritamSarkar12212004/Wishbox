import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATALOG, type CatalogProduct } from '../data/catalogData';

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export const ALL_CATEGORIES = 'all';

export function filterAndSort(
    products: CatalogProduct[],
    category: string,
    sort: SortKey
): CatalogProduct[] {
    const list =
        category === ALL_CATEGORIES
            ? products
            : products.filter((product) => product.category === category);

    switch (sort) {
        case 'price-asc':
            return [...list].sort((a, b) => a.price - b.price);
        case 'price-desc':
            return [...list].sort((a, b) => b.price - a.price);
        case 'rating':
            return [...list].sort((a, b) => b.rating - a.rating);
        default:
            return list;
    }
}

export function countByCategory(category: string): number {
    return category === ALL_CATEGORIES
        ? CATALOG.length
        : CATALOG.filter((product) => product.category === category).length;
}

/**
 * Category + sort read straight from the URL so the header selector, the
 * filter tabs and shared links all stay in sync, and filters survive refresh.
 */
export function useCatalogFilters() {
    const [searchParams, setSearchParams] = useSearchParams();

    const activeCategory = searchParams.get('category') ?? ALL_CATEGORIES;
    // Unknown/malformed sort values fall back to the default ordering.
    const sortParam = searchParams.get('sort');
    const sort: SortKey =
        sortParam === 'price-asc' || sortParam === 'price-desc' || sortParam === 'rating'
            ? sortParam
            : 'featured';

    const visibleProducts = useMemo(
        () => filterAndSort(CATALOG, activeCategory, sort),
        [activeCategory, sort]
    );

    function setCategory(value: string) {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                if (value === ALL_CATEGORIES) next.delete('category');
                else next.set('category', value);
                return next;
            },
            { replace: true }
        );
    }

    function setSort(value: SortKey) {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                if (value === 'featured') next.delete('sort');
                else next.set('sort', value);
                return next;
            },
            { replace: true }
        );
    }

    return { activeCategory, sort, visibleProducts, setCategory, setSort };
}
