import { useReducer, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    BadgeCheck,
    ImageOff,
    Loader2,
    MapPin,
    Phone,
    Receipt,
    RotateCcw,
    Truck,
    UploadCloud,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import SelectMenu from '@/components/ui/select-menu';
import { AdminButton, AdminStatusChip, Panel, PanelHeader, PaymentStatusChip, TextInput } from '../components/AdminUI';
import ConfirmDialog from '../components/ConfirmDialog';
import ScreenshotViewer from '../components/ScreenshotViewer';
import adminConst from '../consts/adminConst';
import { COURIER_OPTIONS } from '../consts/courierConst';
import { nextStatusOptions } from '../consts/orderConst';
import {
    CANCELLATION_REASONS,
    type AdminOrder,
    type AdminOrderStatus,
    type CancellationReason,
    type RefundStatus,
} from '../data/adminData';
import { useAdminFeed } from '../hooks/useAdminFeed';
import {
    addressOf,
    approvalStateOf,
    decodeOrderId,
    hasShipment,
    refundStatusOf,
    type ApprovalState,
} from '../lib/orderDetail';
import { useUpdateOrder } from '../api/useAdmin';
import type { AdminOrderPatch } from '../api/adminApi';
import { useAdminSettings } from '../store/settingsStore';

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});
const DATE_ONLY = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
const TIME_ONLY = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** Matches the catalogue's image DropZone — in-browser storage is small. */
const MAX_SCREENSHOT_KB = 300;

const initialsOf = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?';

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read-failed'));
        reader.readAsDataURL(file);
    });
}

type Preview = { src: string; alt: string };

/**
 * Full-screen order sheet.
 *
 * Replaces the old order modal: **View** on the orders list routes here, so an
 * admin sees the customer, address, every ordered line, the totals, the payment
 * proof and the approve / cancel / refund controls on one screen — laid out like
 * a chat / conversation view that collapses cleanly on a phone.
 */
export default function OrderDetailsPage() {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const { orders } = useAdminFeed();
    /* Retry only needs a fresh render — the lookup below runs on every render. */
    const [, reload] = useReducer((count: number) => count + 1, 0);

    const id = decodeOrderId(orderId);
    const order = orders.find((entry) => entry.id === id);

    const backToOrders = () => navigate(adminConst.route.ordersPage);

    if (!order) {
        return <OrderLoadError onRetry={reload} onBack={backToOrders} />;
    }

    return <OrderSheet key={order.id} order={order} onBack={backToOrders} />;
}

