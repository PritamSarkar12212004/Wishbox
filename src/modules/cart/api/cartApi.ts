import { authedRequest } from '@/modules/auth/api/authApi';

/**
 * Add-to-cart demand.
 *
 * The cart is the browser's own list; this records the *interest* server-side so
 * the admin panel can show how many shoppers want a product and in what
 * quantity. One row per shopper per product, incremented on each add.
 */
export const cartApi = {
    recordAdd(productId: string, qty: number): Promise<void> {
        return authedRequest<void>('/cart/adds', {
            method: 'POST',
            body: { productId, qty },
        });
    },
};
