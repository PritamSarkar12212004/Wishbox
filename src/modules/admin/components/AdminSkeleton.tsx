import { memo, type ComponentProps, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { skeletonKeyFor, type AdminSkeletonKey } from '../lib/skeletonKey';

/**
 * Skeleton loaders for the admin panel.
 *
 * One place owns every admin loading state, so the shell, the lazy route
 * chunks and the first data frame all show the *same shape* the page is about
 * to render — no layout shift, no spinner flash.
 *
 * Performance design:
 *  - Bars are static, plain divs: no per-block animation and no per-block
 *    gradient. A 60-bar page paints 60 solid rectangles.
 *  - The shimmer is a *single* translated overlay per skeleton canvas
 *    (`SkeletonSheen`), so the whole page costs exactly one compositor
 *    animation instead of one per block.
 *  - The keyframes are injected once into a <style> tag, outside React's
 *    render path.
 *  - `prefers-reduced-motion` disables the sweep entirely.
 *  - Every skeleton is memoised, so it never re-renders while the admin feed
 *    ticks underneath it.
 *  - Each skeleton mirrors its page's real Tailwind responsive classes, so the
 *    placeholder is correct from 320px to 4K with no JS breakpoint logic.
 */

/* ------------------------------------------------------------------ */
/*  Shimmer                                                            */
/* ------------------------------------------------------------------ */

const SHIMMER_CSS = `
@keyframes wishbox-admin-sheen {
    0%   { transform: translate3d(-110%, 0, 0); }
    100% { transform: translate3d(110%, 0, 0); }
}
.wishbox-admin-sheen {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.85) 50%,
        transparent 100%
    );
    animation: wishbox-admin-sheen 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
    .wishbox-admin-sheen { animation: none; opacity: 0; }
}
`;

let sheenInjected = false;

/** Injects the sweep keyframes once per document. */
function ensureSheen(): void {
    if (sheenInjected || typeof document === 'undefined') return;
    sheenInjected = true;
    const tag = document.createElement('style');
    tag.setAttribute('data-wishbox', 'admin-skeleton');
    tag.textContent = SHIMMER_CSS;
    document.head.appendChild(tag);
}

/**
 * The page-level loading canvas: one relative wrapper, one sweeping overlay.
 * Every page skeleton renders through this, which is what keeps the animation
 * count at exactly one regardless of how many blocks the page has.
 */
export const SkeletonCanvas = memo(function SkeletonCanvas({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    ensureSheen();
    return (
        <div className={cn('relative overflow-hidden', className)}>
            {children}
            <span aria-hidden="true" className="wishbox-admin-sheen" />
        </div>
    );
});

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

type BarProps = ComponentProps<'div'> & {
    rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
};

const ROUNDED: Record<NonNullable<BarProps['rounded']>, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
};

/** A single static block. Always give it an explicit height class. */
export const Bar = memo(function Bar({ className = '', rounded = 'md', style, ...rest }: BarProps) {
    return (
        <div
            aria-hidden="true"
            className={cn('shrink-0', ROUNDED[rounded], className)}
            style={{ backgroundColor: Theme.colors.surfaceAlt, ...style }}
            {...rest}
        />
    );
});

/** A block of text: a full-width line, then progressively shorter lines. */
export const TextBlock = memo(function TextBlock({
    lines = 2,
    className = '',
    lineClassName = 'h-3',
}: {
    lines?: number;
    className?: string;
    lineClassName?: string;
}) {
    const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3'];
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            {Array.from({ length: lines }, (_, index) => (
                <Bar key={index} className={cn(lineClassName, widths[index % widths.length])} />
            ))}
        </div>
    );
});

/** Placeholder for a Panel — matches its radius, border and shadow exactly. */
export const SkeletonPanel = memo(function SkeletonPanel({
    className = '',
    children,
}: {
    className?: string;
    children?: ReactNode;
}) {
    return (
        <div
            aria-hidden="true"
            className={cn('overflow-hidden', className)}
            style={{
                backgroundColor: Theme.colors.surface,
                border: `1px solid ${Theme.colors.border}`,
                borderRadius: Theme.BorderRadius.lg,
                boxShadow: Theme.Shadow.sm,
            }}
        >
            {children}
        </div>
    );
});

