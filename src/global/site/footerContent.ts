/**
 * Website footer content — the copy and links every page shares.
 *
 * This is the shape the admin's Website tab edits and the storefront footer
 * renders. The defaults below are the shipped footer, so a fresh browser (or a
 * cleared store) shows exactly what the site always did.
 */

/** One link row in a footer column. */
export type FooterLink = {
    /** Stable key for editing — labels can repeat, ids cannot. */
    id: string;
    label: string;
    /** A site path (`/shop`) or a full `https://`, `mailto:` or `tel:` URL. */
    to: string;
};

export type FooterContent = {
    storeName: string;
    tagline: string;
    instagramUrl: string;
    whatsappUrl: string;
    shopHeading: string;
    shopLinks: FooterLink[];
    companyHeading: string;
    companyLinks: FooterLink[];
    contactHeading: string;
    address: string;
    phone: string;
    email: string;
    subscribeHeading: string;
    copyright: string;
};

/** Columns stay readable: a footer is a signpost, not a sitemap. */
export const MAX_FOOTER_LINKS = 8;

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
    storeName: 'WishBox',
    tagline:
        'Handmade paper decorations for your home and events — crafted with love, inspired by nature.',
    instagramUrl: 'https://www.instagram.com/',
    whatsappUrl: 'https://wa.me/919876543210',
    shopHeading: 'Shop',
    shopLinks: [
        { id: 'shop-all', label: 'Shop All', to: '/shop' },
        { id: 'wishlist', label: 'Wishlist', to: '/wishlist' },
        { id: 'cart', label: 'Cart', to: '/cart' },
        { id: 'order-history', label: 'Order History', to: '/history' },
    ],
    companyHeading: 'Company',
    companyLinks: [{ id: 'contact', label: 'Contact', to: '/contact' }],
    contactHeading: 'Get in touch',
    address: '123 Craft Lane, Jaipur, India',
    phone: '+91 98765 43210',
    email: 'hello@wishbox.in',
    subscribeHeading: 'Offers & drops on WhatsApp',
    copyright: '© 2026 WishBox — All rights reserved.',
};

/** Slugifies a label into an id that is unique within one column. */
export function footerLinkId(label: string, links: FooterLink[]): string {
    const base =
        label
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'link';
    if (!links.some((link) => link.id === base)) return base;

    let suffix = 2;
    while (links.some((link) => link.id === `${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

/**
 * Makes a destination usable: site paths get their leading slash, so typing
 * `shop` in the admin still produces a working link.
 */
export function normalizeDestination(value: string): string {
    const destination = value.trim();
    if (!destination) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(destination)) return destination;
    if (destination.startsWith('/') || destination.startsWith('#')) return destination;
    return `/${destination}`;
}

/** A site path, an in-page anchor, or a full https / mailto / tel link. */
export function isValidDestination(value: string): boolean {
    const destination = value.trim();
    if (!destination) return false;
    if (destination.startsWith('/') || destination.startsWith('#')) {
        return !/\s/.test(destination);
    }
    return /^(https?:\/\/|mailto:|tel:)\S+$/i.test(destination);
}

/** Digits only, so `tel:` links stay dial-able. */
export function phoneHref(phone: string): string {
    const digits = phone.replace(/[^\d+]/g, '');
    return digits ? `tel:${digits}` : '';
}

function linkProblems(links: FooterLink[], column: string): string[] {
    const problems: string[] = [];

    links.forEach((link, index) => {
        if (!link.label.trim()) {
            problems.push(`${column}: link ${index + 1} needs a label.`);
        }
        // Bare paths are accepted: saving normalises `shop` into `/shop`.
        if (!isValidDestination(normalizeDestination(link.to))) {
            problems.push(
                `${column}: “${link.label.trim() || `link ${index + 1}`}” needs a valid destination — a /path or a full https://, mailto: or tel: link.`
            );
        }
    });

    return problems;
}

/**
 * Everything that would render a broken footer. The admin disables Save while
 * this is non-empty, so the storefront can never display a dead link or a
 * half-typed email.
 */
export function footerProblems(content: FooterContent): string[] {
    const problems: string[] = [];

    if (!content.storeName.trim()) problems.push('Store name is required.');
    if (content.shopLinks.length > MAX_FOOTER_LINKS) {
        problems.push(`Shop column: keep it to ${MAX_FOOTER_LINKS} links or fewer.`);
    }
    if (content.companyLinks.length > MAX_FOOTER_LINKS) {
        problems.push(`Company column: keep it to ${MAX_FOOTER_LINKS} links or fewer.`);
    }

    problems.push(...linkProblems(content.shopLinks, 'Shop column'));
    problems.push(...linkProblems(content.companyLinks, 'Company column'));

    (['instagramUrl', 'whatsappUrl'] as const).forEach((key) => {
        const value = content[key];
        if (value.trim() && !/^https?:\/\/\S+$/i.test(value.trim())) {
            problems.push(
                key === 'instagramUrl'
                    ? 'Instagram link must be a full https:// URL.'
                    : 'WhatsApp link must be a full https:// URL.'
            );
        }
    });

    if (content.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.email.trim())) {
        problems.push('Email must look like name@domain.com.');
    }

    if (content.phone.trim() && content.phone.replace(/\D/g, '').length < 6) {
        problems.push('Phone needs at least 6 digits.');
    }

    return problems;
}
