import { useState } from 'react';
import { AlertCircle, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import {
    useAddresses,
    useCreateAddress,
    useDeleteAddress,
    useUpdateAddress,
} from '../api/useAddresses';
import { formatAddress, toDraft, type AddressDraft, type DeliveryAddress } from '../data/addressData';
import { describeAddressError } from '../lib/describeAddressError';
import AddressForm from './AddressForm';

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; address: DeliveryAddress };

/**
 * The address book behind the account menu.
 *
 * This is the shopper's own surface: see what is saved, fix it, or take it
 * away. It is deliberately the same form checkout uses, so an address entered
 * while ordering is edited here with the very same rules and wording.
 */
export default function AddressBookPanel() {
    const { data: addresses, isLoading, isError, error, refetch } = useAddresses();
    const createAddress = useCreateAddress();
    const updateAddress = useUpdateAddress();
    const deleteAddress = useDeleteAddress();

    const [mode, setMode] = useState<Mode>({ kind: 'list' });
    const [serverError, setServerError] = useState('');
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const saved = addresses ?? [];

    function startNew() {
        setServerError('');
        setMode({ kind: 'new' });
    }

    function startEdit(address: DeliveryAddress) {
        setServerError('');
        setMode({ kind: 'edit', address });
    }

    function backToList() {
        setServerError('');
        setMode({ kind: 'list' });
    }

    function saveNew(draft: AddressDraft) {
        setServerError('');
        createAddress.mutate(draft, {
            onSuccess: () => {
                toast.success('Address saved');
                backToList();
            },
            onError: (failure) => setServerError(describeAddressError(failure)),
        });
    }

    function saveEdit(id: string, draft: AddressDraft) {
        setServerError('');
        // The whole draft is sent, so clearing the second line works too.
        updateAddress.mutate(
            { id, patch: draft },
            {
                onSuccess: () => {
                    toast.success('Address updated');
                    backToList();
                },
                onError: (failure) => setServerError(describeAddressError(failure)),
            }
        );
    }

    function remove(id: string) {
        deleteAddress.mutate(id, {
            onSuccess: () => {
                toast.success('Address removed');
                setConfirmId(null);
            },
            onError: (failure) => toast.error(describeAddressError(failure)),
        });
    }

    if (isLoading) {
        return (
            <p className="py-8 text-center text-[13px]" style={{ color: Theme.colors.textMuted }}>
                Loading your addresses…
            </p>
        );
    }

    if (isError) {
        return (
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
        );
    }

    if (mode.kind === 'new') {
        return (
            <div className="flex flex-col gap-3">
                <p className="text-[12px] font-semibold" style={{ color: Theme.colors.textLight }}>
                    New delivery address
                </p>
                <AddressForm
                    submitLabel="Save address"
                    busy={createAddress.isPending}
                    serverError={serverError}
                    onSubmit={saveNew}
                    onCancel={backToList}
                />
            </div>
        );
    }

    if (mode.kind === 'edit') {
        return (
            <div className="flex flex-col gap-3">
                <p className="text-[12px] font-semibold" style={{ color: Theme.colors.textLight }}>
                    Edit address
                </p>
                <AddressForm
                    initial={toDraft(mode.address)}
                    submitLabel="Save changes"
                    busy={updateAddress.isPending}
                    serverError={serverError}
                    onSubmit={(draft) => saveEdit(mode.address.id, draft)}
                    onCancel={backToList}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {saved.length === 0 ? (
                <div
                    className="flex flex-col items-center gap-2 rounded-xl px-4 py-7 text-center"
                    style={{ backgroundColor: Theme.colors.surfaceAlt }}
                >
                    <MapPin size={19} style={{ color: Theme.colors.primaryDark }} />
                    <p className="text-[13px] font-semibold" style={{ color: Theme.colors.text }}>
                        No saved addresses
                    </p>
                    <p className="max-w-[22rem] text-[11.5px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        Add your home or office once and checkout becomes one tap.
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col gap-2">
                    {saved.map((address) => (
                        <li
                            key={address.id}
                            className="flex items-start gap-3 rounded-xl border px-3.5 py-3"
                            style={{ borderColor: Theme.colors.border }}
                        >
                            <MapPin
                                size={15}
                                className="mt-0.5 shrink-0"
                                style={{ color: Theme.colors.primaryDark }}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] leading-relaxed" style={{ color: Theme.colors.text }}>
                                    {formatAddress(address)}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(address)}
                                        className="inline-flex items-center gap-1 py-0.5 text-[11.5px] font-semibold transition-colors hover:opacity-70"
                                        style={{ color: Theme.colors.textLight }}
                                    >
                                        <Pencil size={12} />
                                        Edit
                                    </button>
                                    {confirmId === address.id ? (
                                        <span className="inline-flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => remove(address.id)}
                                                disabled={deleteAddress.isPending}
                                                className="text-[11.5px] font-bold disabled:opacity-50"
                                                style={{ color: Theme.colors.accentDark }}
                                            >
                                                {deleteAddress.isPending ? 'Removing…' : 'Confirm'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmId(null)}
                                                className="text-[11.5px] font-semibold"
                                                style={{ color: Theme.colors.textMuted }}
                                            >
                                                Keep
                                            </button>
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmId(address.id)}
                                            className="inline-flex items-center gap-1 text-[11.5px] font-semibold transition-colors hover:opacity-70"
                                            style={{ color: Theme.colors.accentDark }}
                                        >
                                            <Trash2 size={12} />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-semibold transition-colors hover:bg-black/5"
                style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.accentDark }}
            >
                <Plus size={15} />
                Add a new address
            </button>
        </div>
    );
}