/** Placeholder for PanelHeader: a title, a meta line and an optional action. */
export const SkeletonPanelHeader = memo(function SkeletonPanelHeader({
    action = false,
}: {
    action?: boolean;
}) {
    return (
        <div
            className="flex items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
            style={{ borderColor: Theme.colors.border }}
        >
            <div className="flex min-w-0 flex-col gap-1.5">
                <Bar className="h-3.5 w-32 sm:w-40" />
                <Bar className="h-2.5 w-44 sm:w-56" />
            </div>
            {action && <Bar className="h-8 w-20" rounded="lg" />}
        </div>
    );
});

/**
 * Placeholder for PageHeader. The title block and the control cluster stay
 * separate flex children, so the real controls land exactly where the skeleton
 * put them at every breakpoint.
 */
export const SkeletonPageHeader = memo(function SkeletonPageHeader({
    controls = 1,
    title = 'w-40 sm:w-52',
    description = 'w-64 sm:w-80',
}: {
    controls?: number;
    title?: string;
    description?: string;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-2.5">
                <Bar className={cn('h-6 sm:h-7', title)} rounded="lg" />
                <Bar className={cn('h-3', description)} />
            </div>
            {controls > 0 && (
                <div className="flex min-w-0 grow flex-wrap items-center justify-end gap-4">
                    {Array.from({ length: controls }, (_, index) => (
                        <Bar
                            key={index}
                            className={cn('h-9', index === 0 ? 'w-32' : 'w-28')}
                            rounded="lg"
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

/** Placeholder for a Tile, rendered inside its Panel so the grid seams match. */
export const SkeletonTile = memo(function SkeletonTile({ hint = true }: { hint?: boolean }) {
    return (
        <div className="px-4 py-3.5" style={{ backgroundColor: Theme.colors.surface }}>
            <Bar className="h-2.5 w-20" />
            <Bar className="mt-2 h-5 w-16" />
            {hint && <Bar className="mt-1.5 h-2.5 w-24" />}
        </div>
    );
});

/** A responsive metric grid — same columns and gaps as the real tile rows. */
export const SkeletonTileGrid = memo(function SkeletonTileGrid({
    columns = 4,
    count = 4,
    className = '',
}: {
    /** `2`/`3`/`4`/`5`/`6` map to the same Tailwind column classes the pages use. */
    columns?: 2 | 3 | 4 | 5 | 6;
    count?: number;
    className?: string;
}) {
    const columnClass =
        columns === 6
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
            : columns === 5
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
              : columns === 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-4';

    return (
        <div className={cn('grid gap-3 sm:gap-4', columnClass, className)}>
            {Array.from({ length: count }, (_, index) => (
                <SkeletonPanel key={index}>
                    <SkeletonTile />
                </SkeletonPanel>
            ))}
        </div>
    );
});

/**
 * Placeholder for DataTable — the same scroll box, min-width and column rhythm,
 * so a narrow screen scrolls the placeholder exactly like the real table.
 */
export const SkeletonTable = memo(function SkeletonTable({
    rows = 8,
    columns = 6,
    minWidth = 760,
    className = '',
}: {
    rows?: number;
    columns?: number;
    minWidth?: number;
    className?: string;
}) {
    const widths = ['w-20', 'w-28', 'w-16', 'w-24', 'w-14', 'w-20', 'w-16', 'w-24'];
    return (
        <SkeletonPanel className={className}>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" style={{ minWidth }}>
                    <thead>
                        <tr>
                            {Array.from({ length: columns }, (_, index) => (
                                <th key={index} scope="col" className="px-4 py-3 sm:px-5">
                                    <Bar className={cn('h-2.5', widths[index % widths.length])} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }, (_, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="border-t"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                {Array.from({ length: columns }, (_, columnIndex) => (
                                    <td key={columnIndex} className="px-4 py-3.5 sm:px-5">
                                        <Bar
                                            className={cn(
                                                'h-3',
                                                columnIndex === 0
                                                    ? 'w-28'
                                                    : widths[(rowIndex + columnIndex) % widths.length]
                                            )}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SkeletonPanel>
    );
});

/** Placeholder for the small status chips and pills used across the tables. */
export const SkeletonPill = memo(function SkeletonPill({ className = 'w-16' }: { className?: string }) {
    return <Bar className={cn('h-4', className)} rounded="full" />;
});

/** The two-column content grid most admin pages use. */
export const SkeletonSplit = memo(function SkeletonSplit({
    ratio = 'even',
    children,
    className = '',
}: {
    /** Mirrors the page's asymmetric grid templates. */
    ratio?: 'even' | 'wide-left' | 'wide-right';
    children: ReactNode;
    className?: string;
}) {
    const columns =
        ratio === 'wide-left'
            ? 'xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]'
            : ratio === 'wide-right'
              ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]'
              : 'xl:grid-cols-2';
    return <div className={cn('grid grid-cols-1 gap-6', columns, className)}>{children}</div>;
});

/** A generic panel body: optional header plus shimmering content rows. */
export const SkeletonPanelBody = memo(function SkeletonPanelBody({
    header = true,
    action = false,
    lines = 4,
    className = '',
}: {
    header?: boolean;
    action?: boolean;
    lines?: number;
    className?: string;
}) {
    return (
        <SkeletonPanel className={className}>
            {header && <SkeletonPanelHeader action={action} />}
            <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
                {Array.from({ length: lines }, (_, index) => (
                    <Bar key={index} className="h-3" style={{ width: `${92 - index * 9}%` }} />
                ))}
            </div>
        </SkeletonPanel>
    );
});

/** Stand-in for the chart panels (donut, trend, bar list). */
export const SkeletonChart = memo(function SkeletonChart({
    height = 200,
    header = true,
    className = '',
}: {
    height?: number;
    header?: boolean;
    className?: string;
}) {
    return (
        <SkeletonPanel className={className}>
            {header && <SkeletonPanelHeader />}
            <div className="px-4 py-5 sm:px-5">
                <div className="flex items-end justify-center gap-2" style={{ height }}>
                    {[0.45, 0.7, 0.55, 0.9, 0.62, 0.78, 0.5].map((factor, index) => (
                        <Bar
                            key={index}
                            className="w-full"
                            rounded="lg"
                            style={{ height: `${Math.round(height * factor)}px`, maxWidth: 48 }}
                        />
                    ))}
                </div>
            </div>
        </SkeletonPanel>
    );
});

/** A card row used by the list-shaped pages (reviews, tracking, reports). */
export const SkeletonCardList = memo(function SkeletonCardList({
    count = 4,
    className = '',
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {Array.from({ length: count }, (_, index) => (
                <SkeletonPanel key={index}>
                    <div className="flex items-start gap-3 p-4">
                        <Bar className="h-9 w-9" rounded="lg" />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <Bar className="h-3.5 w-40 sm:w-56" />
                            <Bar className="h-2.5 w-11/12" />
                            <Bar className="h-2.5 w-2/3" />
                        </div>
                        <Bar className="hidden h-8 w-20 sm:block" rounded="lg" />
                    </div>
                </SkeletonPanel>
            ))}
        </div>
    );
});

/** A form panel: repeated label + input pairs. */
export const SkeletonForm = memo(function SkeletonForm({
    fields = 3,
    columns = 1,
    header = true,
    className = '',
}: {
    fields?: number;
    columns?: 1 | 2 | 3;
    header?: boolean;
    className?: string;
}) {
    const columnClass =
        columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : '';
    return (
        <SkeletonPanel className={className}>
            {header && <SkeletonPanelHeader />}
            <div className={cn('grid grid-cols-1 gap-4 px-4 py-4 sm:px-5', columnClass)}>
                {Array.from({ length: fields }, (_, index) => (
                    <div key={index} className="flex flex-col gap-1.5">
                        <Bar className="h-2.5 w-20" />
                        <Bar className="h-10 w-full" rounded="lg" />
                    </div>
                ))}
            </div>
        </SkeletonPanel>
    );
});

/* ------------------------------------------------------------------ */
/*  Per-page skeletons                                                 */
/* ------------------------------------------------------------------ */

export const DashboardSkeleton = memo(function DashboardSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} description="w-56 sm:w-72" />
            <SkeletonTileGrid columns={4} count={4} />
            <SkeletonSplit ratio="wide-left" className="mt-6">
                <SkeletonChart height={260} />
                <SkeletonPanelBody lines={5} />
            </SkeletonSplit>
            <SkeletonTable rows={6} columns={5} minWidth={880} className="mt-6" />
        </SkeletonCanvas>
    );
});

export const OrdersSkeleton = memo(function OrdersSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={4} count={4} />
            <div className="mt-4 flex flex-wrap gap-2">
                {[64, 84, 72, 96, 68].map((width, index) => (
                    <Bar key={index} className="h-8" rounded="full" style={{ width }} />
                ))}
            </div>
            <SkeletonTable rows={9} columns={7} minWidth={980} className="mt-4" />
        </SkeletonCanvas>
    );
});

export const CustomersSkeleton = memo(function CustomersSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader description="w-64 sm:w-96" />
            <SkeletonTileGrid columns={6} count={6} />
            <SkeletonSplit ratio="wide-right" className="mt-6">
                <SkeletonPanelBody lines={6} />
                <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <Bar className="h-3 w-24" />
                        <Bar className="h-10 w-full max-w-xs" rounded="lg" />
                    </div>
                    <SkeletonTable rows={8} columns={6} minWidth={820} />
                </div>
            </SkeletonSplit>
        </SkeletonCanvas>
    );
});

export const CouponsSkeleton = memo(function CouponsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader description="w-56 sm:w-80" />
            <SkeletonTileGrid columns={4} count={4} />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                    <SkeletonPanel key={index}>
                        <div className="flex flex-col gap-3 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <Bar className="h-5 w-24" />
                                <SkeletonPill />
                            </div>
                            <Bar className="h-3 w-40" />
                            <Bar className="h-2.5 w-32" />
                        </div>
                    </SkeletonPanel>
                ))}
            </div>
            <SkeletonTable rows={6} columns={7} minWidth={940} className="mt-4" />
        </SkeletonCanvas>
    );
});

export const ReviewsSkeleton = memo(function ReviewsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={4} count={4} />
            <SkeletonSplit ratio="wide-right" className="mt-6">
                <SkeletonPanelBody lines={5} />
                <SkeletonCardList count={4} />
            </SkeletonSplit>
        </SkeletonCanvas>
    );
});

