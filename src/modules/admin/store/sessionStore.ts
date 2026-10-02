/**
 * Admin session store — demo access only.
 *
 * The flag is persisted so a refresh keeps the admin signed in. This is NOT
 * real authentication: there is no backend, and anyone with devtools can flip
 * the key. It exists so the admin shell is reachable at /admin without
 * exposing it during normal storefront browsing.
 */

import { useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import adminConst from '../consts/adminConst';

const SESSION_KEY = 'wishbox.admin.session.v1';

const session = createStore<boolean>(readStoredJSON<boolean>(SESSION_KEY, false), SESSION_KEY);

export const adminSessionStore = {
    subscribe: session.subscribe,
    getSnapshot: session.get,

    signIn(email: string, password: string): boolean {
        const ok =
            email.trim().toLowerCase() === adminConst.demo.email &&
            password === adminConst.demo.password;
        if (ok) session.set(() => true);
        return ok;
    },

    signOut(): void {
        session.set(() => false);
    },
};

export function useAdminSession(): boolean {
    return useSyncExternalStore(
        adminSessionStore.subscribe,
        adminSessionStore.getSnapshot,
        () => false
    );
}
