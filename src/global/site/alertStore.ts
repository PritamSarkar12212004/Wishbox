/**
 * Alert bar content — the strip above the header.
 *
 * The API owns this (`GET /content`, edited through `PATCH /admin/content`).
 * This store is the browser's synchronous copy: the strip has to render on the
 * first paint, before a query resolves, so `SiteContentSync` hydrates it from
 * the server once on load and every admin save writes the response back here.
 *
 * The shipped defaults below are the pre-fetch fallback only — a browser with
 * no API connection shows the shipped strip, never a stale local edit.
 */

import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/createStore';
import { DEFAULT_ALERT_CONTENT, type AlertContent } from './alertContent';

const alert = createStore<AlertContent>(DEFAULT_ALERT_CONTENT);

export const alertStore = {
    subscribe: alert.subscribe,
    getSnapshot: alert.get,

    /** Replaces the copy with what the API serves or just saved. */
    hydrate(next: AlertContent): void {
        alert.set(() => next);
    },

    /** Merges an edit into the copy — used for optimistic UI only. */
    update(patch: Partial<AlertContent>): void {
        alert.set((current) => ({ ...current, ...patch }));
    },

    /** Back to the shipped strip, for a signed-out or offline render. */
    reset(): void {
        alert.set(() => DEFAULT_ALERT_CONTENT);
    },
};

export function useAlertContent(): AlertContent {
    return useSyncExternalStore(
        alertStore.subscribe,
        alertStore.getSnapshot,
        alertStore.getSnapshot
    );
}
