/**
 * Single source of truth for the storefront catalogue.
 *
 * Every product card, the PDP, the cart and the wishlist all resolve their
 * product data from here, so ids stay unique and prices can never drift
 * between pages. Frontend-only: no backend, API or database is involved.
 */

export type ProductCategoryId = 'paper-craft' | 'home-decor' | 'lighting' | 'clocks';

export type ProductBadge = 'SALE' | 'BESTSELLER' | 'NEW';

export type CatalogProduct = {
    id: string;
    sku: string;
    name: string;
    brand: string;
    category: ProductCategoryId;
    rating: number;
    reviewCount: number;
    price: number;
    mrp: number;
    badge?: ProductBadge;
    /** In stock — drives the out-of-stock treatments and blocks purchase. */
    available: boolean;
    /**
     * Unpublished: excluded from the shop listing, search and home rails, and
     * its product page reports as not found. Absent means published.
     */
    hidden?: boolean;
    /** Remaining units — drives the low-stock label on the PDP. */
    stock: number;
    image: string;
    hoverImage: string;
    description: string;
    highlights: string[];
};

const img = (id: string, w: number, h: number) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

/** Percentage saved against MRP, always derived so it can never disagree with the prices. */
export function discountPercent(product: Pick<CatalogProduct, 'price' | 'mrp'>): number {
    if (product.mrp <= product.price) return 0;
    return Math.round((1 - product.price / product.mrp) * 100);
}

/** The only product with a rich PDP (colour/size/GSM variants, bulk pricing, guides). */
export const FLAGSHIP_PRODUCT_ID = 'premium-handmade-decorative-paper';

