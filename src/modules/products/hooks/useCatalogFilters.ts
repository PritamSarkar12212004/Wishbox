import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATALOG, type CatalogProduct } from '../data/catalogData';
import { useCatalog } from '../store/catalogStore';

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export const ALL_CATEGORIES = 'all';

/**
 * Case-insensitive match against every field a shopper would reasonably type:
 * name, brand, description, category and highlights.
 */
export function matchesQuery(product: CatalogProduct, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [product.name, product.brand, product.description, product.category, ...product.highlights]
        .join(' ')
        .toLowerCase()
        .includes(q);
}

export function filterAndSort(
    products: CatalogProduct[],
    category: string,
    sort: SortKey,
    query = ''
): CatalogProduct[] {
    const list = products.filter(
        (product) =>
            !product.hidden &&
            (category === ALL_CATEGORIES || product.category === category) &&
            matchesQuery(product, query)
    );

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

/** Counts respect the active search so the filter chips never overstate results. */
export function countByCategory(
    category: string,
    query = '',
    products: CatalogProduct[] = CATALOG
): number {
    return products.filter(
        (product) =>
            !product.hidden &&
            (category === ALL_CATEGORIES || product.category === category) &&
            matchesQuery(product, query)
    ).length;
}

/**
 * Category, sort and search query read straight from the URL so the header
 * search, the filter tabs and shared links all stay in sync, and results
 * survive refresh.
 */
export function useCatalogFilters() {
    const [searchParams, setSearchParams] = useSearchParams();
    // The live, admin-editable catalogue rather than the static seed.
    const products = useCatalog();

    const activeCategory = searchParams.get('category') ?? ALL_CATEGORIES;
    const query = searchParams.get('q') ?? '';
    // Unknown/malformed sort values fall back to the default ordering.
    const sortParam = searchParams.get('sort');
    const sort: SortKey =
        sortParam === 'price-asc' || sortParam === 'price-desc' || sortParam === 'rating'
            ? sortParam
            : 'featured';

    const visibleProducts = useMemo(
        () => filterAndSort(products, activeCategory, sort, query),
        [products, activeCategory, sort, query]
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

    function setQuery(value: string) {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                const trimmed = value.trim();
                if (!trimmed) next.delete('q');
                else next.set('q', trimmed);
                return next;
            },
            { replace: true }
        );
    }

    /** Empty-state escape hatch: drop the category and search, keep the sort. */
    function clearFilters() {
        setSearchParams(
            (current) => {
                const next = new URLSearchParams(current);
                next.delete('category');
                next.delete('q');
                return next;
            },
            { replace: true }
        );
    }

    return {
        activeCategory,
        sort,
        query,
        visibleProducts,
        products,
        setCategory,
        setSort,
        setQuery,
        clearFilters,
    };
}
