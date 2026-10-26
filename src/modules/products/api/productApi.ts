import { apiRequest } from '@/lib/api/client';
import { authedRequest } from '@/modules/auth/api/authApi';
import { authStore } from '@/modules/auth/store/authStore';

/**
 * The catalogue API.
 *
 * The shop has no catalogue of its own: products and categories are read from
 * MongoDB through these endpoints, and the admin panel writes them through the
 * same client. The types below mirror the API's `PublicProduct` exactly, so a
 * product that arrives here drops straight into the cards, the PDP and the cart.
 */

export type ProductBadge = 'SALE' | 'BESTSELLER' | 'NEW';

/** Physical details captured in the admin editor's specification section. */
export type ProductSpecs = {
    height?: string;
    width?: string;
    gsm?: string;
    packaging?: 'Sealed' | 'Standard';
};

/** A storefront offer attached to a product from the admin editor. */
export type ProductOffer = {
    code: string;
    label: string;
};

/**
 * A quantity break. The order API prices from these, so the cart preview and the
 * amount actually charged come from the same numbers.
 */
export type ProductBulkTier = {
    minQty: number;
    maxQty: number | null;
    unitPrice: number;
};

export type CatalogProduct = {
    /** The product's slug - its public id and its URL. */
    id: string;
    sku: string;
    name: string;
    brand: string;
    category: string;
    rating: number;
    reviewCount: number;
    price: number;
    mrp: number;
    badge?: ProductBadge;
    /** In stock - drives the out-of-stock treatment and blocks purchase. */
    available: boolean;
    /** Unpublished: absent from the shop, search, rails and its own page. */
    hidden: boolean;
    stock: number;
    image: string;
    hoverImage: string;
    description: string;
    highlights: string[];
    beforeImage?: string;
    afterImage?: string;
    gallery?: string[];
    videoUrl?: string;
    specs?: ProductSpecs;
    offer?: ProductOffer;
    bulkTiers?: ProductBulkTier[];
    createdAt?: string;
    updatedAt?: string;
};

export type ProductCategory = {
    id: string;
    label: string;
    sortOrder?: number;
    /** Published products filed under it. */
    productCount?: number;
    /** The official catalogue an admin uploaded for this category. */
    catalogue?: CategoryCatalogue;
};

/** The admin-authored catalogue attached to a category. */
export type CategoryCatalogue = {
    title: string;
    description: string;
    /** Public https URL of the PDF. */
    url: string;
    uploadedAt: string;
};

/** A shopper's review of a product, as the storefront shows it. */
export type ProductReview = {
    id: string;
    rating: number;
    title: string;
    comment: string;
    /** Display name only - the API never exposes another shopper's number. */
    customer: string;
    createdAt: number;
    helpful: number;
    /** True when the signed-in shopper wrote it, so the form starts prefilled. */
    mine: boolean;
    reply?: { message: string; at: number; by: string };
};

/** The rating breakdown under the stars. */
export type ProductReviewSummary = {
    average: number;
    count: number;
    distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
};

export type ProductReviewPage = {
    productId: string;
    summary: ProductReviewSummary;
    reviews: ProductReview[];
};

/** What the review form sends. Stars are whole numbers, 1-5. */
export type ProductReviewInput = {
    rating: number;
    title?: string;
    comment: string;
};

/** What the upload form sends: a title, a blurb and the PDF (or a link to one). */
export type CategoryCatalogueInput = {
    title: string;
    description: string;
    /** A PDF data URI, or an https link to a hosted one. */
    file: string;
};

export type Coupon = {
    code: string;
    label: string;
    kind: 'percent' | 'flat';
    value: number;
    /** Minimum basket the code applies to. */
    minOrder: number;
};

export type ProductSort = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export type ProductListParams = {
    category?: string;
    search?: string;
    badge?: ProductBadge;
    available?: boolean;
    sort?: ProductSort;
    page?: number;
    /** The API caps this at 60 per page. */
    limit?: number;
};

/** What the admin editor sends when creating a product. */
export type ProductInput = {
    name: string;
    /** Omitted on create: the API derives it from the name. */
    slug?: string;
    sku: string;
    brand: string;
    category: string;
    rating?: number;
    reviewCount?: number;
    price: number;
    mrp: number;
    badge?: ProductBadge | null;
    available?: boolean;
    hidden?: boolean;
    stock?: number;
    image: string;
    hoverImage?: string;
    beforeImage?: string | null;
    afterImage?: string | null;
    gallery?: string[];
    videoUrl?: string | null;
    description: string;
    highlights?: string[];
    specs?: ProductSpecs | null;
    offer?: ProductOffer | null;
    bulkTiers?: ProductBulkTier[] | null;
};

