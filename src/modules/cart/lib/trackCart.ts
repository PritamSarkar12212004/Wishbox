import { authStore } from '@/modules/auth/store/authStore';
import { cartApi } from '../api/cartApi';

/**
 * Mirrors an add-to-cart to the API.
 *
 * Fire-and-forget and silent, exactly like the wishlist tracker: adding to the
 * cart must never wait on a network call or raise a toast. Nothing is sent while
 * signed out - the demand report is per shopper, and there is no shopper to
 * attribute it to.
 */
export function trackCartAdd(productId: string, qty: number): void {
    if (!authStore.getSession()) return;
    void cartApi.recordAdd(productId, qty).catch(() => undefined);
}
