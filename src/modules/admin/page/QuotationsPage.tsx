import { useState } from 'react';
import { Check, Download, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AdminButton, AdminTabs, Field, PageHeader, Panel, TextArea } from '../components/AdminUI';
import { useAdminQuotations, useReviewQuotation } from '../api/useAdmin';
import type { AdminQuotation } from '../api/adminApi';

const stamp = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });
const when = (iso: string) => stamp.format(new Date(iso));

/** Paise are real money on a quotation, so totals keep their two decimals. */
const money = (value: number) =>
    `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_TONE: Record<AdminQuotation['status'], { bg: string; fg: string }> = {
    pending: { bg: '#FDF1E7', fg: '#9A4B12' },
    approved: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
    rejected: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textMuted },
};

function StatusPill({ status }: { status: AdminQuotation['status'] }) {
    const tone = STATUS_TONE[status];
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{ backgroundColor: tone.bg, color: tone.fg }}
        >
            {status}
        </span>
    );
}

/** A WhatsApp copy that never reached the gateway is worth flagging. */
function DeliveryPill({ label, sent }: { label: string; sent: boolean }) {
    return (
        <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            style={{
                backgroundColor: sent ? Theme.colors.surfaceAlt : '#FDF1E7',
                color: sent ? Theme.colors.textMuted : '#9A4B12',
            }}
        >
            {label} {sent ? 'sent' : 'failed'}
        </span>
    );
}

/**
 * Bulk quotation requests.
 *
 * Every row is the record the buyer's PDF was produced from: the priced lines,
 * both tax lines, the final amount and the Cloudinary link. Approving here does
 * not place an order - it is the shop's answer to the request, and the decision
 * is stamped with who made it and when.
 */
export default function QuotationsPage() {
    const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [page, setPage] = useState(1);
    const [openId, setOpenId] = useState<string | null>(null);
    const [note, setNote] = useState('');

    const { data, isLoading, error } = useAdminQuotations({ status, page });
    const review = useReviewQuotation();

    const items = data?.items ?? [];
    const active = items.find((entry) => entry.id === openId) ?? null;

    async function decide(quotation: AdminQuotation, next: 'approved' | 'rejected') {
        if (next === 'rejected' && note.trim().length === 0) {
            toast.error('Add a short reason so the customer knows why');
            return;
        }

        try {
            await review.mutateAsync({
                id: quotation.id,
                input: { status: next, ...(note.trim() ? { note: note.trim() } : {}) },
            });
            toast.success(
                `${quotation.quotationNumber} ${next === 'approved' ? 'approved' : 'rejected'}`
            );
            setOpenId(null);
            setNote('');
        } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : 'Could not update the quotation');
        }
    }

    return (
        <>
            <PageHeader
                title="Quotations"
                description="Bulk quotation requests from the cart — open the PDF, then approve or reject."
            />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <AdminTabs
                    label="Filter quotations"
                    value={status}
                    onChange={(next) => {
                        setStatus(next === 'pending' || next === 'approved' || next === 'rejected' ? next : 'all');
                        setPage(1);
                    }}
                    tabs={[
                        { value: 'all', label: `All${data ? ` (${data.total})` : ''}` },
                        { value: 'pending', label: `Pending${data ? ` (${data.pending})` : ''}` },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                    ]}
                />

                {data && data.pending > 0 && (
                    <p className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        {data.pending} waiting for a decision
                    </p>
                )}
            </div>

            <Panel>
                {isLoading ? (
                    <p className="px-5 py-10 text-center text-sm" style={{ color: Theme.colors.textMuted }}>
                        Loading quotations…
                    </p>
                ) : error ? (
                    <div className="px-5 py-10 text-center">
                        <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            Quotations could not be loaded
                        </p>
                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                            {error instanceof Error ? error.message : 'Please try again.'}
                        </p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                            {status === 'all' ? 'No quotations yet' : `No ${status} quotations`}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                            A shopper asks for one with “Send for Quotation” in the cart.
                        </p>
                    </div>
                ) : (
                    <ul>
                        {items.map((entry) => (
                            <li
                                key={entry.id}
                                className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p
                                            className="text-sm font-bold tabular-nums"
                                            style={{ color: Theme.colors.text }}
                                        >
                                            {entry.quotationNumber}
                                        </p>
                                        <StatusPill status={entry.status} />
                                        <DeliveryPill label="Customer" sent={entry.whatsapp.customer.sent} />
                                        <DeliveryPill label="Shop" sent={entry.whatsapp.admin.sent} />
                                    </div>

                                    <p
                                        className="mt-1 truncate text-[13px] font-medium"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {entry.customer.name}
                                        {entry.customer.phone ? ` · ${entry.customer.phone}` : ''}
                                    </p>

                                    <div
                                        className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        <span>{when(entry.date)}</span>
                                        <span>
                                            {entry.items.length}{' '}
                                            {entry.items.length === 1 ? 'product' : 'products'}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Phone size={11} />
                                            {entry.customer.phone || 'Not provided'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <p
                                        className="mr-1 text-sm font-bold tabular-nums"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {money(entry.total)}
                                    </p>
                                    <a
                                        href={entry.pdfUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold"
                                        style={{
                                            borderColor: Theme.colors.borderStrong,
                                            color: Theme.colors.text,
                                        }}
                                    >
                                        <Download size={13} />
                                        PDF
                                    </a>
                                    <AdminButton
                                        onClick={() => {
                                            setOpenId(entry.id);
                                            setNote(entry.note ?? '');
                                        }}
                                    >
                                        Review
                                    </AdminButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            {data && data.pages > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: Theme.colors.textMuted }}>
                        Page {data.page} of {data.pages}
                    </p>
                    <div className="flex items-center gap-2">
                        <AdminButton
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={data.page <= 1}
                        >
                            Previous
                        </AdminButton>
                        <AdminButton
                            onClick={() => setPage((current) => Math.min(data.pages, current + 1))}
                            disabled={data.page >= data.pages}
                        >
                            Next
                        </AdminButton>
                    </div>
                </div>
            )}

            <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setOpenId(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    {active && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{active.quotationNumber}</DialogTitle>
                                <DialogDescription>
                                    {active.customer.name} · {when(active.date)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill status={active.status} />
                                <DeliveryPill label="Customer" sent={active.whatsapp.customer.sent} />
                                <DeliveryPill label="Shop" sent={active.whatsapp.admin.sent} />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Customer">
                                    <p className="text-sm" style={{ color: Theme.colors.text }}>
                                        {active.customer.name}
                                    </p>
                                </Field>
                                <Field label="WhatsApp">
                                    <p className="text-sm" style={{ color: Theme.colors.text }}>
                                        {active.customer.phone || 'Not provided'}
                                    </p>
                                </Field>
                            </div>

                            <Field label="Delivery address">
                                <p
                                    className="whitespace-pre-line text-sm leading-relaxed"
                                    style={{ color: Theme.colors.text }}
                                >
                                    {active.customer.address}
                                </p>
                            </Field>

                            <div
                                className="overflow-x-auto rounded-lg border"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <table className="w-full text-left text-[12px]">
                                    <thead style={{ backgroundColor: Theme.colors.surfaceAlt }}>
                                        <tr
                                            className="text-[10px] uppercase tracking-[0.08em]"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            <th className="px-3 py-2 font-semibold">Product</th>
                                            <th className="px-3 py-2 font-semibold">HSN</th>
                                            <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold">Rate</th>
                                            <th className="px-3 py-2 text-right font-semibold">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {active.items.map((line) => (
                                            <tr
                                                key={`${line.productId}-${line.qty}`}
                                                className="border-t"
                                                style={{
                                                    borderColor: Theme.colors.border,
                                                    color: Theme.colors.text,
                                                }}
                                            >
                                                <td className="px-3 py-2">{line.name}</td>
                                                <td className="px-3 py-2 tabular-nums">{line.hsn}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {line.qty} {line.unit}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {money(line.rate)}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums">
                                                    {money(line.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <dl className="ml-auto w-full max-w-xs space-y-1.5 text-[13px]">
                                <div className="flex items-center justify-between">
                                    <dt style={{ color: Theme.colors.textMuted }}>Subtotal</dt>
                                    <dd className="tabular-nums" style={{ color: Theme.colors.text }}>
                                        {money(active.subtotal)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt style={{ color: Theme.colors.textMuted }}>
                                        CGST @ {active.cgstRate}%
                                    </dt>
                                    <dd className="tabular-nums" style={{ color: Theme.colors.text }}>
                                        {money(active.cgst)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt style={{ color: Theme.colors.textMuted }}>
                                        SGST @ {active.sgstRate}%
                                    </dt>
                                    <dd className="tabular-nums" style={{ color: Theme.colors.text }}>
                                        {money(active.sgst)}
                                    </dd>
                                </div>
                                <div
                                    className="flex items-center justify-between border-t pt-1.5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <dt className="font-semibold" style={{ color: Theme.colors.text }}>
                                        Final total
                                    </dt>
                                    <dd
                                        className="text-base font-bold tabular-nums"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {money(active.total)}
                                    </dd>
                                </div>
                            </dl>

                            <p className="text-[11px] italic" style={{ color: Theme.colors.textMuted }}>
                                {active.amountInWords}
                            </p>

                            {active.note && (
                                <p className="text-[12px]" style={{ color: Theme.colors.textMuted }}>
                                    Note: {active.note}
                                </p>
                            )}

                            <Field label="Note (shown on the record)" hint="Required when rejecting.">
                                <TextArea
                                    rows={3}
                                    value={note}
                                    placeholder="e.g. Can supply 200 units only at this rate"
                                    onChange={(event) => setNote(event.target.value)}
                                />
                            </Field>

                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                <a
                                    href={active.pdfUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold"
                                    style={{
                                        borderColor: Theme.colors.borderStrong,
                                        color: Theme.colors.text,
                                    }}
                                >
                                    <Download size={13} />
                                    Open PDF
                                </a>
                                <div className="flex flex-wrap items-center gap-2">
                                    <AdminButton
                                        variant="danger"
                                        onClick={() => decide(active, 'rejected')}
                                        disabled={review.isPending}
                                    >
                                        <X size={14} />
                                        Reject
                                    </AdminButton>
                                    <AdminButton
                                        variant="primary"
                                        onClick={() => decide(active, 'approved')}
                                        disabled={review.isPending}
                                    >
                                        <Check size={14} />
                                        {review.isPending ? 'Saving…' : 'Approve'}
                                    </AdminButton>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
