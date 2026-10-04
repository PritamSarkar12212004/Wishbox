import type { ComponentProps, ReactNode } from 'react';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import type { AdminOrderStatus, PaymentStatus } from '../data/adminData';

/* ------------------------------------------------------------------ */
/*  Containers                                                         */
/* ------------------------------------------------------------------ */

export function Panel({ className = '', children, ...rest }: ComponentProps<'section'>) {
    return (
        <section
            className={cn('overflow-hidden', className)}
            style={{
                backgroundColor: Theme.colors.surface,
                border: `1px solid ${Theme.colors.border}`,
                borderRadius: Theme.BorderRadius.lg,
                boxShadow: Theme.Shadow.sm,
            }}
            {...rest}
        >
            {children}
        </section>
    );
}

export function PanelHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
    return (
        <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5"
            style={{ borderColor: Theme.colors.border }}
        >
            <div>
                <h2 className="text-sm font-bold" style={{ color: Theme.colors.text }}>
                    {title}
                </h2>
                {meta && (
                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        {meta}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export function PageHeader({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1
                    className="text-xl font-bold tracking-tight sm:text-2xl"
                    style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                >
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                        {description}
                    </p>
                )}
            </div>
            {/* `grow` keeps the controls flush right whether they sit beside the title or wrap below it. */}
            {children && (
                <div className="flex min-w-0 grow flex-wrap items-center justify-end gap-4">{children}</div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Forms                                                              */
/* ------------------------------------------------------------------ */

/**
 * Pill switcher for a page's own sections.
 *
 * Same shape as the RangePicker so a page can carry both without the two
 * controls looking like they came from different apps. Keyboard and screen
 * readers get a real tablist; only the panel below swaps, so the header and the
 * filters above it stay put.
 */
export function AdminTabs({
    tabs,
    value,
    onChange,
    label,
}: {
    tabs: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
    label: string;
}) {
    return (
        <div role="tablist" aria-label={label} className="flex min-w-0 flex-wrap items-center gap-1.5">
            {tabs.map((tab) => {
                const isActive = tab.value === value;
                return (
                    <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.value)}
                        className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all"
                        style={{
                            borderColor: isActive ? 'transparent' : Theme.colors.border,
                            backgroundColor: isActive ? Theme.colors.text : Theme.colors.surface,
                            color: isActive ? Theme.colors.background : Theme.colors.text,
                            boxShadow: isActive ? Theme.Shadow.sm : 'none',
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: Theme.colors.text }}>
                {label}
            </span>
            {children}
            {hint && (
                <span className="text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                    {hint}
                </span>
            )}
        </label>
    );
}

export function TextInput({ className = '', ...props }: ComponentProps<'input'>) {
    return (
        <input
            className={cn(
                'h-10 w-full min-w-0 rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-black/10 disabled:opacity-50',
                className
            )}
            style={{
                backgroundColor: Theme.colors.surface,
                borderColor: Theme.colors.border,
                color: Theme.colors.text,
            }}
            {...props}
        />
    );
}

export function TextArea({ className = '', ...props }: ComponentProps<'textarea'>) {
    return (
        <textarea
            className={cn(
                'w-full min-w-0 rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus:ring-2 focus:ring-black/10',
                className
            )}
            style={{
                backgroundColor: Theme.colors.surface,
                borderColor: Theme.colors.border,
                color: Theme.colors.text,
            }}
            {...props}
        />
    );
}

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

type AdminButtonProps = ComponentProps<'button'> & {
    variant?: 'primary' | 'ghost' | 'danger';
};

export function AdminButton({ variant = 'ghost', className = '', style, ...props }: AdminButtonProps) {
    const palette = {
        primary: {
            backgroundColor: Theme.colors.primaryDark,
            color: Theme.colors.white,
            border: '1px solid transparent',
            boxShadow: Theme.Shadow.sm,
        },
        ghost: {
            backgroundColor: Theme.colors.surface,
            color: Theme.colors.text,
            border: `1px solid ${Theme.colors.borderStrong}`,
            boxShadow: 'none',
        },
        danger: {
            backgroundColor: 'transparent',
            color: Theme.colors.accentDark,
            border: `1px solid ${Theme.colors.borderStrong}`,
            boxShadow: 'none',
        },
    } as const;

    return (
        <button
            type="button"
            className={cn(
                'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            style={{ ...palette[variant], ...style }}
            {...props}
        />
    );
}

/* ------------------------------------------------------------------ */
/*  Status                                                             */
/* ------------------------------------------------------------------ */

const ORDER_STATUS_STYLE: Record<AdminOrderStatus, { bg: string; fg: string }> = {
    Approval: { bg: Theme.colors.secondary, fg: Theme.colors.text },
    Approved: { bg: Theme.colors.tertiary, fg: Theme.colors.text },
    Shipped: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
    'Out for Delivery': { bg: Theme.colors.primary, fg: Theme.colors.white },
    Delivered: { bg: Theme.colors.primaryDark, fg: Theme.colors.white },
    Cancelled: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textMuted },
};

/** Six-stage fulfilment pipeline. */
export function AdminStatusChip({ status }: { status: AdminOrderStatus }) {
    const palette = ORDER_STATUS_STYLE[status];
    return (
        <span
            className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ backgroundColor: palette.bg, color: palette.fg }}
        >
            {status}
        </span>
    );
}

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, { bg: string; fg: string }> = {
    Paid: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
    Pending: { bg: Theme.colors.secondary, fg: Theme.colors.text },
    Failed: { bg: `color-mix(in srgb, ${Theme.colors.accent} 26%, ${Theme.colors.surface})`, fg: Theme.colors.accentDark },
    Refunded: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textLight },
};

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
    const palette = PAYMENT_STATUS_STYLE[status];
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ backgroundColor: palette.bg, color: palette.fg }}
        >
            {status}
        </span>
    );
}

/** Small labelled switch for settings and toggles. */
export function Toggle({
    checked,
    onChange,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    hint?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <div className="min-w-0">
                <p className="text-xs font-semibold sm:text-[13px]">{label}</p>
                {hint && (
                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        {hint}
                    </p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label}
                onClick={() => onChange(!checked)}
                className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                style={{ backgroundColor: checked ? Theme.colors.primaryDark : Theme.colors.borderStrong }}
            >
                <span
                    className="absolute top-0.5 h-5 w-5 rounded-full transition-all"
                    style={{ left: checked ? 22 : 2, backgroundColor: Theme.colors.white }}
                />
            </button>
        </div>
    );
}

/** Stock state — out-of-stock products stay listed but cannot be bought. */
export function StockPill({ available }: { available: boolean }) {
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
                backgroundColor: available ? Theme.colors.primaryLight : Theme.colors.surfaceAlt,
                color: available ? Theme.colors.primaryDark : Theme.colors.textMuted,
            }}
        >
            <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: available ? Theme.colors.primaryDark : Theme.colors.textMuted }}
            />
            {available ? 'In stock' : 'Out of stock'}
        </span>
    );
}

/** Publication state — hidden products are absent from the storefront entirely. */
export function VisibilityPill({ hidden }: { hidden: boolean }) {
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
                backgroundColor: hidden ? Theme.colors.text : Theme.colors.surfaceAlt,
                color: hidden ? Theme.colors.background : Theme.colors.textMuted,
            }}
        >
            {hidden ? 'Hidden' : 'Published'}
        </span>
    );
}
