/**
 * Home page content — the hero every storefront visitor sees first.
 *
 * Server-owned, like the alert strip and the footer: `GET /content` serves it
 * and `PATCH /admin/content` saves it. The store is the synchronous copy the
 * hero reads, hydrated once on load by `SiteContentSync`; the defaults are only
 * the pre-fetch fallback.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/createStore';
import { DEFAULT_HOME_CONTENT, type HomeContent } from '../data/homeContent';

const home = createStore<HomeContent>(DEFAULT_HOME_CONTENT);

export const homeStore = {
    subscribe: home.subscribe,
    getSnapshot: home.get,

    /** Replaces the copy with what the API serves or just saved. */
    hydrate(next: HomeContent): void {
        home.set(() => next);
    },

    /** Merges an edit into the copy — used for optimistic UI only. */
    update(patch: Partial<HomeContent>): void {
        home.set((current) => ({ ...current, ...patch }));
    },

    /** Back to the shipped hero, for a signed-out or offline render. */
    reset(): void {
        home.set(() => DEFAULT_HOME_CONTENT);
    },
};

export function useHomeContent(): HomeContent {
    return useSyncExternalStore(homeStore.subscribe, homeStore.getSnapshot, homeStore.getSnapshot);
}
