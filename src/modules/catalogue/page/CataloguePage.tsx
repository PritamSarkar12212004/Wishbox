import ActionButton from '@/components/ui/action-button';
import { ArrowDownToLine, ArrowLeft, FileText, Loader2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import type { ProductCategory } from '@/modules/products/api/productApi';
import {
    useCatalog,
    useCatalogCategories,
    useCatalogStatus,
    useCatalogueLibrary,
} from '@/modules/products/api/useProducts';
import { downloadCatalogue } from '../lib/cataloguePdf';
import { catalogueHref } from '../lib/catalogueUrl';

type CatalogueCardItem = {
    key: string;
    category: ProductCategory;
    title: string;
    description: string;
    url?: string;
};

function CataloguePage() {
    const products = useCatalog();
    const categories = useCatalogCategories();
    const library = useCatalogueLibrary();
    const { isLoading } = useCatalogStatus();

    const cards: CatalogueCardItem[] = categories.flatMap((category): CatalogueCardItem[] => {
        const uploaded = [
            ...(category.catalogue ? [{ ...category.catalogue, id: category.catalogue.id ?? 'official' }] : []),
            ...(category.catalogues ?? []),
        ];
        if (uploaded.length > 0) {
            return uploaded.map((catalogue) => ({
                key: `${category.id}-${catalogue.id}`,
                category,
                title: catalogue.title,
                description: catalogue.description || 'Download catalogue PDF',
                url: catalogue.url,
            }));
        }
        return [{
            key: category.id,
            category,
            title: category.label,
            description: 'PDF · Includes prices',
            url: undefined,
        }];
    });

    function downloadOne(category: { id: string; label: string }) {
        const categoryProducts = products.filter((product) => product.category === category.id);
        if (categoryProducts.length === 0) {
            toast.error(`No ${category.label} products yet`);
            return;
        }

        try {
            const count = downloadCatalogue({
                title: `${category.label} catalogue`,
                subtitle: `Every ${category.label.toLowerCase()} product in the shop right now.`,
                sections: [{ title: category.label, products: categoryProducts }],
                includePrices: true,
            });
            toast.success(`${category.label} catalogue ready · ${count} products`);
        } catch {
            toast.error('Could not build the catalogue');
        }
    }

    return (
        <main
            className="min-h-screen w-full overflow-hidden"
            style={{ backgroundColor: Theme.colors.background, color: Theme.colors.text }}
        >
            <div className="mx-auto w-full max-w-[1800px] px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-7 lg:px-10 lg:pt-9 2xl:px-14">
                <LinkBack />

                <section aria-labelledby="catalogue-collections">
                    <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
                        <div>
                            <h1 id="catalogue-collections" className="text-lg font-bold sm:text-xl">Catalogues</h1>
                            <p className="mt-1 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                                {isLoading ? 'Loading catalogues…' : `${cards.length} catalogues available`}
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid min-h-52 place-items-center rounded-3xl border" style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                            <div className="flex items-center gap-2 text-sm" style={{ color: Theme.colors.textMuted }}>
                                <Loader2 size={17} className="animate-spin" />
                                Loading collections…
                            </div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="grid min-h-52 place-items-center rounded-3xl border px-5 text-center" style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
                            <div>
                                <Package size={28} className="mx-auto" style={{ color: Theme.colors.textMuted }} />
                                <p className="mt-3 text-sm font-semibold">No collections available yet</p>
                                <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>Please check back soon.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {cards.map((card) => {
                                const { category } = card;
                                const categoryProducts = products.filter((product) => product.category === category.id);
                                const count = categoryProducts.length;
                                const image = categoryProducts[0]?.image;

                                return (
                                    <CatalogueCard
                                        key={card.key}
                                        title={card.title}
                                        category={category.label}
                                        description={card.description}
                                        count={count}
                                        image={image}
                                        url={card.url}
                                        onDownload={() => downloadOne(category)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Files that belong to no single category - the shop-wide lookbooks. */}
                {library.length > 0 && (
                    <section aria-labelledby="catalogue-general" className="mt-8 sm:mt-10">
                        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
                            <div>
                                <h2 id="catalogue-general" className="text-lg font-bold sm:text-xl">
                                    More from the studio
                                </h2>
                                <p className="mt-1 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                                    Lookbooks, trade lists and gift guides covering the whole shop.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                            {library.map((catalogue) => (
                                <a
                                    key={catalogue.id}
                                    href={catalogueHref({ url: catalogue.url })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 rounded-2xl border p-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl sm:p-4"
                                    style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
                                >
                                    <span
                                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                                        style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                                    >
                                        <FileText size={17} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-bold">
                                            {catalogue.title}
                                        </span>
                                        <span
                                            className="mt-0.5 block truncate text-[11px]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            {catalogue.description || 'Download the catalogue'}
                                        </span>
                                    </span>
                                    <span
                                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform group-hover:translate-y-0.5"
                                        style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.background }}
                                    >
                                        <ArrowDownToLine size={14} />
                                    </span>
                                </a>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}

function CatalogueCard({
    title,
    category,
    description,
    count,
    image,
    url,
    onDownload,
}: {
    title: string;
    category: string;
    description: string;
    count: number;
    image?: string;
    url?: string;
    onDownload: () => void;
}) {
    const className = 'group flex min-w-0 flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2 sm:rounded-3xl';
    const style = { borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface };
    const content = (
        <>
            <span className="relative block aspect-[5/3] w-full overflow-hidden" style={{ backgroundColor: Theme.colors.surfaceAlt }}>
                {image ? (
                    <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                ) : (
                    <span className="grid h-full place-items-center" style={{ color: Theme.colors.textMuted }}><Package size={30} strokeWidth={1.5} /></span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
                <span className="absolute bottom-2 left-2 rounded-full px-2 py-1 text-[9px] font-semibold text-white shadow-sm sm:bottom-3 sm:left-3 sm:px-3 sm:text-[11px]" style={{ backgroundColor: 'rgba(28, 25, 23, 0.58)' }}>
                    {count} {count === 1 ? 'product' : 'products'}
                </span>
                <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full shadow-md transition-transform duration-300 group-hover:scale-110 sm:right-3 sm:top-3 sm:h-9 sm:w-9" style={{ backgroundColor: Theme.colors.surface, color: Theme.colors.primaryDark }}>
                    <ArrowDownToLine size={15} />
                </span>
            </span>
            <span className="flex w-full flex-1 items-center justify-between gap-2 p-3 sm:gap-3 sm:p-4">
                <span className="min-w-0">
                    <span className="block truncate text-sm font-bold sm:text-base" style={{ color: Theme.colors.text }}>{title}</span>
                    <span className="mt-0.5 block truncate text-[10px] sm:mt-1 sm:text-xs" style={{ color: Theme.colors.textMuted }}>{category} · {description}</span>
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-transform group-hover:translate-y-0.5" style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.background }}>
                    <ArrowDownToLine size={14} />
                </span>
            </span>
        </>
    );

    return url ? (
        <a href={catalogueHref({ url })} target="_blank" rel="noopener noreferrer" className={className} style={style} aria-label={`Download ${title} from ${category}`}>
            {content}
        </a>
    ) : (
        <ActionButton type="button" onClick={onDownload} disabled={count === 0} className={`${className} disabled:cursor-not-allowed disabled:opacity-60`} style={style} aria-label={`Download ${title} PDF`}>
            {content}
        </ActionButton>
    );
}

function LinkBack() {
    return (
        <Link
            to="/shop"
            className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-70 sm:mb-6"
            style={{ color: Theme.colors.textMuted }}
        >
            <ArrowLeft size={13} />
            Back to the shop
        </Link>
    );
}

export default CataloguePage;
