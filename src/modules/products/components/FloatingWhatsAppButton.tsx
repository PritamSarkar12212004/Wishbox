import { memo } from 'react';
import { useQuotationConfig } from '@/modules/cart/api/useQuotation';
import { useFooterContent } from '@/global/site/footerStore';
import { inr } from '@/lib/format';
import type { CatalogProduct } from '../api/productApi';

const DEFAULT_ADMIN_PHONE = '9405561572';
const DEFAULT_OWNER_NAME = 'Swapan Singha';
const DEFAULT_STORE_NAME = 'WishBox Paper Decor Company';

function toTitleCase(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function resolveWhatsAppPhone(configPhone?: string, footerPhone?: string, whatsappUrl?: string): string {
    const candidates = [configPhone, footerPhone, whatsappUrl];
    for (const candidate of candidates) {
        if (!candidate) continue;
        const digits = candidate.replace(/\D/g, '').slice(-10);
        if (/^[6-9]\d{9}$/.test(digits)) {
            return `91${digits}`;
        }
    }
    return `91${DEFAULT_ADMIN_PHONE}`;
}

function resolveOwnerGreetingName(ownerLine?: string): string {
    if (!ownerLine || !ownerLine.trim()) return DEFAULT_OWNER_NAME;
    const words = toTitleCase(ownerLine).split(' ');
    if (words.length >= 2) {
        return `${words[0]} ${words[words.length - 1]}`;
    }
    return words[0] || DEFAULT_OWNER_NAME;
}

type FloatingWhatsAppButtonProps = {
    /** Optional product context when rendered on a product detail page. */
    product?: CatalogProduct;
    /** Optional active category or search label when rendered on the shop page. */
    categoryLabel?: string;
    searchQuery?: string;
};

/**
 * Floating rounded WhatsApp action button shown on mobile / small screens
 * (`lg:hidden`) on the product listing and product detail pages.
 *
 * Tapping it opens a direct WhatsApp chat with the admin/owner (`Swapan Singha`)
 * pre-filled with a polite enquiry message and product/store context.
 */
function FloatingWhatsAppButton({
    product,
    categoryLabel,
    searchQuery,
}: FloatingWhatsAppButtonProps) {
    const { data: config } = useQuotationConfig();
    const footer = useFooterContent();

    const phone = resolveWhatsAppPhone(config?.phone, footer.phone, footer.whatsappUrl);
    const ownerName = resolveOwnerGreetingName(config?.ownerLine);
    const storeName = config?.storeName?.trim()
        ? toTitleCase(config.storeName)
        : footer.storeName || DEFAULT_STORE_NAME;

    const message = product
        ? `Hello ${ownerName} (${storeName}),\n\nI am interested in this product on your website:\n• Product: ${product.name}\n• SKU: ${product.sku}\n• Price: ${inr(product.price)}\n\nPlease share more details regarding bulk order pricing and availability.`
        : searchQuery
          ? `Hello ${ownerName} (${storeName}),\n\nI am browsing "${searchQuery}" products on your website and would like to enquire about bulk orders and pricing. Please share more details.`
          : categoryLabel && categoryLabel !== 'All Categories'
            ? `Hello ${ownerName} (${storeName}),\n\nI am browsing ${categoryLabel} products on your website and would like to enquire about bulk orders and pricing. Please share more details.`
            : `Hello ${ownerName} (${storeName}),\n\nI visited your website and would like to enquire about your paper decor products, bulk pricing, and catalogue details.`;

    const whatsappHref = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat with ${ownerName} on WhatsApp`}
            title={`Chat with ${ownerName} on WhatsApp`}
            style={{
                bottom: 'calc(1.25rem + var(--sticky-action-offset, 0px))',
                backgroundColor: '#25D366',
                boxShadow: '0 10px 25px -4px rgba(37, 211, 102, 0.55), 0 4px 10px -2px rgba(0, 0, 0, 0.18)',
            }}
            className="fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 lg:hidden"
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: '#25D366', animationDuration: '2.6s' }}
            />
            <svg
                viewBox="0 0 32 32"
                width="28"
                height="28"
                fill="currentColor"
                aria-hidden="true"
                className="relative z-10"
            >
                <path d="M16.004 3.2c-7.068 0-12.8 5.732-12.8 12.8 0 2.258.59 4.462 1.71 6.404L3.2 28.8l6.56-1.692a12.74 12.74 0 0 0 6.244 1.624h.006c7.066 0 12.79-5.732 12.79-12.8 0-3.42-1.332-6.636-3.75-9.054A12.716 12.716 0 0 0 16.004 3.2Zm0 23.368h-.004a10.59 10.59 0 0 1-5.402-1.48l-.388-.23-3.892 1.004 1.038-3.794-.252-.402a10.582 10.582 0 0 1-1.632-5.666c0-5.862 4.77-10.632 10.636-10.632 2.84 0 5.51 1.106 7.518 3.116a10.562 10.562 0 0 1 3.112 7.516c0 5.864-4.77 10.568-10.734 10.568Zm5.834-7.958c-.32-.16-1.892-.934-2.186-1.04-.292-.108-.506-.16-.72.16-.214.32-.826 1.04-1.012 1.254-.186.212-.374.24-.694.08-.32-.16-1.35-.498-2.572-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.492.14-.652.144-.144.32-.374.48-.56.16-.186.214-.32.32-.534.106-.212.054-.4-.026-.56-.08-.16-.72-1.734-.986-2.374-.26-.624-.526-.54-.72-.55l-.614-.01c-.214 0-.56.08-.854.4-.292.32-1.12 1.094-1.12 2.668 0 1.572 1.146 3.094 1.306 3.308.16.212 2.256 3.444 5.466 4.83.764.33 1.36.526 1.824.674.766.244 1.464.21 2.016.126.614-.092 1.892-.774 2.16-1.52.266-.746.266-1.386.186-1.52-.08-.134-.292-.214-.612-.374Z" />
            </svg>
        </a>
    );
}

export default memo(FloatingWhatsAppButton);
