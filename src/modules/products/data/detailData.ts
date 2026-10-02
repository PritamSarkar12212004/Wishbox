/**
 * Rich product-detail configuration for the flagship handmade paper product.
 *
 * Only the flagship has colour/size/GSM variants, bulk pricing and the paper
 * guides; every other catalogue product renders through the same PDP with the
 * standard price/quantity/offer blocks.
 */

import type { CatalogProduct } from './catalogData';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

export type ColorOption = {
    name: string;
    hex: string;
    available: boolean;
    hasOwnImages: boolean;
};

export type SizeOption = {
    label: string;
    value: string;
    widthInch: number;
    heightInch: number;
    available: boolean;
};

export type GsmOption = { value: number; available: boolean };
export type PackOption = { sheets: number; packPrice: number; perSheet: number; available: boolean };
export type BulkTier = { min: number; max: number | null; unitPrice: number; discountPct: number };
export type Offer = { icon: 'tag' | 'gift' | 'truck' | 'card'; title: string; description: string; code?: string };
export type Coupon = { type: 'percent' | 'flat'; value: number; label: string };
export type SizeGuideItem = { label: string; width: number | null; height: number | null; note: string };

export type PaperDetail = {
    colors: ColorOption[];
    sizes: SizeOption[];
    gsms: GsmOption[];
    packs: PackOption[];
    bulkTiers: BulkTier[];
    offers: Offer[];
    coupons: Record<string, Coupon>;
    galleryByColor: Record<string, GalleryItem[]>;
    highlights: string[];
    specifications: Array<{ label: string; value: string }>;
    sizeGuide: SizeGuideItem[];
    gsmGuide: Array<{ range: string; label: string; height: string; color: string }>;
};

/* ------------------------------------------------------------------ */
/*  Imagery                                                            */
/* ------------------------------------------------------------------ */

const img = (id: string, w: number) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const BASE_IMAGES: string[] = [
    'Premium handmade decorative paper sheets in assorted pastel shades',
    'Stack of textured craft paper for gifting and decoration',
    'Folded decorative paper sheets showing smooth matte finish',
    'Handmade paper sheets arranged for crafting and DIY projects',
    'Colored paper pack for stationery, scrapbooking and event decoration',
    'Artisan paper texture close-up in warm tones',
    'Decorative paper sheets used for wedding and birthday decoration',
    'Premium paper sheets pack ready to ship',
];

const BASE_PHOTO_IDS = [
    'photo-1586075010923-2dd4570fb338',
    'photo-1517842645767-c639042777db',
    'photo-1513364776144-60967b0f800f',
    'photo-1519197924294-4ba991a11128',
    'photo-1452802447250-470a88ac82bc',
    'photo-1457365050282-c53d772ef8b2',
    'photo-1543007630-9710e4a00a20',
    'photo-1584697964358-3e14ca57658b',
];

function buildGallery(ids: string[], labels: string[], prefix: string): GalleryItem[] {
    return ids.map((id, i) => ({
        id: `${prefix}-${i}`,
        src: img(id, 1400),
        medium: img(id, 900),
        thumb: img(id, 160),
        alt: labels[i],
        width: 1200,
        height: 1500,
        type: 'image' as const,
    }));
}

export const DEFAULT_GALLERY: GalleryItem[] = buildGallery(BASE_PHOTO_IDS, BASE_IMAGES, 'gold');

