import { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { AlertCircle, MapPin, Plus, Truck, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { useAddresses, useCreateAddress } from '../api/useAddresses';
import { formatAddress, type AddressDraft, type DeliveryAddress } from '../data/addressData';
import { describeAddressError } from '../lib/describeAddressError';
import { checkoutGate, useCheckoutGate } from '../store/checkoutGate';
import AddressForm from './AddressForm';

/**
 * The delivery-address step of checkout.
 *
 * Rendered once at app level. Buy Now and the cart open it through
 * `checkoutGate.require(onAddress)`, and it calls back with the address the
 * shopper confirmed - an existing one, or the one they just typed, which is
 * saved to their address book before the order is placed so the two never
 * disagree.
 */
export default function CheckoutAddressDialog() {
    const { open, session } = useCheckoutGate();

    return (
        <DialogPrimitive.Root
            open={open}
            onOpenChange={(next) => {
                if (!next) checkoutGate.close();
            }}
        >
            <DialogPrimitive.Portal>
                <DialogPrimitive.Backdrop
                    data-slot="checkout-backdrop"
                    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
                />
                <DialogPrimitive.Popup
                    data-slot="checkout-popup"
                    className="fixed z-[61] w-full outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:data-open:slide-in-from-bottom-6 sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,30rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:data-open:zoom-in-95
                    max-h-[92vh] overflow-y-auto overscroll-contain"
                    style={{
                        backgroundColor: Theme.colors.surface,
                        boxShadow: Theme.Shadow.xl,
                        fontFamily: Theme.Typography.fontFamily,
                        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
                    }}
                >
                    {/* A session key restarts the step cleanly each time the gate opens. */}
                    <CheckoutFlow key={session} />
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

function CheckoutFlow() {
    const { data: addresses, isLoading, isError, error, refetch } = useAddresses();
    const createAddress = useCreateAddress();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [serverError, setServerError] = useState('');

    const saved = addresses ?? [];
    /*
     * Both defaults are derived, not stored in an effect: the newest address is
     * the one they just added, and with nothing saved the form *is* the step.
     * An effect here would only add a render between the data arriving and the
     * right thing being on screen.
     */
    const activeId = selectedId ?? saved[0]?.id ?? null;
    const selected = saved.find((address) => address.id === activeId) ?? null;
    const showForm = adding || (!isLoading && !isError && saved.length === 0);

    function saveAndDeliver(draft: AddressDraft) {
        setServerError('');
        createAddress.mutate(draft, {
            onSuccess: (created) => {
                toast.success('Address saved');
                // Continue straight to placing the order with the address they
                // just entered - they were never here to browse a list.
                checkoutGate.complete(created);
            },
            onError: (failure) => setServerError(describeAddressError(failure)),
        });
    }

    return (
        <div className="flex flex-col">
            {/* ── Head ────────────────────────────────────────────── */}
            <div
                className="sticky top-0 z-10 flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6"
                style={{ background: `linear-gradient(135deg, ${Theme.colors.surfaceAlt}, ${Theme.colors.surface})` }}
            >
                <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                >
                    <Truck size={19} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    <DialogPrimitive.Title className="text-lg font-bold tracking-tight sm:text-xl">
                        {showForm ? 'Add a delivery address' : 'Where should this go?'}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description
                        className="mt-1 text-[13px] leading-relaxed"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        {showForm
                            ? 'We save this to your account so the next order is one tap.'
                            : 'Pick a saved address, or add a new one — the order goes here.'}
                    </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                    aria-label="Close checkout"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5"
                    style={{ borderColor: Theme.colors.border, color: Theme.colors.textLight }}
                >
                    <X size={16} />
                </DialogPrimitive.Close>
            </div>

            {/* ── Body ────────────────────────────────────────────── */}
            <div className="px-5 pt-5 sm:px-6">
                {isLoading && (
                    <p className="py-8 text-center text-[13px]" style={{ color: Theme.colors.textMuted }}>
                        Loading your addresses…
                    </p>
                )}

                {isError && (
                    <div
                        className="flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center"
                        style={{ backgroundColor: Theme.colors.surfaceAlt }}
                    >
                        <AlertCircle size={20} style={{ color: Theme.colors.accentDark }} />
                        <p className="text-[13px]" style={{ color: Theme.colors.text }}>
                            {describeAddressError(error)}
                        </p>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="text-[12px] font-semibold underline-offset-2 hover:underline"
                            style={{ color: Theme.colors.accentDark }}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isLoading && !isError && showForm && (
                    <AddressForm
                        submitLabel="Save & deliver here"
                        busy={createAddress.isPending}
                        serverError={serverError}
                        onSubmit={saveAndDeliver}
                        onCancel={saved.length > 0 ? () => setAdding(false) : undefined}
                    />
                )}

                {!isLoading && !isError && !showForm && (
                    <div className="flex flex-col gap-2.5">
                        {saved.map((address) => (
                            <AddressOption
                                key={address.id}
                                address={address}
                                selected={address.id === activeId}
                                onSelect={() => setSelectedId(address.id)}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={() => {
                                setServerError('');
                                setAdding(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-black/5"
                            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.accentDark }}
                        >
                            <Plus size={16} />
                            Add a new address
                        </button>
                    </div>
                )}
            </div>

            {/* ── Foot ────────────────────────────────────────────── */}
            {!isLoading && !isError && !showForm && (
                <div className="px-5 pt-5 sm:px-6">
                    <button
                        type="button"
                        onClick={() => selected && checkoutGate.complete(selected)}
                        disabled={!selected}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                            background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                            color: Theme.colors.background,
                            boxShadow: Theme.Shadow.md,
                        }}
                    >
                        <MapPin size={16} />
                        Deliver to this address
                    </button>
                    <p className="mt-3 text-center text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        Demo checkout — no payment is taken.
                    </p>
                </div>
            )}
        </div>
    );
}

/** One selectable saved address. */
function AddressOption({
    address,
    selected,
    onSelect,
}: {
    address: DeliveryAddress;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <label
            className="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors"
            style={{
                borderColor: selected ? Theme.colors.primaryDark : Theme.colors.border,
                backgroundColor: selected ? Theme.colors.surfaceAlt : Theme.colors.surface,
            }}
        >
            <input
                type="radio"
                name="delivery-address"
                checked={selected}
                onChange={onSelect}
                className="mt-1 h-5 w-5 shrink-0 sm:h-4 sm:w-4"
                style={{ accentColor: Theme.colors.primaryDark }}
            />
            <span className="min-w-0 flex-1">
                <span className="block text-[13px] leading-relaxed sm:text-[13.5px]" style={{ color: Theme.colors.text }}>
                    {formatAddress(address)}
                </span>
            </span>
        </label>
    );
}
