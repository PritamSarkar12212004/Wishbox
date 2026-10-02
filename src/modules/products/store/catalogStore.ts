/**
 * Runtime catalogue store.
 *
 * Seeded from the static CATALOG and then owned by the admin panel: creating,
 * editing, hiding or deleting a product writes here and persists to
 * localStorage. The storefront — shop listing, search, PDP and home rails —
 * reads this same store, so admin changes go live immediately with no rebuild.
 *
 * The static CATALOG remains the seed (and the fixture source for order
 * history). Bumping SEED_VERSION deliberately resets admin edits when the
 * shipped catalogue changes shape.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { CATALOG, type CatalogProduct, type ProductCategoryId } from '../data/catalogData';

const CATALOG_KEY = 'wishbox.catalog.v1';
const SEED_VERSION = 1;

type CatalogState = {
    version: number;
    products: CatalogProduct[];
};

/** Everything needed to create a product; id and SKU are assigned here. */
export type NewProductInput = Omit<CatalogProduct, 'id' | 'sku'>;

export type CatalogPatch = Partial<Omit<CatalogProduct, 'id'>>;

const CATEGORY_SKU_PREFIX: Record<ProductCategoryId, string> = {
    'paper-craft': 'PAPER',
    'home-decor': 'DECOR',
    lighting: 'LIGHT',
    clocks: 'CLOCK',
};

/** Slugifies a product name into a URL-safe id, suffixing until it is unique. */
function uniqueId(name: string, products: CatalogProduct[]): string {
    const base =
        name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'product';
    if (!products.some((product) => product.id === base)) return base;

    let suffix = 2;
    while (products.some((product) => product.id === `${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

/** Continues the WB-…-### sequence the seed catalogue uses. */
function nextSku(category: ProductCategoryId, products: CatalogProduct[]): string {
    const highest = products.reduce((max, product) => {
        const match = /-(\d+)$/.exec(product.sku);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `WB-${CATEGORY_SKU_PREFIX[category]}-${String(highest + 1).padStart(3, '0')}`;
}

function initialCatalogState(): CatalogState {
    const stored = readStoredJSON<CatalogState | null>(CATALOG_KEY, null);
    if (stored && stored.version === SEED_VERSION && Array.isArray(stored.products)) {
        return stored;
    }
    return { version: SEED_VERSION, products: CATALOG };
}

const catalog = createStore<CatalogState>(initialCatalogState(), CATALOG_KEY);

export const catalogStore = {
    subscribe: catalog.subscribe,
    getSnapshot: () => catalog.get().products,

    add(input: NewProductInput): CatalogProduct {
        const products = catalog.get().products;
        const product: CatalogProduct = {
            ...input,
            id: uniqueId(input.name, products),
            sku: nextSku(input.category, products),
        };
        catalog.set((state) => ({ ...state, products: [product, ...state.products] }));
        return product;
    },

    update(id: string, patch: CatalogPatch): void {
        catalog.set((state) => ({
            ...state,
            products: state.products.map((product) =>
                product.id === id ? { ...product, ...patch, id } : product
            ),
        }));
    },

    remove(id: string): void {
        catalog.set((state) => ({
            ...state,
            products: state.products.filter((product) => product.id !== id),
        }));
    },

    toggleAvailability(id: string): void {
        catalog.set((state) => ({
            ...state,
            products: state.products.map((product) =>
                product.id === id ? { ...product, available: !product.available } : product
            ),
        }));
    },

    /** Unpublish or republish a product without touching its stock state. */
    toggleHidden(id: string): void {
        catalog.set((state) => ({
            ...state,
            products: state.products.map((product) =>
                product.id === id ? { ...product, hidden: !product.hidden } : product
            ),
        }));
    },

    /** Restores the shipped catalogue, undoing every admin edit. */
    reset(): void {
        catalog.set(() => ({ version: SEED_VERSION, products: CATALOG }));
    },
};

export function useCatalog(): CatalogProduct[] {
    return useSyncExternalStore(
        catalogStore.subscribe,
        catalogStore.getSnapshot,
        catalogStore.getSnapshot
    );
}

/** Single product lookup against the live catalogue. */
export function useCatalogProduct(id?: string): CatalogProduct | undefined {
    const products = useCatalog();
    return useMemo(
        () => (id ? products.find((product) => product.id === id) : undefined),
        [products, id]
    );
}