export type ProductPatch = Partial<ProductInput>;

/** `list` drops query params that are unset, so the URL stays readable. */
function queryString(params: Record<string, string | number | boolean | undefined>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) return;
        search.set(key, String(value));
    });
    const encoded = search.toString();
    return encoded ? `?${encoded}` : '';
}

/**
 * The API pages its listing at 60 at most.
 *
 * The shop filters, sorts and counts client-side, so a single page would quietly
 * hide everything past the 60th product. The listing therefore walks the pages
 * until one comes back short. The cap is a guard against a runaway loop, not a
 * merchandising limit: 50 pages is 3,000 products, well past this shop's shape.
 */
export const CATALOG_PAGE_SIZE = 60;
const MAX_PAGES = 50;

async function collectPages(
    fetchPage: (page: number) => Promise<CatalogProduct[] | null>
): Promise<CatalogProduct[]> {
    const products: CatalogProduct[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
        const batch = (await fetchPage(page)) ?? [];
        products.push(...batch);
        if (batch.length < CATALOG_PAGE_SIZE) break;
    }

    return products;
}

export const productApi = {
    async list(params: ProductListParams = {}): Promise<CatalogProduct[]> {
        // Paging is handled by `collectPages`, so a caller's page is ignored.
        const rest = { ...params };
        delete rest.page;
        return collectPages((page) =>
            apiRequest<CatalogProduct[]>(
                `/products${queryString({
                    ...rest,
                    limit: CATALOG_PAGE_SIZE,
                    page,
                })}`
            )
        );
    },

    get(slug: string): Promise<CatalogProduct> {
        return apiRequest<CatalogProduct>(`/products/${encodeURIComponent(slug)}`);
    },

    categories(): Promise<ProductCategory[]> {
        return apiRequest<ProductCategory[]>('/categories');
    },

    /** Every product, drafts included. Admin only. */
    async adminList(): Promise<CatalogProduct[]> {
        return collectPages((page) =>
            authedRequest<CatalogProduct[]>(
                `/admin/products${queryString({
                    visibility: 'all',
                    limit: CATALOG_PAGE_SIZE,
                    page,
                })}`
            )
        );
    },

    /** One product that may still be a draft. Admin only. */
    adminGet(slug: string): Promise<CatalogProduct> {
        return authedRequest<CatalogProduct>(`/admin/products/${encodeURIComponent(slug)}`);
    },

    create(input: ProductInput): Promise<CatalogProduct> {
        return authedRequest<CatalogProduct>('/admin/products', { method: 'POST', body: input });
    },

    update(slug: string, patch: ProductPatch): Promise<CatalogProduct> {
        return authedRequest<CatalogProduct>(`/admin/products/${encodeURIComponent(slug)}`, {
            method: 'PATCH',
            body: patch,
        });
    },

    remove(slug: string): Promise<void> {
        return authedRequest<void>(`/admin/products/${encodeURIComponent(slug)}`, {
            method: 'DELETE',
        });
    },

    createCategory(label: string): Promise<ProductCategory> {
        return authedRequest<ProductCategory>('/admin/categories', {
            method: 'POST',
            body: { label },
        });
    },

    /** Uploads or replaces a category's official catalogue. Admin only. */
    setCategoryCatalogue(
        slug: string,
        input: CategoryCatalogueInput
    ): Promise<ProductCategory> {
        return authedRequest<ProductCategory>(
            `/admin/categories/${encodeURIComponent(slug)}/catalogue`,
            { method: 'PUT', body: input }
        );
    },

    removeCategoryCatalogue(slug: string): Promise<ProductCategory> {
        return authedRequest<ProductCategory>(
            `/admin/categories/${encodeURIComponent(slug)}/catalogue`,
            { method: 'DELETE' }
        );
    },

    /**
     * Published reviews for one product.
     *
     * Public, but the access token is sent when there is one: that is what lets
     * the API flag the shopper's own review (`mine`) without a second request.
     */
    reviews(slug: string): Promise<ProductReviewPage> {
        const token = authStore.getSession()?.accessToken;
        return apiRequest<ProductReviewPage>(
            `/products/${encodeURIComponent(slug)}/reviews`,
            token ? { token } : {}
        );
    },

    /** Writes the signed-in shopper's review - one per product, edited in place. */
    submitReview(slug: string, input: ProductReviewInput): Promise<ProductReview> {
        return authedRequest<ProductReview>(
            `/products/${encodeURIComponent(slug)}/reviews`,
            { method: 'POST', body: { title: '', ...input } }
        );
    },

    /** The codes the storefront may advertise, from the API's own table. */
    coupons(): Promise<Coupon[]> {
        return apiRequest<Coupon[]>('/coupons');
    },
};