/** Rose Gold ships with its own image set (demonstrates color → gallery swap). */
export const ROSE_GALLERY: GalleryItem[] = [
    {
        id: 'rose-0',
        src: img('photo-1607083206968-13611e3d76db', 1400),
        medium: img('photo-1607083206968-13611e3d76db', 900),
        thumb: img('photo-1607083206968-13611e3d76db', 160),
        alt: 'Rose gold handmade paper sheets with soft shimmer finish',
        width: 1200,
        height: 1500,
        type: 'image',
    },
    ...buildGallery(
        [BASE_PHOTO_IDS[1], BASE_PHOTO_IDS[2], BASE_PHOTO_IDS[4], BASE_PHOTO_IDS[5], BASE_PHOTO_IDS[6], BASE_PHOTO_IDS[7], BASE_PHOTO_IDS[0]],
        [BASE_IMAGES[1], BASE_IMAGES[2], BASE_IMAGES[4], BASE_IMAGES[5], BASE_IMAGES[6], BASE_IMAGES[7], BASE_IMAGES[0]],
        'rose'
    ),
];

/** Demo video slide. */
export const VIDEO_ITEM: GalleryItem = {
    id: 'demo-video',
    src: img('photo-1543007630-9710e4a00a20', 1400),
    medium: img('photo-1543007630-9710e4a00a20', 900),
    thumb: img('photo-1543007630-9710e4a00a20', 160),
    alt: 'Product demo video - folding decorative paper sheets',
    width: 1200,
    height: 1500,
    type: 'video',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
};

const GALLERY_BY_COLOR: Record<string, GalleryItem[]> = {
    Gold: [...DEFAULT_GALLERY.slice(0, 3), VIDEO_ITEM, ...DEFAULT_GALLERY.slice(4)],
    Silver: DEFAULT_GALLERY,
    'Rose Gold': ROSE_GALLERY,
    Pink: DEFAULT_GALLERY,
    Blue: DEFAULT_GALLERY,
    Red: DEFAULT_GALLERY,
};

/** Gallery for any catalogue product: main shot, hover shot, then the detail shot. */
export function galleryForProduct(product: CatalogProduct): GalleryItem[] {
    const images = [product.image, product.hoverImage, product.image];
    return images.map((src, index) => ({
        id: `${product.id}-${index}`,
        src,
        medium: src,
        thumb: src,
        alt: `${product.name} — view ${index + 1}`,
        width: 600,
        height: 750,
        type: 'image' as const,
    }));
}

/* ------------------------------------------------------------------ */
/*  Variants & pricing                                                 */
/* ------------------------------------------------------------------ */

export const COLORS: ColorOption[] = [
    { name: 'Gold', hex: '#C9A87C', available: true, hasOwnImages: true },
    { name: 'Silver', hex: '#B7B7B7', available: true, hasOwnImages: false },
    { name: 'Rose Gold', hex: '#DBA291', available: true, hasOwnImages: true },
    { name: 'Pink', hex: '#E8B4C0', available: true, hasOwnImages: false },
    { name: 'Blue', hex: '#A9C3E0', available: true, hasOwnImages: false },
    { name: 'Red', hex: '#C97B5D', available: false, hasOwnImages: false },
];

export const SIZES: SizeOption[] = [
    { label: 'A4', value: 'a4', widthInch: 8.27, heightInch: 11.69, available: true },
    { label: 'A3', value: 'a3', widthInch: 11.69, heightInch: 16.54, available: true },
    { label: '12 × 18 inch', value: '12x18', widthInch: 12, heightInch: 18, available: true },
    { label: '18 × 24 inch', value: '18x24', widthInch: 18, heightInch: 24, available: true },
    { label: '24 × 36 inch', value: '24x36', widthInch: 24, heightInch: 36, available: false },
];

export const GSMS: GsmOption[] = [
    { value: 100, available: true },
    { value: 120, available: true },
    { value: 150, available: true },
    { value: 200, available: true },
    { value: 250, available: false },
];

export const PACKS: PackOption[] = [
    { sheets: 10, packPrice: 249, perSheet: 25, available: true },
    { sheets: 25, packPrice: 549, perSheet: 22, available: true },
    { sheets: 50, packPrice: 999, perSheet: 20, available: true },
    { sheets: 100, packPrice: 1899, perSheet: 19, available: true },
];

