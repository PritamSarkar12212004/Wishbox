import { memo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, Check, PackageX, RotateCcw, ShoppingBag } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { alphaHex } from '@/lib/color';

type ErrorStateProps = {
    title?: string;
    description?: string;
    /** When provided, renders a retry button instead of the default shop link. */
    onRetry?: () => void;
};

export const ErrorState = memo(function ErrorState({
    title = 'Unable to load product',
    description = 'Something went wrong while loading this product. Please try again, or continue shopping.',
    onRetry,
}: ErrorStateProps) {
    return (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
            <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: alphaHex('#C97B5D', 12) }}
            >
                <AlertTriangle size={28} style={{ color: Theme.colors.accent }} />
            </div>
            <h2 className="mt-5 text-xl font-bold" style={{ color: Theme.colors.text }}>
                {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                {description}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {onRetry ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-all active:scale-[0.98]"
                        style={{ backgroundColor: Theme.colors.primaryDark }}
                    >
                        <RotateCcw size={15} />
                        Try Again
                    </button>
                ) : (
                    <Link
                        to="/shop"
                        className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-all active:scale-[0.98]"
                        style={{ backgroundColor: Theme.colors.primaryDark }}
                    >
                        <ShoppingBag size={15} />
                        Back to shop
                    </Link>
                )}
                <Link
                    to="/"
                    className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold transition-colors hover:bg-black/5"
                    style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
});

export const OutOfStockState = memo(function OutOfStockState({
    disabled,
    onNotify,
}: {
    disabled?: boolean;
    onNotify: () => void;
}) {
    return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: alphaHex('#8A7B70', 12) }}
            >
                <PackageX size={28} style={{ color: Theme.colors.textMuted }} />
            </div>
            <h2 className="mt-5 text-xl font-bold" style={{ color: Theme.colors.text }}>
                Out of Stock
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                This product is currently unavailable. Leave your email and we&apos;ll notify you as soon as it&apos;s
                back.
            </p>
            <button
                type="button"
                onClick={onNotify}
                disabled={disabled}
                className="mt-6 mx-auto flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
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
