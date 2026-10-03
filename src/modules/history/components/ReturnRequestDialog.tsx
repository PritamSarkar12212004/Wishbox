import { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Check, PackageCheck, RotateCcw, Truck, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { inr } from '@/lib/format';
import { orderTotal, type Order } from '../data/historyData';
import { RETURN_REASONS, returnsStore, type ReturnReason, type ReturnRequest } from '../store/returnsStore';

/**
 * Return or exchange a delivered order.
 *
 * Three taps at most: pick a reason, add an optional note, submit. The request
 * is stored on this device and surfaces in the account's notifications tab.
 */
export default function ReturnRequestDialog({
    order,
    onOpenChange,
}: {
    order: Order | null;
    onOpenChange: (open: boolean) => void;
}) {
    const [reason, setReason] = useState<ReturnReason | null>(null);
    const [note, setNote] = useState('');
    const [created, setCreated] = useState<ReturnRequest | null>(null);

    if (!order) return null;

    const firstItem = order.items[0];

    function submit() {
        if (!reason || !order) return;
        const request = returnsStore.create({
            orderId: order.id,
            productName: firstItem?.name ?? 'Order items',
            reason,
            note: note.trim(),
            refundAmount: orderTotal(order),
        });
        setCreated(request);
        toast.success(`Return ${request.id} raised`, {
            description: 'We will arrange a pickup within 24-48 hours.',
        });
    }

    return (
        <DialogPrimitive.Root
            open={Boolean(order)}
            onOpenChange={onOpenChange}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
                <DialogPrimitive.Popup
                    className="fixed z-[61] w-full outline-none data-open:animate-in data-open:fade-in-0 max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:data-open:slide-in-from-bottom-6 sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,30rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:data-open:zoom-in-95 max-h-[92vh] overflow-y-auto overscroll-contain"
                    style={{
                        backgroundColor: Theme.colors.surface,
                        boxShadow: Theme.Shadow.xl,
                        fontFamily: Theme.Typography.fontFamily,
                        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
                    }}
                >
                    <div
                        className="flex items-start gap-3 px-5 py-5"
                        style={{ background: `linear-gradient(135deg, ${Theme.colors.surfaceAlt}, ${Theme.colors.surface})` }}
                    >
                        <span
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                            style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                        >
                            <RotateCcw size={17} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="text-base font-bold">
                                {created ? 'Pickup requested' : 'Return or exchange'}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description className="mt-0.5 text-[12px]" style={{ color: Theme.colors.textMuted }}>
                                {order.id} · {firstItem?.name ?? 'Order items'}
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close
                            aria-label="Close return request"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5"
                            style={{ borderColor: Theme.colors.border, color: Theme.colors.textLight }}
                        >
                            <X size={16} />
                        </DialogPrimitive.Close>
                    </div>

                    {created ? (
                        <div className="flex flex-col gap-3 px-5 py-5">
                            <div
                                className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                                style={{ backgroundColor: Theme.colors.surfaceAlt }}
                            >
                                <span
                                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                                    style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                                >
                                    <Check size={17} strokeWidth={3} />
                                </span>
                                <div>
                                    <p className="text-[13px] font-bold">Request {created.id} raised</p>
                                    <p className="mt-0.5 text-[11.5px]" style={{ color: Theme.colors.textLight }}>
                                        Refund up to {inr(created.refundAmount)} once the item is picked up.
                                    </p>
                                </div>
                            </div>

                            <ol className="flex flex-col gap-2 text-[12.5px]" style={{ color: Theme.colors.textLight }}>
                                <li className="flex items-start gap-2">
                                    <Truck size={15} style={{ color: Theme.colors.primaryDark, marginTop: 1 }} />
                                    A courier collects the parcel within 24-48 hours — keep the packaging ready.
                                </li>
                                <li className="flex items-start gap-2">
                                    <PackageCheck size={15} style={{ color: Theme.colors.primaryDark, marginTop: 1 }} />
                                    We inspect it, then refund or ship the exchange size/colour.
                                </li>
                            </ol>

                            <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                Track this request under Notifications in your account menu. Demo only — no courier is
                                actually booked.
                            </p>

                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="mt-1 h-11 rounded-xl text-sm font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                    background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                                    color: Theme.colors.background,
                                    boxShadow: Theme.Shadow.md,
                                }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 px-5 py-5">
                            <fieldset className="flex flex-col gap-2">
                                <legend className="mb-1 text-xs font-semibold">Why are you returning it?</legend>
                                {RETURN_REASONS.map((option) => {
                                    const isActive = option === reason;
                                    return (
                                        <label
                                            key={option}
                                            className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] transition-colors"
                                            style={{
                                                borderColor: isActive ? Theme.colors.primaryDark : Theme.colors.border,
                                                backgroundColor: isActive ? Theme.colors.surfaceAlt : Theme.colors.surface,
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="return-reason"
                                                value={option}
                                                checked={isActive}
                                                onChange={() => setReason(option)}
                                                className="h-4 w-4 accent-[var(--c-primary-dark)]"
                                                style={{ '--c-primary-dark': Theme.colors.primaryDark } as React.CSSProperties}
                                            />
                                            {option}
                                        </label>
                                    );
                                })}
                            </fieldset>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold">Anything else? (optional)</span>
                                <textarea
                                    rows={3}
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    placeholder="Tell us what went wrong so the pickup goes smoothly."
                                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                    style={{
                                        backgroundColor: Theme.colors.surface,
                                        borderColor: Theme.colors.border,
                                        color: Theme.colors.text,
                                    }}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={submit}
                                disabled={!reason}
                                className="h-12 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                                style={{
                                    background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                                    color: Theme.colors.background,
                                    boxShadow: Theme.Shadow.md,
                                }}
                            >
                                Request pickup
                            </button>
                        </div>
                    )}
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