export const CATALOG: CatalogProduct[] = [
    {
        id: FLAGSHIP_PRODUCT_ID,
        sku: 'WB-PAPER-001',
        name: 'Premium Handmade Decorative Paper Sheets',
        brand: 'PaperCraft',
        category: 'paper-craft',
        rating: 4.8,
        reviewCount: 1248,
        price: 249,
        mrp: 399,
        badge: 'BESTSELLER',
        available: true,
        stock: 8,
        image: img('photo-1586075010923-2dd4570fb338', 600, 750),
        hoverImage: img('photo-1517842645767-c639042777db', 600, 750),
        description:
            'Hand-pressed decorative paper with a smooth matte finish, made for gifting, crafting and event décor.',
        highlights: [
            'Premium handmade quality paper',
            'Smooth, even matte texture',
            'Easy to cut, fold and glue',
            'Suitable for decoration & gifting',
        ],
    },
    {
        id: 'matte-pastel-paper-pack',
        sku: 'WB-PAPER-002',
        name: 'Matte Pastel Paper Sheets – Decorative Pack',
        brand: 'VibeCrafts',
        category: 'paper-craft',
        rating: 4.6,
        reviewCount: 342,
        price: 199,
        mrp: 299,
        badge: 'BESTSELLER',
        available: true,
        stock: 34,
        image: img('photo-1517842645767-c639042777db', 600, 750),
        hoverImage: img('photo-1452802447250-470a88ac82bc', 600, 750),
        description:
            'A curated pack of soft pastel sheets that takes ink and paint beautifully — ideal for scrapbooking and handmade cards.',
        highlights: [
            'Eight coordinated pastel shades',
            'Acid-free, fade-resistant dyes',
            'Perfect for scrapbooking',
            'Ships flat in a protective sleeve',
        ],
    },
    {
        id: 'origami-paper-200-sheets',
        sku: 'WB-PAPER-003',
        name: 'Origami Paper – 200 Multi Colour Sheets',
        brand: 'PaperCraft',
        category: 'paper-craft',
        rating: 4.9,
        reviewCount: 1284,
        price: 299,
        mrp: 499,
        badge: 'BESTSELLER',
        available: true,
        stock: 120,
        image: img('photo-1513364776144-60967b0f800f', 600, 750),
        hoverImage: img('photo-1584697964358-3e14ca57658b', 600, 750),
        description:
            'Two hundred crisp, perfectly square sheets in 20 colours — the classic pack for origami and paper crafts.',
        highlights: [
            '200 sheets, 20 colours',
            'Crisp creases, no cracking',
            'True 15 × 15 cm squares',
            'Loved by beginners and folders alike',
        ],
    },
    {
        id: 'handmade-paper-gift-bags',
        sku: 'WB-PAPER-004',
        name: 'Handmade Paper Gift Bags – Set of 12',
        brand: 'Lume',
        category: 'paper-craft',
        rating: 4.5,
        reviewCount: 276,
        price: 349,
        mrp: 599,
        available: true,
        stock: 41,
        image: img('photo-1519197924294-4ba991a11128', 600, 750),
        hoverImage: img('photo-1543007630-9710e4a00a20', 600, 750),
        description:
            'Sturdy handmade bags with cotton handles, sized for gifting jewellery, soaps and small décor pieces.',
        highlights: [
            '12 bags with cotton rope handles',
            'Reinforced fold-over top',
            'Recyclable and plastic-free',
            'Fits petites gift sets',
        ],
    },
    {
        id: 'craft-paper-multipack',
        sku: 'WB-PAPER-005',
        name: 'Craft Paper Multipack – 50 Sheets',
        brand: 'ArtisanHome',
        category: 'paper-craft',
        rating: 4.3,
        reviewCount: 198,
        price: 149,
        mrp: 249,
        available: true,
        stock: 76,
        image: img('photo-1452802447250-470a88ac82bc', 600, 750),
        hoverImage: img('photo-1586075010923-2dd4570fb338', 600, 750),
        description:
            'Everyday craft paper for wrapping, school projects and prototyping — tough enough to fold without tearing.',
        highlights: [
            '50 large-format sheets',
            'Tear-resistant fibre blend',
            'Takes markers and paint',
            'Great value for classrooms',
        ],
    },
    {
        id: 'decorative-ribbon-spool',
        sku: 'WB-CRAFT-006',
        name: 'Decorative Craft Ribbon Spool',
        brand: 'ArtisanHome',
        category: 'paper-craft',
        rating: 3.9,
        reviewCount: 154,
        price: 129,
        mrp: 199,
        available: false,
        stock: 0,
        image: img('photo-1457365050282-c53d772ef8b2', 600, 750),
        hoverImage: img('photo-1519197924294-4ba991a11128', 600, 750),
        description:
            'A 25-metre spool of soft double-faced ribbon for gift wrapping, garlands and table styling.',
        highlights: [
            '25 m double-faced satin ribbon',
            'Holds a crisp bow',
            'Colour-fast and iron-safe',
            'Restocking soon',
        ],
    },
    {
        id: 'gold-foil-wrapping-roll',
        sku: 'WB-PAPER-007',
        name: 'Gold Foil Wrapping Paper Roll',
        brand: 'ArtisanHome',
        category: 'paper-craft',
        rating: 4.7,
        reviewCount: 518,
        price: 149,
        mrp: 249,
        badge: 'SALE',
        available: true,
        stock: 63,
        image: img('photo-1543007630-9710e4a00a20', 600, 750),
        hoverImage: img('photo-1607083206968-13611e3d76db', 600, 750),
        description:
            'Matte kraft paper with a soft gold foil pattern — festive wrapping that photographs beautifully.',
        highlights: [
            '10 m roll, 70 cm wide',
            'Soft metallic gold foil',
            'Matte kraft reverse side',
            'FSC-certified paper',
        ],
    },
    {
        id: 'premium-cardstock-250gsm',
        sku: 'WB-PAPER-008',
        name: 'Premium Cardstock – 250 GSM',
        brand: 'Timeless',
        category: 'paper-craft',
        rating: 4.6,
        reviewCount: 689,
        price: 229,
        mrp: 379,
        available: true,
        stock: 58,
        image: img('photo-1584697964358-3e14ca57658b', 600, 750),
        hoverImage: img('photo-1517842645767-c639042777db', 600, 750),
        description:
            'Heavyweight cardstock that holds a crease and carries print without buckling — for cards, tags and packaging.',
        highlights: [
            '250 GSM heavyweight stock',
            'Double-sided smooth finish',
            'Laser and inkjet friendly',
            '30 sheets per pack',
        ],
    },
    {
        id: 'rose-gold-shimmer-paper',
        sku: 'WB-PAPER-009',
        name: 'Rose Gold Shimmer Paper Sheets',
        brand: 'PaperCraft',
        category: 'paper-craft',
        rating: 4.4,
        reviewCount: 208,
        price: 259,
        mrp: 399,
        available: true,
        stock: 27,
        image: img('photo-1607083206968-13611e3d76db', 600, 750),
        hoverImage: img('photo-1513364776144-60967b0f800f', 600, 750),
        description:
            'Pearlescent rose-gold sheets with a fine shimmer that catches the light without shedding glitter.',
        highlights: [
            'Fine pearl shimmer finish',
            'No glitter shedding',
            'Perfect for wedding stationery',
            '20 sheets per pack',
        ],
    },
    {
        id: 'led-round-wall-mirror',
        sku: 'WB-DECOR-010',
        name: 'Modern Designer LED Round Wall Mirror',
        brand: 'VibeCrafts',
        category: 'home-decor',
        rating: 4.2,
        reviewCount: 187,
        price: 5270,
        mrp: 9999,
        badge: 'SALE',
        available: true,
        stock: 12,
        image: img('photo-1618220179428-22790b461013', 600, 750),
        hoverImage: img('photo-1513364776144-60967b0f800f', 600, 750),
        description:
            'A dimmable halo-lit mirror that doubles as a statement wall piece for entryways and dressing corners.',
        highlights: [
            'Touch-dimmable LED halo',
            'Three colour temperatures',
            'Aluminium frame, 60 cm',
            'Wall-mount hardware included',
        ],
    },
    {
        id: 'ceramic-vase-set',
        sku: 'WB-DECOR-011',
        name: 'Handmade Ceramic Vase Set',
        brand: 'ArtisanHome',
        category: 'home-decor',
        rating: 4.3,
        reviewCount: 231,
        price: 1899,
        mrp: 2800,
        badge: 'NEW',
        available: true,
        stock: 19,
        image: img('photo-1578749556568-bc2c40e68b61', 600, 750),
        hoverImage: img('photo-1586075010923-2dd4570fb338', 600, 750),
        description:
            'A trio of wheel-thrown stoneware vases in tonal glazes — beautiful empty, better with dried stems.',
        highlights: [
            'Set of three, tallest 24 cm',
            'Food-safe reactive glaze',
            'Waterproof sealed interior',
            'Each piece is one of a kind',
        ],
    },
    {
        id: 'wooden-wall-clock',
        sku: 'WB-CLOCK-012',
        name: 'Elegant Wooden Wall Clock',
        brand: 'Timeless',
        category: 'clocks',
        rating: 4.4,
        reviewCount: 402,
        price: 2999,
        mrp: 4500,
        badge: 'NEW',
        available: true,
        stock: 23,
        image: img('photo-1563861826100-9cb868fdbe1c', 600, 750),
        hoverImage: img('photo-1457365050282-c53d772ef8b2', 600, 750),
        description:
            'Solid ash clock with a silent sweep movement, hand-finished in a warm walnut tone.',
        highlights: [
            'Silent sweep, no ticking',
            'Solid ash, walnut finish',
            '40 cm dial, 1-year warranty',
            'Runs on a single AA cell',
        ],
    },
    {
        id: 'minimalist-desk-lamp',
        sku: 'WB-LIGHT-013',
        name: 'Minimalist Desk Lamp',
        brand: 'Lume',
        category: 'lighting',
        rating: 4.7,
        reviewCount: 356,
        price: 2199,
        mrp: 3200,
        badge: 'BESTSELLER',
        available: true,
        stock: 31,
        image: img('photo-1507473885765-e6ed057f782c', 600, 750),
        hoverImage: img('photo-1543007630-9710e4a00a20', 600, 750),
        description:
            'A slim, warm-toned desk lamp with a weighted base and stepless dimming for late-night work.',
        highlights: [
            'Stepless touch dimming',
            '3000K warm-white LED',
            'Weighted, non-slip base',
            'USB-C powered, cable included',
        ],
    },
];

/** Lookup map so pages never re-filter the catalogue to find one product. */
export const CATALOG_BY_ID: Record<string, CatalogProduct> = Object.fromEntries(
    CATALOG.map((product) => [product.id, product])
);

export function getProduct(id: string | undefined): CatalogProduct | undefined {
    return id ? CATALOG_BY_ID[id] : undefined;
}