export const ReturnsSkeleton = memo(function ReturnsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} description="w-64 sm:w-80" />
            <SkeletonTileGrid columns={4} count={4} />
            <SkeletonSplit ratio="wide-left" className="mt-6">
                <SkeletonTable rows={8} columns={6} minWidth={980} />
                <div className="flex flex-col gap-6">
                    <SkeletonPanelBody lines={4} />
                    <SkeletonPanelBody lines={3} />
                </div>
            </SkeletonSplit>
        </SkeletonCanvas>
    );
});

export const ShippingSkeleton = memo(function ShippingSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={5} count={5} />
            <SkeletonTable rows={9} columns={6} minWidth={940} className="mt-6" />
        </SkeletonCanvas>
    );
});

export const TrackingSkeleton = memo(function TrackingSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={4} count={4} />
            <SkeletonSplit ratio="wide-left" className="mt-6">
                <SkeletonCardList count={3} />
                <SkeletonTable rows={6} columns={4} minWidth={880} />
            </SkeletonSplit>
        </SkeletonCanvas>
    );
});

export const CourierSettingsSkeleton = memo(function CourierSettingsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonPanel key={index}>
                        <SkeletonPanelHeader action />
                        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
                            {Array.from({ length: 3 }, (_, row) => (
                                <div key={row} className="flex items-center justify-between gap-3">
                                    <Bar className="h-3 w-28" />
                                    <Bar className="h-6 w-11" rounded="full" />
                                </div>
                            ))}
                        </div>
                    </SkeletonPanel>
                ))}
            </div>
        </SkeletonCanvas>
    );
});

