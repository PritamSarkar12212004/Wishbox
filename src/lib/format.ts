/** Shared money/number formatting for the storefront (en-IN). */

export function inr(value: number): string {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** Compact rupee label for chart axes and KPI tiles (₹1.2L, ₹30K). */
export function inrCompact(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
    if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
    if (abs >= 1_000) return `₹${Math.round(value / 1_000)}K`;
    return `₹${Math.round(value)}`;
}

export function compactCount(value: number): string {
    if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return value.toLocaleString('en-IN');
}

/** Indicative monthly EMI (12 months) — a merchandising hint, not a quote. */
export const emiFor = (price: number) => Math.ceil(price / 12);
