import { authedRequest } from '@/modules/auth/api/authApi';

/**
 * The wishlist API.
 *
 * localStorage stays the copy the storefront reads, so the heart never waits on
 * the network. These calls are what make a save visible to the admin panel:
 * `PUT` is idempotent, so pushing the local list twice counts one shopper once.
 */
export type MyWishlist = {
    productIds: string[];
};

const itemPath = (productId: string) => `/wishlist/${encodeURIComponent(productId)}`;

export const wishlistApi = {
    mine(): Promise<MyWishlist> {
        return authedRequest<MyWishlist>('/wishlist');
    },

    save(productId: string): Promise<void> {
        return authedRequest<void>(itemPath(productId), { method: 'PUT' });
    },

    remove(productId: string): Promise<void> {
        return authedRequest<void>(itemPath(productId), { method: 'DELETE' });
    },
};
