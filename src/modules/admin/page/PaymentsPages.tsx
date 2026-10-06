import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, QrCode, ScanLine, ShieldCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr, inrCompact } from '@/lib/format';
import { AdminButton, AdminTabs, PageHeader, Panel, PanelHeader, TextInput } from '../components/AdminUI';
import DonutChart from '../components/charts/DonutChart';
import DataTable from '../components/DataTable';
import DropZone from '../components/DropZone';
import RangePicker from '../components/RangePicker';
import ScreenshotViewer from '../components/ScreenshotViewer';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import { PAYMENT_COLORS } from '../consts/paymentConst';
import type { AdminOrder, AdminReturn } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { inRange, paymentAnalytics, rangeLabel, returnsAnalytics } from '../lib/analytics';
import { parseUpi } from '../lib/upi';
import { useUpdateSettings } from '../api/useAdmin';
import { useAdminSettings } from '../store/settingsStore';

const route = adminConst.route;
const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/* ------------------------------------------------------------------ */
/*  Transactions                                                      */
/* ------------------------------------------------------------------ */

/** The page's sections: the money view, the QR shoppers pay to, and a QR check tool. */
type PaymentTab = 'overview' | 'qr' | 'scanner';

const PAYMENT_TABS = [
    { value: 'overview', label: 'Overview' },
    { value: 'qr', label: 'Payment QR' },
    { value: 'scanner', label: 'QR Scanner' },
];

