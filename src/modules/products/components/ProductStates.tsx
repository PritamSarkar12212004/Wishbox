import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, ShoppingBag, RotateCcw, PackageX, Check } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function ThemedSkeleton({ className }: { className?: string }) {
    return <Skeleton className={cn('rounded-lg', className)} style={{ backgroundColor: Theme.colors.surfaceAlt }} />;
}

function themeAlpha(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
}

export const GallerySkeleton = memo(function GallerySkeleton() {
    return (
        <div className="flex w-full gap-3 lg:gap-5">
            <div className="hidden lg:flex w-[84px] shrink-0 flex-col gap-2">
                {[...Array(5)].map((_, i) => (
                    <ThemedSkeleton key={i} className="h-20 w-full" />
                ))}
            </div>
            <div className="flex-1 space-y-3">
                <ThemedSkeleton className="aspect-[4/5] w-full rounded-2xl" />
                <div className="flex gap-2 lg:hidden">
                    {[...Array(5)].map((_, i) => (
                        <ThemedSkeleton key={i} className="h-14 w-14" />
                    ))}
                </div>
            </div>
        </div>
    );
});

export const InfoSkeleton = memo(function InfoSkeleton() {
    return (
        <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <ThemedSkeleton className="h-4 w-32" />
                <ThemedSkeleton className="h-5 w-20 rounded-full" />
            </div>
            <ThemedSkeleton className="h-8 w-11/12" />
            <ThemedSkeleton className="h-8 w-3/4" />
            <ThemedSkeleton className="h-4 w-44" />
            <div className="rounded-2xl border p-4" style={{ borderColor: Theme.colors.border }}>
                <ThemedSkeleton className="h-10 w-32" />
                <ThemedSkeleton className="mt-3 h-3 w-48" />
            </div>
            {['Color', 'Size', 'GSM', 'Pack Size'].map((label) => (
                <div key={label} className="space-y-2.5">
                    <ThemedSkeleton className="h-4 w-24" />
                    <div className="flex flex-wrap gap-2">
                        {[...Array(4)].map((_, i) => (
                            <ThemedSkeleton key={i} className="h-10 w-16" />
                        ))}
                    </div>
                </div>
            ))}
            <ThemedSkeleton className="h-12 w-full rounded-xl" />
            <ThemedSkeleton className="h-12 w-full rounded-xl" />
        </div>
    );
});

export const CardSkeleton = memo(function CardSkeleton() {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border"
            style={{ borderColor: Theme.colors.border }}>
            <ThemedSkeleton className="aspect-[4/5] w-full" />
            <div className="space-y-2 p-3">
                <ThemedSkeleton className="h-4 w-full" />
                <ThemedSkeleton className="h-3 w-2/3" />
                <ThemedSkeleton className="h-5 w-24" />
                <ThemedSkeleton className="h-8 w-full rounded-xl" />
            </div>
        </div>
    );
});

export const CarouselSkeleton = memo(function CarouselSkeleton() {
    return (
        <div className="space-y-4">
            <ThemedSkeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
});

export const ProductPageSkeleton = memo(function ProductPageSkeleton() {
    return (
        <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 py-5" role="status" aria-label="Loading product">
            <ThemedSkeleton className="mb-6 h-4 w-72" />
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
                <GallerySkeleton />
                <InfoSkeleton />
            </div>
            <div className="mt-12 space-y-4">
                <ThemedSkeleton className="h-6 w-56" />
                <div className="grid gap-4">
                    {[...Array(2)].map((_, i) => (
                        <ThemedSkeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
                <CarouselSkeleton />
            </div>
            <span className="sr-only">Loading product details…</span>
        </div>
    );
});

export const ErrorState = memo(function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: themeAlpha('#C97B5D', 12) }}>
                <AlertTriangle size={28} style={{ color: Theme.colors.accent }} />
            </div>
            <h2 className="mt-5 text-xl font-bold" style={{ color: Theme.colors.text }}>
                Unable to load product
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                Something went wrong while loading this product. Please try again, or continue shopping.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={onRetry}
                    className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-all active:scale-[0.98]"
                    style={{ backgroundColor: Theme.colors.primaryDark }}
                >
                    <RotateCcw size={15} />
                    Try Again
                </button>
                <Link
                    to="/"
                    className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold transition-colors hover:bg-black/5"
                    style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                >
                    <ShoppingBag size={15} />
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
});

export const OutOfStockState = memo(function OutOfStockState({ disabled, onNotify }: { disabled?: boolean; onNotify: () => void }) {
    return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: themeAlpha('#8A7B70', 12) }}>
                <PackageX size={28} style={{ color: Theme.colors.textMuted }} />
            </div>
            <h2 className="mt-5 text-xl font-bold" style={{ color: Theme.colors.text }}>
                Out of Stock
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                This product is currently unavailable. Leave your email and we&apos;ll notify you as soon as it&apos;s back.
            </p>
            <button
                type="button"
                onClick={onNotify}
                disabled={disabled}
                className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: Theme.colors.primaryDark }}
            >
                {disabled ? (
                    <span className="flex items-center gap-2">
                        <Check size={15} />
                        You&apos;re on the list
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Bell size={15} />
                        Notify Me
                    </span>
                )}
            </button>
        </div>
    );
});