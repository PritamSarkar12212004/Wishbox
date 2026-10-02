/** Shared money/number formatting for the storefront (en-IN). */

export function inr(value: number): string {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function compactCount(value: number): string {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return value.toLocaleString('en-IN');
}

/** Indicative monthly EMI (12 months) — a merchandising hint, not a quote. */
export const emiFor = (price: number) => Math.ceil(price / 12);
