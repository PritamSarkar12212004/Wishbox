/**
 * Category labels.
 *
 * Categories used to be a closed set. The admin can now add their own, so a
 * product's category is a free-form slug: built-in ids resolve to the curated
 * storefront labels, anything else is humanised from its slug.
 */

import productConst from '../consts/productConst';

const BUILT_IN = productConst.categories.filter((category) => category.value !== 'all');

/** 'gift-wrapping' → 'Gift Wrapping'. */
export function titleizeCategory(value: string): string {
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function formatCategory(value: string): string {
    return BUILT_IN.find((category) => category.value === value)?.label ?? titleizeCategory(value);
}

/** URL-safe id for a category the admin typed in, unique against `taken`. */
export function slugifyCategory(label: string, taken: string[]): string {
    const base =
        label
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'category';
    if (!taken.includes(base)) return base;

    let suffix = 2;
    while (taken.includes(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

/** Built-in categories, ready for a select. */
export function builtInCategoryOptions(): Array<{ value: string; label: string }> {
    return BUILT_IN.map((category) => ({ value: category.value, label: category.label }));
}
