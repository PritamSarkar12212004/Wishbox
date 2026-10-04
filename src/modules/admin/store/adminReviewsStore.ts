/**
 * Admin replies and moderation state for customer reviews.
 *
 * The reviews themselves are seeded demo data, generated in memory on every
 * load, so nothing about them can be written back. What an admin *does* to a
 * review — the public reply they send, whether it is published — is stored here
 * as a patch keyed by review id, exactly the way `adminOrdersStore` handles
 * orders.
 *
 * There is no server, so this store is the backend: the reviews page renders
 * whatever it returns rather than inventing local success.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { getAdminDataset, type AdminReview } from '../data/adminData';

const REVIEWS_KEY = 'wishbox.admin.reviews.v1';
const REVIEWS_VERSION = 1;

/** A reply the store is holding for one review. */
export type ReviewReply = {
    message: string;
    at: number;
    /** Who sent it — the signed-in admin. */
    by: string;
};

/** Everything an admin can change about a review. */
export type ReviewPatch = {
    reply?: ReviewReply;
    status?: AdminReview['status'];
};

/** A review as the page sees it: the seeded row plus any admin changes. */
export type ModeratedReview = AdminReview & { reply?: ReviewReply };

type ReviewState = {
    version: number;
    patches: Record<string, ReviewPatch>;
};

function initialState(): ReviewState {
    const stored = readStoredJSON<ReviewState | null>(REVIEWS_KEY, null);
    if (stored && stored.version === REVIEWS_VERSION && stored.patches) return stored;
    return { version: REVIEWS_VERSION, patches: {} };
}

const reviews = createStore<ReviewState>(initialState(), REVIEWS_KEY);

/** Merges fields into one review's patch, leaving every other review alone. */
function patchReview(id: string, fields: ReviewPatch): void {
    reviews.set((state) => ({
        ...state,
        patches: { ...state.patches, [id]: { ...state.patches[id], ...fields } },
    }));
}

/** Lays a review's stored admin changes on top of its seeded values. */
function withOverrides(review: AdminReview, patches: Record<string, ReviewPatch>): ModeratedReview {
    const patch = patches[review.id];
    return patch ? { ...review, ...patch } : review;
}

export const adminReviewsStore = {
    subscribe: reviews.subscribe,

    /**
     * Sends the admin's public reply, replacing any earlier one. A blank reply
     * is ignored — there is nothing to say, so nothing is stored.
     */
    reply(id: string, message: string, author: string): void {
        const text = message.trim();
        if (!text) return;
        patchReview(id, { reply: { message: text, at: Date.now(), by: author } });
    },

    /** Removes the reply, putting the review back in the unanswered pile. */
    clearReply(id: string): void {
        const patch = reviews.get().patches[id];
        if (!patch) return;
        // Rewritten without the key rather than set to undefined, so the stored
        // JSON stays honest about what is actually there.
        const next = { ...patch };
        delete next.reply;
        reviews.set((state) => ({ ...state, patches: { ...state.patches, [id]: next } }));
    },

    /** Publishes or unpublishes a review. */
    setStatus(id: string, status: AdminReview['status']): void {
        patchReview(id, { status });
    },

    /** Drops every reply and moderation change, back to the seeded reviews. */
    reset(): void {
        reviews.set(() => ({ version: REVIEWS_VERSION, patches: {} }));
    },

    /** One review with its admin changes applied — the value the page renders. */
    resolve(review: AdminReview): ModeratedReview {
        return withOverrides(review, reviews.get().patches);
    },
};

/** The whole review feed with replies and moderation applied. */
export function useAdminReviews(): ModeratedReview[] {
    const state = useSyncExternalStore(reviews.subscribe, reviews.get, reviews.get);

    return useMemo(
        () => getAdminDataset().reviews.map((review) => withOverrides(review, state.patches)),
        [state]
    );
}