export const PaymentsSkeleton = memo(function PaymentsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} description="w-56 sm:w-80" />
            <SkeletonSplit ratio="wide-left">
                <div className="flex flex-col gap-6">
                    <SkeletonChart height={190} />
                    <SkeletonPanel>
                        <div
                            className="grid grid-cols-2 gap-px"
                            style={{ backgroundColor: Theme.colors.border }}
                        >
                            {Array.from({ length: 4 }, (_, index) => (
                                <SkeletonTile key={index} hint={false} />
                            ))}
                        </div>
                    </SkeletonPanel>
                </div>
                <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <Bar className="h-3 w-32" />
                        <Bar className="h-10 w-full max-w-xs" rounded="lg" />
                    </div>
                    <SkeletonTable rows={8} columns={5} minWidth={820} />
                </div>
            </SkeletonSplit>
        </SkeletonCanvas>
    );
});

export const FailedPaymentsSkeleton = memo(function FailedPaymentsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={3} count={3} />
            <SkeletonTable rows={8} columns={5} minWidth={860} className="mt-6" />
        </SkeletonCanvas>
    );
});

export const ProductsSkeleton = memo(function ProductsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={3} />
            <SkeletonTable rows={9} columns={7} minWidth={980} />
        </SkeletonCanvas>
    );
});

export const ProductEditorSkeleton = memo(function ProductEditorSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} description="w-56 sm:w-72" />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    <SkeletonForm fields={6} columns={2} />
                    <SkeletonPanelBody lines={4} />
                </div>
                <div className="flex flex-col gap-6">
                    <SkeletonPanel>
                        <SkeletonPanelHeader />
                        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
                            <Bar className="h-40 w-full" rounded="lg" />
                            <Bar className="h-3 w-32" />
                        </div>
                    </SkeletonPanel>
                    <SkeletonPanelBody lines={3} />
                </div>
            </div>
        </SkeletonCanvas>
    );
});

