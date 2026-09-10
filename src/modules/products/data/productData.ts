/**
 * Mock data for the Product Details Page.
 * Frontend-only; no backend, API or database is involved.
 */

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
export type ReviewPhoto = { src: string; thumb: string; alt: string };

export type Review = {
    id: number;
    name: string;
    rating: number;
    title: string;
    text: string;
    date: string;
    verified: boolean;
    helpful: number;
    color: string;
    photos: ReviewPhoto[];
};

export type Faq = { id: number; question: string; answer: string; helpful: number };

export type RelatedProduct = {
    id: number;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    price: number;
    mrp: number;
    discountPct: number;
    badge?: string;
    available: boolean;
};

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

const BASE_PHOTO_IDS = [
    'photo-1586075010923-2dd4570fb338',
    'photo-1528459199175-e5b1bbb10e30',
    'photo-1513364776144-60967b0f800f',
    'photo-1519197924294-4ba991a11128',
    'photo-1452802447250-470a88ac82bc',
    'photo-1457365050282-c53d772ef8b2',
    'photo-1543007630-9710e4a00a20',
    'photo-1584697964358-3e14ca57658b',
];

export const DEFAULT_GALLERY: GalleryItem[] = buildGallery(BASE_PHOTO_IDS, BASE_IMAGES, 'gold');

