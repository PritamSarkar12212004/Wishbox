import { X } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';
import productConst from '../consts/productConst';
import { useCatalogFilters } from '../hooks/useCatalogFilters';

function ProductPage() {
    const { activeCategory, sort, query, visibleProducts, setCategory, setSort, setQuery, clearFilters } =
        useCatalogFilters();

    const activeLabel =
        productConst.categories.find((category) => category.value === activeCategory)?.label ??
        'All Categories';

    return (
        <div
            className="min-h-full px-4 py-8 sm:py-10 md:px-6 lg:px-8"
            style={{
                backgroundColor: Theme.colors.background,
                // Exposed so class-based hover states can reach the theme accent.
                ['--card-accent' as string]: Theme.colors.accentDark,
            } as React.CSSProperties}
        >
            <div className="mx-auto max-w-[1500px]">
                <header className="mb-6">
                    <p
                        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: Theme.colors.primaryDark }}
                    >
                        {query ? 'Search' : 'Shop'}
                    </p>
                    <h1
                        className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                    >
                        {query ? 'Search Results' : 'All Products'}
                    </h1>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                        <span>
                            {query ? `“${query}” · ` : `${activeLabel} · `}
                            {visibleProducts.length}{' '}
                            {visibleProducts.length === 1 ? 'product' : 'products'}
                        </span>
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors hover:opacity-80"
                                style={{
                                    borderColor: Theme.colors.border,
                                    color: Theme.colors.text,
                                    backgroundColor: Theme.colors.surface,
                                }}
                            >
                                <X size={11} />
                                Clear search
                            </button>
                        )}
                    </p>
                </header>

                <ProductFilters
                    activeCategory={activeCategory}
                    sort={sort}
                    query={query}
                    onCategoryChange={setCategory}
                    onSortChange={setSort}
                />

                <ProductGrid
                    products={visibleProducts}
                    onClearFilters={clearFilters}
                    emptyMessage={
                        query ? `No products match “${query}”` : `No products in ${activeLabel}`
                    }
                />
            </div>
        </div>
    );
}

export default ProductPage;