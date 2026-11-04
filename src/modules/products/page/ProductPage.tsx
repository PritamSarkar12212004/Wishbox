import ActionButton from '@/components/ui/action-button';
import { Download, RotateCcw, X } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import ProductFilters from '../components/ProductFilters';
import ProductGrid from '../components/ProductGrid';
import { formatCategory } from '../lib/category';
import { catalogueHref } from '@/modules/catalogue/lib/catalogueUrl';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import { useCatalogCategories, useCatalogStatus } from '../api/useProducts';

function ProductPage() {
    const {
        activeCategory,
        sort,
        query,
        visibleProducts,
        products,
        setCategory,
        setSort,
        setQuery,
        clearFilters,
    } = useCatalogFilters();
    /** The listing is fetched once; this is what the page says while it waits. */
    const { isLoading, error, refetch } = useCatalogStatus();
    const categories = useCatalogCategories();

    const activeLabel =
        activeCategory === 'all' ? 'All Categories' : formatCategory(activeCategory);

    /* The admin can attach an official PDF to a category. While a search is
     * running the results are the point, so that PDF is only offered on the
     * plain category view and the live list is exported instead. */
    const official = query
        ? undefined
        : categories.find((category) => category.id === activeCategory)?.catalogue;

    /* The download is always a real document built by the API: the admin's
     * uploaded file when there is one, otherwise the catalogue the backend
     * renders from the live product records. The browser never prices it. */
    const catalogueLink = official
        ? catalogueHref(official)
        : !query && visibleProducts.length > 0
          ? catalogueHref({
                url: `/catalogues/pdf?category=${encodeURIComponent(activeCategory)}`,
            })
          : undefined;

    return (
        <div
            className="min-h-full px-2.5 py-6 sm:px-4 sm:py-10 md:px-6 lg:px-8"
            style={{
                backgroundColor: Theme.colors.background,
                // Exposed so class-based hover states can reach the theme accent.
                ['--card-accent' as string]: Theme.colors.accentDark,
            } as React.CSSProperties}
        >
            <div className="mx-auto max-w-[1500px]">
                <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
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
                            <ActionButton
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
                            </ActionButton>
                        )}
                    </p>
                    </div>

                    {/* A real document only: the uploaded file, or the PDF the
                      * API builds from live prices. Nothing is rendered in the
                      * browser, so a download cannot carry an edited rate. */}
                    {catalogueLink && (
                        <div className="flex flex-col items-start gap-1.5 sm:items-end">
                            <a
                                href={catalogueLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold transition-colors hover:opacity-80"
                                style={{
                                    borderColor: Theme.colors.borderStrong,
                                    backgroundColor: Theme.colors.surface,
                                    color: Theme.colors.primaryDark,
                                }}
                            >
                                <Download size={14} />
                                Download catalogue
                            </a>
                            <p
                                className="max-w-[17rem] text-[11px] leading-snug sm:text-right"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {official
                                    ? official.description
                                        ? `${official.title} — ${official.description}`
                                        : official.title
                                    : 'Live prices from the shop — GST extra.'}
                            </p>
                        </div>
                    )}
                </header>

                <ProductFilters
                    activeCategory={activeCategory}
                    sort={sort}
                    products={products}
                    query={query}
                    onCategoryChange={setCategory}
                    onSortChange={setSort}
                />

                {error && (
                    <div
                        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
                        role="alert"
                        style={{
                            borderColor: Theme.colors.border,
                            backgroundColor: Theme.colors.surface,
                            color: Theme.colors.text,
                        }}
                    >
                        <span>We couldn't load the catalogue. Check your connection and try again.</span>
                        <ActionButton
                            type="button"
                            onClick={() => void refetch()}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
                            style={{ borderColor: Theme.colors.borderStrong }}
                        >
                            <RotateCcw size={12} />
                            Try again
                        </ActionButton>
                    </div>
                )}

                <ProductGrid
                    products={visibleProducts}
                    loading={isLoading}
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
