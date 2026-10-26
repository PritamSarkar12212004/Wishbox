import type { CatalogProduct, ProductBulkTier } from '../api/productApi';

/** Percentage saved against MRP, derived so it can never disagree with the prices. */
export function discountPercent(product: Pick<CatalogProduct, 'price' | 'mrp'>): number {
    if (product.mrp <= product.price) return 0;
    return Math.round((1 - product.price / product.mrp) * 100);
}

/** The tier a quantity falls into, or `null` when the product has no breaks. */
export function findBulkTier(
    tiers: ProductBulkTier[] | undefined,
    qty: number
): ProductBulkTier | null {
    if (!tiers || tiers.length === 0) return null;
    return (
        [...tiers]
            .filter((tier) => qty >= tier.minQty && (tier.maxQty === null || qty <= tier.maxQty))
            .sort((a, b) => b.minQty - a.minQty)[0] ?? null
    );
}

/**
 * What one unit costs at a quantity.
 *
 * The same rule the order API applies, so the cart preview and the amount the
 * server charges cannot disagree - a tier can only ever lower the price.
 */
export function unitPriceFor(
    product: Pick<CatalogProduct, 'price' | 'bulkTiers'>,
    qty: number
): number {
    const tier = findBulkTier(product.bulkTiers, qty);
    return Math.min(tier?.unitPrice ?? product.price, product.price);
}
