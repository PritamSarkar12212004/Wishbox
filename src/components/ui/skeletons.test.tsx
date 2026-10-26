import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    AddressListSkeleton,
    HistorySkeleton,
    PageSkeleton,
    PdpSkeleton,
    ProductEditorSkeleton,
    ProductGridSkeleton,
} from './skeletons';
import ProductGrid from '@/modules/products/components/ProductGrid';

/**
 * The skeletons are the loading state of every screen, so they are tested as
 * markup: each announces itself once (role="status"), and each draws the shape
 * it stands in for rather than an empty box or a spinner.
 */

const pulseCount = (html: string) => (html.match(/animate-pulse/g) ?? []).length;

describe('skeletons', () => {
    it('announce what they are loading, once each', () => {
        expect(renderToStaticMarkup(<PdpSkeleton />)).toContain('aria-label="Loading product"');
        expect(renderToStaticMarkup(<HistorySkeleton />)).toContain(
            'aria-label="Loading your orders"'
        );
        expect(renderToStaticMarkup(<AddressListSkeleton />)).toContain(
            'aria-label="Loading your addresses"'
        );
        expect(renderToStaticMarkup(<ProductEditorSkeleton />)).toContain(
            'aria-label="Loading product"'
        );
        expect(renderToStaticMarkup(<PageSkeleton />)).toContain('aria-label="Loading page"');
    });

    it('draw the gallery, buy column and overview for a product page', () => {
        const html = renderToStaticMarkup(<PdpSkeleton />);

        expect(pulseCount(html)).toBeGreaterThan(15);
        expect(html).toContain('aspect-[4/5]');
    });

    it('draw the stat tiles, filters and order cards for history', () => {
        const html = renderToStaticMarkup(<HistorySkeleton />);

        expect(pulseCount(html)).toBeGreaterThan(10);
        expect(html).toContain('rounded-full');
    });

    it('draw one row per saved address', () => {
        const twoRows = renderToStaticMarkup(<AddressListSkeleton rows={2} />);
        const fiveRows = renderToStaticMarkup(<AddressListSkeleton rows={5} />);

        expect(pulseCount(fiveRows)).toBeGreaterThan(pulseCount(twoRows));
    });

    it('draw a whole grid of cards for a page or an empty catalogue', () => {
        expect(pulseCount(renderToStaticMarkup(<ProductGridSkeleton count={4} />))).toBeGreaterThan(
            pulseCount(renderToStaticMarkup(<ProductGridSkeleton count={1} />))
        );
    });

    it('replace the product grid with card skeletons while the catalogue loads', () => {
        const loading = renderToStaticMarkup(<ProductGrid products={[]} loading />);
        const loaded = renderToStaticMarkup(<ProductGrid products={[]} />);

        expect(loading).toContain('Loading products');
        expect(pulseCount(loading)).toBeGreaterThan(50);
        expect(pulseCount(loaded)).toBe(0);
    });
});
