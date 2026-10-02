import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import type { CatalogProduct } from '../data/catalogData';
import productConst from '../consts/productConst';
import { useCatalogCategories } from '../store/catalogStore';
import { countByCategory } from '../hooks/useCatalogFilters';
import type { SortKey } from '../hooks/useCatalogFilters';

type ProductFiltersProps = {
    activeCategory: string;
    sort: SortKey;
    /** Live catalogue kept in sync with the admin panel. */
    products: CatalogProduct[];
    /** Active search query — keeps the per-category counts honest. */
    query?: string;
    onCategoryChange: (value: string) => void;
    onSortChange: (value: SortKey) => void;
};

function ProductFilters({
    activeCategory,
    sort,
    products,
    query = '',
    onCategoryChange,
    onSortChange,
}: ProductFiltersProps) {
    const categories = useCatalogCategories();

    /** Shipped categories always show; admin-added ones only once they sell something. */
    const options = [
        { value: 'all', label: 'All' },
        ...categories
            .filter(
                (category) =>
                    productConst.categories.some((built) => built.value === category.id) ||
                    countByCategory(category.id, '', products) > 0
            )
            .map((category) => ({ value: category.id, label: category.label })),
    ];

    return (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
                role="tablist"
                aria-label="Filter by category"
                className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1 [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:px-0 sm:pb-0"
                style={{ scrollbarWidth: 'none' }}
            >
                {options.map((category) => {
                    const isActive = category.value === activeCategory;
                    return (
                        <button
                            key={category.value}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onCategoryChange(category.value)}
                            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:px-3.5 sm:py-2 sm:text-xs"
                            style={{
                                borderColor: isActive ? 'transparent' : Theme.colors.border,
                                backgroundColor: isActive ? Theme.colors.text : Theme.colors.surface,
                                color: isActive ? Theme.colors.background : Theme.colors.text,
                                boxShadow: isActive ? Theme.Shadow.sm : 'none',
                            }}
                        >
                            {category.label}
                            <span className="text-[10px] tabular-nums" style={{ opacity: isActive ? 0.7 : 0.5 }}>
                                {countByCategory(category.value, query, products)}
                            </span>
                        </button>
                    );
                })}
            </div>

            <SelectMenu
                className="shrink-0 self-start sm:self-auto"
                value={sort}
                options={productConst.sortOptions}
                onChange={(value) => onSortChange(value as SortKey)}
                label="Sort products"
                menuHeading="Sort by"
            />
        </div>
    );
}

export default ProductFilters;
