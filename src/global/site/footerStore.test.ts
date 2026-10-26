import { beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_FOOTER_CONTENT,
    footerLinkId,
    footerProblems,
    isValidDestination,
    normalizeDestination,
    phoneHref,
} from './footerContent';
import { footerStore } from './footerStore';

beforeEach(() => {
    footerStore.reset();
});

describe('footer store', () => {
    it('starts from the shipped footer', () => {
        expect(footerStore.getSnapshot()).toEqual(DEFAULT_FOOTER_CONTENT);
    });

    it('merges an edit without dropping the untouched fields', () => {
        footerStore.update({ storeName: 'Paper & Post', phone: '+91 90000 00000' });

        const content = footerStore.getSnapshot();
        expect(content.storeName).toBe('Paper & Post');
        expect(content.phone).toBe('+91 90000 00000');
        expect(content.shopLinks).toEqual(DEFAULT_FOOTER_CONTENT.shopLinks);
        expect(content.tagline).toBe(DEFAULT_FOOTER_CONTENT.tagline);
    });

    it('replaces link columns wholesale', () => {
        footerStore.update({
            companyLinks: [{ id: 'contact', label: 'Talk to us', to: '/contact' }],
        });

        expect(footerStore.getSnapshot().companyLinks).toHaveLength(1);
        expect(footerStore.getSnapshot().companyLinks[0].label).toBe('Talk to us');
    });

    it('resets back to the shipped footer', () => {
        footerStore.update({ storeName: 'Changed', copyright: '' });
        footerStore.reset();

        expect(footerStore.getSnapshot()).toEqual(DEFAULT_FOOTER_CONTENT);
    });
});

describe('footer link ids', () => {
    it('slugifies the label and suffixes duplicates', () => {
        const first = { id: 'shop-all', label: 'Shop All', to: '/shop' };
        expect(footerLinkId('Shop All', [])).toBe('shop-all');
        expect(footerLinkId('Shop All', [first])).toBe('shop-all-2');
        expect(footerLinkId('  ', [])).toBe('link');
    });
});

describe('footer destinations', () => {
    it('adds the leading slash to site paths but leaves URLs alone', () => {
        expect(normalizeDestination('shop')).toBe('/shop');
        expect(normalizeDestination(' /shop ')).toBe('/shop');
        expect(normalizeDestination('https://wa.me/91')).toBe('https://wa.me/91');
        expect(normalizeDestination('mailto:hello@wishbox.in')).toBe('mailto:hello@wishbox.in');
        expect(normalizeDestination('')).toBe('');
    });

    it('accepts site paths, anchors and full URLs only', () => {
        expect(isValidDestination('/shop')).toBe(true);
        expect(isValidDestination('#top')).toBe(true);
        expect(isValidDestination('/shop?q=paper')).toBe(true);
        expect(isValidDestination('https://example.com')).toBe(true);
        expect(isValidDestination('mailto:hello@wishbox.in')).toBe(true);
        expect(isValidDestination('tel:+919876543210')).toBe(true);

        expect(isValidDestination('shop')).toBe(false);
        expect(isValidDestination('/shop page')).toBe(false);
        expect(isValidDestination('javascript:alert(1)')).toBe(false);
        expect(isValidDestination('')).toBe(false);
    });

    it('builds dial-able phone links', () => {
        expect(phoneHref('+91 98765 43210')).toBe('tel:+919876543210');
        expect(phoneHref('')).toBe('');
    });
});

describe('footer validation', () => {
    it('passes the shipped footer', () => {
        expect(footerProblems(DEFAULT_FOOTER_CONTENT)).toEqual([]);
    });

    it('reports empty labels, bad destinations, emails and phones', () => {
        const problems = footerProblems({
            ...DEFAULT_FOOTER_CONTENT,
            email: 'not-an-email',
            phone: '12',
            instagramUrl: 'instagram.com/studio',
            shopLinks: [{ id: 'shop', label: '', to: 'shop page' }],
        });

        expect(problems.some((problem) => problem.includes('Store name'))).toBe(false);
        expect(problems.some((problem) => problem.includes('Shop column: link 1 needs a label'))).toBe(
            true
        );
        expect(problems.some((problem) => problem.includes('needs a valid destination'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Instagram link'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Email must look like'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Phone needs at least 6 digits'))).toBe(
            true
        );
    });

    it('accepts a bare path, because saving adds the leading slash', () => {
        const problems = footerProblems({
            ...DEFAULT_FOOTER_CONTENT,
            shopLinks: [{ id: 'shop', label: 'Shop', to: 'shop' }],
        });

        expect(problems).toEqual([]);
    });
});