export function PaymentsPage() {
    const { orders, returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');
    const [tab, setTab] = useState<PaymentTab>('overview');

    const payments = useMemo(() => paymentAnalytics(orders, range, returns), [orders, range, returns]);

    /*
     * The four numbers the page answers with: how many orders, what came in,
     * what went back, and what is actually left.
     *
     * Refunds come from two places and both count. The returns list covers
     * delivered-and-returned parcels; a cancelled order was refunded without a
     * return ever existing, so its full amount is added on top. They cannot
     * overlap — a return is only raised against a delivered order.
     */
    const totals = useMemo(() => {
        const inWindow = orders.filter((order) => inRange(order.placedAt, range));
        const refundedCancelled = inWindow
            .filter((order) => order.status === 'Cancelled' && order.paymentStatus === 'Refunded')
            .reduce((sum, order) => sum + order.amount, 0);
        const refunded = payments.refundedAmount + refundedCancelled;

        return {
            orders: inWindow.length,
            collected: payments.collected,
            refunded,
            net: payments.collected - refunded,
        };
    }, [orders, range, payments]);


    return (
        <div>
            <PageHeader
                title="Payments"
                description={
                    tab === 'overview'
                        ? `${compactCount(totals.orders)} orders · ${inr(totals.collected)} received · ${inr(totals.refunded)} refunded · ${rangeLabel(key, range)}.`
                        : tab === 'qr'
                          ? 'Upload or replace the QR code shoppers scan to pay you.'
                          : 'Check that a payment code points at the right payee before it goes live.'
                }
            >
                {tab === 'overview' && (
                    <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                )}
                <Link to={route.failedPaymentsPage}>
                    <AdminButton variant={payments.failedOrders.length > 0 ? 'primary' : 'ghost'}>
                        Failed payments
                    </AdminButton>
                </Link>
            </PageHeader>

            <div className="mb-5">
                <AdminTabs
                    tabs={PAYMENT_TABS}
                    value={tab}
                    onChange={(next) => setTab(next as PaymentTab)}
                    label="Payments sections"
                />
            </div>

            {tab === 'scanner' && <QrScannerPanel />}

            {tab === 'qr' && <PaymentQrPanel />}

            {tab === 'overview' && (
                <>
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
                        <Panel>
                            <Tile label="Orders" value={compactCount(totals.orders)} hint={rangeLabel(key, range)} />
                        </Panel>
                        <Panel>
                            <Tile label="Payment received" value={inr(totals.collected)} tone="good" />
                        </Panel>
                        <Panel>
                            <Tile label="Refunded" value={inr(totals.refunded)} tone="warn" />
                        </Panel>
                        <Panel>
                            <Tile label="Net" value={inr(totals.net)} hint="Received − refunded" />
                        </Panel>
                        <Panel>
                            <Tile label="Pending" value={inr(payments.pending)} tone="warn" />
                        </Panel>
                        <Panel>
                            <Tile label="Failed" value={inr(payments.failed)} tone="bad" />
                        </Panel>
                    </div>

                    <Panel>
                        <PanelHeader title="Payment methods" meta="Share of orders by rail" />
                        <div className="px-4 py-5 sm:px-5">
                            <DonutChart
                                centerValue={inrCompact(payments.collected)}
                                centerLabel="Collected"
                                segments={payments.methods.map((row) => ({
                                    label: row.method,
                                    value: row.count,
                                    color: PAYMENT_COLORS[row.method],
                                    meta: inrCompact(row.amount),
                                }))}
                            />
                        </div>
                    </Panel>
                </>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Payment QR                                                        */
/* ------------------------------------------------------------------ */

/**
 * Where the admin uploads the UPI QR shoppers pay to.
 *
 * Edits are held as a draft and only written to the settings store on save, so
 * a half-browsed-for image never replaces the live code. The QR is stored the
 * same way the catalogue stores product photos — a data URL in localStorage,
 * with a hosted URL accepted for anything too big to keep in the browser.
 */
function PaymentQrPanel() {
    const settings = useAdminSettings();
    const updateSettings = useUpdateSettings();
    const saved = settings.paymentQr;
    const [draft, setDraft] = useState(saved);
    const [preview, setPreview] = useState(false);

    const dirty = draft !== saved;

    function save() {
        updateSettings.mutate(
            { paymentQr: draft, paymentQrUpdatedAt: draft ? Date.now() : 0 },
            {
                onSuccess: () =>
                    toast.success(draft ? 'Payment QR updated' : 'Payment QR removed', {
                        description: draft
                            ? 'This is the code shoppers will be shown to pay.'
                            : 'No QR is on file — checkout has nothing to show.',
                    }),
                onError: () => toast.error('Could not save the payment QR', { description: 'Please try again.' }),
            }
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Panel className="self-start">
                <PanelHeader
                    title="Payment QR"
                    meta={
                        !saved
                            ? 'Not uploaded yet'
                            : settings.paymentQrUpdatedAt > 0
                              ? `Last updated ${DATE.format(settings.paymentQrUpdatedAt)}`
                              : 'Live'
                    }
                />
                <div className="flex flex-col gap-4 px-4 py-5 sm:px-5">
                    <DropZone
                        label="UPI QR code"
                        hint="A screenshot of your UPI QR works. Keep it under 300 KB, or paste a hosted image URL."
                        values={draft ? [draft] : []}
                        onChange={(next) => setDraft(next[0] ?? '')}
                        maxKb={300}
                        emptyLabel="Drop the QR image here, or click to browse"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <AdminButton variant="primary" disabled={!dirty} onClick={save}>
                            <QrCode size={13} />
                            {saved ? 'Update QR' : 'Save QR'}
                        </AdminButton>
                        <AdminButton disabled={!dirty} onClick={() => setDraft(saved)}>
                            Discard changes
                        </AdminButton>
                        {!dirty && (
                            <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {saved ? 'This code is live.' : 'Nothing uploaded yet.'}
                            </span>
                        )}
                    </div>
                </div>
            </Panel>

            <Panel className="self-start">
                <PanelHeader title="Live code" meta="What shoppers scan" />
                <div className="px-4 py-5 sm:px-5">
                    {saved ? (
                        <button
                            type="button"
                            onClick={() => setPreview(true)}
                            className="block w-full overflow-hidden rounded-xl border transition-opacity hover:opacity-90"
                            style={{ borderColor: Theme.colors.border }}
                        >
                            <img src={saved} alt="Payment QR code" className="mx-auto max-h-[320px] w-auto" />
                        </button>
                    ) : (
                        <p
                            className="rounded-xl px-4 py-10 text-center text-xs"
                            style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}
                        >
                            No QR uploaded yet — shoppers have no code to scan until you add one.
                        </p>
                    )}
                </div>
            </Panel>

            <ScreenshotViewer
                src={saved}
                alt="Payment QR code"
                open={preview}
                onClose={() => setPreview(false)}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  QR Scanner                                                        */
/* ------------------------------------------------------------------ */

function UpiRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt style={{ color: Theme.colors.textMuted }}>{label}</dt>
            <dd className="truncate font-semibold">{value}</dd>
        </div>
    );
}

/**
 * Second QR section: check a code before it goes live.
 *
 * The left card reads a pasted payment string; the right one reports whether a
 * live code exists at all and where shoppers will meet it.
 */
function QrScannerPanel() {
    const settings = useAdminSettings();
    const saved = settings.paymentQr;
    const [input, setInput] = useState('');
    const [checked, setChecked] = useState(false);

    const details = parseUpi(input);

    function verify() {
        setChecked(true);
        if (parseUpi(input)) {
            toast.success('Payment code verified', {
                description: 'The payee and UPI id parsed cleanly.',
            });
        } else {
            toast.error('Could not read a UPI id', {
                description: 'Look for a pa=… parameter in the string.',
            });
        }
    }

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <Panel className="self-start">
                <PanelHeader
                    title="Verify a payment code"
                    meta="Paste the UPI string a payment app produced"
                    action={<ScanLine size={15} style={{ color: Theme.colors.primaryDark }} />}
                />
                <div className="flex flex-col gap-4 px-4 py-5 sm:px-5">
                    <div>
                        <label
                            className="text-xs font-semibold"
                            style={{ color: Theme.colors.text }}
                            htmlFor="upi-payment-string"
                        >
                            Payment string
                        </label>
                        <TextInput
                            id="upi-payment-string"
                            value={input}
                            onChange={(event) => {
                                setInput(event.target.value);
                                setChecked(false);
                            }}
                            placeholder="upi://pay?pa=wishbox@upi&pn=WishBox&am=499"
                            className="mt-1.5 font-mono text-[11px]"
                            aria-label="Payment string"
                        />
                        <p
                            className="mt-1.5 text-[11px] leading-relaxed"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            This panel has no camera, so paste the payload instead — every UPI code encodes one.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <AdminButton variant="primary" disabled={!input.trim()} onClick={verify}>
                            <ShieldCheck size={13} />
                            Verify code
                        </AdminButton>
                        <AdminButton
                            disabled={!input}
                            onClick={() => {
                                setInput('');
                                setChecked(false);
                            }}
                        >
                            Clear
                        </AdminButton>
                    </div>

                    {checked && (
                        <div
                            className="rounded-xl border px-4 py-4"
                            style={{
                                borderColor: details ? Theme.colors.primaryLight : Theme.colors.borderStrong,
                                backgroundColor: Theme.colors.surfaceAlt,
                            }}
                        >
                            {details ? (
                                <div className="flex flex-col gap-3">
                                    <p
                                        className="flex items-center gap-1.5 text-xs font-bold"
                                        style={{ color: Theme.colors.primaryDark }}
                                    >
                                        <CheckCircle2 size={14} />
                                        Valid UPI payment string
                                    </p>
                                    <dl className="flex flex-col gap-2 text-[11px]">
                                        <UpiRow label="Payee" value={details.payee || '—'} />
                                        <UpiRow label="UPI id" value={details.upiId} />
                                        <UpiRow
                                            label="Amount"
                                            value={details.amount !== null ? inr(details.amount) : 'Shopper chooses'}
                                        />
                                        <UpiRow label="Note" value={details.note || '—'} />
                                    </dl>
                                </div>
                            ) : (
                                <p
                                    className="flex items-start gap-1.5 text-xs font-semibold"
                                    style={{ color: Theme.colors.accentDark }}
                                >
                                    <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                                    No <span className="font-mono">pa=…</span> payee found — this does not look like a
                                    UPI payment code.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </Panel>

            <Panel className="self-start">
                <PanelHeader title="Live code check" meta="What shoppers scan right now" />
                <div className="flex flex-col gap-4 px-4 py-5 sm:px-5">
                    <div className="flex items-center gap-3">
                        {saved ? (
                            <span
                                className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <img src={saved} alt="" className="h-full w-full object-cover" />
                            </span>
                        ) : (
                            <span
                                className="grid h-16 w-16 shrink-0 place-items-center rounded-lg"
                                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}
                            >
                                <QrCode size={20} />
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="text-[13px] font-bold">{saved ? 'A QR is on file' : 'No QR on file'}</p>
                            <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {saved
                                    ? settings.paymentQrUpdatedAt > 0
                                        ? `Last updated ${DATE.format(settings.paymentQrUpdatedAt)}`
                                        : 'Live — upload time unknown'
                                    : 'Checkout has nothing to show until you upload one.'}
                            </p>
                        </div>
                    </div>

                    <ul
                        className="flex flex-col gap-2 border-t pt-3"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        {['Checkout', 'Order confirmation', 'Invoice footer'].map((surface) => (
                            <li key={surface} className="flex items-center justify-between gap-3 text-[11px]">
                                <span style={{ color: Theme.colors.textLight }}>{surface}</span>
                                <span
                                    className="font-semibold"
                                    style={{ color: saved ? Theme.colors.primaryDark : Theme.colors.textMuted }}
                                >
                                    {saved ? 'Shows this code' : 'Hidden'}
                                </span>
                            </li>
                        ))}
                    </ul>

                    <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        A demo check: it reads the string you paste rather than a camera feed, and nothing is sent
                        anywhere.
                    </p>
                </div>
            </Panel>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Refunds                                                           */
/* ------------------------------------------------------------------ */

export function RefundsPage() {
    const { returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('1y');

    const analytics = useMemo(() => returnsAnalytics(returns, range), [returns, range]);
    const refunds = useMemo(
        () => returns.filter((entry) => entry.refundAmount > 0).slice(0, 60),
        [returns]
    );

    return (
        <div>
            <PageHeader
                title="Refunds"
                description={`${inr(analytics.refundPending)} pending · ${inr(analytics.refunded)} already released.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                <Link to={route.returnsPage}>
                    <AdminButton variant="primary">Approve in returns queue</AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Refund pending" value={inr(analytics.refundPending)} tone="warn" hint={rangeLabel(key, range)} />
                </Panel>
                <Panel>
                    <Tile label="Refunded" value={inr(analytics.refunded)} tone="good" />
                </Panel>
                <Panel>
                    <Tile
                        label="Rejected"
                        value={String(analytics.byStatus.find((row) => row.status === 'Rejected')?.count ?? 0)}
                        hint="No refund issued"
                    />
                </Panel>
                <Panel>
                    <Tile label="Requests" value={compactCount(analytics.total)} hint="All statuses" />
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={880}
                    rows={refunds}
                    rowKey={(entry) => entry.id}
                    emptyTitle="No refunds recorded"
                    emptyHint="Nothing has been refunded in this period."
                    columns={[
                        {
                            key: 'return',
                            header: 'Return',
                            render: (entry: AdminReturn) => (
                                <div>
                                    <p className="text-[13px] font-bold">{entry.id}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {entry.orderId}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'customer',
                            header: 'Customer',
                            render: (entry: AdminReturn) => <span className="text-xs">{entry.customer}</span>,
                        },
                        {
                            key: 'reason',
                            header: 'Reason',
                            hideBelow: 'md',
                            render: (entry: AdminReturn) => <span className="text-xs">{entry.reason}</span>,
                        },
                        {
                            key: 'requested',
                            header: 'Requested',
                            hideBelow: 'sm',
                            render: (entry: AdminReturn) => (
                                <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                    {DATE.format(entry.requestedAt)}
                                </span>
                            ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (entry: AdminReturn) => (
                                <span className="text-xs font-semibold">{entry.status}</span>
                            ),
                        },
                        {
                            key: 'amount',
                            header: 'Refund',
                            align: 'right',
                            render: (entry: AdminReturn) => (
                                <div>
                                    <p className="text-[13px] font-bold tabular-nums">{inr(entry.refundAmount)}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {entry.refunded ? 'Released' : 'Pending'}
                                    </p>
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Failed payments                                                   */
/* ------------------------------------------------------------------ */

export function FailedPaymentsPage() {
    const { orders, returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const payments = useMemo(() => paymentAnalytics(orders, range, returns), [orders, range, returns]);
    const failed = payments.failedOrders;

    return (
        <div>
            <PageHeader
                title="Failed payments"
                description={`${failed.length} payments worth ${inr(payments.failed)} did not complete · ${rangeLabel(key, range)}.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                <Link to={route.paymentsPage}>
                    <AdminButton>All transactions</AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <Panel>
                    <Tile label="Failed payments" value={String(failed.length)} tone="bad" />
                </Panel>
                <Panel>
                    <Tile label="Value at risk" value={inr(payments.failed)} tone="warn" />
                </Panel>
                <Panel>
                    <Tile label="Pending settlement" value={inr(payments.pending)} hint="Awaiting capture" />
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={860}
                    rows={failed.slice(0, 60)}
                    rowKey={(order) => order.id}
                    emptyTitle="No failed payments"
                    emptyHint="Every payment went through in this period."
                    columns={[
                        {
                            key: 'order',
                            header: 'Order',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-[13px] font-bold">{order.id}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {DATE.format(order.placedAt)}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'customer',
                            header: 'Customer',
                            render: (order: AdminOrder) => (
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold">{order.customer}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {order.email}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'method',
                            header: 'Method',
                            hideBelow: 'sm',
                            render: (order: AdminOrder) => <span className="text-xs">{order.payment}</span>,
                        },
                        {
                            key: 'amount',
                            header: 'Amount',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <span className="text-[13px] font-bold tabular-nums">{inr(order.amount)}</span>
                            ),
                        },
                        {
                            key: 'action',
                            header: '',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <a
                                    href={`mailto:${order.email}?subject=${encodeURIComponent(
                                        `Payment failed for ${order.id}`
                                    )}&body=${encodeURIComponent(
                                        `Hi ${order.customer}, we could not complete the payment of ${inr(
                                            order.amount
                                        )} for order ${order.id}. Reply here and we will send a fresh payment link.`
                                    )}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
                                    style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                                >
                                    <Mail size={13} />
                                    Payment link
                                </a>
                            ),
                        },
                    ]}
                    footer={
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Sending a payment link needs a gateway integration — this opens a pre-filled email instead.
                        </p>
                    }
                />
            </div>
        </div>
    );
}