/** Tier 1 matches the catalogue price so the card and the PDP can never disagree. */
export const BULK_TIERS: BulkTier[] = [
    { min: 1, max: 9, unitPrice: 249, discountPct: 0 },
    { min: 10, max: 49, unitPrice: 237, discountPct: 5 },
    { min: 50, max: 99, unitPrice: 232, discountPct: 7 },
    { min: 100, max: 499, unitPrice: 229, discountPct: 8 },
    { min: 500, max: null, unitPrice: 227, discountPct: 9 },
];

export function findBulkTier(qty: number): BulkTier {
    return BULK_TIERS.find((tier) => qty >= tier.min && (tier.max === null || qty <= tier.max)) ?? BULK_TIERS[0];
}

export const OFFERS: Offer[] = [
    {
        icon: 'tag',
        title: '10% OFF on your first order',
        description: 'Use code PAPER10 at checkout. Valid on orders above ₹499.',
        code: 'PAPER10',
    },
    {
        icon: 'gift',
        title: 'Save up to 9% on bulk packs',
        description: '5% off from 10 packs, rising to 9% at 500 — applied automatically in your cart.',
    },
    {
        icon: 'card',
        title: 'Flat ₹100 off with code',
        description: 'Use code PREPAID100 on prepaid orders.',
        code: 'PREPAID100',
    },
];

/** Coupons that actually apply a discount on the product price. */
export const COUPONS: Record<string, Coupon> = {
    PAPER10: { type: 'percent', value: 10, label: '10% OFF' },
    SAVE5: { type: 'percent', value: 5, label: '5% OFF' },
    PREPAID100: { type: 'flat', value: 100, label: '₹100 OFF' },
};

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const HIGHLIGHTS = [
    'Premium handmade quality paper',
    'Smooth, even matte texture',
    'Easy to cut, fold and glue',
    'Suitable for decoration & gifting',
    'Eco-friendly material',
    'Multiple colors available',
    'Multiple GSM options',
    'Bulk orders supported',
];

const SPECIFICATIONS: Array<{ label: string; value: string }> = [
    { label: 'Product Type', value: 'Decorative Paper' },
    { label: 'Material', value: 'Premium Paper' },
    { label: 'Color', value: 'Gold' },
    { label: 'Size', value: '12 × 18 inch' },
    { label: 'GSM', value: '150 GSM' },
    { label: 'Finish', value: 'Matte' },
    { label: 'Pack Size', value: '25 Sheets' },
    { label: 'Weight', value: '350 g' },
    { label: 'Country', value: 'India' },
    { label: 'SKU', value: 'WB-PAPER-001' },
];

const SIZE_GUIDE: SizeGuideItem[] = [
    { label: 'A4', width: 8.27, height: 11.69, note: 'Standard printer size' },
    { label: 'A3', width: 11.69, height: 16.54, note: 'Ideal for posters' },
    { label: 'A2', width: 16.54, height: 23.39, note: 'Large projects' },
    { label: 'Custom', width: null, height: null, note: 'Made on request' },
];

const GSM_GUIDE = [
    { range: '80–100 GSM', label: 'Lightweight', height: '40px', color: '#E8E0D8' },
    { range: '120–180 GSM', label: 'Medium', height: '64px', color: '#D5CCC2' },
    { range: '200–250 GSM', label: 'Heavy', height: '96px', color: '#B5AEA8' },
    { range: '300+ GSM', label: 'Card / Premium', height: '128px', color: '#8A7B70' },
];

export const PAPER_DETAIL: PaperDetail = {
    colors: COLORS,
    sizes: SIZES,
    gsms: GSMS,
    packs: PACKS,
    bulkTiers: BULK_TIERS,
    offers: OFFERS,
    coupons: COUPONS,
    galleryByColor: GALLERY_BY_COLOR,
    highlights: HIGHLIGHTS,
    specifications: SPECIFICATIONS,
    sizeGuide: SIZE_GUIDE,
    gsmGuide: GSM_GUIDE,
};