function OrderSheet({ order, onBack }: { order: AdminOrder; onBack: () => void }) {
    const settings = useAdminSettings();
    const approval = approvalStateOf(order);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [confirm, setConfirm] = useState<'approve' | 'cancel' | null>(null);
    const [cancelReason, setCancelReason] = useState<CancellationReason>(CANCELLATION_REASONS[0]);
    const [busy, setBusy] = useState(false);

    const units = order.items.reduce((sum, item) => sum + item.qty, 0);
    const updateOrder = useUpdateOrder();

    /**
     * Sends one change to the API and reports exactly what happened.
     *
     * Every action below goes through here, so the sheet only ever shows a
     * success after the server has accepted the write — a refusal surfaces as
     * an error toast with the API's own explanation, never as a faked success.
     */
    async function applyPatch(patch: AdminOrderPatch, success: string, description?: string) {
        try {
            await updateOrder.mutateAsync({ id: order.id, patch });
            toast.success(success, description ? { description } : undefined);
            return true;
        } catch (error) {
            toast.error('Could not update the order', {
                description: error instanceof Error ? error.message : 'Please try again.',
            });
            return false;
        }
    }

    /** Move a parcel that is already with a courier to its next stage. */
    function advanceStatus(status: AdminOrderStatus) {
        if (status === order.status) return;
        void applyPatch({ status }, `${order.id} marked ${status.toLowerCase()}`, 'The pipeline has moved on.');
    }

    /**
     * Handover. The courier and the AWB are saved *and* the order is marked
     * shipped in the same request — there is deliberately no way to ship an
     * order without them, and the API rejects a courier on an unapproved order.
     */
    function shipOrder(patch: { courier: string; trackingId: string }) {
        void applyPatch(
            { status: 'Shipped', courier: patch.courier, trackingId: patch.trackingId },
            `${order.id} marked shipped`,
            `${patch.courier} · ${patch.trackingId}`
        );
    }

    /** Correcting the carrier or AWB once the parcel is already moving. */
    function saveShipping(patch: { courier: string; trackingId: string }) {
        void applyPatch(
            { courier: patch.courier, trackingId: patch.trackingId },
            'Shipping details saved',
            `${order.id} · ${patch.courier}${patch.trackingId ? ` · ${patch.trackingId}` : ''}`
        );
    }

    /*
     * Approval and cancellation go straight to the API, which stamps the
     * timestamps and the admin who made the call.
     */
    async function approve() {
        setBusy(true);
        const done = await applyPatch(
            { status: 'Approved' },
            `${order.id} approved`,
            'Payment verified — the order has moved into fulfilment.'
        );
        if (done) setConfirm(null);
        setBusy(false);
    }

    async function cancel() {
        setBusy(true);
        const done = await applyPatch(
            { status: 'Cancelled', cancellationReason: cancelReason },
            `${order.id} cancelled`,
            'The refund section is now open for this order.'
        );
        if (done) setConfirm(null);
        setBusy(false);
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <OrderHeader
                order={order}
                onBack={onBack}
                onAdvance={advanceStatus}
                onShip={shipOrder}
                onSaveShipping={saveShipping}
                defaultCourier={settings.defaultCourier}
            />

            {/* The chat header stays put; only this pane scrolls. */}
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="grid w-full grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                    <div className="flex min-w-0 flex-col gap-4">
                        <OrderInformation order={order} />
                        <OrderedItems order={order} units={units} />
                        <PriceSummary order={order} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-4">
                        <PaymentScreenshotSection order={order} onPreview={setPreview} />
                        <ApprovalSection
                            order={order}
                            state={approval}
                            onApprove={() => setConfirm('approve')}
                            onCancel={() => setConfirm('cancel')}
                        />
                        {approval === 'cancelled' && <RefundSection order={order} onPreview={setPreview} />}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirm === 'approve'}
                title="Approve this order?"
                description={`Are you sure you want to approve ${order.id}? The payment is marked verified and the order is released to fulfilment.`}
                confirmLabel="Approve order"
                busy={busy}
                onConfirm={approve}
                onClose={() => setConfirm(null)}
            />

            <ConfirmDialog
                open={confirm === 'cancel'}
                title="Cancel this order?"
                description={`Are you sure you want to cancel ${order.id}? A refund section opens so you can record the refund.`}
                confirmLabel="Cancel order"
                confirmVariant="danger"
                cancelLabel="Keep order"
                busy={busy}
                onConfirm={cancel}
                onClose={() => setConfirm(null)}
            >
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: Theme.colors.text }}>
                        Cancellation reason
                    </span>
                    {/*
                     * A native select on purpose: the themed SelectMenu portals its
                     * popup outside the dialog, where the dialog's outside-click
                     * dismiss would close the sheet before a reason could be picked.
                     */}
                    <select
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value as CancellationReason)}
                        className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-black/10"
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                            color: Theme.colors.text,
                        }}
                    >
                        {CANCELLATION_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                                {reason}
                            </option>
                        ))}
                    </select>
                </label>
            </ConfirmDialog>

            <ScreenshotViewer
                src={preview?.src}
                alt={preview?.alt ?? 'Screenshot'}
                open={Boolean(preview)}
                onClose={() => setPreview(null)}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Header — the chat-style top of the sheet                           */
/* ------------------------------------------------------------------ */

