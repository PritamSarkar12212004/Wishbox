/**
 * Contact page content — the copy the public Contact page prints.
 *
 * Server-owned, like the footer and the alert strip: `GET /content` serves it
 * and `PATCH /admin/content` saves it. The store is the synchronous copy the
 * page reads, hydrated once on load by `SiteContentSync`; the defaults are only
 * the pre-fetch fallback.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/createStore';
import { DEFAULT_CONTACT_CONTENT, type ContactContent } from '../data/contactContent';

const contact = createStore<ContactContent>(DEFAULT_CONTACT_CONTENT);

export const contactStore = {
    subscribe: contact.subscribe,
    getSnapshot: contact.get,

    /** Replaces the copy with what the API serves or just saved. */
    hydrate(next: ContactContent): void {
        contact.set(() => next);
    },

    /** Merges an edit into the copy — used for optimistic UI only. */
    update(patch: Partial<ContactContent>): void {
        contact.set((current) => ({ ...current, ...patch }));
    },

    /** Back to the shipped page, for a signed-out or offline render. */
    reset(): void {
        contact.set(() => DEFAULT_CONTACT_CONTENT);
    },
};

export function useContactContent(): ContactContent {
    return useSyncExternalStore(
        contactStore.subscribe,
        contactStore.getSnapshot,
        contactStore.getSnapshot
    );
}
