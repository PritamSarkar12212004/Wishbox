import { useEffect } from 'react';
import { pushLocalWishlist } from '@/modules/wishlist/lib/trackWishlist';
import { useCurrentUser } from '../api/useAuth';

/**
 * Keeps the stored session honest.
 *
 * Mounted once at app level and renders nothing. The token pair is persisted, so
 * on load the store can only say "a session was here" - this is what asks the
 * API whether it is still good, and what pulls in a name that changed elsewhere.
 * A session that no longer works is emptied in `useCurrentUser`, so the header
 * and the account gates never show a signed-in shopper who cannot do anything.
 */
export default function AuthSessionSync() {
    // Subscribing is the whole job; the hook already syncs or clears the store.
    const { data: user } = useCurrentUser();

    /* A confirmed session is also the moment the browser's saved products are
     * written to the API, so a wishlist built before this build (or while a
     * write failed) still shows up in the admin panel. */
    useEffect(() => {
        if (user) pushLocalWishlist();
    }, [user]);

    return null;
}
