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
    useCurrentUser();
    return null;
}
