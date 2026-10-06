import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, MessageCircle } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { useIdentity } from '../store/authStore';
import { loginGate } from '../store/loginGate';

/**
 * Page-level account gate.
 *
 * Used by the wishlist and order-history routes so a bookmarked or shared link
 * behaves like the rest of the store: the modal opens once with the reason, and
 * dismissing it leaves a friendly locked panel instead of a dead end.
 */
export default function AccountGate({
    reason,
    title,
    description,
    children,
}: {
    reason: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    const identity = useIdentity();
    const asked = useRef(false);

    useEffect(() => {
        if (identity || asked.current) return;
        asked.current = true;
        loginGate.require(undefined, reason);
    }, [identity, reason]);

    if (identity) return <>{children}</>;

    return (
        <div className="w-full px-4 py-16 sm:py-24 md:px-6 lg:px-8">
            <div
                className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border px-6 py-10 text-center"
                style={{
                    backgroundColor: Theme.colors.surface,
                    borderColor: Theme.colors.border,
                    boxShadow: Theme.Shadow.md,
                    fontFamily: Theme.Typography.fontFamily,
                }}
            >
                <span
                    className="grid h-14 w-14 place-items-center rounded-full"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                >
                    <LockKeyhole size={24} />
                </span>
                <h1
                    className="text-xl font-bold tracking-tight"
                    style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                >
                    {title}
                </h1>
                <p className="text-[13px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    {description}
                </p>

                <button
                    type="button"
                    onClick={() => loginGate.require(undefined, reason)}
                    className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:w-auto sm:px-8"
                    style={{
                        background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                        color: Theme.colors.background,
                        boxShadow: Theme.Shadow.md,
                    }}
                >
                    <MessageCircle size={17} />
                    Continue with WhatsApp
                </button>

                <Link
                    to="/shop"
                    className="text-[12.5px] font-semibold underline-offset-2 transition-colors hover:underline"
                    style={{ color: Theme.colors.textLight }}
                >
                    Keep browsing the shop
                </Link>

                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    No password needed — we verify a one-time code on WhatsApp, and keep only your
                    name and number.
                </p>
            </div>
        </div>
    );
}
