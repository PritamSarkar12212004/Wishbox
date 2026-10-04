import { beforeEach, describe, expect, it } from 'vitest';
import { getAdminDataset } from '../data/adminData';
import { adminReviewsStore, type ModeratedReview } from './adminReviewsStore';

/**
 * The reviews page's back end.
 *
 * There is no server, so `adminReviewsStore` is the source of truth the page
 * renders — these tests pin the reply / unpublish contract and the fixture
 * fields the review cards depend on.
 */

const dataset = getAdminDataset();

function anyReview(): ModeratedReview {
    const found = dataset.reviews[0];
    if (!found) throw new Error('Expected a fixture review');
    return found;
}

function pendingReview(): ModeratedReview {
    const found = dataset.reviews.find((review) => review.status === 'Pending');
    if (!found) throw new Error('Expected a review awaiting moderation');
    return found;
}

beforeEach(() => {
    adminReviewsStore.reset();
});

describe('review fixtures', () => {
    it('gives every review the fields a card renders', () => {
        const sample = dataset.reviews.slice(0, 60);
        expect(sample).toHaveLength(60);

        sample.forEach((review) => {
            expect(review.id).toMatch(/^#REV-/);
            expect(review.productName).toBeTruthy();
            expect(review.image).toBeTruthy();
            expect(review.customer).toBeTruthy();
            expect(review.title).toBeTruthy();
            expect(review.comment).toBeTruthy();
            expect(review.rating).toBeGreaterThanOrEqual(1);
            expect(review.rating).toBeLessThanOrEqual(5);
            expect(review.createdAt).toBeTypeOf('number');
        });
    });

    it('covers both moderation states, so the status filter has something to show', () => {
        expect(dataset.reviews.some((review) => review.status === 'Pending')).toBe(true);
        expect(dataset.reviews.some((review) => review.status === 'Published')).toBe(true);
    });
});

describe('admin review actions', () => {
    it('stores a reply with its author and timestamp', () => {
        const review = anyReview();
        const before = Date.now();

        adminReviewsStore.reply(review.id, '  Thanks for the kind words!  ', 'admin@wishbox.in');

        const resolved = adminReviewsStore.resolve(review);
        expect(resolved.reply?.message).toBe('Thanks for the kind words!');
        expect(resolved.reply?.by).toBe('admin@wishbox.in');
        expect(resolved.reply?.at).toBeGreaterThanOrEqual(before);
    });

    it('ignores a blank reply instead of storing an empty one', () => {
        const review = anyReview();

        adminReviewsStore.reply(review.id, '   \n  ', 'admin@wishbox.in');

        expect(adminReviewsStore.resolve(review).reply).toBeUndefined();
    });

    it('replaces an earlier reply rather than stacking replies', () => {
        const review = anyReview();

        adminReviewsStore.reply(review.id, 'First answer', 'admin@wishbox.in');
        adminReviewsStore.reply(review.id, 'Corrected answer', 'admin@wishbox.in');

        expect(adminReviewsStore.resolve(review).reply?.message).toBe('Corrected answer');
    });

    it('clears a reply and leaves the review unanswered again', () => {
        const review = anyReview();

        adminReviewsStore.reply(review.id, 'Answer', 'admin@wishbox.in');
        adminReviewsStore.clearReply(review.id);

        expect(adminReviewsStore.resolve(review).reply).toBeUndefined();
    });

    it('publishes and unpublishes a review', () => {
        const review = pendingReview();
        expect(adminReviewsStore.resolve(review).status).toBe('Pending');

        adminReviewsStore.setStatus(review.id, 'Published');
        expect(adminReviewsStore.resolve(review).status).toBe('Published');

        adminReviewsStore.setStatus(review.id, 'Pending');
        expect(adminReviewsStore.resolve(review).status).toBe('Pending');
    });

    it('never touches a neighbouring review', () => {
        const [first, second] = dataset.reviews;
        if (!first || !second) throw new Error('Expected at least two fixture reviews');

        adminReviewsStore.reply(first.id, 'Only for the first', 'admin@wishbox.in');

        expect(adminReviewsStore.resolve(second).reply).toBeUndefined();
        expect(adminReviewsStore.resolve(second).status).toBe(second.status);
    });

    it('drops every change on reset', () => {
        const review = anyReview();

        adminReviewsStore.reply(review.id, 'Answer', 'admin@wishbox.in');
        adminReviewsStore.setStatus(review.id, 'Pending');
        adminReviewsStore.reset();

        const resolved = adminReviewsStore.resolve(review);
        expect(resolved.reply).toBeUndefined();
        expect(resolved.status).toBe(review.status);
    });
});
