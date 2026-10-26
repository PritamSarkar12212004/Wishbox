/**
 * Product-page imagery.
 *
 * There is no per-product presentation data in the frontend any more: colours,
 * sizes, GSM, packs, offers and specifications all live on the product record
 * the API serves, and the admin editor is where they are edited. What remains
 * here is the gallery - the one piece of presentation that has to be derived
 * from a set of URLs rather than stored as one field.
 */

import type { CatalogProduct } from '../api/productApi';

export type GalleryItem = {
    id: string;
    src: string;
    medium: string;
    thumb: string;
    alt: string;
    width: number;
    height: number;
    type?: 'image' | 'video';
    videoSrc?: string;
};

/**
 * Gallery for any catalogue product.
 *
 * Main and hover shots always lead; the admin's before/after pair, extra
 * photos and promo video follow when the product has them. The list is padded
 * back to three slides so the gallery never looks empty or under-filled.
 */
export function galleryForProduct(product: CatalogProduct): GalleryItem[] {
    const items: GalleryItem[] = [];

    const push = (src: string, alt: string, type: 'image' | 'video' = 'image') => {
        if (!src || items.some((item) => item.src === src)) return;
        items.push({
            id: `${product.id}-${items.length}`,
            src,
            medium: src,
            thumb: src,
            alt,
            width: type === 'video' ? 1280 : 600,
            height: type === 'video' ? 720 : 750,
            type,
            videoSrc: type === 'video' ? src : undefined,
        });
    };

    push(product.image, product.name);
    push(product.hoverImage, `${product.name} — alternate view`);
    push(product.beforeImage ?? '', `${product.name} — before`);
    push(product.afterImage ?? '', `${product.name} — after`);
    (product.gallery ?? []).forEach((src, index) => push(src, `${product.name} — photo ${index + 1}`));
    push(product.videoUrl ?? '', `${product.name} — video`, 'video');

    if (items.length === 0) return [];

    // Keep the old three-slide rhythm when there is only one real photo.
    const slides = [...items];
    let repeat = 1;
    while (slides.length < 3) {
        slides.push({ ...items[0], id: `${product.id}-repeat-${repeat}` });
        repeat += 1;
    }
    return slides;
}
