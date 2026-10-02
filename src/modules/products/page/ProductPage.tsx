import Theme from '@/assets/Theme/Theme';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';
import productConst from '../consts/productConst';
import { useCatalogFilters } from '../hooks/useCatalogFilters';

function ProductPage() {
    const { activeCategory, sort, visibleProducts, setCategory, setSort } = useCatalogFilters();

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
                        Shop
                    </p>
                    <h1
                        className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                    >
                        All Products
                    </h1>
                    <p className="mt-1.5 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                        {activeLabel} · {visibleProducts.length}{' '}
                        {visibleProducts.length === 1 ? 'product' : 'products'}
                    </p>
                </header>

                <ProductFilters
                    activeCategory={activeCategory}
                    sort={sort}
                    onCategoryChange={setCategory}
                    onSortChange={setSort}
                />

                <ProductGrid
                    products={visibleProducts}
                    onClearFilters={() => setCategory('all')}
                    emptyMessage={`No products in ${activeLabel}`}
                />
            </div>
        </div>
    );
}

export default ProductPage;