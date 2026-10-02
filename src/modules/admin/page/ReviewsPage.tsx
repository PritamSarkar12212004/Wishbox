import { useMemo, useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount } from '@/lib/format';
import { PageHeader, Panel, PanelHeader } from '../components/AdminUI';
import BarList from '../components/charts/BarList';
import Tile from '../components/Tile';
import type { AdminReview } from '../data/adminData';
import { useAdminFeed } from '../hooks/useAdminFeed';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

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
                    size={12}
                    style={{
                        color: value <= rating ? Theme.colors.gold : Theme.colors.borderStrong,
                        fill: value <= rating ? Theme.colors.gold : 'none',
                    }}
                />
            ))}
        </span>
    );
}

export default function ReviewsPage() {
    const { dataset } = useAdminFeed();
    const [rating, setRating] = useState<number | 'all'>('all');
    const [status, setStatus] = useState<'all' | AdminReview['status']>('all');

    const stats = useMemo(() => {
        const reviews = dataset.reviews;
        const average = reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(reviews.length, 1);
        return {
            total: reviews.length,
            average,
            pending: reviews.filter((review) => review.status === 'Pending').length,
            fiveStar: reviews.length > 0 ? (reviews.filter((review) => review.rating === 5).length / reviews.length) * 100 : 0,
            byRating: [5, 4, 3, 2, 1].map((value) => ({
                label: `${value} star`,
                value: reviews.filter((review) => review.rating === value).length,
            })),
        };
    }, [dataset.reviews]);

    const visible = useMemo(
        () =>
            dataset.reviews.filter(
                (review) =>
                    (rating === 'all' || review.rating === rating) && (status === 'all' || review.status === status)
            ),
        [dataset.reviews, rating, status]
    );

    return (
        <div>
            <PageHeader
                title="Reviews"
                description={`${compactCount(stats.total)} customer reviews · ${stats.pending} waiting for moderation.`}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
                <Panel className="self-start">
                    <PanelHeader title="Rating spread" meta="How the catalogue is landing" />
                    <BarList
                        rows={stats.byRating.map((row) => ({
                            label: row.label,
                            value: row.value,
                            color: Theme.colors.gold,
                        }))}
                        format={compactCount}
                    />
                </Panel>

                <div>
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            {(['all', 5, 4, 3, 2, 1] as const).map((value) => {
                                const active = rating === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setRating(value)}
                                        className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                                        style={{
                                            borderColor: active ? 'transparent' : Theme.colors.border,
                                            backgroundColor: active ? Theme.colors.text : Theme.colors.surface,
                                            color: active ? Theme.colors.background : Theme.colors.text,
                                        }}
                                    >
                                        {value === 'all' ? 'All ratings' : `${value} ★`}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {(['all', 'Pending', 'Published'] as const).map((value) => {
                                const active = status === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setStatus(value)}
                                        className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                                        style={{
                                            borderColor: active ? 'transparent' : Theme.colors.border,
                                            backgroundColor: active ? Theme.colors.text : Theme.colors.surface,
                                            color: active ? Theme.colors.background : Theme.colors.text,
                                        }}
                                    >
                                        {value === 'all' ? 'Any status' : value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <ul className="flex flex-col gap-3">
                        {visible.slice(0, 30).map((review) => (
                            <li key={review.id}>
                                <Panel className="p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <img
                                                src={review.image}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold">{review.productName}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Stars rating={review.rating} />
                                                    <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                                        {review.customer} · {DATE.format(review.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span
                                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                                            style={{
                                                backgroundColor:
                                                    review.status === 'Published'
                                                        ? Theme.colors.primaryLight
                                                        : Theme.colors.secondary,
                                                color:
                                                    review.status === 'Published'
                                                        ? Theme.colors.primaryDark
                                                        : Theme.colors.text,
                                            }}
                                        >
                                            {review.status}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-[13px] font-semibold">{review.title}</p>
                                    <p className="mt-1 text-xs leading-relaxed" style={{ color: Theme.colors.textLight }}>
                                        {review.comment}
                                    </p>
                                    <p
                                        className="mt-2.5 inline-flex items-center gap-1.5 text-[11px]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        <ThumbsUp size={12} />
                                        {review.helpful} found this helpful
                                    </p>
                                </Panel>
                            </li>
                        ))}
                        {visible.length === 0 && (
                            <Panel className="px-4 py-10 text-center">
                                <p className="text-sm font-semibold">No reviews match</p>
                                <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                                    Try a different rating or status filter.
                                </p>
                            </Panel>
                        )}
                    </ul>

                    <Panel className="mt-4 p-4">
                        <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                            Reviews are generated from delivered orders in the demo dataset. Moderation actions would
                            write to the review API — the storefront PDP reads its rating and review count from the
                            live catalogue.
                        </p>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
