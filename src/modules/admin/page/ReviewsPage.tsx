import { useMemo, useState } from 'react';
import {
    Eye,
    EyeOff,
    MessageSquare,
    Pencil,
    RotateCcw,
    Search,
    Send,
    Star,
    ThumbsUp,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import { compactCount } from '@/lib/format';
import { AdminButton, AdminTabs, PageHeader, Panel, TextArea, TextInput } from '../components/AdminUI';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import type { AdminReview } from '../data/adminData';
import { adminReviewsStore, useAdminReviews, type ModeratedReview } from '../store/adminReviewsStore';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

/** How far back a reply can be edited before it is just a new reply. */
const REPLY_MAX = 600;

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type StatusFilter = 'all' | AdminReview['status'];
type ReplyFilter = 'all' | 'replied' | 'unanswered';
type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'highest', label: 'Highest rated' },
    { value: 'lowest', label: 'Lowest rated' },
    { value: 'helpful', label: 'Most helpful' },
];

function Stars({ rating }: { rating: number }) {
    return (
        <span
            className="inline-flex items-center gap-0.5"
            aria-label={`${rating} out of 5 stars`}
            title={`${rating} out of 5`}
        >
            {[1, 2, 3, 4, 5].map((value) => (
                <Star
                    key={value}
                    size={13}
                    style={{
                        color: value <= rating ? Theme.colors.gold : Theme.colors.borderStrong,
                        fill: value <= rating ? Theme.colors.gold : 'none',
                    }}
                />
            ))}
        </span>
    );
}

function StatusChip({ status }: { status: AdminReview['status'] }) {
    const published = status === 'Published';
    return (
        <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{
                backgroundColor: published ? Theme.colors.primaryLight : Theme.colors.secondary,
                color: published ? Theme.colors.primaryDark : Theme.colors.text,
            }}
        >
            {status}
        </span>
    );
}

/**
 * Reviews — one list, filtered.
 *
 * Laid out as a single column: the numbers, then the filters, then the reviews
 * themselves. Each review can be answered, and the reply is stored, shown under
 * the review and editable until the admin is happy with it. Rating counts live
 * on the filter pills rather than in a separate chart, so the distribution and
 * the way to isolate it are the same control.
 */
