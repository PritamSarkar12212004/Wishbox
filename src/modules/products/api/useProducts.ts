import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import {
    productApi,
    type CatalogProduct,
    type CategoryCatalogueInput,
    type Coupon,
    type LibraryCatalogue,
    type ProductCategory,
    type ProductInput,
    type ProductListParams,
    type ProductPatch,
    type ProductReviewInput,
} from './productApi';

/**
 * The catalogue hooks.
 *
 * The shop and the admin panel read the same keys, so an edit in the panel
 * invalidates everything that shows a product - listing, PDP, category counts -
 * with one invalidation. That is the replacement for the old client-side store
 * that made admin edits "instant": here they are instant because the cache is
 * rewritten from the row the API returned.
 */

export const productKeys = {
    all: ['products'] as const,
    list: (params: ProductListParams) => ['products', 'list', params] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    categories: ['products', 'categories'] as const,
    adminList: ['products', 'admin', 'list'] as const,
    adminDetail: (slug: string) => ['products', 'admin', 'detail', slug] as const,
    reviews: (slug: string) => ['products', 'reviews', slug] as const,
    coupons: ['coupons'] as const,
    /** General catalogues, which belong to no category. */
    library: ['catalogues'] as const,
};

/** Publishes products the shopper can browse: the shop, search, home rails. */
export function useCatalog(params: ProductListParams = {}): CatalogProduct[] {
    const query = useQuery({
        queryKey: productKeys.list(params),
        queryFn: () => productApi.list(params),
    });
    return query.data ?? [];
}

/** Whether the first page of the catalogue is still on its way. */
export function useCatalogStatus() {
    const query = useQuery({
        queryKey: productKeys.list({}),
        queryFn: () => productApi.list({}),
    });
    return { isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

/** One published product. A draft or a deleted one is an error, not a product. */
export function useCatalogProduct(slug?: string) {
    return useQuery({
        queryKey: productKeys.detail(slug ?? ''),
        queryFn: () => productApi.get(slug as string),
        enabled: Boolean(slug),
        // A product that 404s will keep 404ing; do not hammer the API for it.
        retry: false,
    });
}

export function useCatalogCategories(): ProductCategory[] {
    const query = useQuery({
        queryKey: productKeys.categories,
        queryFn: () => productApi.categories(),
    });
    return query.data ?? [];
}

/** The admin's catalogue: drafts included, and only loaded behind the gate. */
export function useAdminProducts(): CatalogProduct[] {
    const signedIn = useIsSignedIn();
    const query = useQuery({
        queryKey: productKeys.adminList,
        queryFn: () => productApi.adminList(),
        enabled: signedIn,
    });
    return query.data ?? [];
}

export function useAdminProductStatus() {
    const signedIn = useIsSignedIn();
    const query = useQuery({
        queryKey: productKeys.adminList,
        queryFn: () => productApi.adminList(),
        enabled: signedIn,
    });
    return { isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

/**
 * The admin editor's product, drafts included. It falls back to the public
 * detail when the admin list has not loaded yet, so a deep link still works.
 */
export function useAdminProduct(slug?: string) {
    return useQuery({
        queryKey: productKeys.adminDetail(slug ?? ''),
        queryFn: () => productApi.adminGet(slug as string),
        enabled: Boolean(slug),
        retry: false,
    });
}

export function useCoupons(): Coupon[] {
    const query = useQuery({
        queryKey: productKeys.coupons,
        queryFn: () => productApi.coupons(),
    });
    return query.data ?? [];
}

/** Published reviews of one product, plus its live rating summary. */
export function useProductReviews(slug?: string) {
    return useQuery({
        queryKey: productKeys.reviews(slug ?? ''),
        queryFn: () => productApi.reviews(slug as string),
        enabled: Boolean(slug),
    });
}

/**
 * Writes the shopper's review and refreshes what depends on it: the review
 * list, the product's rating, and the cards that show it.
 */
export function useSubmitReview(slug: string) {
    const invalidate = useInvalidateCatalog();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: ProductReviewInput) => productApi.submitReview(slug, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: productKeys.reviews(slug) });
            invalidate();
        },
    });
}

/** Refreshes everything catalogue-shaped after a write. */
function useInvalidateCatalog() {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: productKeys.all });
        void queryClient.invalidateQueries({ queryKey: productKeys.coupons });
    };
}

export function useCreateProduct() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: (input: ProductInput) => productApi.create(input),
        onSuccess: invalidate,
    });
}

export function useUpdateProduct() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: ({ slug, patch }: { slug: string; patch: ProductPatch }) =>
            productApi.update(slug, patch),
        onSuccess: invalidate,
    });
}

export function useDeleteProduct() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: (slug: string) => productApi.remove(slug),
        onSuccess: invalidate,
    });
}

export function useCreateCategory() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: (label: string) => productApi.createCategory(label),
        onSuccess: invalidate,
    });
}

/** The category-free catalogue library: lookbooks and trade lists. */
export function useCatalogueLibrary(): LibraryCatalogue[] {
    const query = useQuery({
        queryKey: productKeys.library,
        queryFn: () => productApi.catalogues(),
    });
    return query.data ?? [];
}

function useInvalidateLibrary() {
    const queryClient = useQueryClient();
    return () => void queryClient.invalidateQueries({ queryKey: productKeys.library });
}

export function useAddLibraryCatalogue() {
    const invalidate = useInvalidateLibrary();
    return useMutation({
        mutationFn: (input: CategoryCatalogueInput) => productApi.addCatalogue(input),
        onSuccess: invalidate,
    });
}

export function useRemoveLibraryCatalogue() {
    const invalidate = useInvalidateLibrary();
    return useMutation({
        mutationFn: (catalogueId: string) => productApi.removeCatalogue(catalogueId),
        onSuccess: invalidate,
    });
}

/** Uploads (or replaces) the official catalogue for a category. */
export function useSetCategoryCatalogue() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: ({ slug, input }: { slug: string; input: CategoryCatalogueInput }) =>
            productApi.setCategoryCatalogue(slug, input),
        onSuccess: invalidate,
    });
}

/** Adds a separate downloadable catalogue to a category. */
export function useAddCategoryCatalogue() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: ({ slug, input }: { slug: string; input: CategoryCatalogueInput }) =>
            productApi.addCategoryCatalogue(slug, input),
        onSuccess: invalidate,
    });
}

export function useRemoveAdditionalCategoryCatalogue() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: ({ slug, catalogueId }: { slug: string; catalogueId: string }) =>
            productApi.removeAdditionalCategoryCatalogue(slug, catalogueId),
        onSuccess: invalidate,
    });
}

export function useRemoveCategoryCatalogue() {
    const invalidate = useInvalidateCatalog();
    return useMutation({
        mutationFn: (slug: string) => productApi.removeCategoryCatalogue(slug),
        onSuccess: invalidate,
    });
}