export const CategoriesSkeleton = memo(function CategoriesSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonPanel key={index}>
                        <div className="flex items-center gap-4 p-4">
                            <Bar className="h-12 w-12" rounded="lg" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <Bar className="h-3.5 w-40" />
                                <Bar className="h-2.5 w-64" />
                            </div>
                            <Bar className="hidden h-9 w-24 sm:block" rounded="lg" />
                        </div>
                    </SkeletonPanel>
                ))}
            </div>
        </SkeletonCanvas>
    );
});

export const BrandsSkeleton = memo(function BrandsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader />
            <SkeletonTable rows={8} columns={6} minWidth={860} />
        </SkeletonCanvas>
    );
});

export const InventorySkeleton = memo(function InventorySkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={4} count={4} />
            <SkeletonSplit className="mt-6">
                <SkeletonChart height={220} />
                <SkeletonPanelBody lines={5} />
            </SkeletonSplit>
        </SkeletonCanvas>
    );
});

export const AnalyticsSkeleton = memo(function AnalyticsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} description="w-56 sm:w-72" />
            <SkeletonTileGrid columns={4} count={4} />
            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <SkeletonChart height={240} className="xl:col-span-2" />
                <SkeletonPanelBody lines={6} />
            </div>
            <SkeletonTable rows={7} columns={6} minWidth={860} className="mt-6" />
        </SkeletonCanvas>
    );
});

export const ReportsSkeleton = memo(function ReportsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader controls={2} />
            <SkeletonTileGrid columns={4} count={4} />
            <div className="mt-6 flex flex-col gap-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonPanel key={index}>
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 flex-col gap-2">
                                <Bar className="h-3.5 w-44" />
                                <Bar className="h-2.5 w-64" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Bar className="h-3 w-16" />
                                <Bar className="h-9 w-24" rounded="lg" />
                            </div>
                        </div>
                    </SkeletonPanel>
                ))}
            </div>
        </SkeletonCanvas>
    );
});

