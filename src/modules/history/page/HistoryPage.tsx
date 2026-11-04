import ActionButton from '@/components/ui/action-button';
import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    Clock,
    Download,
    FileText,
    MapPin,
    Package,
    Phone,
    XCircle,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import { useMyQuotations } from '@/modules/cart/api/useQuotation';
import type { Quotation, QuotationStatus } from '@/modules/cart/api/quotationApi';
import { HistorySkeleton } from '@/components/ui/skeletons';

/**
 * Quotation history.
 *
 * The cart asks for a bulk price instead of checking out, so this is what the
 * shopper's account keeps: every quotation they asked for, the priced lines it
 * was built from, both tax lines, the hosted PDF, and where the shop's answer
 * stands - pending, approved or rejected.
 */

type FilterValue = 'all' | QuotationStatus;

const STATUS_META: Record<
    QuotationStatus,
    { label: string; bg: string; fg: string; icon: typeof Clock; note: string }
> = {
    pending: {
        label: 'Pending',
        bg: Theme.colors.secondary,
        fg: Theme.colors.text,
        icon: Clock,
        note: 'Waiting for the shop to review this price.',
    },
    approved: {
        label: 'Approved',
        bg: Theme.colors.primaryLight,
        fg: Theme.colors.primaryDark,
        icon: CheckCircle2,
        note: 'Approved by the shop — this price is held for 30 days.',
    },
    rejected: {
        label: 'Rejected',
        bg: Theme.colors.surfaceAlt,
        fg: Theme.colors.textMuted,
        icon: XCircle,
        note: 'The shop could not offer this. Ask again with a different quantity.',
    },
};

const FILTERS: FilterValue[] = ['all', 'pending', 'approved', 'rejected'];
const FILTER_LABEL: Record<FilterValue, string> = {
    all: 'All',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

const dateStamp = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });
const when = (iso: string) => dateStamp.format(new Date(iso));

