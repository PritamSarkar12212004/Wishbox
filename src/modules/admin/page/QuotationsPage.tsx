import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Building2,
    Check,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Landmark,
    Phone,
    RotateCcw,
    Save,
    Sparkles,
    X,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AdminButton,
    AdminTabs,
    Field,
    PageHeader,
    Panel,
    PanelHeader,
    TextArea,
    TextInput,
} from '../components/AdminUI';
import {
    useAdminQuotations,
    usePreviewQuotationSettingsPdf,
    useQuotationSettingsQuery,
    useResetQuotationSettings,
    useReviewQuotation,
    useUpdateQuotationSettings,
} from '../api/useAdmin';
import type {
    AdminQuotation,
    QuotationBankDetails,
    QuotationPdfSettings,
} from '../api/adminApi';
import adminConst from '../consts/adminConst';

const stamp = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });
const when = (iso: string) => stamp.format(new Date(iso));

/** Paise are real money on a quotation, so totals keep their two decimals. */
const money = (value: number) =>
    `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pdfMoney = (value: number) =>
    value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

/* ------------------------------------------------------------------ */
/*  Indian amount-in-words helper for live preview                     */
/* ------------------------------------------------------------------ */

const ONES = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
];

const TENS = [
    '',
    'Ten',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
];

function twoDigits(value: number): string {
    if (value < 20) return ONES[value] ?? '';
    const tens = TENS[Math.floor(value / 10)] ?? '';
    const ones = ONES[value % 10] ?? '';
    return ones ? `${tens} ${ones}` : tens;
}

function threeDigits(value: number): string {
    const hundreds = Math.floor(value / 100);
    const rest = value % 100;
    const parts: string[] = [];
    if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
    if (rest > 0) parts.push(twoDigits(rest));
    return parts.join(' ');
}

function formatAmountInWords(amount: number): string {
    const rounded = Math.round((Math.max(0, amount) + Number.EPSILON) * 100) / 100;
    const rupees = Math.floor(rounded);
    const paise = Math.round((rounded - rupees) * 100);

    if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

    const crore = Math.floor(rupees / 10_000_000);
    const lakh = Math.floor((rupees % 10_000_000) / 100_000);
    const thousand = Math.floor((rupees % 100_000) / 1_000);
    const hundred = rupees % 1_000;

    const words: string[] = [];
    if (crore > 0) words.push(`${threeDigits(crore)} Crore`);
    if (lakh > 0) words.push(`${twoDigits(lakh)} Lakh`);
    if (thousand > 0) words.push(`${twoDigits(thousand)} Thousand`);
    if (hundred > 0) words.push(threeDigits(hundred));

    const rupeeWords = words.join(' ') || 'Zero';
    const paiseWords = paise > 0 ? ` and ${twoDigits(paise)} Paisa` : '';
    return `${rupeeWords} Rupees${paiseWords} Only`;
}

/**
 * Bulk quotation requests + dynamic Quotation PDF & GST Settings editor with live preview.
 */
export default function QuotationsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const activeSection: 'requests' | 'settings' = location.pathname.endsWith('/settings')
        ? 'settings'
        : 'requests';

    function switchSection(next: 'requests' | 'settings') {
        navigate(
            next === 'settings'
                ? adminConst.route.quotationSettingsPage
                : adminConst.route.quotationsPage
        );
    }

    return (
        <div>
            {/* Top-level section tabs */}
            <div
                className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
                style={{ borderColor: Theme.colors.border }}
            >
                <AdminTabs
                    label="Quotation management sections"
                    value={activeSection}
                    onChange={(next) =>
                        switchSection(next === 'settings' ? 'settings' : 'requests')
                    }
                    tabs={[
                        { value: 'requests', label: 'Quotation Requests' },
                        { value: 'settings', label: 'PDF & GST Details (Template & Preview)' },
                    ]}
                />

                {activeSection === 'requests' && (
                    <AdminButton onClick={() => switchSection('settings')}>
                        <FileText size={13} />
                        Edit PDF & GST Details
                    </AdminButton>
                )}
            </div>

            {activeSection === 'settings' ? (
                <QuotationPdfSettingsPanel />
            ) : (
                <QuotationRequestsSection />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tab 1: Quotation Requests                                          */
/* ------------------------------------------------------------------ */

function QuotationRequestsSection() {
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
                        setStatus(
                            next === 'pending' || next === 'approved' || next === 'rejected'
                                ? next
                                : 'all'
                        );
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
                    <p
                        className="px-5 py-10 text-center text-sm"
                        style={{ color: Theme.colors.textMuted }}
                    >
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
                                        <DeliveryPill
                                            label="Customer"
                                            sent={entry.whatsapp.customer.sent}
                                        />
                                        <DeliveryPill
                                            label="Shop"
                                            sent={entry.whatsapp.admin.sent}
                                        />
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
                                <DeliveryPill
                                    label="Customer"
                                    sent={active.whatsapp.customer.sent}
                                />
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
                                            <th className="px-3 py-2 text-right font-semibold">
                                                Qty
                                            </th>
                                            <th className="px-3 py-2 text-right font-semibold">
                                                Rate
                                            </th>
                                            <th className="px-3 py-2 text-right font-semibold">
                                                Amount
                                            </th>
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
                                                <td className="px-3 py-2 tabular-nums">
                                                    {line.hsn}
                                                </td>
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
                                    <dd
                                        className="tabular-nums"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {money(active.subtotal)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt style={{ color: Theme.colors.textMuted }}>
                                        CGST @ {active.cgstRate}%
                                    </dt>
                                    <dd
                                        className="tabular-nums"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {money(active.cgst)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt style={{ color: Theme.colors.textMuted }}>
                                        SGST @ {active.sgstRate}%
                                    </dt>
                                    <dd
                                        className="tabular-nums"
                                        style={{ color: Theme.colors.text }}
                                    >
                                        {money(active.sgst)}
                                    </dd>
                                </div>
                                <div
                                    className="flex items-center justify-between border-t pt-1.5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <dt
                                        className="font-semibold"
                                        style={{ color: Theme.colors.text }}
                                    >
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

                            <p
                                className="text-[11px] italic"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {active.amountInWords}
                            </p>

                            {active.note && (
                                <p
                                    className="text-[12px]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
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

/* ------------------------------------------------------------------ */
/*  Tab 2: Quotation PDF & GST Details + Live Preview                  */
/* ------------------------------------------------------------------ */

function QuotationPdfSettingsPanel() {
    const { data: savedSettings, isLoading, error } = useQuotationSettingsQuery();
    const updateMutation = useUpdateQuotationSettings();
    const resetMutation = useResetQuotationSettings();
    const previewPdfMutation = usePreviewQuotationSettingsPdf();

    const [draft, setDraft] = useState<QuotationPdfSettings | null>(savedSettings ?? null);
    const [previewMode, setPreviewMode] = useState<'visual' | 'pdf'>('visual');
    const [renderedPdfUrl, setRenderedPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (savedSettings) {
            setDraft(savedSettings);
        }
    }, [savedSettings]);

    const dirty = useMemo(
        () =>
            Boolean(draft && savedSettings) &&
            JSON.stringify(draft) !== JSON.stringify(savedSettings),
        [draft, savedSettings]
    );

    const patch = (values: Partial<QuotationPdfSettings>) => {
        setDraft((current) => (current ? { ...current, ...values } : current));
    };

    const patchBank = (values: Partial<QuotationBankDetails>) => {
        setDraft((current) =>
            current ? { ...current, bank: { ...current.bank, ...values } } : current
        );
    };

    if (isLoading || (!draft && !error)) {
        return (
            <Panel>
                <p
                    className="px-5 py-12 text-center text-sm"
                    style={{ color: Theme.colors.textMuted }}
                >
                    Loading PDF &amp; GST details from database…
                </p>
            </Panel>
        );
    }

    if (error || !draft) {
        return (
            <Panel>
                <div className="px-5 py-10 text-center">
                    <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>
                        Could not load PDF &amp; GST details from database
                    </p>
                    <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                        {error instanceof Error ? error.message : 'Please try again.'}
                    </p>
                </div>
            </Panel>
        );
    }

    function extractPanFromGstin() {
        if (!draft) return;
        const cleaned = draft.gstin.trim().toUpperCase();
        if (cleaned.length >= 12) {
            const extracted = cleaned.slice(2, 12);
            patch({ gstin: cleaned, pan: extracted });
            toast.success(`PAN updated to ${extracted} from GSTIN`);
        } else {
            toast.error('Enter a valid 15-character GSTIN first');
        }
    }

    async function handleSave() {
        if (!draft) return;
        if (!draft.storeName.trim()) {
            toast.error('Trade / Store name is required');
            return;
        }
        if (!draft.ownerLine.trim()) {
            toast.error('Legal / Proprietor name is required');
            return;
        }
        if (!draft.gstin.trim()) {
            toast.error('GSTIN number is required');
            return;
        }
        if (!draft.address.trim()) {
            toast.error('Registered business address is required');
            return;
        }

        try {
            const saved = await updateMutation.mutateAsync(draft);
            setDraft(saved);
            toast.success('Quotation PDF & GST details saved to database', {
                description: 'All new quotations will now generate with these details.',
            });
        } catch (cause) {
            toast.error(
                cause instanceof Error ? cause.message : 'Could not save quotation PDF details'
            );
        }
    }

    async function handleReset() {
        try {
            const restored = await resetMutation.mutateAsync();
            setDraft(restored);
            setRenderedPdfUrl(null);
            toast.success('Reset to GST Certificate defaults in database');
        } catch (cause) {
            toast.error(
                cause instanceof Error ? cause.message : 'Could not reset on server'
            );
        }
    }

    async function handleRenderRealPdf(openInNewTab = false) {
        if (!draft) return;
        try {
            const result = await previewPdfMutation.mutateAsync(draft);
            setRenderedPdfUrl(result.pdfDataUrl);
            if (openInNewTab) {
                const link = document.createElement('a');
                link.href = result.pdfDataUrl;
                link.download = 'WishBox-Quotation-Sample-Preview.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Sample Quotation PDF downloaded');
            } else {
                setPreviewMode('pdf');
            }
        } catch (cause) {
            toast.error(
                cause instanceof Error ? cause.message : 'Could not generate sample PDF'
            );
        }
    }

    return (
        <div>
            <PageHeader
                title="Quotation PDF & GST Details"
                description="Dynamic GST registration details, business address, tax rates, HSN defaults and bank account printed on every quotation PDF."
            >
                <AdminButton
                    disabled={previewPdfMutation.isPending}
                    onClick={() => void handleRenderRealPdf(true)}
                >
                    <Download size={13} />
                    {previewPdfMutation.isPending ? 'Generating PDF…' : 'Download Sample PDF'}
                </AdminButton>
                <AdminButton
                    disabled={resetMutation.isPending || updateMutation.isPending}
                    onClick={() => void handleReset()}
                >
                    <RotateCcw size={13} />
                    Reset to GST Certificate
                </AdminButton>
                <AdminButton
                    variant="primary"
                    disabled={!dirty || updateMutation.isPending || isLoading}
                    onClick={() => void handleSave()}
                >
                    <Save size={13} />
                    {updateMutation.isPending ? 'Saving…' : 'Save PDF Details'}
                </AdminButton>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
                {/* Left Column: Editor Forms */}
                <div className="flex flex-col gap-6">
                    {/* 1. Business & GST Identity */}
                    <Panel>
                        <PanelHeader
                            title="GST Registration & Business Identity"
                            meta="Pre-filled from Form GST REG-06 (Registration Certificate)"
                            action={
                                <Building2
                                    size={15}
                                    style={{ color: Theme.colors.primaryDark }}
                                />
                            }
                        />
                        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                            <div className="sm:col-span-2">
                                <Field
                                    label="Trade Name / Store Name"
                                    hint="Main heading at the top-left of the quotation PDF."
                                >
                                    <TextInput
                                        value={draft.storeName}
                                        placeholder="WISHBOX PAPER DECOR COMPANY"
                                        onChange={(e) => patch({ storeName: e.target.value })}
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Legal Name / Proprietor"
                                hint="Printed directly below the trade name."
                            >
                                <TextInput
                                    value={draft.ownerLine}
                                    placeholder="SWAPAN SUSHIL SINGHA"
                                    onChange={(e) => patch({ ownerLine: e.target.value })}
                                />
                            </Field>

                            <Field
                                label="Constitution of Business"
                                hint="e.g. Proprietorship, Partnership, Pvt. Ltd."
                            >
                                <TextInput
                                    value={draft.constitution}
                                    placeholder="Proprietorship"
                                    onChange={(e) => patch({ constitution: e.target.value })}
                                />
                            </Field>

                            <Field
                                label="GSTIN (Registration Number)"
                                hint="15-character Goods & Services Tax Identification Number."
                            >
                                <TextInput
                                    value={draft.gstin}
                                    placeholder="27DGYPS7370L1Z4"
                                    onChange={(e) =>
                                        patch({ gstin: e.target.value.toUpperCase() })
                                    }
                                />
                            </Field>

                            <Field
                                label="PAN Number"
                                hint="10-character PAN (characters 3–12 of GSTIN)."
                            >
                                <div className="flex items-center gap-2">
                                    <TextInput
                                        value={draft.pan}
                                        placeholder="DGYPS7370L"
                                        onChange={(e) =>
                                            patch({ pan: e.target.value.toUpperCase() })
                                        }
                                    />
                                    <AdminButton
                                        onClick={extractPanFromGstin}
                                        title="Auto-fill PAN from GSTIN"
                                        className="shrink-0 px-2.5"
                                    >
                                        <Sparkles size={12} />
                                        From GSTIN
                                    </AdminButton>
                                </div>
                            </Field>

                            <Field label="State / Place of Supply">
                                <TextInput
                                    value={draft.state}
                                    placeholder="Maharashtra"
                                    onChange={(e) => patch({ state: e.target.value })}
                                />
                            </Field>

                            <Field label="Payment Terms">
                                <TextInput
                                    value={draft.paymentTerm}
                                    placeholder="100% Advance"
                                    onChange={(e) => patch({ paymentTerm: e.target.value })}
                                />
                            </Field>
                        </div>
                    </Panel>

                    {/* 2. Principal Place of Business & Contacts */}
                    <Panel>
                        <PanelHeader
                            title="Principal Place of Business & Contact"
                            meta="Address and contact lines shown in the PDF header and footer"
                            action={
                                <Phone size={15} style={{ color: Theme.colors.primaryDark }} />
                            }
                        />
                        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                            <div className="sm:col-span-2">
                                <Field
                                    label="Registered Business Address"
                                    hint="Building/Flat, Premises, Road/Street, Landmark, Locality, City, District, State & PIN Code."
                                >
                                    <TextArea
                                        rows={3}
                                        value={draft.address}
                                        placeholder="Flat No. 402, C Wing, Gaytree Landmark Phase 2, Dange Chowk Flyover..."
                                        onChange={(e) => patch({ address: e.target.value })}
                                    />
                                </Field>
                            </div>

                            <Field label="Contact Phone Number">
                                <TextInput
                                    type="tel"
                                    value={draft.phone}
                                    placeholder="9405561572"
                                    onChange={(e) => patch({ phone: e.target.value })}
                                />
                            </Field>

                            <Field label="Contact Email">
                                <TextInput
                                    type="email"
                                    value={draft.email}
                                    placeholder="wishboxpune@gmail.com"
                                    onChange={(e) => patch({ email: e.target.value })}
                                />
                            </Field>
                        </div>
                    </Panel>

                    {/* 3. Tax Slabs & Table Defaults */}
                    <Panel>
                        <PanelHeader
                            title="GST Tax Slabs & Line Defaults"
                            meta="Applied when pricing quotation items and computing totals"
                            action={
                                <FileSpreadsheet
                                    size={15}
                                    style={{ color: Theme.colors.primaryDark }}
                                />
                            }
                        />
                        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                            <Field
                                label="CGST Rate (%)"
                                hint="Central GST percentage applied on taxable subtotal."
                            >
                                <TextInput
                                    type="number"
                                    min={0}
                                    max={50}
                                    step="0.5"
                                    value={String(draft.cgstRate)}
                                    onChange={(e) =>
                                        patch({
                                            cgstRate: Math.max(
                                                0,
                                                Math.min(50, Number(e.target.value) || 0)
                                            ),
                                        })
                                    }
                                />
                            </Field>

                            <Field
                                label="SGST Rate (%)"
                                hint="State GST percentage applied on taxable subtotal."
                            >
                                <TextInput
                                    type="number"
                                    min={0}
                                    max={50}
                                    step="0.5"
                                    value={String(draft.sgstRate)}
                                    onChange={(e) =>
                                        patch({
                                            sgstRate: Math.max(
                                                0,
                                                Math.min(50, Number(e.target.value) || 0)
                                            ),
                                        })
                                    }
                                />
                            </Field>

                            <Field
                                label="Default HSN/SAC Code"
                                hint="Used when a product does not specify its own HSN code."
                            >
                                <TextInput
                                    value={draft.defaultHsn}
                                    placeholder="48239090"
                                    onChange={(e) => patch({ defaultHsn: e.target.value })}
                                />
                            </Field>

                            <Field
                                label="Default Unit"
                                hint="Printed in the 'Per Unit' column (e.g. pcs, sets, boxes)."
                            >
                                <TextInput
                                    value={draft.defaultUnit}
                                    placeholder="pcs"
                                    onChange={(e) => patch({ defaultUnit: e.target.value })}
                                />
                            </Field>
                        </div>
                    </Panel>

                    {/* 4. Bank Account Details */}
                    <Panel>
                        <PanelHeader
                            title="Bank Account Details"
                            meta="Printed in the bottom-left settlement block of the quotation PDF"
                            action={
                                <Landmark size={15} style={{ color: Theme.colors.primaryDark }} />
                            }
                        />
                        <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                            <Field label="Bank Name">
                                <TextInput
                                    value={draft.bank.name}
                                    placeholder="Axis Bank"
                                    onChange={(e) => patchBank({ name: e.target.value })}
                                />
                            </Field>

                            <Field label="Account Type">
                                <TextInput
                                    value={draft.bank.accountType}
                                    placeholder="Saving Account / Current Account"
                                    onChange={(e) => patchBank({ accountType: e.target.value })}
                                />
                            </Field>

                            <Field label="Account Holder Name">
                                <TextInput
                                    value={draft.bank.holder}
                                    placeholder="Tapan Sushil Singha"
                                    onChange={(e) => patchBank({ holder: e.target.value })}
                                />
                            </Field>

                            <Field label="Account Number">
                                <TextInput
                                    value={draft.bank.accountNumber}
                                    placeholder="917010036587018"
                                    onChange={(e) => patchBank({ accountNumber: e.target.value })}
                                />
                            </Field>

                            <Field label="IFSC Code">
                                <TextInput
                                    value={draft.bank.ifsc}
                                    placeholder="UTIB0001494"
                                    onChange={(e) =>
                                        patchBank({ ifsc: e.target.value.toUpperCase() })
                                    }
                                />
                            </Field>

                            <Field label="Branch">
                                <TextInput
                                    value={draft.bank.branch}
                                    placeholder="Nigdi, Pune"
                                    onChange={(e) => patchBank({ branch: e.target.value })}
                                />
                            </Field>
                        </div>
                    </Panel>

                    {/* 5. Footer Disclaimer & Validity */}
                    <Panel>
                        <PanelHeader
                            title="Document Footer & Validity Note"
                            meta="Printed at the bottom of every page along with GSTIN and contact info"
                        />
                        <div className="px-4 py-4 sm:px-5">
                            <Field
                                label="Footer Disclaimer Text"
                                hint="Appears before the quotation number and GSTIN summary in the footer."
                            >
                                <TextArea
                                    rows={2}
                                    value={draft.footerNote}
                                    placeholder="This is a quotation, not a tax invoice. Prices are valid for 30 days from the quotation date."
                                    onChange={(e) => patch({ footerNote: e.target.value })}
                                />
                            </Field>
                        </div>
                    </Panel>
                </div>

                {/* Right Column: Sticky Live Preview */}
                <div className="xl:sticky xl:top-20 xl:self-start">
                    <Panel>
                        <PanelHeader
                            title="Live Quotation PDF Preview"
                            meta={
                                dirty
                                    ? 'Showing unsaved edits in real time'
                                    : 'Showing saved live configuration'
                            }
                            action={
                                <div className="flex flex-wrap items-center gap-2">
                                    <AdminButton
                                        variant={previewMode === 'visual' ? 'primary' : 'ghost'}
                                        onClick={() => setPreviewMode('visual')}
                                        className="h-8 px-2.5 text-[11px]"
                                    >
                                        <Eye size={12} />
                                        Live Sheet
                                    </AdminButton>
                                    <AdminButton
                                        variant={previewMode === 'pdf' ? 'primary' : 'ghost'}
                                        disabled={previewPdfMutation.isPending}
                                        onClick={() => void handleRenderRealPdf(false)}
                                        className="h-8 px-2.5 text-[11px]"
                                    >
                                        <FileText size={12} />
                                        {previewPdfMutation.isPending
                                            ? 'Rendering…'
                                            : 'Real PDF View'}
                                    </AdminButton>
                                </div>
                            }
                        />

                        <div
                            className="p-3 sm:p-5"
                            style={{ backgroundColor: Theme.colors.surfaceAlt }}
                        >
                            {previewMode === 'pdf' && renderedPdfUrl ? (
                                <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                                    <iframe
                                        title="Rendered Quotation PDF Preview"
                                        src={renderedPdfUrl}
                                        className="h-[720px] w-full border-0"
                                    />
                                </div>
                            ) : (
                                <QuotationPaperPreview settings={draft} />
                            )}
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Exact A4 Visual Replica of quotations.pdf.ts                       */
/* ------------------------------------------------------------------ */

function QuotationPaperPreview({ settings }: { settings: QuotationPdfSettings }) {
    const sampleLines = useMemo(() => {
        const hsn = settings.defaultHsn.trim() || '48239090';
        const unit = settings.defaultUnit.trim() || 'pcs';
        return [
            {
                sr: 1,
                name: 'Honeycomb Paper Lantern Set (Assorted Festive Pack)',
                hsn,
                qty: 50,
                rate: 120,
                unit,
                amount: 50 * 120,
            },
            {
                sr: 2,
                name: 'Origami Paper Star Garland — Warm Ivory (3m)',
                hsn,
                qty: 30,
                rate: 85,
                unit,
                amount: 30 * 85,
            },
        ];
    }, [settings.defaultHsn, settings.defaultUnit]);

    const totals = useMemo(() => {
        const subtotal = sampleLines.reduce((sum, item) => sum + item.amount, 0);
        const cgst = Math.round((subtotal * settings.cgstRate + Number.EPSILON)) / 100;
        const sgst = Math.round((subtotal * settings.sgstRate + Number.EPSILON)) / 100;
        const total = Math.round((subtotal + cgst + sgst + Number.EPSILON) * 100) / 100;
        return {
            subtotal,
            cgst,
            sgst,
            total,
            words: formatAmountInWords(total),
        };
    }, [sampleLines, settings.cgstRate, settings.sgstRate]);

    const today = useMemo(() => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${now.getFullYear()}`;
    }, []);

    const ownerAndConstitution = settings.constitution.trim()
        ? `${(settings.ownerLine || 'OWNER NAME').toUpperCase()} (${settings.constitution.trim().toUpperCase()})`
        : (settings.ownerLine || 'OWNER NAME').toUpperCase();

    return (
        <div
            className="mx-auto w-full max-w-[680px] rounded-md border bg-white p-5 shadow-md sm:p-7"
            style={{
                borderColor: '#D1D5DB',
                color: '#111827',
                fontFamily: 'Helvetica, Arial, sans-serif',
            }}
        >
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 border-b-[1.5px] border-[#111827] pb-3.5 sm:flex-row sm:items-start">
                <div className="max-w-[64%] space-y-1">
                    <h3
                        className="text-base font-bold leading-snug sm:text-lg"
                        style={{ color: '#1F3A5F' }}
                    >
                        {settings.storeName || 'STORE / TRADE NAME'}
                    </h3>
                    <p
                        className="text-[10.5px] font-bold tracking-[0.05em]"
                        style={{ color: '#111827' }}
                    >
                        {ownerAndConstitution}
                    </p>
                    <p
                        className="whitespace-pre-line text-[10.5px] leading-relaxed"
                        style={{ color: '#6B7280' }}
                    >
                        {settings.address || 'Registered Business Address'}
                    </p>
                    <p className="pt-0.5 text-[10.5px] font-bold" style={{ color: '#111827' }}>
                        GSTIN Number: {settings.gstin || '—'}
                        {settings.pan.trim() ? `    PAN: ${settings.pan.trim()}` : ''}
                    </p>
                    <p className="text-[10.5px]" style={{ color: '#6B7280' }}>
                        Contact: {settings.phone || '—'} &nbsp;&nbsp; Mail:{' '}
                        {settings.email || '—'}
                    </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                    <p
                        className="text-sm font-bold tracking-wide sm:text-base"
                        style={{ color: '#1F3A5F' }}
                    >
                        QUOTATION
                    </p>
                    <p className="mt-1 text-[11px] font-bold" style={{ color: '#111827' }}>
                        No.: WBQ-1001
                    </p>
                    <p className="text-[10.5px]" style={{ color: '#6B7280' }}>
                        Date: {today}
                    </p>
                    <p className="text-[10.5px]" style={{ color: '#6B7280' }}>
                        State: {settings.state || '—'}
                    </p>
                    {settings.paymentTerm.trim() && (
                        <p className="text-[10px]" style={{ color: '#6B7280' }}>
                            Terms: {settings.paymentTerm.trim()}
                        </p>
                    )}
                </div>
            </div>

            {/* Buyer Box */}
            <div className="mt-3.5 rounded bg-[#F3F4F6] p-3">
                <p
                    className="text-[9.5px] font-bold uppercase tracking-[0.06em]"
                    style={{ color: '#6B7280' }}
                >
                    QUOTATION TO
                </p>
                <p className="mt-0.5 text-xs font-bold" style={{ color: '#111827' }}>
                    Aarav Enterprises (Sample Buyer)
                </p>
                <p className="mt-0.5 text-[10.5px] leading-snug" style={{ color: '#6B7280' }}>
                    Shop No. 14, Market Yard Road, Kothrud, Pune, Maharashtra - 411038
                </p>
                <p className="mt-0.5 text-[10.5px]" style={{ color: '#111827' }}>
                    Phone: +919876543210
                </p>
            </div>

            {/* Line Items Table */}
            <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-[10.5px]">
                    <thead>
                        <tr className="bg-[#F3F4F6] text-[9px] font-bold uppercase text-[#111827]">
                            <th className="px-2 py-2 text-left">Sr.</th>
                            <th className="px-2 py-2 text-left">
                                Description of Goods &amp; Services
                            </th>
                            <th className="px-2 py-2 text-center">HSN/SAC</th>
                            <th className="px-2 py-2 text-right">Qty</th>
                            <th className="px-2 py-2 text-right">Rate (INR)</th>
                            <th className="px-2 py-2 text-right">Unit</th>
                            <th className="px-2 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sampleLines.map((line) => (
                            <tr
                                key={line.sr}
                                className="border-b border-[#D1D5DB] text-[#111827]"
                            >
                                <td className="px-2 py-2 tabular-nums">{line.sr}</td>
                                <td className="px-2 py-2">{line.name}</td>
                                <td className="px-2 py-2 text-center tabular-nums">
                                    {line.hsn}
                                </td>
                                <td className="px-2 py-2 text-right tabular-nums">{line.qty}</td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                    {pdfMoney(line.rate)}
                                </td>
                                <td className="px-2 py-2 text-right">{line.unit}</td>
                                <td className="px-2 py-2 text-right tabular-nums">
                                    {pdfMoney(line.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Block */}
            <div className="mt-3 flex justify-end">
                <div className="w-full max-w-[260px] text-[10.5px]">
                    <div className="flex items-center justify-between border-b border-[#D1D5DB] px-2.5 py-1.5">
                        <span style={{ color: '#6B7280' }}>Subtotal (Taxable Value)</span>
                        <span className="font-bold tabular-nums">
                            Rs. {pdfMoney(totals.subtotal)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#D1D5DB] px-2.5 py-1.5">
                        <span style={{ color: '#6B7280' }}>CGST @ {settings.cgstRate}%</span>
                        <span className="font-bold tabular-nums">
                            Rs. {pdfMoney(totals.cgst)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#D1D5DB] px-2.5 py-1.5">
                        <span style={{ color: '#6B7280' }}>SGST @ {settings.sgstRate}%</span>
                        <span className="font-bold tabular-nums">
                            Rs. {pdfMoney(totals.sgst)}
                        </span>
                    </div>
                    <div
                        className="flex items-center justify-between px-2.5 py-2 text-white"
                        style={{ backgroundColor: '#1F3A5F' }}
                    >
                        <span className="text-[11px] font-bold">FINAL TOTAL</span>
                        <span className="text-xs font-bold tabular-nums">
                            Rs. {pdfMoney(totals.total)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Amount in Words */}
            <div className="mt-3.5 rounded bg-[#F3F4F6] p-2.5">
                <p
                    className="text-[9px] font-bold uppercase tracking-wide"
                    style={{ color: '#6B7280' }}
                >
                    TOTAL AMOUNT IN WORDS
                </p>
                <p className="mt-0.5 text-[10.5px] italic" style={{ color: '#111827' }}>
                    {totals.words}
                </p>
            </div>

            {/* Bank Details */}
            <div className="mt-4">
                <p
                    className="text-[10px] font-bold uppercase tracking-[0.05em]"
                    style={{ color: '#1F3A5F' }}
                >
                    BANK ACCOUNT DETAILS
                </p>
                <div
                    className="mt-1 space-y-0.5 text-[10px] leading-relaxed"
                    style={{ color: '#6B7280' }}
                >
                    <p>Bank Name: {settings.bank.name || '—'}</p>
                    <p>Account Type: {settings.bank.accountType || '—'}</p>
                    <p>Account Holder Name: {settings.bank.holder || '—'}</p>
                    <p>Account Number: {settings.bank.accountNumber || '—'}</p>
                    <p>IFSC Code: {settings.bank.ifsc || '—'}</p>
                    <p>Branch: {settings.bank.branch || '—'}</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-5 border-t border-[#D1D5DB] pt-2 text-center text-[9.5px] leading-relaxed text-[#6B7280]">
                {settings.footerNote.trim() ? `${settings.footerNote.trim()} ` : ''}
                (WBQ-1001) · GSTIN {settings.gstin || '—'} · {settings.email || '—'} ·{' '}
                {settings.phone || '—'}
            </div>
        </div>
    );
}
