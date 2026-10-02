import { memo, type ComponentProps } from 'react';
import { SearchX } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { CatalogProduct } from '../data/catalogData';
import ProductCard from './ProductCard';

const SKELETON_COUNT = 10;

const ThemedSkeleton = memo(function ThemedSkeleton({
    className,
    style,
    ...props
}: ComponentProps<'div'>) {
    return (
        <Skeleton
            className={cn('rounded-md', className)}
            style={{ backgroundColor: Theme.colors.surfaceAlt, ...style }}
            {...props}
        />
    );
});

const ProductCardSkeleton = memo(function ProductCardSkeleton() {
    return (
        <div
            aria-hidden="true"
            style={{
                backgroundColor: Theme.colors.surface,
                borderRadius: Theme.BorderRadius.xl,
                border: `1px solid ${Theme.colors.border}`,
                boxShadow: Theme.Shadow.sm,
            }}
            className="overflow-hidden"
        >
            <ThemedSkeleton className="h-40 w-full shrink-0 rounded-none sm:h-52 lg:h-52 xl:h-56" />
            <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                <ThemedSkeleton className="h-2.5 w-1/3" />
                <ThemedSkeleton className="mt-2 h-4 w-11/12" />
                <ThemedSkeleton className="mt-1.5 h-4 w-2/3" />
                <ThemedSkeleton className="mt-2 h-3.5 w-12" />
                <div className="mt-auto flex items-baseline gap-x-1.5 border-t pt-2 sm:gap-x-2 sm:pt-3" style={{ borderColor: Theme.colors.border }}>
                    <ThemedSkeleton className="h-5 w-16 sm:h-6 sm:w-24" />
                    <ThemedSkeleton className="h-3.5 w-10 sm:h-4 sm:w-14" />
                </div>
                <ThemedSkeleton className="mt-2 h-2.5 w-24" />
            </div>
        </div>
    );
});

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
                    <span className="sr-only">Loading products...</span>
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
