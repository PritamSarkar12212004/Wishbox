import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import ProductGrid from '@/modules/products/components/ProductGrid';
import { CATALOG, type ProductBadge } from '@/modules/products/data/catalogData';

const FEATURED_COUNT = 10;

/** Merchandising order for the home rail: bestsellers first, then sale, new, rest. */
const badgeRank = (badge?: ProductBadge) =>
    badge === 'BESTSELLER' ? 0 : badge === 'SALE' ? 1 : badge === 'NEW' ? 2 : 3;

type ProductSectionsProps = {
    loading?: boolean;
};

export default function ProductSections({ loading }: ProductSectionsProps = {}) {
    const featured = useMemo(
        () =>
            [...CATALOG]
                .sort((a, b) => badgeRank(a.badge) - badgeRank(b.badge) || b.rating - a.rating)
                .slice(0, FEATURED_COUNT),
        []
    );

    return (
        <section
            style={{
                backgroundColor: Theme.colors.background,
                // Exposed so class-based hover states can reach the theme accent.
                ['--card-accent' as string]: Theme.colors.accentDark,
            } as React.CSSProperties}
            className="w-full py-8"
        >
            <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: Theme.colors.text }}>
                            Featured this week
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                            Handpicked pieces our makers are proudest of.
                        </p>
                    </div>
                    <Link
                        to="/shop"
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-[var(--card-accent)]"
                        style={{ color: Theme.colors.accentDark }}
                    >
                        View all products
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>

                <ProductGrid products={featured} loading={loading} />
            </div>
        </section>
    );
}
