import ActionButton from '@/components/ui/action-button';
import { useEffect, useState } from 'react';
import { BadgeCheck, Loader2, MessageSquare, PenLine, Star } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { alphaHex } from '@/lib/color';
import { LOGIN_REASONS } from '@/modules/auth/data/authData';
import { loginGate } from '@/modules/auth/store/loginGate';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import type { CatalogProduct, ProductReview } from '../api/productApi';
import { useProductReviews, useSubmitReview } from '../api/useProducts';

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** Whole stars, filled up to `rating`. `size` is the icon size in pixels. */
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
    return (
        <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((value) => (
                <Star
                    key={value}
                    size={size}
                    style={{
                        color: value <= rating ? Theme.colors.gold : Theme.colors.borderStrong,
                        fill: value <= rating ? Theme.colors.gold : 'none',
                    }}
                />
            ))}
        </span>
    );
}

/** A shopper's review: the stars, what they wrote, and the store's reply. */
function ReviewCard({ review }: { review: ProductReview }) {
    const initial = (review.customer || 'S').trim().charAt(0).toUpperCase();

    return (
        <li
            className="rounded-2xl border p-4"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
        >
            <div className="flex items-start gap-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold"
                    style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                    aria-hidden
                >
                    {initial}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[13px] font-bold">{review.mine ? 'You' : review.customer}</span>
                        {review.mine && (
                            <span
                                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                                style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                            >
                                <BadgeCheck size={10} />
                                Your review
                            </span>
                        )}
                        <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {DATE.format(new Date(review.createdAt))}
                        </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-[11px] font-semibold" style={{ color: Theme.colors.textMuted }}>
                            {review.rating}/5
                        </span>
                    </div>
                    {review.title && <p className="mt-2 text-[13px] font-semibold">{review.title}</p>}
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: Theme.colors.textLight }}>
                        {review.comment}
                    </p>

                    {review.reply && (
                        <div
                            className="mt-3 rounded-xl border p-3"
                            style={{
                                borderColor: Theme.colors.border,
                                backgroundColor: Theme.colors.surfaceAlt,
                            }}
                        >
                            <p
                                className="flex items-center gap-1.5 text-[11px] font-semibold"
                                style={{ color: Theme.colors.primaryDark }}
                            >
                                <MessageSquare size={12} />
                                WishBox replied
                            </p>
                            <p className="mt-1 text-xs leading-relaxed">{review.reply.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}

/**
 * Ratings and reviews for one product.
 *
 * Every number here is counted from the reviews in the database - the summary,
 * the breakdown and the list - so the page cannot show a rating nobody gave.
 * Writing needs an account (the login gate opens instead), and one account gets
 * one review per product: a second submission edits the first.
 */
export default function ProductReviews({ product }: { product: CatalogProduct }) {
    const query = useProductReviews(product.id);
    const submit = useSubmitReview(product.id);
    const signedIn = useIsSignedIn();

    const reviews = query.data?.reviews ?? [];
    const summary = query.data?.summary;
    const mine = reviews.find((review) => review.mine);

    const [composing, setComposing] = useState(false);
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');

    /* An existing review opens the form prefilled, so editing is one tap. */
    useEffect(() => {
        if (!mine) return;
        setRating(mine.rating);
        setTitle(mine.title);
        setComment(mine.comment);
    }, [mine]);

    const busiest = submit.isPending;

    function save() {
        if (rating < 1) {
            toast.error('Choose a star rating first');
            return;
        }
        if (comment.trim().length < 4) {
            toast.error('Write a few words about the product');
            return;
        }

        loginGate.require(() => {
            submit.mutate(
                { rating, title: title.trim(), comment: comment.trim() },
                {
                    onSuccess: () => {
                        setComposing(false);
                        toast.success(mine ? 'Review updated' : 'Thanks for the review', {
                            description: product.name,
                        });
                    },
                    onError: (error) =>
                        toast.error('Could not save your review', {
                            description: error instanceof Error ? error.message : 'Please try again.',
                        }),
                }
            );
        }, LOGIN_REASONS.review);
    }

    const count = summary?.count ?? 0;
    const average = summary?.average ?? 0;

    return (
        <section id="reviews" aria-label="Ratings and reviews" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2
                        className="text-xl font-bold tracking-tight"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                    >
                        Ratings &amp; reviews
                    </h2>
                    <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                        {count > 0
                            ? `From ${count} ${count === 1 ? 'shopper' : 'shoppers'} who bought this product.`
                            : 'No reviews yet — be the first to say what you think.'}
                    </p>
                </div>

                <ActionButton
                    type="button"
                    onClick={() => setComposing((open) => !open)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold transition-colors hover:opacity-80"
                    style={{
                        borderColor: Theme.colors.borderStrong,
                        backgroundColor: Theme.colors.surface,
                        color: Theme.colors.primaryDark,
                    }}
                >
                    <PenLine size={14} />
                    {mine ? 'Edit your review' : 'Write a review'}
                </ActionButton>
            </div>

            <div
                className="rounded-2xl border p-4 sm:p-5"
                style={{
                    borderColor: Theme.colors.border,
                    backgroundColor: Theme.colors.surface,
                    boxShadow: Theme.Shadow.sm,
                }}
            >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                    <div className="shrink-0 text-center sm:text-left">
                        <p className="text-3xl font-extrabold tracking-tight tabular-nums">
                            {count > 0 ? average.toFixed(1) : '—'}
                        </p>
                        <Stars rating={Math.round(average)} size={15} />
                        <p className="mt-1 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {count} {count === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>

                    <div className="min-w-0 flex-1">
                        {(['5', '4', '3', '2', '1'] as const).map((star) => {
                            const hits = summary?.distribution?.[star] ?? 0;
                            const share = count > 0 ? (hits / count) * 100 : 0;

                            return (
                                <div key={star} className="flex items-center gap-2 py-0.5">
                                    <span
                                        className="w-8 shrink-0 text-[11px] font-semibold tabular-nums"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        {star} ★
                                    </span>
                                    <span
                                        className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                                        style={{ backgroundColor: Theme.colors.surfaceAlt }}
                                    >
                                        <span
                                            className="block h-full rounded-full"
                                            style={{
                                                width: `${share}%`,
                                                backgroundColor: Theme.colors.gold,
                                            }}
                                        />
                                    </span>
                                    <span
                                        className="w-8 shrink-0 text-right text-[11px] tabular-nums"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        {hits}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {composing && (
                    <div
                        className="mt-5 rounded-xl border p-4"
                        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
                    >
                        <p className="text-[13px] font-bold">{mine ? 'Update your review' : 'Write your review'}</p>
                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {signedIn
                                ? 'Your name appears on the review. You can edit it any time.'
                                : 'Sign in with your WhatsApp number to post it — one review per product.'}
                        </p>

                        <div className="mt-3 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <ActionButton
                                    key={value}
                                    type="button"
                                    onClick={() => setRating(value)}
                                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                    aria-pressed={rating === value}
                                    className="rounded-md p-0.5 transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={24}
                                        style={{
                                            color: value <= rating ? Theme.colors.gold : Theme.colors.borderStrong,
                                            fill: value <= rating ? Theme.colors.gold : 'none',
                                        }}
                                    />
                                </ActionButton>
                            ))}
                            <span className="ml-2 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {rating > 0 ? `${rating}/5` : 'Tap to rate'}
                            </span>
                        </div>

                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={80}
                            placeholder="Headline (optional)"
                            aria-label="Review headline"
                            className="mt-3 h-10 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                        />

                        <textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="How is the paper, the finish, the packaging? What would you tell a friend?"
                            aria-label="Your review"
                            className="mt-2 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                        />

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                {comment.length}/1000
                            </span>
                            <div className="flex items-center gap-2">
                                <ActionButton
                                    type="button"
                                    onClick={() => setComposing(false)}
                                    disabled={busiest}
                                    className="h-10 rounded-xl border px-4 text-[13px] font-semibold disabled:opacity-50"
                                    style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                                >
                                    Cancel
                                </ActionButton>
                                <ActionButton
                                    type="button"
                                    onClick={save}
                                    disabled={busiest}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
                                    style={{ backgroundColor: Theme.colors.primaryDark }}
                                >
                                    {busiest && <Loader2 size={14} className="animate-spin" />}
                                    {mine ? 'Update review' : 'Post review'}
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {query.isLoading ? (
                <p className="flex items-center gap-2 text-xs" style={{ color: Theme.colors.textMuted }}>
                    <Loader2 size={13} className="animate-spin" />
                    Loading reviews…
                </p>
            ) : reviews.length > 0 ? (
                <ul className="flex flex-col gap-3">
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </ul>
            ) : (
                <div
                    className="rounded-2xl border px-4 py-8 text-center"
                    style={{
                        borderColor: Theme.colors.border,
                        backgroundColor: alphaHex(Theme.colors.primaryLight, 40),
                    }}
                >
                    <p className="text-sm font-semibold">No reviews yet</p>
                    <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                        Bought this? Your review is the first one on the page.
                    </p>
                </div>
            )}
        </section>
    );
}