export const NotificationsSkeleton = memo(function NotificationsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader />
            <SkeletonTileGrid columns={5} count={5} />
            <SkeletonCardList count={5} className="mt-6" />
        </SkeletonCanvas>
    );
});

export const SettingsSkeleton = memo(function SettingsSkeleton() {
    return (
        <SkeletonCanvas>
            <SkeletonPageHeader />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonForm key={index} fields={3} />
                ))}
            </div>
        </SkeletonCanvas>
    );
});

/* ------------------------------------------------------------------ */
/*  Router                                                             */
/* ------------------------------------------------------------------ */

const SKELETONS: Record<AdminSkeletonKey, React.ComponentType> = {
    dashboard: DashboardSkeleton,
    orders: OrdersSkeleton,
    customers: CustomersSkeleton,
    coupons: CouponsSkeleton,
    reviews: ReviewsSkeleton,
    returns: ReturnsSkeleton,
    shipping: ShippingSkeleton,
    tracking: TrackingSkeleton,
    couriers: CourierSettingsSkeleton,
    payments: PaymentsSkeleton,
    'failed-payments': FailedPaymentsSkeleton,
    products: ProductsSkeleton,
    'product-editor': ProductEditorSkeleton,
    categories: CategoriesSkeleton,
    brands: BrandsSkeleton,
    inventory: InventorySkeleton,
    analytics: AnalyticsSkeleton,
    reports: ReportsSkeleton,
    notifications: NotificationsSkeleton,
    settings: SettingsSkeleton,
    generic: DashboardSkeleton,
};

/**
 * Drop-in Suspense fallback for the admin shell. Derives the right skeleton
 * from the current URL, so the lazy chunk, the route transition and the first
 * data frame all share one continuous loading silhouette.
 */
export function AdminPageSkeleton({ pathname }: { pathname?: string }) {
    const location = useLocation();
    const path = pathname ?? location.pathname;
    const Component = SKELETONS[skeletonKeyFor(path)];
    return (
        <div role="status" aria-live="polite" aria-busy="true" aria-label="Loading admin page">
            <span className="sr-only">Loading admin page…</span>
            <Component />
        </div>
    );
}

/**
 * Full admin shell placeholder — sidebar, header and page body. Used as the
 * router-level fallback, so the very first visit to /admin paints the panel
 * frame instead of a bare spinner.
 */
export function AdminShellSkeleton({ pathname }: { pathname?: string }) {
    const location = useLocation();
    const path = pathname ?? location.pathname;
    const Component = SKELETONS[skeletonKeyFor(path)];

    return (
        <div
            className="min-h-screen w-full md:flex"
            style={{
                backgroundColor: Theme.colors.background,
                fontFamily: Theme.Typography.fontFamily,
                color: Theme.colors.text,
            }}
        >
            {/* Sidebar — mirrors AdminLayout's 248px rail. */}
            <aside
                className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-1 border-r px-3 py-5 md:flex"
                style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
            >
                <div className="mb-4 px-2">
                    <Bar className="h-5 w-24" rounded="md" />
                    <Bar className="mt-2 h-2.5 w-20" />
                </div>
                {[112, 88, 96, 76, 104, 84, 120, 72, 92, 80].map((width, index) => (
                    <div key={index} className="flex items-center gap-2.5 px-3 py-2.5">
                        <Bar className="h-4 w-4" rounded="sm" />
                        <Bar className="h-3" style={{ width }} />
                    </div>
                ))}
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header — same padding and height as the real one. */}
                <header
                    className="sticky top-0 z-40 border-b"
                    style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
                >
                    <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
                        <Bar className="h-4 w-28 sm:w-36" />
                        <div className="flex items-center gap-2">
                            <Bar className="h-8 w-8" rounded="lg" />
                            <Bar className="h-8 w-24" rounded="lg" />
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-8">
                    <div role="status" aria-live="polite" aria-busy="true" aria-label="Loading admin page">
                        <span className="sr-only">Loading admin page…</span>
                        <Component />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminPageSkeleton;
