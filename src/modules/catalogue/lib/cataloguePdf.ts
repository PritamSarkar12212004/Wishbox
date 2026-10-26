import { jsPDF } from 'jspdf';
import type { CatalogProduct } from '@/modules/products/api/productApi';

/**
 * Catalogue PDFs, built in the browser.
 *
 * The shop's products are the source, so a catalogue can never go stale the way
 * a hand-made PDF does: the same function serves the shop's "download this
 * category" button and the account page's custom picker. It is deliberately
 * typographic - a cover, then one section per category with a name, brand, SKU
 * and price per row - because a photo grid would make the file huge and every
 * product image a separate network fetch.
 *
 * `Rs.` is spelled out rather than `₹`: the PDF's built-in Helvetica has no
 * rupee glyph, and a missing glyph renders as a box.
 */

export type CatalogueItem = Pick<
    CatalogProduct,
    'id' | 'name' | 'brand' | 'sku' | 'price' | 'mrp' | 'available'
>;

export type CatalogueSection = {
    title: string;
    description?: string;
    products: CatalogueItem[];
};

export type CatalogueOptions = {
    title: string;
    subtitle?: string;
    sections: CatalogueSection[];
    /** Prices and MRPs. Off gives a lookbook-style list. */
    includePrices?: boolean;
    storeName?: string;
};

const PAGE = { width: 210, height: 297, margin: 18 };
const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;
const BOTTOM = PAGE.height - 22;

const ink = { r: 38, g: 32, b: 28 };
const muted = { r: 122, g: 110, b: 100 };
const accent = { r: 160, g: 98, b: 62 };

const inr = (value: number) => `Rs. ${Math.round(value).toLocaleString('en-IN')}`;

/** A filename that survives every filesystem: no spaces, no punctuation. */
export function catalogueFilename(title: string): string {
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${slug || 'wishbox-catalogue'}.pdf`;
}

export function productCountOf(sections: CatalogueSection[]): number {
    return sections.reduce((count, section) => count + section.products.length, 0);
}

/** Builds the catalogue and hands the PDF to the browser's download. */
export function downloadCatalogue(options: CatalogueOptions): number {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const includePrices = options.includePrices ?? true;
    const storeName = options.storeName ?? 'WishBox';
    const total = productCountOf(options.sections);

    let y = 0;
    let page = 1;

    const setFont = (style: 'normal' | 'bold' | 'italic', size: number, colour: typeof ink) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(colour.r, colour.g, colour.b);
    };

    const footer = () => {
        setFont('normal', 8, muted);
        doc.text(storeName, PAGE.margin, PAGE.height - 12);
        doc.text(String(page), PAGE.width - PAGE.margin, PAGE.height - 12, { align: 'right' });
    };

    const newPage = () => {
        footer();
        doc.addPage();
        page += 1;
        y = PAGE.margin;
    };

    /* ── Cover ─────────────────────────────────────────────────────── */
    setFont('bold', 12, accent);
    doc.text(storeName.toUpperCase(), PAGE.margin, PAGE.margin + 4);

    doc.setDrawColor(accent.r, accent.g, accent.b);
    doc.setLineWidth(0.4);
    doc.line(PAGE.margin, PAGE.margin + 8, PAGE.width - PAGE.margin, PAGE.margin + 8);

    y = 62;
    setFont('bold', 30, ink);
    doc.text(doc.splitTextToSize(options.title, CONTENT_WIDTH), PAGE.margin, y);
    y += doc.splitTextToSize(options.title, CONTENT_WIDTH).length * 12 + 4;

    if (options.subtitle) {
        setFont('normal', 12, muted);
        const lines = doc.splitTextToSize(options.subtitle, CONTENT_WIDTH - 10);
        doc.text(lines, PAGE.margin, y);
        y += lines.length * 6;
    }

    y += 8;
    setFont('normal', 10, muted);
    const cover = [
        `${total} product${total === 1 ? '' : 's'}`,
        `${options.sections.length} section${options.sections.length === 1 ? '' : 's'}`,
        new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    ];
    doc.text(cover.join('   ·   '), PAGE.margin, y);

    /* ── Sections ──────────────────────────────────────────────────── */
    options.sections.forEach((section) => {
        if (section.products.length === 0) return;

        newPage();
        setFont('bold', 16, ink);
        doc.text(section.title, PAGE.margin, y + 2);
        y += 8;

        if (section.description) {
            setFont('normal', 9.5, muted);
            const lines = doc.splitTextToSize(section.description, CONTENT_WIDTH);
            doc.text(lines, PAGE.margin, y);
            y += lines.length * 4.2 + 1;
        }

        doc.setDrawColor(225, 218, 209);
        doc.setLineWidth(0.2);
        doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
        y += 6;

        section.products.forEach((product, index) => {
            const nameLines = doc.splitTextToSize(product.name, CONTENT_WIDTH - 34) as string[];
            const rowHeight = Math.max(nameLines.length * 4.8, 9) + 5;

            if (y + rowHeight > BOTTOM) newPage();

            setFont('normal', 8, muted);
            doc.text(String(index + 1).padStart(2, '0'), PAGE.margin, y + 4);

            setFont('bold', 10.5, ink);
            doc.text(nameLines, PAGE.margin + 9, y + 4);

            setFont('normal', 8.5, muted);
            const meta = [product.brand, product.sku, product.available ? '' : 'Out of stock']
                .filter(Boolean)
                .join('  ·  ');
            doc.text(meta, PAGE.margin + 9, y + 4 + nameLines.length * 4.6);

            if (includePrices) {
                setFont('bold', 10.5, ink);
                doc.text(inr(product.price), PAGE.width - PAGE.margin, y + 4, { align: 'right' });
                if (product.mrp > product.price) {
                    setFont('normal', 8, muted);
                    doc.text(`MRP ${inr(product.mrp)}`, PAGE.width - PAGE.margin, y + 8.4, {
                        align: 'right',
                    });
                }
            }

            y += rowHeight;
            doc.setDrawColor(238, 233, 226);
            doc.line(PAGE.margin, y - 2.5, PAGE.width - PAGE.margin, y - 2.5);
        });
    });

    footer();
    doc.save(catalogueFilename(options.title));
    return total;
}
