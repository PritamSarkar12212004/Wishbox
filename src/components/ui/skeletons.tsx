import type { ComponentProps, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';

/**
 * The loading language of the storefront.
 *
 * Every screen that waits for the API paints the shape it is about to show, in
 * the shop's own colours, rather than a spinner or a line of text: the page does
 * not jump when the data lands, and a slow connection still looks like WishBox.
 *
 * Each composition carries `role="status"` and a screen-reader line, so the wait
 * is announced without reading out a dozen empty boxes.
 */

/** One themed bar. The base `Skeleton` supplies the pulse animation. */
export function SkeletonBlock({
    className,
    style,
    ...props
}: ComponentProps<'div'>) {
    return (
        <Skeleton
            className={cn('rounded-md', className)}
            style={{ backgroundColor: Theme.colors.surfaceAlt, ...style }}
            {...props}
        />
    );
}

function Status({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div role="status" aria-busy="true" aria-label={label}>
            <span className="sr-only">{label}…</span>
            {children}
        </div>
    );
}

/** A product card in the shape of `ProductCard`, used by every grid. */
export function ProductCardSkeleton() {
    return (
        <div
            aria-hidden="true"
            style={{
                backgroundColor: Theme.colors.surface,
                borderRadius: Theme.BorderRadius.xl,
                border: `1px solid ${Theme.colors.border}`,
                boxShadow: Theme.Shadow.sm,
            }}
            className="overflow-hidden"
        >
            <SkeletonBlock className="h-40 w-full shrink-0 rounded-none sm:h-52 lg:h-52 xl:h-56" />
            <div className="flex flex-1 flex-col p-2.5 sm:p-4">
                <SkeletonBlock className="h-2.5 w-1/3" />
                <SkeletonBlock className="mt-2 h-4 w-11/12" />
                <SkeletonBlock className="mt-1.5 h-4 w-2/3" />
                <SkeletonBlock className="mt-2 h-3.5 w-12" />
                <div
                    className="mt-auto flex items-baseline gap-x-1.5 border-t pt-2 sm:gap-x-2 sm:pt-3"
                    style={{ borderColor: Theme.colors.border }}
                >
                    <SkeletonBlock className="h-5 w-16 sm:h-6 sm:w-24" />
                    <SkeletonBlock className="h-3.5 w-10 sm:h-4 sm:w-14" />
                </div>
                <SkeletonBlock className="mt-2 h-2.5 w-24" />
            </div>
        </div>
    );
}

const GRID_CLASS =
    'grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-5';

/** A grid of card skeletons, for pages that do not use `ProductGrid`. */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <div className={GRID_CLASS} aria-hidden="true">
            {Array.from({ length: count }).map((_, index) => (
                <ProductCardSkeleton key={`product-skeleton-${index}`} />
            ))}
        </div>
    );
}

/**
 * The product page while its record is on the way: breadcrumb, gallery, the buy
 * column and the overview panels below, in the same two-column rhythm.
 */
export function PdpSkeleton() {
    return (
        <Status label="Loading product">
            <div className="mx-auto max-w-[1400px] px-4 pt-6 md:px-6 lg:px-8">
                <SkeletonBlock className="h-3 w-52" />

                <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6 lg:gap-12">
                    <div className="min-w-0 md:col-span-7">
                        <SkeletonBlock className="aspect-[4/5] w-full rounded-2xl" />
                        <div className="mt-3 flex gap-2">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <SkeletonBlock
                                    key={`thumb-${index}`}
                                    className="h-16 w-16 rounded-lg"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="min-w-0 md:col-span-5">
                        <div className="flex items-center justify-between">
                            <SkeletonBlock className="h-4 w-40" />
                            <SkeletonBlock className="h-6 w-20 rounded-full" />
                        </div>
                        <SkeletonBlock className="mt-4 h-8 w-11/12" />
                        <SkeletonBlock className="mt-2 h-8 w-2/3" />
                        <SkeletonBlock className="mt-4 h-5 w-44" />
                        <SkeletonBlock className="mt-4 h-28 w-full rounded-2xl" />
                        <SkeletonBlock className="mt-4 h-24 w-full rounded-2xl" />
                        <SkeletonBlock className="mt-4 h-28 w-full rounded-2xl" />
                        <SkeletonBlock className="mt-4 h-12 w-full rounded-xl" />
                        <SkeletonBlock className="mt-3 h-12 w-full rounded-xl" />
                    </div>
                </div>

                <div className="mt-10 flex flex-col gap-5 pb-10">
                    <SkeletonBlock className="h-44 w-full rounded-2xl" />
                    <SkeletonBlock className="h-60 w-full rounded-2xl" />
                </div>
            </div>
        </Status>
    );
}