export default function ReviewsPage() {
    const reviews = useAdminReviews();

    const [rating, setRating] = useState<RatingFilter>('all');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [answered, setAnswered] = useState<ReplyFilter>('all');
    const [sort, setSort] = useState<SortKey>('newest');
    const [search, setSearch] = useState('');

    /* Only one review is composed at a time, so the draft lives here. */
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [draft, setDraft] = useState('');

    const stats = useMemo(() => {
        const total = reviews.length;
        const average = reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(total, 1);
        const countBy = (value: number) => reviews.filter((review) => review.rating === value).length;

        return {
            total,
            average,
            byRating: { 5: countBy(5), 4: countBy(4), 3: countBy(3), 2: countBy(2), 1: countBy(1) },
            fiveStar: total > 0 ? (countBy(5) / total) * 100 : 0,
            pending: reviews.filter((review) => review.status === 'Pending').length,
            replied: reviews.filter((review) => Boolean(review.reply)).length,
        };
    }, [reviews]);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();

        const filtered = reviews.filter((review) => {
            if (rating !== 'all' && review.rating !== Number(rating)) return false;
            if (status !== 'all' && review.status !== status) return false;
            if (answered === 'replied' && !review.reply) return false;
            if (answered === 'unanswered' && review.reply) return false;
            if (!query) return true;
            return (
                review.productName.toLowerCase().includes(query) ||
                review.customer.toLowerCase().includes(query) ||
                review.title.toLowerCase().includes(query) ||
                review.comment.toLowerCase().includes(query)
            );
        });

        const sorted = [...filtered];
        switch (sort) {
            case 'oldest':
                sorted.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'highest':
                sorted.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt);
                break;
            case 'lowest':
                sorted.sort((a, b) => a.rating - b.rating || b.createdAt - a.createdAt);
                break;
            case 'helpful':
                sorted.sort((a, b) => b.helpful - a.helpful);
                break;
            default:
                sorted.sort((a, b) => b.createdAt - a.createdAt);
        }
        return sorted;
    }, [reviews, rating, status, answered, search, sort]);

    const filtersActive = rating !== 'all' || status !== 'all' || answered !== 'all' || search.trim() !== '';

    function clearFilters() {
        setRating('all');
        setStatus('all');
        setAnswered('all');
        setSearch('');
    }

    function openComposer(review: ModeratedReview) {
        setReplyingTo(review.id);
        setDraft(review.reply?.message ?? '');
    }

    function sendReply(review: ModeratedReview) {
        adminReviewsStore.reply(review.id, draft, adminConst.demo.email);
        setReplyingTo(null);
        setDraft('');
        toast.success(`Reply sent to ${review.customer}`, {
            description: `${review.id} · ${review.productName}`,
        });
    }

    function deleteReply(review: ModeratedReview) {
        adminReviewsStore.clearReply(review.id);
        toast('Reply removed', { description: `${review.id} is unanswered again.` });
    }

    function togglePublished(review: ModeratedReview) {
        const next: AdminReview['status'] = review.status === 'Published' ? 'Pending' : 'Published';
        adminReviewsStore.setStatus(review.id, next);
        toast.success(next === 'Published' ? 'Review published' : 'Review unpublished', {
            description: `${review.id} · ${review.productName}`,
        });
    }

    return (
        <div>
            <PageHeader
                title="Reviews"
                description={`${compactCount(stats.total)} customer reviews · ${stats.average.toFixed(2)} ★ average · ${stats.pending} awaiting moderation · ${stats.replied} answered.`}
            >
                <AdminButton
                    onClick={() => {
                        adminReviewsStore.reset();
                        toast('Replies and moderation reset');
                    }}
                >
                    <RotateCcw size={13} />
                    Reset replies
                </AdminButton>
            </PageHeader>

            {/* ── Numbers ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                <Panel>
                    <Tile label="Reviews" value={compactCount(stats.total)} hint="From delivered orders only" />
                </Panel>
                <Panel>
                    <Tile label="Average rating" value={`${stats.average.toFixed(2)} ★`} tone="good" />
                </Panel>
                <Panel>
                    <Tile label="Five star share" value={`${stats.fiveStar.toFixed(0)}%`} tone="good" />
                </Panel>
                <Panel>
                    <Tile label="Pending moderation" value={String(stats.pending)} tone="warn" />
                </Panel>
                <Panel>
                    <Tile label="Replied" value={String(stats.replied)} hint="Answers on record" />
                </Panel>
            </div>

            {/* ── Filters ─────────────────────────────────────────── */}
            <Panel className="mt-6 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                        <Search
                            size={15}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                            style={{ color: Theme.colors.textMuted }}
                        />
                        <TextInput
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search product, customer or text"
                            className="pl-9"
                            aria-label="Search reviews"
                        />
                    </div>

                    <SelectMenu
                        className="w-[168px]"
                        value={sort}
                        options={SORT_OPTIONS}
                        onChange={(value) => setSort(value as SortKey)}
                        label="Sort reviews"
                        menuHeading="Sort by"
                    />

                    <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        {compactCount(visible.length)} of {compactCount(stats.total)} shown
                    </span>

                    {filtersActive && (
                        <AdminButton onClick={clearFilters}>
                            <RotateCcw size={13} />
                            Clear filters
                        </AdminButton>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <AdminTabs
                        label="Filter by rating"
                        value={rating}
                        onChange={(next) => setRating(next as RatingFilter)}
                        tabs={[
                            { value: 'all', label: `All ratings (${stats.total})` },
                            ...[5, 4, 3, 2, 1].map((value) => ({
                                value: String(value),
                                label: `${value} ★ (${stats.byRating[value as 5 | 4 | 3 | 2 | 1]})`,
                            })),
                        ]}
                    />

                    <AdminTabs
                        label="Filter by status"
                        value={status}
                        onChange={(next) => setStatus(next as StatusFilter)}
                        tabs={[
                            { value: 'all', label: 'Any status' },
                            { value: 'Pending', label: `Pending (${stats.pending})` },
                            { value: 'Published', label: `Published (${stats.total - stats.pending})` },
                        ]}
                    />

                    <AdminTabs
                        label="Filter by reply state"
                        value={answered}
                        onChange={(next) => setAnswered(next as ReplyFilter)}
                        tabs={[
                            { value: 'all', label: 'Answered or not' },
                            { value: 'replied', label: `Replied (${stats.replied})` },
                            { value: 'unanswered', label: `Unanswered (${stats.total - stats.replied})` },
                        ]}
                    />
                </div>
            </Panel>

            {/* ── Reviews ─────────────────────────────────────────── */}
            <ul className="mt-6 flex flex-col gap-3">
                {visible.slice(0, 30).map((review) => {
                    const composing = replyingTo === review.id;

                    return (
                        <li key={review.id}>
                            <Panel className="p-4 sm:p-5">
                                <div className="flex flex-wrap items-start gap-3">
                                    <img
                                        src={review.image}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-bold">{review.productName}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {review.customer} · {DATE.format(review.createdAt)} · {review.id}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        <StatusChip status={review.status} />
                                        <AdminButton onClick={() => togglePublished(review)}>
                                            {review.status === 'Published' ? (
                                                <>
                                                    <EyeOff size={13} />
                                                    Unpublish
                                                </>
                                            ) : (
                                                <>
                                                    <Eye size={13} />
                                                    Publish
                                                </>
                                            )}
                                        </AdminButton>
                                        <AdminButton
                                            variant={review.reply ? 'ghost' : 'primary'}
                                            onClick={() => (composing ? setReplyingTo(null) : openComposer(review))}
                                        >
                                            <MessageSquare size={13} />
                                            {review.reply ? 'Edit reply' : 'Reply'}
                                        </AdminButton>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                    <Stars rating={review.rating} />
                                    <span className="text-[11px] font-semibold">{review.rating}.0</span>
                                    <span
                                        className="inline-flex items-center gap-1.5 text-[11px]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        <ThumbsUp size={12} />
                                        {review.helpful} found this helpful
                                    </span>
                                </div>

                                <p className="mt-3 text-[13px] font-semibold">{review.title}</p>
                                <p
                                    className="mt-1 text-xs leading-relaxed"
                                    style={{ color: Theme.colors.textLight }}
                                >
                                    {review.comment}
                                </p>

                                {review.reply && !composing && (
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
                                            WishBox replied · {DATE_TIME.format(review.reply.at)}
                                        </p>
                                        <p
                                            className="mt-1.5 text-xs leading-relaxed"
                                            style={{ color: Theme.colors.text }}
                                        >
                                            {review.reply.message}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                            <span
                                                className="text-[10.5px]"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                Sent by {review.reply.by}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <AdminButton onClick={() => openComposer(review)}>
                                                    <Pencil size={13} />
                                                    Edit
                                                </AdminButton>
                                                <AdminButton variant="danger" onClick={() => deleteReply(review)}>
                                                    <Trash2 size={13} />
                                                    Delete
                                                </AdminButton>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {composing && (
                                    <div className="mt-3">
                                        <TextArea
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            rows={3}
                                            maxLength={REPLY_MAX}
                                            placeholder="Write the reply the customer will see…"
                                            aria-label={`Reply to ${review.customer}`}
                                        />
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                            <span
                                                className="text-[11px] tabular-nums"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                {draft.length}/{REPLY_MAX}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <AdminButton
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setDraft('');
                                                    }}
                                                >
                                                    Cancel
                                                </AdminButton>
                                                <AdminButton
                                                    variant="primary"
                                                    disabled={draft.trim().length === 0}
                                                    onClick={() => sendReply(review)}
                                                >
                                                    <Send size={13} />
                                                    {review.reply ? 'Update reply' : 'Send reply'}
                                                </AdminButton>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Panel>
                        </li>
                    );
                })}

                {visible.length === 0 && (
                    <li>
                        <Panel className="px-4 py-12 text-center">
                            <p className="text-sm font-semibold">No reviews match</p>
                            <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                                Loosen a filter, or search for a different product or customer.
                            </p>
                            {filtersActive && (
                                <div className="mt-4 flex justify-center">
                                    <AdminButton onClick={clearFilters}>Clear filters</AdminButton>
                                </div>
                            )}
                        </Panel>
                    </li>
                )}
            </ul>

            {visible.length > 30 && (
                <p className="mt-3 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                    Showing the first 30 of {compactCount(visible.length)} matching reviews — narrow with a filter or a
                    search to see the rest.
                </p>
            )}

            <Panel className="mt-4 p-4">
                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    Reviews come from delivered orders in the demo dataset, and replies and publish state are stored in
                    this browser — there is no review API to write to. The storefront product page reads its rating and
                    review count from the live catalogue, so these replies stay admin-side.
                </p>
            </Panel>
        </div>
    );
}