function OrderHeader({
    order,
    onBack,
    onAdvance,
    onShip,
    onSaveShipping,
    defaultCourier,
}: {
    order: AdminOrder;
    onBack: () => void;
    onAdvance: (status: AdminOrderStatus) => void;
    onShip: (patch: { courier: string; trackingId: string }) => void;
    onSaveShipping: (patch: { courier: string; trackingId: string }) => void;
    defaultCourier: string;
}) {
    /*
     * No status menu here. A pending order offers nothing (approving happens in
     * the payment panel below); an approved one hands over through the shipment
     * form, which cannot submit without a courier and an AWB; and once a parcel
     * is moving the only moves left are the delivery ones, plus fixing the
     * carrier if the admin got it wrong.
     */
    const shipment = hasShipment(order);
    const canShip = order.status === 'Approved';
    const deliveryMoves = shipment ? nextStatusOptions(order.status) : [];

    return (
        <header
            className="shrink-0 border-b"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
        >
            <div className="flex flex-wrap items-start gap-3 px-4 py-3 sm:px-6">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label="Back to orders"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5"
                    style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                >
                    <ArrowLeft size={16} />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                        aria-hidden="true"
                        className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold sm:grid"
                        style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                    >
                        {initialsOf(order.customer)}
                    </span>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1
                                className="truncate text-[15px] font-bold sm:text-base"
                                style={{ color: Theme.colors.text }}
                            >
                                {order.customer}
                            </h1>
                            <AdminStatusChip status={order.status} />
                            {order.isLive && <Tag label="Storefront order" />}
                        </div>
                        <p
                            className="mt-1 flex items-center gap-1.5 text-[11.5px]"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            <Phone size={12} />
                            {order.phone}
                        </p>
                    </div>
                </div>

                {/* Actions, not statuses: hand the parcel over, or move it along. */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {canShip && <ShipmentForm onShip={onShip} />}

                    {shipment && (
                        <ShippingControls
                            /*
                             * Keyed by the saved values so a save remounts this with the
                             * fresh courier/AWB — no effect needed to sync props to state.
                             */
                            key={`${order.courier ?? ''}|${order.trackingId ?? ''}`}
                            courier={order.courier}
                            trackingId={order.trackingId}
                            defaultCourier={defaultCourier}
                            onSave={onSaveShipping}
                        />
                    )}

                    {deliveryMoves.map((move) => (
                        <AdminButton
                            key={move.value}
                            onClick={() => onAdvance(move.value as AdminOrderStatus)}
                        >
                            {move.label}
                        </AdminButton>
                    ))}
                </div>
            </div>

            <div className="border-t px-4 py-2.5 sm:px-6" style={{ borderColor: Theme.colors.border }}>
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: Theme.colors.textMuted }}
                >
                    Delivery address
                </p>
                <p
                    className="mt-1 flex items-start gap-1.5 text-[12.5px] leading-relaxed"
                    style={{ color: Theme.colors.text }}
                >
                    <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: Theme.colors.textMuted }} />
                    {addressOf(order)}
                </p>
            </div>
        </header>
    );
}

/**
 * Handover form for an approved order.
 *
 * A shipment is two facts — which courier took the parcel and its AWB — so both
 * are required before **Mark as shipped** unlocks; the button ships the order
 * and records them in one step. The courier starts empty on purpose: the admin
 * names the carrier actually carrying this parcel rather than accepting a
 * prefilled default they never looked at.
 */
function ShipmentForm({ onShip }: { onShip: (patch: { courier: string; trackingId: string }) => void }) {
    const [courier, setCourier] = useState('');
    const [awb, setAwb] = useState('');

    const ready = courier !== '' && awb.trim() !== '';

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <span
                className="hidden items-center gap-1.5 text-[11px] font-semibold lg:inline-flex"
                style={{ color: Theme.colors.textMuted }}
            >
                <Truck size={13} />
                Shipment
            </span>

            <SelectMenu
                className="w-[140px]"
                value={courier}
                options={COURIER_OPTIONS}
                onChange={setCourier}
                placeholder="Select courier"
                label="Courier partner"
                menuHeading="Courier partner"
            />

            <TextInput
                value={awb}
                onChange={(event) => setAwb(event.target.value)}
                placeholder="AWB / tracking id"
                aria-label="AWB or tracking id"
                className="h-9 w-[168px] text-xs"
            />

            <AdminButton
                variant="primary"
                disabled={!ready}
                title={ready ? undefined : 'Pick a courier and enter the AWB first'}
                onClick={() => onShip({ courier, trackingId: awb.trim() })}
            >
                Mark as shipped
            </AdminButton>
        </div>
    );
}

