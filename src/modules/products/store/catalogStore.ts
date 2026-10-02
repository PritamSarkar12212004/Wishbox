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
import { CATALOG, type CatalogProduct } from '../data/catalogData';
import { builtInCategoryOptions, formatCategory, slugifyCategory } from '../lib/category';

const CATALOG_KEY = 'wishbox.catalog.v1';
const SEED_VERSION = 2;

/** A category the admin added from the product editor. */
export type CatalogCategory = { id: string; label: string };

type CatalogState = {
    version: number;
    products: CatalogProduct[];
    /** Admin-added categories, on top of the shipped ones. */
    categories: CatalogCategory[];
};

/** Everything needed to create a product; id and SKU are assigned here. */
export type NewProductInput = Omit<CatalogProduct, 'id' | 'sku'>;

export type CatalogPatch = Partial<Omit<CatalogProduct, 'id'>>;

const CATEGORY_SKU_PREFIX: Record<string, string> = {
    'paper-craft': 'PAPER',
    'home-decor': 'DECOR',
    lighting: 'LIGHT',
    clocks: 'CLOCK',
};

/** Admins can invent categories; their SKUs fall back to a generic prefix. */
const DEFAULT_SKU_PREFIX = 'GEN';

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
function nextSku(category: string, products: CatalogProduct[]): string {
    const highest = products.reduce((max, product) => {
        const match = /-(\d+)$/.exec(product.sku);
        return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    const prefix = CATEGORY_SKU_PREFIX[category] ?? DEFAULT_SKU_PREFIX;
    return `WB-${prefix}-${String(highest + 1).padStart(3, '0')}`;
}

function initialCatalogState(): CatalogState {
    const stored = readStoredJSON<CatalogState | null>(CATALOG_KEY, null);
    if (
        stored &&
        stored.version === SEED_VERSION &&
        Array.isArray(stored.products) &&
        Array.isArray(stored.categories)
    ) {
        return stored;
    }
    return { version: SEED_VERSION, products: CATALOG, categories: [] };
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

    /** Adds an admin-authored category and returns it, ready to be selected. */
    addCategory(label: string): CatalogCategory {
        const state = catalog.get();
        const taken = [
            ...builtInCategoryOptions().map((option) => option.value),
            ...state.categories.map((category) => category.id),
        ];
        const category = { id: slugifyCategory(label, taken), label: label.trim() };
        catalog.set((current) => ({ ...current, categories: [...current.categories, category] }));
        return category;
    },

    /** Restores the shipped catalogue, undoing every admin edit. */
    reset(): void {
        catalog.set(() => ({ version: SEED_VERSION, products: CATALOG, categories: [] }));
    },
};

export function useCatalog(): CatalogProduct[] {
    return useSyncExternalStore(
        catalogStore.subscribe,
        catalogStore.getSnapshot,
        catalogStore.getSnapshot
    );
}

/**
 * Every category a product can belong to: the shipped ones, the admin's own,
 * and any legacy category still referenced by a product.
 */
export function useCatalogCategories(): CatalogCategory[] {
    const products = useCatalog();
    // Reference-stable while only products change, so this never loops.
    const added = useSyncExternalStore(
        catalogStore.subscribe,
        () => catalog.get().categories,
        () => catalog.get().categories
    );

    return useMemo(() => {
        const options = new Map<string, string>();
        builtInCategoryOptions().forEach((option) => options.set(option.value, option.label));
        added.forEach((category) => options.set(category.id, category.label));

        // Any slug already used by a product without a registered label.
        products.forEach((product) => {
            if (!options.has(product.category)) options.set(product.category, formatCategory(product.category));
        });

        return [...options.entries()].map(([id, label]) => ({ id, label }));
    }, [products, added]);
}

/** Single product lookup against the live catalogue. */
export function useCatalogProduct(id?: string): CatalogProduct | undefined {
    const products = useCatalog();
    return useMemo(
        () => (id ? products.find((product) => product.id === id) : undefined),
        [products, id]
    );
}
