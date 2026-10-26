import { authStore } from '@/modules/auth/store/authStore';
import { wishlistStore } from '@/modules/products/store/store';
import { wishlistApi } from '../api/wishlistApi';

/**
 * Mirrors the browser's wishlist to the API.
 *
 * The UI reads localStorage so a tap is instant, but a save only reaches the
 * admin panel once it is recorded server-side. These writes are fire-and-forget
 * and silent: a wishlist save must never block the heart or raise a toast, and
 * the next sign-in pushes the whole local list again, which repairs anything
 * that failed quietly.
 *
 * Nothing is sent while signed out - the storefront gates the heart behind the
 * login modal, so this is only the leak-proofing check.
 */

export function trackWishlistAdded(productId: string): void {
    if (!authStore.getSession()) return;
    void wishlistApi.save(productId).catch(() => undefined);
}

export function trackWishlistRemoved(productId: string): void {
    if (!authStore.getSession()) return;
    void wishlistApi.remove(productId).catch(() => undefined);
}

/** Records everything this browser has saved, once a session is confirmed. */
export function pushLocalWishlist(): void {
    if (!authStore.getSession()) return;

    wishlistStore
        .getSnapshot()
        .forEach((entry) => void wishlistApi.save(entry.id).catch(() => undefined));
}
