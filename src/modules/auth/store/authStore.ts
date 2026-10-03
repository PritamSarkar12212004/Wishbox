import { useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';

/**
 * The shopper's verified identity.
 *
 * There is no server in this project: verification happens in the browser and
 * only the confirmed name + WhatsApp number are kept, under one storage key.
 * Every account-gated action in the storefront reads from here.
 */

export type Identity = {
    name: string;
    /** Ten digits, without the country code. */
    phone: string;
    verifiedAt: number;
};

const IDENTITY_KEY = 'wishbox.identity.v1';

const identity = createStore<Identity | null>(
    readStoredJSON<Identity | null>(IDENTITY_KEY, null),
    IDENTITY_KEY
);

export const authStore = {
    subscribe: identity.subscribe,
    get: identity.get,

    signIn(name: string, phone: string): Identity {
        const next: Identity = { name: name.trim(), phone, verifiedAt: Date.now() };
        identity.set(() => next);
        return next;
    },

    updateName(name: string): void {
        const trimmed = name.trim();
        if (!trimmed) return;
        identity.set((current) => (current ? { ...current, name: trimmed } : current));
    },

    signOut(): void {
        identity.set(() => null);
    },
};

export function useIdentity(): Identity | null {
    return useSyncExternalStore(authStore.subscribe, authStore.get, authStore.get);
}

export const useIsSignedIn = (): boolean => useIdentity() !== null;
