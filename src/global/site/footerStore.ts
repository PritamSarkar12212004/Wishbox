/**
 * Footer content — the footer every storefront page renders.
 *
 * Server-owned, like the alert strip: `GET /content` serves it and
 * `PATCH /admin/content` saves it. The store is the synchronous copy the footer
 * reads, hydrated once on load by `SiteContentSync`; the defaults are only the
 * pre-fetch fallback.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/createStore';
import { DEFAULT_FOOTER_CONTENT, type FooterContent } from './footerContent';

const footer = createStore<FooterContent>(DEFAULT_FOOTER_CONTENT);

export const footerStore = {
    subscribe: footer.subscribe,
    getSnapshot: footer.get,

    /** Replaces the copy with what the API serves or just saved. */
    hydrate(next: FooterContent): void {
        footer.set(() => next);
    },

    /** Merges an edit into the copy — used for optimistic UI only. */
    update(patch: Partial<FooterContent>): void {
        footer.set((current) => ({ ...current, ...patch }));
    },

    /** Back to the shipped footer, for a signed-out or offline render. */
    reset(): void {
        footer.set(() => DEFAULT_FOOTER_CONTENT);
    },
};

export function useFooterContent(): FooterContent {
    return useSyncExternalStore(
        footerStore.subscribe,
        footerStore.getSnapshot,
        footerStore.getSnapshot
    );
}
