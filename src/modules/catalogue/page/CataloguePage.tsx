import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    useCatalog,
    useCatalogCategories,
    useCatalogStatus,
} from '@/modules/products/api/useProducts';
import { downloadCatalogue, productCountOf } from '../lib/cataloguePdf';

/**
 * Build a catalogue of your own.
 *
 * The shop's per-category button downloads whatever is on screen; this page is
 * the deliberate version: pick the categories, name the document, and get one
 * PDF. Categories the admin has given an official catalogue also link to it, so
 * the designed version is never more than a click away.
 */
function CataloguePage() {
    const products = useCatalog();
    const categories = useCatalogCategories();
    const { isLoading } = useCatalogStatus();

    const [title, setTitle] = useState('WishBox Catalogue');
    const [includePrices, setIncludePrices] = useState(true);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [building, setBuilding] = useState(false);

    /* Nothing ticked means everything: the page opens as "the whole shop",
       which is what most visitors want, without a second click. */
    const chosen = useMemo(
        () => categories.filter((category) => selected[category.id] !== false),
        [categories, selected]
    );

    const sections = useMemo(
        () =>
            chosen.map((category) => ({
                title: category.label,
                products: products.filter((product) => product.category === category.id),
            })),
        [chosen, products]
    );

    const total = productCountOf(sections);
    const officialCatalogues = categories.filter((category) => category.catalogue);

    function toggle(id: string) {
        setSelected((current) => ({ ...current, [id]: current[id] === false }));
    }

    function download() {
        if (total === 0) {
            toast.error('Pick at least one category with products');
            return;
        }

        setBuilding(true);
        try {
            const count = downloadCatalogue({
                title: title.trim() || 'WishBox Catalogue',
                subtitle: `${chosen.length} ${chosen.length === 1 ? 'category' : 'categories'} chosen by you.`,
                sections,
                includePrices,
            });
            toast.success(`Catalogue ready · ${count} products`);
        } catch {
            toast.error('Could not build the catalogue');
        } finally {
            setBuilding(false);
        }
    }

    return (
        <div
            className="min-h-screen w-full"
            style={{ backgroundColor: Theme.colors.background, color: Theme.colors.text }}
        >
            <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-10 md:px-6 lg:px-8">
                <Link
                    to="/shop"
                    className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
                    style={{ color: Theme.colors.textMuted }}
                >
                    <ArrowLeft size={13} />
                    Back to the shop
                </Link>

                <header className="mb-7">
                    <p
                        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: Theme.colors.primaryDark }}
                    >
                        Catalogues
                    </p>
                    <h1
                        className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                        style={{ fontFamily: Theme.Typography.headingFamily }}
                    >
                        Build your own catalogue
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm" style={{ color: Theme.colors.textMuted }}>
                        Pick the categories you care about and download one PDF — for a gifting list, a
                        bulk order or a shop of your own.
                    </p>
                </header>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    {/* Categories */}
                    <section
                        className="rounded-2xl border p-4 sm:p-5"
                        style={{
                            borderColor: Theme.colors.border,
                            backgroundColor: Theme.colors.surface,
                            boxShadow: Theme.Shadow.sm,
                        }}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-sm font-bold">Categories</h2>
                            <div className="flex items-center gap-3 text-[11px] font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setSelected({})}
                                    className="transition-opacity hover:opacity-70"
                                    style={{ color: Theme.colors.primaryDark }}
                                >
                                    Select all
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelected(
                                            Object.fromEntries(
                                                categories.map((category) => [category.id, false])
                                            )
                                        )
                                    }
                                    className="transition-opacity hover:opacity-70"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <p className="mt-4 flex items-center gap-2 text-xs" style={{ color: Theme.colors.textMuted }}>
                                <Loader2 size={13} className="animate-spin" />
                                Loading the catalogue…
                            </p>
                        ) : (
                            <ul className="mt-3 flex flex-col divide-y" style={{ borderColor: Theme.colors.border }}>
                                {categories.map((category) => {
                                    const count = products.filter(
                                        (product) => product.category === category.id
                                    ).length;
                                    const checked = selected[category.id] !== false;

                                    return (
                                        <li key={category.id} className="py-2.5">
                                            <label className="flex cursor-pointer items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggle(category.id)}
                                                    className="h-4 w-4 shrink-0"
                                                    style={{ accentColor: Theme.colors.primaryDark }}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[13px] font-semibold">
                                                        {category.label}
                                                    </span>
                                                    <span
                                                        className="mt-0.5 block text-[11px]"
                                                        style={{ color: Theme.colors.textMuted }}
                                                    >
                                                        {count} {count === 1 ? 'product' : 'products'}
                                                        {category.catalogue ? ' · official catalogue available' : ''}
                                                    </span>
                                                </span>
                                                {category.catalogue && (
                                                    <a
                                                        href={category.catalogue.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[10.5px] font-bold"
                                                        style={{
                                                            borderColor: Theme.colors.border,
                                                            color: Theme.colors.primaryDark,
                                                        }}
                                                        title={category.catalogue.description}
                                                    >
                                                        <FileText size={11} />
                                                        Official
                                                    </a>
                                                )}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>

                    {/* Download card */}
                    <section
                        className="flex h-fit flex-col gap-4 rounded-2xl border p-4 sm:p-5"
                        style={{
                            borderColor: Theme.colors.border,
                            backgroundColor: Theme.colors.surface,
                            boxShadow: Theme.Shadow.sm,
                        }}
                    >
                        <h2 className="text-sm font-bold">Your catalogue</h2>

                        <label className="flex flex-col gap-1.5">
                            <span
                                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                Title
                            </span>
                            <input
                                type="text"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={60}
                                className="h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                            />
                        </label>

                        <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                                type="checkbox"
                                checked={includePrices}
                                onChange={(event) => setIncludePrices(event.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0"
                                style={{ accentColor: Theme.colors.primaryDark }}
                            />
                            <span>
                                <span className="block text-[13px] font-semibold">Show prices</span>
                                <span className="mt-0.5 block text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    Leave it off for a lookbook you can share without listing rates.
                                </span>
                            </span>
                        </label>

                        <dl className="flex flex-col gap-1.5 border-t pt-3 text-xs" style={{ borderColor: Theme.colors.border }}>
                            <div className="flex justify-between gap-3">
                                <dt style={{ color: Theme.colors.textMuted }}>Categories</dt>
                                <dd className="font-semibold tabular-nums">{chosen.length}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt style={{ color: Theme.colors.textMuted }}>Products</dt>
                                <dd className="font-semibold tabular-nums">{total}</dd>
                            </div>
                        </dl>

                        <button
                            type="button"
                            onClick={download}
                            disabled={building || total === 0}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: Theme.colors.primaryDark, boxShadow: Theme.Shadow.sm }}
                        >
                            {building ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                            Download PDF
                        </button>

                        {officialCatalogues.length > 0 && (
                            <div className="border-t pt-3" style={{ borderColor: Theme.colors.border }}>
                                <p className="text-[11px] font-semibold" style={{ color: Theme.colors.textMuted }}>
                                    Official catalogues
                                </p>
                                <ul className="mt-1.5 flex flex-col gap-1">
                                    {officialCatalogues.map((category) => (
                                        <li key={category.id}>
                                            <a
                                                href={category.catalogue?.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-opacity hover:opacity-70"
                                                style={{ color: Theme.colors.primaryDark }}
                                            >
                                                <FileText size={12} />
                                                {category.catalogue?.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default CataloguePage;
