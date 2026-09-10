import { useState, memo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, BadgeCheck, Camera, ChevronDown, Plus } from 'lucide-react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import Theme from '@/assets/Theme/Theme';
import { PRODUCT, REVIEWS, REVIEW_PHOTOS } from '../data/productData';
import { cn } from '@/lib/utils';

const BREAKDOWN = [
    { stars: 5, pct: 82 },
    { stars: 4, pct: 12 },
    { stars: 3, pct: 4 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 },
];

const SORTS = ['Most Helpful', 'Newest First', 'Highest Rated', 'Lowest Rated'];

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
    return (
        <span className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    size={size}
                    style={{
                        color: i <= rating ? Theme.colors.gold : Theme.colors.border,
                        fill: i <= rating ? Theme.colors.gold : 'none',
                    }}
                    aria-hidden="true"
                />
            ))}
        </span>
    );
}

function themeAlpha(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

function CustomerPhotos() {
    const openViewer = useCallback(() => {
        const lightbox = new PhotoSwipeLightbox({
            dataSource: REVIEW_PHOTOS.map((p) => ({ src: p.src, w: 1200, h: 1500, alt: p.alt })),
            pswpModule: PhotoSwipe,
            bgOpacity: 0.94,
        });
        lightbox.init();
        lightbox.loadAndOpen(0);
    }, []);

    return (
        <div className="mt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: Theme.colors.text }}>
                <Camera size={15} style={{ color: Theme.colors.primaryDark }} />
                Customer Photos
                <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}>
                    {REVIEW_PHOTOS.length}
                </span>
            </h3>
            <div className="mt-3 flex flex-wrap gap-2.5">
                {REVIEW_PHOTOS.map((p, idx) => (
                    <button
                        key={p.src + idx}
                        type="button"
                        onClick={openViewer}
                        aria-label={`View customer photo - ${p.alt}`}
                        className="h-20 w-20 overflow-hidden rounded-xl transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                    >
                        <img src={p.thumb} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}

function ReviewCard({ review }: { review: (typeof REVIEWS)[0] }) {
    const [helpful, setHelpful] = useState(false);
    return (
        <article className="rounded-2xl border p-4 md:p-5" style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}>
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold rounded-full"
                    style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }} aria-hidden="true">
                    {review.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>{review.name}</p>
                    <div className="flex items-center gap-1.5">
                        <Stars rating={review.rating} size={13} />
                        <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>{review.date}</span>
                    </div>
                </div>
                {review.verified && (
                    <span className="ml-auto flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: themeAlpha('#2E7D5B', 12), color: '#2E7D5B' }}>
                        <BadgeCheck size={12} />
                        Verified Purchase
                    </span>
                )}
            </div>
            <h4 className="mt-3 text-sm font-semibold" style={{ color: Theme.colors.text }}>{review.title}</h4>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: Theme.colors.textLight }}>{review.text}</p>
            {review.photos.length > 0 && (
                <div className="mt-3 flex gap-2">
                    {review.photos.map((p) => (
                        <img key={p.src} src={p.thumb} alt="" loading="lazy" decoding="async"
                            className="h-16 w-16 cursor-zoom-in rounded-lg object-cover" />
                    ))}
                </div>
            )}
            <button
                type="button"
                onClick={() => setHelpful((v) => !v)}
                aria-pressed={helpful}
                className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5"
                style={{ color: helpful ? '#2E7D5B' : Theme.colors.textMuted }}
            >
                <ThumbsUp size={13} />
                Helpful ({review.helpful + (helpful ? 1 : 0)})
            </button>
        </article>
    );
}

export default memo(function ReviewsSection() {
    const [sort, setSort] = useState(SORTS[0]);
    const [filter, setFilter] = useState<number | null>(null);
    const [shown, setShown] = useState(3);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const list = REVIEWS.filter((r) => (filter ?? r.rating) === r.rating);

    return (
        <section id="reviews" className="scroll-mt-24 rounded-2xl border bg-white/60 p-5 md:p-7"
            style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.sm }}
            aria-label="Ratings and reviews">
            <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: Theme.colors.text }}>
                <Star size={18} fill="currentColor" style={{ color: Theme.colors.gold }} />
                Ratings &amp; Reviews
            </h2>

            {/* Summary */}
            <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="text-center sm:w-40">
                    <p className="text-[44px] font-extrabold leading-none tabular-nums" style={{ color: Theme.colors.text }}>
                        {PRODUCT.rating}
                    </p>
                    <Stars rating={Math.round(PRODUCT.rating)} size={16} />
                    <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                        {PRODUCT.reviewCount.toLocaleString('en-IN')} Ratings
                    </p>
                </div>
                <div className="flex-1 space-y-1.5">
                    {BREAKDOWN.map((b) => (
                        <div key={b.stars} className="flex items-center gap-2.5 text-sm">
                            <span className="flex w-8 items-center gap-0.5" style={{ color: Theme.colors.textMuted }}>
                                {b.stars}
                                <Star size={11} fill="currentColor" style={{ color: Theme.colors.gold, opacity: 0.9 }} />
                            </span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: Theme.colors.border }}>
                                <div className="h-full" style={{ width: `${b.pct}%`, backgroundColor: Theme.colors.gold }} />
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                {b.pct}%
                            </span>
                        </div>
                    ))}
                </div>
                <div className="sm:w-44">
                    <button
                        type="button"
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                        style={{ backgroundColor: Theme.colors.primaryDark }}
                    >
                        <Plus size={15} />
                        Write a Review
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
                {[null, 5, 4, 3, 2, 1].map((f) => (
                    <button
                        key={String(f)}
                        type="button"
                        onClick={() => setFilter(f)}
                        aria-pressed={filter === f}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            filter === f && 'text-white'
                        )}
                        style={{
                            backgroundColor: filter === f ? Theme.colors.primaryDark : Theme.colors.surfaceAlt,
                            color: filter === f ? '#fff' : Theme.colors.textMuted,
                        }}
                    >
                        {f === null ? 'All' : `${f} ★`}
                    </button>
                ))}
                <div className="relative ml-auto" ref={menuRef}>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-expanded={menuOpen}
                        aria-haspopup="menu"
                        className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium"
                        style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                    >
                        Sort: {sort}
                        <ChevronDown size={13} className="transition-transform" style={{ transform: menuOpen ? 'rotate(180deg)' : undefined }} />
                    </button>
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.14 }}
                                role="menu"
                                className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border bg-white p-1.5 shadow-lg"
                                style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.lg }}
                            >
                                {SORTS.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={sort === s}
                                        onClick={() => {
                                            setSort(s);
                                            setMenuOpen(false);
                                        }}
                                        className={cn(
                                            'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm',
                                            sort === s ? 'font-semibold' : 'hover:bg-black/5'
                                        )}
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {s}
                                        {sort === s && (
                                            <BadgeCheck size={13} className="ml-auto" style={{ color: Theme.colors.primaryDark }} />
                                        )}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Reviews list */}
            <div className="mt-5 flex flex-col gap-4">
                {list.slice(0, shown).map((r) => (
                    <ReviewCard key={r.id} review={r} />
                ))}
            </div>
            {list.length === 0 && (
                <p className="mt-5 text-sm" style={{ color: Theme.colors.textMuted }}>
                    No reviews match this rating yet.
                </p>
            )}
            {shown < list.length && (
                <button
                    type="button"
                    onClick={() => setShown((s) => s + 3)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-colors hover:bg-black/5"
                    style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                >
                    Load more reviews
                    <ChevronDown size={14} />
                </button>
            )}
            <CustomerPhotos />
        </section>
    );
});