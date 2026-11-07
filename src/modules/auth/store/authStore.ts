import { useSyncExternalStore } from 'react';
import { canUseStorage, createStore, readStoredJSON } from '@/lib/createStore';
import { cartStore, wishlistStore } from '@/modules/products/store/store';

/**
 * The shopper's signed-in session.
 *
 * The verified identity (name + WhatsApp number) is what every account-gated
 * screen reads, and the token pair is what the API layer attaches to a request.
 * They live in one record because signing out has to drop them together - keep
 * the tokens and the next mount would authorise with a session the server has
 * already retired.
 *
 * Only the identity is ever exposed through a hook. The tokens stay behind
 * `getSession()`, which the API layer calls, so one cannot reach rendered output.
 *
 * The session is a server fact: it is written from an API response (verify or
 * refresh) and read back by `useCurrentUser()` on load, never invented here.
 */

export type Identity = {
    name: string;
    /** Ten digits, without the country code. */
    phone: string;
    verifiedAt: number;
};

export type Session = {
    identity: Identity;
    accessToken: string;
    refreshToken: string;
};

export const SESSION_KEY = 'wishbox.session.v1';

function isValidSession(candidate: unknown): candidate is Session {
    if (!candidate || typeof candidate !== 'object') return false;
    const record = candidate as Partial<Session>;
    return (
        typeof record.accessToken === 'string' &&
        record.accessToken.length > 0 &&
        typeof record.refreshToken === 'string' &&
        record.refreshToken.length > 0 &&
        Boolean(record.identity) &&
        typeof record.identity?.phone === 'string' &&
        record.identity.phone.length > 0
    );
}

export function readStoredSession(): Session | null {
    const raw = readStoredJSON<unknown>(SESSION_KEY, null);
    return isValidSession(raw) ? raw : null;
}

const session = createStore<Session | null>(readStoredSession(), SESSION_KEY);

export const authStore = {
    subscribe: session.subscribe,

    /** The verified shopper, or null when signed out. */
    get: (): Identity | null => session.get()?.identity ?? null,

    /** The full session for the API layer. Never render these tokens. */
    getSession: (): Session | null => {
        const inMemory = session.get();
        if (inMemory) return inMemory;
        const fromStorage = readStoredSession();
        if (fromStorage) {
            session.set(() => fromStorage);
            return fromStorage;
        }
        return null;
    },

    setSession(next: Session): void {
        session.set(() => next);
    },

    /**
     * Refreshes the stored identity from a server response, keeping the tokens
     * untouched - a name can change on another device.
     */
    syncIdentity(identity: Identity): void {
        session.set((current) => (current ? { ...current, identity } : current));
    },

    /** Local-only rename; the API call that made it stick happens in the hook. */
    updateName(name: string): void {
        const trimmed = name.trim();
        if (!trimmed) return;
        session.set((current) =>
            current ? { ...current, identity: { ...current.identity, name: trimmed } } : current
        );
    },

    /**
     * Signs out and clears all user-scoped local state (cart, coupons, wishlist)
     * so no personal or basket data remains visible when unauthenticated.
     */
    signOut(): void {
        session.set(() => null);
        cartStore.clear();
        wishlistStore.clear();
        if (canUseStorage) {
            try {
                window.localStorage.removeItem(SESSION_KEY);
                window.localStorage.removeItem('wishbox.cart.v1');
                window.localStorage.removeItem('wishbox.coupon.v1');
                window.localStorage.removeItem('wishbox.wishlist.v1');
            } catch {
                /* ignore storage errors */
            }
        }
    },
};

export function useIdentity(): Identity | null {
    return useSyncExternalStore(authStore.subscribe, authStore.get, authStore.get);
}

export const useIsSignedIn = (): boolean => useIdentity() !== null;
