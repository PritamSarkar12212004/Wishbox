import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cartStore, wishlistStore } from '@/modules/products/store/store';
import { pushLocalWishlist } from '@/modules/wishlist/lib/trackWishlist';
import { authKeys, useCurrentUser } from '../api/useAuth';
import { useIsSignedIn } from '../store/authStore';

/**
 * Keeps the stored session honest and ensures all user/cart/wishlist data is
 * wiped whenever no authenticated session is present.
 *
 * Mounted once at app level and renders nothing. The token pair is persisted, so
 * on load the store can only say "a session was here" - this is what asks the
 * API whether it is still good, and what pulls in a name that changed elsewhere.
 * A session that no longer works is emptied in `useCurrentUser`, so the header
 * and the account gates never show a signed-in shopper who cannot do anything.
 */
export default function AuthSessionSync() {
    const queryClient = useQueryClient();
    const signedIn = useIsSignedIn();
    // Subscribing is the whole job; the hook already syncs or clears the store.
    const { data: user } = useCurrentUser();

    /* Whenever auth is absent or removed (e.g. logout or cleared storage),
     * wipe cart, coupon, wishlist, and account query caches so nothing remains visible. */
    useEffect(() => {
        if (!signedIn) {
            cartStore.clear();
            wishlistStore.clear();
            queryClient.removeQueries({ queryKey: authKeys.me });
            queryClient.removeQueries({ queryKey: ['orders'] });
            queryClient.removeQueries({ queryKey: ['returns'] });
            queryClient.removeQueries({ queryKey: ['quotations'] });
            queryClient.removeQueries({ queryKey: ['addresses'] });
            queryClient.removeQueries({ queryKey: ['admin'] });
        }
    }, [signedIn, queryClient]);

    /* A confirmed session is also the moment the browser's saved products are
     * written to the API, so a wishlist built before this build (or while a
     * write failed) still shows up in the admin panel. */
    useEffect(() => {
        if (user) pushLocalWishlist();
    }, [user]);

    return null;
}