/**
 * Courier + AWB editor for an order that is already on its way.
 *
 * Holds its own draft and is keyed by the saved values upstream, so a save
 * remounts it with the fresh values — that keeps the props in sync without an
 * effect, and stops the sticky header showing a form that disagrees with the
 * order.
 */
function ShippingControls({
    courier,
    trackingId,
    defaultCourier,
    onSave,
}: {
    courier?: string;
    trackingId?: string;
    defaultCourier: string;
    onSave: (patch: { courier: string; trackingId: string }) => void;
}) {
    const savedCourier = courier ?? defaultCourier;
    const savedAwb = trackingId ?? '';

    const [nextCourier, setNextCourier] = useState(savedCourier);
    const [awb, setAwb] = useState(savedAwb);

    const dirty = nextCourier !== savedCourier || awb.trim() !== savedAwb;

    return (
        <div className="flex flex-wrap items-center justify-end gap-2">
            <span
                className="hidden items-center gap-1.5 text-[11px] font-semibold lg:inline-flex"
                style={{ color: Theme.colors.textMuted }}
            >
                <Truck size={13} />
                Shipment
            </span>

            <SelectMenu
                className="w-[140px]"
                value={nextCourier}
                options={COURIER_OPTIONS}
                onChange={setNextCourier}
                label="Courier partner"
                menuHeading="Courier partner"
            />

            <TextInput
                value={awb}
                onChange={(event) => setAwb(event.target.value)}
                placeholder="AWB / tracking id"
                aria-label="AWB or tracking id"
                className="h-9 w-[168px] text-xs"
            />

            <AdminButton
                variant="primary"
                onClick={() => onSave({ courier: nextCourier, trackingId: awb.trim() })}
                disabled={!dirty}
            >
                Save
            </AdminButton>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Order information                                                  */
/* ------------------------------------------------------------------ */

/** A panel with the standard header + padded body used by every block below. */
function Section({
    title,
    meta,
    action,
    children,
}: {
    title: string;
    meta?: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Panel>
            <PanelHeader title={title} meta={meta} action={action} />
            <div className="px-4 py-4 sm:px-5">{children}</div>
        </Panel>
    );
}

function OrderInformation({ order }: { order: AdminOrder }) {
    const fields: Array<{ label: string; value: string; wide?: boolean }> = [
        { label: 'Order ID', value: order.id },
        { label: 'Order date', value: DATE_ONLY.format(order.placedAt) },
        { label: 'Order time', value: TIME_ONLY.format(order.placedAt) },
        { label: 'Status', value: order.status },
        { label: 'Customer', value: order.customer },
        { label: 'Phone', value: order.phone },
        { label: 'Payment', value: order.payment },
        { label: 'Delivery address', value: addressOf(order), wide: true },
    ];

    return (
        <Section title="Order information">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className={
                            field.wide
                                ? 'flex flex-col gap-0.5 sm:col-span-2'
                                : 'flex items-baseline justify-between gap-3 sm:block'
                        }
                    >
                        <dt
                            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            {field.label}
                        </dt>
                        <dd
                            className={`text-[12.5px] font-medium ${
                                field.wide ? 'text-left' : 'text-right sm:mt-1 sm:text-left'
                            }`}
                            style={{ color: Theme.colors.text }}
                        >
                            {field.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </Section>
    );
}

function SummaryRow({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt style={{ color: Theme.colors.textMuted }}>{label}</dt>
            <dd className="tabular-nums" style={{ color: good ? Theme.colors.primaryDark : Theme.colors.text }}>
                {value}
            </dd>
        </div>
    );
}

function Tag({ label }: { label: string }) {
    return (
        <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textLight }}
        >
            {label}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/*  Ordered items                                                      */
/* ------------------------------------------------------------------ */

/**
 * Every line the customer actually bought, at the price and quantity saved with
 * the order at checkout — never the live cart.
 */
function OrderedItems({ order, units }: { order: AdminOrder; units: number }) {
    return (
        <Section
            title="Ordered items"
            meta={`${order.items.length} product${order.items.length === 1 ? '' : 's'} · ${units} unit${
                units === 1 ? '' : 's'
            }`}
        >
            <ul className="flex flex-col gap-3">
                {order.items.map((item) => (
                    <li key={item.productId} className="flex items-center gap-3">
                        <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            style={{ border: `1px solid ${Theme.colors.border}` }}
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold" style={{ color: Theme.colors.text }}>
                                {item.name}
                            </p>
                            <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {item.brand} · {inr(item.price)} × {item.qty}
                            </p>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-[13px] font-bold tabular-nums" style={{ color: Theme.colors.text }}>
                                {inr(item.price * item.qty)}
                            </p>
                            {item.mrp > item.price && (
                                <p className="text-[10.5px] line-through" style={{ color: Theme.colors.textMuted }}>
                                    {inr(item.mrp * item.qty)}
                                </p>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </Section>
    );
}

/* ------------------------------------------------------------------ */
/*  Payment summary                                                    */
/* ------------------------------------------------------------------ */

function PriceSummary({ order }: { order: AdminOrder }) {
    return (
        <Section title="Payment summary" meta={order.couponCode ? `Coupon ${order.couponCode} applied` : undefined}>
            <dl className="flex flex-col gap-2 text-[12.5px]">
                <SummaryRow label="Item subtotal" value={inr(order.subtotal)} />
                <SummaryRow label="Delivery" value={order.shipping === 0 ? 'Free' : inr(order.shipping)} />
                {order.discount > 0 && <SummaryRow label="Discount" value={`− ${inr(order.discount)}`} good />}
                {order.refund > 0 && <SummaryRow label="Refunded" value={`− ${inr(order.refund)}`} good />}
                <div
                    className="mt-1 flex items-center justify-between gap-3 border-t pt-2.5"
                    style={{ borderColor: Theme.colors.border }}
                >
                    <dt className="text-sm font-bold" style={{ color: Theme.colors.text }}>
                        Total amount
                    </dt>
                    <dd className="text-base font-bold tabular-nums" style={{ color: Theme.colors.primaryDark }}>
                        {inr(order.amount)}
                    </dd>
                </div>
            </dl>
        </Section>
    );
}

/* ------------------------------------------------------------------ */
/*  Payment screenshot                                                 */
/* ------------------------------------------------------------------ */

function PaymentScreenshotSection({
    order,
    onPreview,
}: {
    order: AdminOrder;
    onPreview: (preview: Preview) => void;
}) {
    return (
        <Section title="Payment screenshot" action={<PaymentStatusChip status={order.paymentStatus} />}>
            {order.paymentScreenshot ? (
                <ScreenshotThumb
                    src={order.paymentScreenshot}
                    alt={`Payment screenshot for ${order.id}`}
                    onOpen={onPreview}
                />
            ) : (
                <EmptyState icon={<ImageOff size={16} />} text="Payment screenshot not uploaded" />
            )}
        </Section>
    );
}

/** Clickable receipt thumbnail — the full-screen viewer handles zooming. */
function ScreenshotThumb({ src, alt, onOpen }: { src: string; alt: string; onOpen: (preview: Preview) => void }) {
    return (
        <button
            type="button"
            onClick={() => onOpen({ src, alt })}
            aria-label={`Open ${alt} full screen`}
            className="block w-40 overflow-hidden rounded-xl border transition-transform active:scale-[0.98]"
            style={{ borderColor: Theme.colors.border }}
        >
            {/* The 3:5 frame matches the receipt art, so nothing is cropped. */}
            <img src={src} alt={alt} loading="lazy" decoding="async" className="aspect-[3/5] w-full object-cover" />
        </button>
    );
}

function EmptyState({ icon, text, action }: { icon: ReactNode; text: string; action?: ReactNode }) {
    return (
        <div
            className="flex flex-col items-center gap-2.5 rounded-xl border border-dashed px-4 py-6 text-center"
            style={{ borderColor: Theme.colors.borderStrong }}
        >
            <span
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}
            >
                {icon}
            </span>
            <p className="text-xs font-semibold" style={{ color: Theme.colors.textLight }}>
                {text}
            </p>
            {action}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Approval / cancellation                                            */
/* ------------------------------------------------------------------ */

function ApprovalSection({
    order,
    state,
    onApprove,
    onCancel,
}: {
    order: AdminOrder;
    state: ApprovalState;
    onApprove: () => void;
    onCancel: () => void;
}) {
    return (
        <Section title="Payment approval">
            {state === 'pending' && (
                <>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                        Check the payment screenshot, then approve the order to release it to fulfilment — or cancel
                        it to open a refund.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <AdminButton variant="primary" onClick={onApprove}>
                            <BadgeCheck size={14} />
                            Approve order
                        </AdminButton>
                        <AdminButton variant="danger" onClick={onCancel}>
                            <XCircle size={14} />
                            Cancel order
                        </AdminButton>
                    </div>
                </>
            )}

            {state === 'approved' && (
                <StatusNote
                    tone="good"
                    icon={<BadgeCheck size={18} />}
                    title="Order approved"
                    lines={[
                        order.approvedAt ? `Approved on ${DATE_TIME.format(order.approvedAt)}` : 'Approved',
                        order.approvedBy ? `Approved by ${order.approvedBy}` : undefined,
                    ]}
                />
            )}

            {state === 'cancelled' && (
                <StatusNote
                    tone="bad"
                    icon={<XCircle size={18} />}
                    title="Order cancelled"
                    lines={[
                        order.cancelledAt ? `Cancelled on ${DATE_TIME.format(order.cancelledAt)}` : 'Cancelled',
                        order.cancellationReason ? `Cancellation reason: ${order.cancellationReason}` : undefined,
                    ]}
                />
            )}
        </Section>
    );
}

function StatusNote({
    tone,
    icon,
    title,
    lines,
}: {
    tone: 'good' | 'bad';
    icon: ReactNode;
    title: string;
    lines: Array<string | undefined>;
}) {
    const palette =
        tone === 'good'
            ? { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark }
            : {
                  bg: `color-mix(in srgb, ${Theme.colors.accent} 22%, ${Theme.colors.surface})`,
                  fg: Theme.colors.accentDark,
              };
    const detail = lines.filter((line): line is string => Boolean(line));

    return (
        <div
            className="flex items-start gap-3 rounded-xl px-3.5 py-3"
            style={{ backgroundColor: palette.bg, color: palette.fg }}
        >
            <span className="mt-0.5 shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-[13px] font-bold">{title}</p>
                {detail.map((line) => (
                    <p key={line} className="mt-0.5 text-[11.5px] opacity-90">
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Refund — cancelled orders                                          */
/* ------------------------------------------------------------------ */

function RefundSection({ order, onPreview }: { order: AdminOrder; onPreview: (preview: Preview) => void }) {
    const status = refundStatusOf(order);
    const completed = status === 'Completed' && Boolean(order.refundScreenshot);

    return (
        <Section
            title="Admin refund"
            meta={inr(order.refund > 0 ? order.refund : order.amount)}
            action={<RefundChip status={status} />}
        >
            {completed && order.refundScreenshot ? (
                <div className="flex flex-col gap-2">
                    <ScreenshotThumb
                        src={order.refundScreenshot}
                        alt={`Refund screenshot for ${order.id}`}
                        onOpen={onPreview}
                    />
                    {order.refundedAt && (
                        <p className="text-[11.5px]" style={{ color: Theme.colors.textMuted }}>
                            Refunded on {DATE_TIME.format(order.refundedAt)}
                        </p>
                    )}
                </div>
            ) : (
                <RefundUploader order={order} />
            )}
        </Section>
    );
}

function RefundChip({ status }: { status: RefundStatus }) {
    const done = status === 'Completed';
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{
                backgroundColor: done ? Theme.colors.primaryLight : Theme.colors.secondary,
                color: done ? Theme.colors.primaryDark : Theme.colors.text,
            }}
        >
            {done ? 'Refund completed' : 'Refund pending'}
        </span>
    );
}

/**
 * Admin-only refund screenshot upload.
 *
 * Mirrors the catalogue's DropZone contract: pick an image, preview it, then
 * commit it. Nothing is saved until the admin confirms, and the API is what
 * decides whether the upload stuck — a refusal surfaces as an error rather
 * than a fake success.
 */
function RefundUploader({ order }: { order: AdminOrder }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const updateOrder = useUpdateOrder();
    const [pending, setPending] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function pick(files: FileList | null) {
        const file = files?.[0];
        if (!file) return;
        if (file.size > MAX_SCREENSHOT_KB * 1024) {
            toast.error(`${file.name} is too large`, {
                description: `Keep the screenshot under ${MAX_SCREENSHOT_KB} KB. In-browser storage is limited.`,
            });
            return;
        }
        setBusy(true);
        try {
            setPending(await fileToDataUrl(file));
        } catch {
            toast.error('Could not read that image', { description: 'Please try a different file.' });
        } finally {
            setBusy(false);
        }
    }

    function save() {
        if (!pending) return;
        setBusy(true);

        updateOrder.mutate(
            { id: order.id, patch: { refundScreenshot: pending } },
            {
                onSuccess: () => {
                    toast.success('Refund screenshot uploaded', {
                        description: 'This order is now marked refund completed.',
                    });
                    setPending(null);
                },
                onError: (error) =>
                    toast.error('Upload failed', {
                        description:
                            error instanceof Error
                                ? error.message
                                : 'The screenshot was not saved. Please try again.',
                    }),
                onSettled: () => setBusy(false),
            }
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    void pick(event.target.files);
                    event.target.value = '';
                }}
            />

            {pending ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <img
                        src={pending}
                        alt="Refund screenshot preview"
                        className="aspect-[3/5] w-32 rounded-xl object-cover"
                        style={{ border: `1px solid ${Theme.colors.border}` }}
                    />
                    <div className="flex flex-wrap gap-2">
                        <AdminButton variant="primary" onClick={save} disabled={busy}>
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                            Save refund screenshot
                        </AdminButton>
                        <AdminButton onClick={() => setPending(null)} disabled={busy}>
                            Discard
                        </AdminButton>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<ImageOff size={16} />}
                    text="Refund screenshot not uploaded"
                    action={
                        <AdminButton variant="primary" onClick={() => inputRef.current?.click()} disabled={busy}>
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                            Upload refund screenshot
                        </AdminButton>
                    }
                />
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

function OrderLoadError({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
    return (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <Panel className="w-full max-w-md px-6 py-10 text-center">
                <span
                    className="mx-auto grid h-12 w-12 place-items-center rounded-full"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.accentDark }}
                >
                    <Receipt size={20} />
                </span>
                <p className="mt-3 text-sm font-bold" style={{ color: Theme.colors.text }}>
                    Unable to load order details.
                </p>
                <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                    The order may have been removed, or the link is incomplete.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <AdminButton variant="primary" onClick={onRetry}>
                        <RotateCcw size={13} />
                        Retry
                    </AdminButton>
                    <AdminButton onClick={onBack}>Back to orders</AdminButton>
                </div>
            </Panel>
        </div>
    );
}