/** Rose Gold ships with its own image set (demonstrates color → gallery swap). */
export const ROSE_GALLERY: GalleryItem[] = [
    {
        id: 'rose-0',
        src: img('photo-1598367818977-038df1068a97', 1400),
        medium: img('photo-1598367818977-038df1068a97', 900),
        thumb: img('photo-1598367818977-038df1068a97', 160),
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

export const GALLERY_BY_COLOR: Record<string, GalleryItem[]> = {
    Gold: [...DEFAULT_GALLERY.slice(0, 3), VIDEO_ITEM, ...DEFAULT_GALLERY.slice(4)],
    Silver: DEFAULT_GALLERY,
    'Rose Gold': ROSE_GALLERY,
    Pink: DEFAULT_GALLERY,
    Blue: DEFAULT_GALLERY,
    Red: DEFAULT_GALLERY,
};

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

export const BULK_TIERS: BulkTier[] = [
    { min: 1, max: 9, unitPrice: 249, discountPct: 0 },
    { min: 10, max: 49, unitPrice: 219, discountPct: 12 },
    { min: 50, max: 99, unitPrice: 189, discountPct: 24 },
    { min: 100, max: 499, unitPrice: 159, discountPct: 36 },
    { min: 500, max: null, unitPrice: 139, discountPct: 44 },
];

export const PRODUCT = {
    id: 'wb-paper-001',
    sku: 'WB-PAPER-001',
    brand: 'PaperCraft',
    category: 'Paper Decoration',
    subcategory: 'Decorative Paper',
    title: 'Premium Handmade Decorative Paper Sheets',
    rating: 4.8,
    reviewCount: 1248,
    mrp: 399,
    basePrice: 249,
    stock: 8,
    stockStatus: 'in-stock' as 'in-stock' | 'low-stock' | 'out-of-stock' | 'coming-soon',
    includesTax: true,
};

export const OFFERS: Offer[] = [
    {
        icon: 'tag',
        title: '10% OFF on your first order',
        description: 'Use code PAPER10 at checkout. Valid on orders above ₹499.',
        code: 'PAPER10',
    },
    {
        icon: 'gift',
        title: 'Buy 5 packs, get extra 5% off',
        description: 'Auto-applied on 5 or more packs in your cart.',
    },
    {
        icon: 'truck',
        title: 'Free shipping above ₹999',
        description: 'Free doorstep delivery on orders over ₹999.',
    },
    {
        icon: 'card',
        title: 'Extra ₹100 off on prepaid orders',
        description: 'Flat ₹100 discount when paying via UPI, cards or wallets.',
    },
];

export const REVIEW_PHOTOS: ReviewPhoto[] = [
    { src: img('photo-1513364776144-60967b0f800f', 900), thumb: img('photo-1513364776144-60967b0f800f', 160), alt: 'Customer photo - decorative paper in gold' },
    { src: img('photo-1528459199175-e5b1bbb10e30', 900), thumb: img('photo-1528459199175-e5b1bbb10e30', 160), alt: 'Customer photo - craft paper sheets' },
    { src: img('photo-1519197924294-4ba991a11128', 900), thumb: img('photo-1519197924294-4ba991a11128', 160), alt: 'Customer photo - handmade cards' },
    { src: img('photo-1543007630-9710e4a00a20', 900), thumb: img('photo-1543007630-9710e4a00a20', 160), alt: 'Customer photo - gift wrapping' },
    { src: img('photo-1457365050282-c53d772ef8b2', 900), thumb: img('photo-1457365050282-c53d772ef8b2', 160), alt: 'Customer photo - craft project' },
    { src: img('photo-1584697964358-3e14ca57658b', 900), thumb: img('photo-1584697964358-3e14ca57658b', 160), alt: 'Customer photo - origami' },
];

export const REVIEWS: Review[] = [
    {
        id: 1,
        name: 'Ananya Sharma',
        rating: 5,
        title: 'Beautiful quality paper',
        text: 'Exactly as shown in the images. The texture is smooth and the colors are rich. Made my daughter’s birthday decoration look premium and elegant.',
        date: '12 Aug 2026',
        verified: true,
        helpful: 24,
        color: 'Rose Gold',
        photos: [REVIEW_PHOTOS[0], REVIEW_PHOTOS[1]],
    },
    {
        id: 2,
        name: 'Rohan Mehta',
        rating: 4,
        title: 'Great for wedding décor',
        text: 'Used these sheets for an outdoor wedding setup. Sturdy, easy to fold and doesn’t tear easily. Slightly slow shipping but worth the wait.',
        date: '3 Aug 2026',
        verified: true,
        helpful: 18,
        color: 'Gold',
        photos: [REVIEW_PHOTOS[2]],
    },
    {
        id: 3,
        name: 'Priya Nair',
        rating: 5,
        title: 'Premium feel, worth the price',
        text: 'The GSM is accurate and the paper feels heavy and premium. Perfect for scrapbooking. Highly recommend the 150 GSM option.',
        date: '27 Jul 2026',
        verified: true,
        helpful: 31,
        color: 'Pink',
        photos: [REVIEW_PHOTOS[3], REVIEW_PHOTOS[4]],
    },
];

export const FAQS: Faq[] = [
    {
        id: 1,
        question: 'Is this suitable for wedding decoration?',
        answer: 'Yes, it can be used for wedding and event decoration. The higher GSM options (150+) hold their shape well for backdrops, pleats and garlands.',
        helpful: 42,
    },
    {
        id: 2,
        question: 'Can I order in bulk?',
        answer: 'Yes, bulk pricing is available starting at 10 packs. Reach a volume of 500+ packs for the best unit rates, or contact our bulk desk for quotes.',
        helpful: 35,
    },
    {
        id: 3,
        question: 'Are the colors fade-resistant?',
        answer: 'These sheets are dyed with high-quality pigments and are light-fast. Avoid prolonged direct sunlight to keep colors vibrant for years.',
        helpful: 28,
    },
    {
        id: 4,
        question: 'What is the delivery time?',
        answer: 'Metro pincodes receive delivery in 2–3 days. Other locations usually take 4–6 business days. Free shipping kicks in above ₹999.',
        helpful: 19,
    },
];
export const RELATED_PRODUCTS: RelatedProduct[] = [
    {
        id: 11,
        name: 'Matte Pastel Paper Sheets - Decorative Pack',
        image: img('photo-1528459199175-e5b1bbb10e30', 640),
        rating: 4.6,
        reviews: 342,
        price: 199,
        mrp: 299,
        discountPct: 33,
        badge: 'BESTSELLER',
        available: true,
    },
    {
        id: 12,
        name: 'Gold Foil Wrapping Paper Roll',
        image: img('photo-1586075010923-2dd4570fb338', 640),
        rating: 4.7,
        reviews: 518,
        price: 149,
        mrp: 249,
        discountPct: 40,
        available: true,
    },
    {
        id: 13,
        name: 'Origami Paper - 200 Multi Color Sheets',
        image: img('photo-1513364776144-60967b0f800f', 640),
        rating: 4.9,
        reviews: 1284,
        price: 299,
        mrp: 499,
        discountPct: 40,
        badge: 'TOP RATED',
        available: true,
    },
    {
        id: 14,
        name: 'Handmade Paper Gift Bags Set of 12',
        image: img('photo-1519197924294-4ba991a11128', 640),
        rating: 4.5,
        reviews: 276,
        price: 349,
        mrp: 599,
        discountPct: 42,
        available: true,
    },
    {
        id: 15,
        name: 'Premium Cardstock - 250 GSM',
        image: img('photo-1543007630-9710e4a00a20', 640),
        rating: 4.6,
        reviews: 689,
        price: 229,
        mrp: 379,
        discountPct: 40,
        available: true,
    },
];

export const PRODUCT_HIGHLIGHTS = [
    'Premium handmade quality paper',
    'Smooth, even matte texture',
    'Easy to cut, fold and glue',
    'Suitable for decoration & gifting',
    'Eco-friendly material',
    'Multiple colors available',
    'Multiple GSM options',
    'Bulk orders supported',
];

export const SPECIFICATIONS: Array<{ label: string; value: string }> = [
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

export type SizeGuideItem = {
    label: string;
    width: number | null;
    height: number | null;
    note: string;
};

export const SIZE_GUIDE: SizeGuideItem[] = [
    { label: 'A4', width: 8.27, height: 11.69, note: 'Standard printer size' },
    { label: 'A3', width: 11.69, height: 16.54, note: 'Ideal for posters' },
    { label: 'A2', width: 16.54, height: 23.39, note: 'Large projects' },
    { label: 'Custom', width: null, height: null, note: 'Made on request' },
];

export const GSM_GUIDE = [
    { range: '80–100 GSM', label: 'Lightweight', height: '40px', color: '#E8E0D8' },
    { range: '120–180 GSM', label: 'Medium', height: '64px', color: '#D5CCC2' },
    { range: '200–250 GSM', label: 'Heavy', height: '96px', color: '#B5AEA8' },
    { range: '300+ GSM', label: 'Card / Premium', height: '128px', color: '#8A7B70' },
];

export const CARE_TIPS = [
    'Store in a dry place',
    'Keep away from moisture',
    'Avoid direct sunlight',
    'Store flat when possible',
    'Handle carefully to prevent creasing',
];

export function inr(value: number): string {
    return `₹${value.toLocaleString('en-IN')}`;
}

export const RECENTLY_VIEWED: RelatedProduct[] = [
    { ...RELATED_PRODUCTS[2] },
    { ...RELATED_PRODUCTS[1] },
    { ...RELATED_PRODUCTS[4] },
    { ...RELATED_PRODUCTS[0] },
    {
        ...RELATED_PRODUCTS[0],
        id: 61,
        name: 'Decorative Paper Lanterns - Set of 3',
        image: img('photo-1457365050282-c53d772ef8b2', 640),
        rating: 4.4,
        reviews: 189,
        price: 899,
        mrp: 1299,
        discountPct: 31,
    },
];