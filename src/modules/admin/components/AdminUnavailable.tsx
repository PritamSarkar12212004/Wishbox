import { AlertTriangle, RefreshCw } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { API_BASE_URL, ApiError } from '@/lib/api/client';
import { AdminButton } from './AdminUI';

/**
 * Shown when the panel cannot get its data.
 *
 * The admin panel has no local fallback: every figure it renders comes from the
 * API, so the honest thing to do is say so and offer a retry rather than draw a
 * plausible-looking empty dashboard.
 */
export default function AdminUnavailable({
    error,
    onRetry,
}: {
    error: unknown;
    onRetry?: () => void;
}) {
    const apiError = error instanceof ApiError ? error : null;
    const message =
        apiError?.message ?? 'The admin panel could not load its data. Please try again in a moment.';

    return (
        <div
            className="grid min-h-screen place-items-center px-4"
            style={{ backgroundColor: Theme.colors.background, fontFamily: Theme.Typography.fontFamily }}
        >
            <div
                className="w-full max-w-md rounded-2xl border p-6 text-center"
                style={{
                    backgroundColor: Theme.colors.surface,
                    borderColor: Theme.colors.border,
                    boxShadow: Theme.Shadow.md,
                }}
            >
                <span
                    className="mx-auto grid h-10 w-10 place-items-center rounded-full"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.accentDark }}
                >
                    <AlertTriangle size={18} />
                </span>

                <p className="mt-3 text-sm font-bold" style={{ color: Theme.colors.text }}>
                    The admin data could not be loaded
                </p>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    {message}
                </p>

                {apiError?.isNetworkError && (
                    <p
                        className="mt-3 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
                        style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textLight }}
                    >
                        The panel reads everything from the API. Check that it is running at{' '}
                        <code>{API_BASE_URL}</code>.
                    </p>
                )}

                {onRetry && (
                    <AdminButton variant="primary" className="mt-4 h-9" onClick={onRetry}>
                        <RefreshCw size={13} />
                        Try again
                    </AdminButton>
                )}
            </div>
        </div>
    );
}
