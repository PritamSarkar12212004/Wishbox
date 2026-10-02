import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import type { AdminOrder } from '../data/adminData';
import { AdminStatusChip, PaymentStatusChip } from './AdminUI';

const DATE_TIME = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

/** Read-only order sheet — shared by the dashboard, orders and customer views. */
export default function OrderDetailDialog({
    order,
    onClose,
}: {
    order: AdminOrder | null;
    onClose: () => void;
}) {
    return (
        <Dialog
            open={Boolean(order)}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto p-5">
                {order && (
                    <>
                        <DialogHeader>
                            <div className="flex flex-wrap items-center gap-2">
                                <DialogTitle className="text-lg font-bold">{order.id}</DialogTitle>
                                <AdminStatusChip status={order.status} />
                                {order.isLive && (
                                    <span
                                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                                        style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textLight }}
                                    >
                                        Storefront order
                                    </span>
                                )}
                            </div>
                            <DialogDescription>
                                {DATE_TIME.format(order.placedAt)} · {order.items.length} product
                                {order.items.length === 1 ? '' : 's'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Block title="Customer">
                                <p className="text-[13px] font-semibold">{order.customer}</p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {order.email}
                                </p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {order.city}
                                    {order.isGuest ? ' · guest checkout' : ''}
                                </p>
                            </Block>

                            <Block title="Payment">
                                <p className="text-[13px] font-semibold">{order.payment}</p>
                                <div className="mt-1">
                                    <PaymentStatusChip status={order.paymentStatus} />
                                </div>
                                {order.couponCode && (
                                    <p className="mt-1.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        Coupon {order.couponCode}
                                    </p>
                                )}
                            </Block>
                        </div>

                        {(order.courier || order.delayed) && (
                            <Block title="Delivery">
                                <p className="text-[13px] font-semibold">
                                    {order.courier ?? 'Awaiting courier'}
                                    {order.trackingId ? ` · ${order.trackingId}` : ''}
                                </p>
                                {order.delayed && (
                                    <p className="mt-1 text-[11px] font-semibold" style={{ color: Theme.colors.accentDark }}>
                                        Running late — past the expected delivery window
                                    </p>
                                )}
                            </Block>
                        )}

                        <div>
                            <p
                                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                Items
                            </p>
                            <ul className="mt-2 flex flex-col gap-2">
                                {order.items.map((item) => (
                                    <li
                                        key={item.productId}
                                        className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
                                        style={{ borderColor: Theme.colors.border }}
                                    >
                                        <img
                                            src={item.image}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            className="h-9 w-9 shrink-0 rounded-md object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold">{item.name}</p>
                                            <p className="text-[10.5px]" style={{ color: Theme.colors.textMuted }}>
                                                {item.brand} · qty {item.qty} · {inr(item.price)}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-bold tabular-nums">
                                            {inr(item.price * item.qty)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <dl className="flex flex-col gap-1.5 text-xs">
                            <Row label="Subtotal" value={inr(order.subtotal)} />
                            {order.discount > 0 && (
                                <Row label="Coupon discount" value={`− ${inr(order.discount)}`} good />
                            )}
                            <Row label="Shipping" value={order.shipping === 0 ? 'Free' : inr(order.shipping)} />
                            {order.refund > 0 && <Row label="Refunded" value={inr(order.refund)} good />}
                            <div
                                className="flex justify-between gap-3 border-t pt-1.5 text-sm font-bold"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <dt>Order total</dt>
                                <dd className="tabular-nums">{inr(order.amount)}</dd>
                            </div>
                        </dl>

                        {order.returnReason && (
                            <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                                Return reason: {order.returnReason}
                            </p>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div
            className="rounded-lg border p-3"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
        >
            <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: Theme.colors.textMuted }}
            >
                {title}
            </p>
            <div className="mt-1.5">{children}</div>
        </div>
    );
}

function Row({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
    return (
        <div className="flex justify-between gap-3">
            <dt style={{ color: Theme.colors.textMuted }}>{label}</dt>
            <dd className="tabular-nums" style={good ? { color: Theme.colors.primaryDark } : undefined}>
                {value}
            </dd>
        </div>
    );
}
