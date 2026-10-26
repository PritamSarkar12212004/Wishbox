import { SearchX } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { ProductCardSkeleton } from '@/components/ui/skeletons';
import type { CatalogProduct } from '../api/productApi';
import ProductCard from './ProductCard';

const SKELETON_COUNT = 10;

type ProductGridProps = {
    products: CatalogProduct[];
    loading?: boolean;
    /** Copy shown when the active filter has no results. */
    emptyMessage?: string;
    onClearFilters?: () => void;
};

export default function ProductGrid({
    products,
    loading = false,
    emptyMessage = 'No products in this category',
    onClearFilters,
}: ProductGridProps) {
    return (
        <div
            className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5"
            aria-busy={loading}
        >
            {loading ? (
                <>
                    <span className="sr-only" role="status" aria-live="polite">
                        Loading products…
                    </span>
                    {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                        <ProductCardSkeleton key={`skeleton-${index}`} />
                    ))}
                </>
            ) : products.length === 0 ? (
                <div
                    className="col-span-full flex flex-col items-center justify-center rounded-2xl border px-6 py-14 text-center"
                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
                >
                    <span
                        className="grid h-12 w-12 place-items-center rounded-full"
                        style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}
                    >
                        <SearchX size={20} />
                    </span>
                    <p className="mt-3 text-sm font-semibold" style={{ color: Theme.colors.text }}>
                        {emptyMessage}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                        Try another category or clear the filter.
                    </p>
                    {onClearFilters && (
                        <button
                            type="button"
                            onClick={onClearFilters}
                            className="mt-4 rounded-full px-4 py-2 text-xs font-semibold transition-transform hover:-translate-y-0.5"
                            style={{ backgroundColor: Theme.colors.text, color: Theme.colors.background }}
                        >
                            Clear filter
                        </button>
                    )}
                </div>
            ) : (
                products.map((product) => <ProductCard key={product.id} product={product} />)
            )}
        </div>
    );
}