/** Quotation money keeps paise: a 9% split rarely lands on whole rupees. */
const money = (value: number) =>
    `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const themeVars = {
    '--c-surface-alt': Theme.colors.surfaceAlt,
    '--c-accent-dark': Theme.colors.accentDark,
    '--c-accent-soft': `color-mix(in srgb, ${Theme.colors.accent} 12%, ${Theme.colors.surface})`,
    '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/* ------------------------------------------------------------------ */
/*  Micro components                                                   */
/* ------------------------------------------------------------------ */

function StatusChip({ status }: { status: QuotationStatus }) {
    const meta = STATUS_META[status];
    const Icon = meta.icon;
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px]"
            style={{ backgroundColor: meta.bg, color: meta.fg }}
        >
            <Icon size={10} strokeWidth={3} />
            {meta.label}
        </span>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div
            className="rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3"
            style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
        >
            <p
                className="text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]"
                style={{ color: Theme.colors.textMuted }}
            >
                {label}
            </p>
            <p
                className="mt-1 text-sm font-bold tabular-nums sm:text-lg"
                style={{ color: accent ?? Theme.colors.text }}
            >
                {value}
            </p>
        </div>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MapPin;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon size={15} className="mt-0.5 shrink-0" style={{ color: Theme.colors.textLight }} />
            <div className="min-w-0">
                <p
                    className="text-[9px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: Theme.colors.textMuted }}
                >
                    {label}
                </p>
                <p
                    className="mt-0.5 whitespace-pre-line text-[12px] leading-snug sm:text-[13px]"
                    style={{ color: Theme.colors.text }}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Quotation card                                                     */
/* ------------------------------------------------------------------ */

const QuotationCard = memo(function QuotationCard({
    quotation,
    expanded,
    onToggle,
}: {
    quotation: Quotation;
    expanded: boolean;
    onToggle: (id: string) => void;
}) {
    const units = quotation.items.reduce((sum, line) => sum + line.qty, 0);
    const statusNote = STATUS_META[quotation.status].note;

    return (
        <article
            className="overflow-hidden"
            style={{
                backgroundColor: Theme.colors.surface,
                borderRadius: Theme.BorderRadius.xl,
                border: `1px solid ${Theme.colors.border}`,
                boxShadow: Theme.Shadow.sm,
            }}
        >
            {/* ── Collapsed summary row (whole row is the toggle) ── */}
            <ActionButton
                type="button"
                onClick={() => onToggle(quotation.id)}
                aria-expanded={expanded}
                className="flex w-full flex-col gap-3 p-3.5 text-left transition-colors hover:bg-[var(--c-surface-alt)] sm:flex-row sm:items-center sm:gap-5 sm:p-5"
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12"
                        style={{ backgroundColor: Theme.colors.surfaceAlt }}
                    >
                        <FileText size={18} style={{ color: Theme.colors.primaryDark }} />
                    </span>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span
                                className="text-sm font-bold tabular-nums sm:text-[15px]"
                                style={{ color: Theme.colors.text }}
                            >
                                {quotation.quotationNumber}
                            </span>
                            <StatusChip status={quotation.status} />
                        </div>
                        <p
                            className="mt-1 text-[11px] sm:text-xs"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            Asked {when(quotation.date)} · {quotation.items.length} product
                            {quotation.items.length > 1 ? 's' : ''} · {units} unit
                            {units > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="sm:text-right">
                        <p
                            className="text-base font-bold tabular-nums leading-none sm:text-lg"
                            style={{ color: Theme.colors.text }}
                        >
                            {money(quotation.total)}
                        </p>
                        <p
                            className="mt-1 text-[10px] sm:text-[11px]"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            incl. GST
                        </p>
                    </div>
                    <ChevronDown
                        size={16}
                        className={cn(
                            'shrink-0 transition-transform duration-200',
                            expanded && 'rotate-180'
                        )}
                        style={{ color: Theme.colors.textMuted }}
                    />
                </div>
            </ActionButton>

            {/* ── Expanded detail ── */}
            {expanded && (
                <div className="border-t" style={{ borderColor: Theme.colors.border }}>
                    <ul>
                        {quotation.items.map((line) => (
                            <li
                                key={`${line.productId}-${line.qty}`}
                                className="flex items-start gap-3 border-t px-3.5 py-3 first:border-t-0 sm:gap-4 sm:px-5 sm:py-4"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <div className="min-w-0 flex-1">
                                    <p
                                        className="text-[12.5px] font-semibold leading-snug sm:text-sm"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {line.name}
                                    </p>
                                    <p
                                        className="mt-1 text-[10.5px] tabular-nums sm:text-xs"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        HSN {line.hsn} · {line.qty} {line.unit} × {money(line.rate)}
                                    </p>
                                </div>
                                <p
                                    className="shrink-0 text-[12.5px] font-bold tabular-nums sm:text-sm"
                                    style={{ color: Theme.colors.text }}
                                >
                                    {money(line.amount)}
                                </p>
                            </li>
                        ))}
                    </ul>

                    <div
                        className="grid grid-cols-1 gap-x-8 gap-y-4 border-t px-3.5 py-4 sm:grid-cols-2 sm:px-5"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        <div className="space-y-3.5">
                            <DetailRow
                                icon={MapPin}
                                label="Delivery address"
                                value={quotation.customer.address}
                            />
                            <DetailRow
                                icon={Phone}
                                label="Contact"
                                value={`${quotation.customer.name} · ${quotation.customer.phone}`}
                            />
                            <DetailRow
                                icon={Package}
                                label="Status"
                                value={statusNote}
                            />
                            {quotation.note && (
                                <DetailRow
                                    icon={FileText}
                                    label="Note from the shop"
                                    value={quotation.note}
                                />
                            )}
                        </div>

                        <dl
                            className="space-y-2 text-[12px] sm:text-[13px]"
                            style={{ color: Theme.colors.text }}
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <dt style={{ color: Theme.colors.textMuted }}>Subtotal</dt>
                                <dd className="tabular-nums">{money(quotation.subtotal)}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                                <dt style={{ color: Theme.colors.textMuted }}>
                                    CGST @ {quotation.cgstRate}%
                                </dt>
                                <dd className="tabular-nums">{money(quotation.cgst)}</dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                                <dt style={{ color: Theme.colors.textMuted }}>
                                    SGST @ {quotation.sgstRate}%
                                </dt>
                                <dd className="tabular-nums">{money(quotation.sgst)}</dd>
                            </div>
                            <div
                                className="flex items-baseline justify-between gap-3 border-t pt-2.5 font-bold"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <dt>Final total</dt>
                                <dd className="tabular-nums">{money(quotation.total)}</dd>
                            </div>
                            <p
                                className="pt-1 text-[10.5px] italic leading-snug"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {quotation.amountInWords}
                            </p>
                        </dl>
                    </div>

                    <div
                        className="flex flex-wrap gap-2 border-t px-3.5 py-3.5 sm:px-5 sm:py-4"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        <a
                            href={quotation.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11.5px] font-semibold text-white transition-transform active:scale-[0.98] sm:h-10 sm:flex-none sm:px-5 sm:text-[13px]"
                            style={{
                                backgroundColor: Theme.colors.primaryDark,
                                boxShadow: Theme.Shadow.sm,
                            }}
                        >
                            <Download size={13} />
                            View quotation PDF
                        </a>
                        <Link
                            to="/shop"
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[11.5px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)] sm:h-10 sm:flex-none sm:px-5 sm:text-[13px]"
                            style={{
                                borderColor: Theme.colors.borderStrong,
                                color: Theme.colors.text,
                            }}
                        >
                            Shop again
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            )}
        </article>
    );
});

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function HistoryPage() {
    const signedIn = useIsSignedIn();
    const quotationsQuery = useMyQuotations();
    const quotations = useMemo(
        () => quotationsQuery.data?.items ?? [],
        [quotationsQuery.data]
    );
    const [filter, setFilter] = useState<FilterValue>('all');
    const [expanded, setExpanded] = useState<string[]>([]);

    const visible = useMemo(
        () =>
            filter === 'all' ? quotations : quotations.filter((entry) => entry.status === filter),
        [filter, quotations]
    );

    const totalUnits = useMemo(
        () => quotations.reduce((sum, entry) => sum + entry.items.reduce((n, l) => n + l.qty, 0), 0),
        [quotations]
    );
    const approved = quotations.filter((entry) => entry.status === 'approved').length;
    const pending = quotations.filter((entry) => entry.status === 'pending').length;
    const quotedValue = quotations.reduce((sum, entry) => sum + entry.total, 0);

    const countFor = (value: FilterValue) =>
        value === 'all'
            ? quotations.length
            : quotations.filter((entry) => entry.status === value).length;

    function toggle(id: string) {
        setExpanded((previous) =>
            previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id]
        );
    }

    if (!signedIn) {
        return (
            <div
                className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center"
                style={{ ...themeVars, color: Theme.colors.text }}
            >
                <FileText size={26} style={{ color: Theme.colors.textLight }} />
                <p className="mt-3 text-sm font-semibold">Sign in to see your quotations</p>
                <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                    Every quotation you request is kept on your account.
                </p>
            </div>
        );
    }

    // Nothing paints until the first answer lands: "no quotations" and a loading
    // list must not look the same.
    if (quotationsQuery.isLoading) {
        return <HistorySkeleton />;
    }

    return (
        <div
            className="min-h-full w-full"
            style={{ ...themeVars, backgroundColor: Theme.colors.background }}
        >
            <div className="w-full px-4 py-8 sm:py-10 md:px-6 lg:px-8">
                {/* ── Header ── */}
                <header className="mb-6 sm:mb-8">
                    <Link
                        to="/"
                        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--c-accent-dark)]"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        <ArrowLeft size={13} />
                        Continue shopping
                    </Link>

                    <div className="flex items-center gap-3">
                        <div
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                            style={{ backgroundColor: Theme.colors.secondary }}
                        >
                            <FileText size={20} style={{ color: Theme.colors.text }} />
                        </div>
                        <div className="min-w-0">
                            <h1
                                className="text-2xl font-bold tracking-tight sm:text-4xl"
                                style={{
                                    fontFamily: Theme.Typography?.headingFamily,
                                    color: Theme.colors.text,
                                }}
                            >
                                Quotation History
                            </h1>
                            <p
                                className="mt-0.5 text-[12px] sm:mt-1 sm:text-sm"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {quotations.length} quotation{quotations.length === 1 ? '' : 's'} ·{' '}
                                {totalUnits} unit{totalUnits === 1 ? '' : 's'} · GST included
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:max-w-2xl sm:gap-3">
                        <Stat label="Quotations" value={String(quotations.length)} />
                        <Stat
                            label="Approved"
                            value={String(approved)}
                            accent={Theme.colors.primaryDark}
                        />
                        <Stat label="Pending" value={String(pending)} />
                    </div>
                    <p className="mt-2 text-[11px] sm:text-xs" style={{ color: Theme.colors.textMuted }}>
                        Total quoted{' '}
                        <span style={{ color: Theme.colors.text, fontWeight: 700 }}>
                            {money(quotedValue)}
                        </span>
                    </p>
                </header>

                {/* ── Status filter ── */}
                <div className="mb-5 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
                        {FILTERS.map((value) => {
                            const active = filter === value;
                            return (
                                <ActionButton
                                    key={value}
                                    type="button"
                                    onClick={() => setFilter(value)}
                                    aria-pressed={active}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition-all sm:text-xs',
                                        active
                                            ? 'shadow-sm'
                                            : 'hover:border-[var(--c-accent-dark)] hover:text-[var(--c-accent-dark)]'
                                    )}
                                    style={
                                        active
                                            ? {
                                                  backgroundColor: Theme.colors.text,
                                                  color: Theme.colors.background,
                                                  borderColor: Theme.colors.text,
                                              }
                                            : {
                                                  borderColor: Theme.colors.border,
                                                  color: Theme.colors.textMuted,
                                              }
                                    }
                                >
                                    {FILTER_LABEL[value]}
                                    <span
                                        className="rounded-full px-1.5 text-[9.5px] tabular-nums sm:text-[10px]"
                                        style={
                                            active
                                                ? {
                                                      backgroundColor: 'rgba(255,255,255,0.18)',
                                                      color: Theme.colors.background,
                                                  }
                                                : {
                                                      backgroundColor: Theme.colors.surfaceAlt,
                                                      color: Theme.colors.textMuted,
                                                  }
                                        }
                                    >
                                        {countFor(value)}
                                    </span>
                                </ActionButton>
                            );
                        })}
                    </div>
                </div>

                {/* ── Quotations ── */}
                {quotationsQuery.error ? (
                    <div
                        className="rounded-2xl border px-6 py-12 text-center"
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                        }}
                    >
                        <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            Your quotations could not be loaded
                        </p>
                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                            {quotationsQuery.error instanceof Error
                                ? quotationsQuery.error.message
                                : 'Please try again.'}
                        </p>
                    </div>
                ) : visible.length === 0 ? (
                    <div
                        className="rounded-2xl border px-6 py-14 text-center"
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                        }}
                    >
                        <Package size={26} className="mx-auto" style={{ color: Theme.colors.textLight }} />
                        <p className="mt-3 text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            {quotations.length === 0
                                ? 'No quotations yet'
                                : `No ${FILTER_LABEL[filter].toLowerCase()} quotations`}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                            {quotations.length === 0
                                ? 'Ask for a bulk price with “Send for Quotation” in your cart.'
                                : 'Try another status to see the rest.'}
                        </p>
                        <Link
                            to={quotations.length === 0 ? '/cart' : '/quotations'}
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                            style={{ color: Theme.colors.accentDark }}
                        >
                            {quotations.length === 0 ? 'Go to cart' : 'Show all quotations'}
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {visible.map((quotation) => (
                            <QuotationCard
                                key={quotation.id}
                                quotation={quotation}
                                expanded={expanded.includes(quotation.id)}
                                onToggle={toggle}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;