/**
 * Order history while the shopper's orders and returns arrive: the heading,
 * the three stat tiles, the status filter and a few collapsed order cards.
 */
export function HistorySkeleton() {
    return (
        <Status label="Loading your orders">
            <div className="w-full px-4 py-8 sm:py-10 md:px-6 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <SkeletonBlock className="h-3 w-32" />
                    <div className="mt-4 flex items-center gap-3">
                        <SkeletonBlock className="h-10 w-10 rounded-full" />
                        <div className="min-w-0 flex-1">
                            <SkeletonBlock className="h-7 w-56 max-w-full" />
                            <SkeletonBlock className="mt-2 h-3 w-72 max-w-full" />
                        </div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:max-w-2xl sm:gap-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <SkeletonBlock
                                key={`stat-${index}`}
                                className="h-16 w-full rounded-xl"
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-5 flex gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <SkeletonBlock
                            key={`filter-${index}`}
                            className="h-8 w-24 shrink-0 rounded-full"
                        />
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SkeletonBlock
                            key={`order-${index}`}
                            className="h-40 w-full rounded-2xl"
                        />
                    ))}
                </div>
            </div>
        </Status>
    );
}

/** Saved addresses while the address book loads — used in the panel and checkout. */
export function AddressListSkeleton({ rows = 3 }: { rows?: number }) {
    return (
        <Status label="Loading your addresses">
            <div className="flex flex-col gap-2.5" aria-hidden="true">
                {Array.from({ length: rows }).map((_, index) => (
                    <div
                        key={`address-${index}`}
                        className="rounded-xl border px-4 py-3.5"
                        style={{
                            borderColor: Theme.colors.border,
                            backgroundColor: Theme.colors.surface,
                        }}
                    >
                        <SkeletonBlock className="h-3.5 w-24" />
                        <SkeletonBlock className="mt-2 h-3 w-11/12" />
                        <SkeletonBlock className="mt-1.5 h-3 w-2/3" />
                    </div>
                ))}
            </div>
        </Status>
    );
}

/** The admin product editor while the draft product loads. */
export function ProductEditorSkeleton() {
    return (
        <Status label="Loading product">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex flex-col gap-6">
                    <SkeletonBlock className="h-24 w-full rounded-xl" />
                    <SkeletonBlock className="h-48 w-full rounded-xl" />
                    <SkeletonBlock className="h-64 w-full rounded-xl" />
                    <SkeletonBlock className="h-40 w-full rounded-xl" />
                </div>
                <div className="flex flex-col gap-6">
                    <SkeletonBlock className="h-64 w-full rounded-xl" />
                    <SkeletonBlock className="h-40 w-full rounded-xl" />
                </div>
            </div>
        </Status>
    );
}

/** A lazy route chunk's first paint: the heading then the product grid. */
export function PageSkeleton() {
    return (
        <Status label="Loading page">
            <div className="mx-auto max-w-[1500px] px-4 py-8 sm:py-10 md:px-6 lg:px-8">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="mt-3 h-8 w-64 max-w-full" />
                <SkeletonBlock className="mt-2 h-3 w-48" />
                <div className="mt-6">
                    <ProductGridSkeleton count={10} />
                </div>
            </div>
        </Status>
    );
}
