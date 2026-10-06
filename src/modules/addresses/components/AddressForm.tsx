import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import {
    BLANK_ADDRESS,
    STATES,
    hasErrors,
    validateAddress,
    type AddressDraft,
    type AddressErrors,
    type AddressField,
} from '../data/addressData';

const fieldClass =
    'h-12 w-full rounded-xl border px-3.5 text-[15px] outline-none transition-shadow focus:ring-2 focus:ring-black/10';

const fieldStyle: React.CSSProperties = {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    color: Theme.colors.text,
};

type AddressFormProps = {
    /** The saved address being edited, or blank for a new one. */
    initial?: AddressDraft;
    submitLabel: string;
    busy?: boolean;
    /** A refusal from the API, shown above the fields as the API wrote it. */
    serverError?: string;
    onSubmit: (draft: AddressDraft) => void;
    onCancel?: () => void;
};

/**
 * The address form, shared by checkout and the account's address book.
 *
 * It validates field by field *for the shopper's benefit* - the same rules the
 * API enforces, answered instantly - and clears a field's complaint the moment
 * it is touched again, so the form never argues about a value already fixed.
 * The server is still the authority: whatever it says on submit is shown as-is.
 */
export default function AddressForm({
    initial,
    submitLabel,
    busy = false,
    serverError,
    onSubmit,
    onCancel,
}: AddressFormProps) {
    const [draft, setDraft] = useState<AddressDraft>(initial ?? BLANK_ADDRESS);
    const [errors, setErrors] = useState<AddressErrors>({});
    const [submitted, setSubmitted] = useState(false);

    function update(field: AddressField, value: string) {
        const nextDraft = { ...draft, [field]: value };
        setDraft(nextDraft);
        // Re-check once they have seen the errors, so a fix clears its warning.
        if (submitted) setErrors(validateAddress(nextDraft));
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const found = validateAddress(draft);
        setErrors(found);
        setSubmitted(true);
        if (hasErrors(found)) return;
        onSubmit({
            address1: draft.address1.trim(),
            address2: draft.address2.trim(),
            city: draft.city.trim(),
            state: draft.state,
            pincode: draft.pincode.trim(),
        });
    }

    const errorFor = (field: AddressField) => (submitted ? errors[field] : undefined);

    return (
        <form className="flex flex-col gap-3.5" onSubmit={submit} noValidate>
            <Field
                label="Flat, house or building"
                hint="Start with the number, like “12B, Sunrise Apartments”."
                error={errorFor('address1')}
            >
                <input
                    autoFocus
                    value={draft.address1}
                    onChange={(event) => update('address1', event.target.value)}
                    placeholder="12B, Sunrise Apartments"
                    autoComplete="address-line1"
                    maxLength={120}
                    aria-invalid={Boolean(errorFor('address1'))}
                    className={fieldClass}
                    style={fieldStyle}
                />
            </Field>

            <Field
                label="Area, landmark, street"
                hint="The locality your courier will look for."
                error={errorFor('address2')}
            >
                <input
                    value={draft.address2}
                    onChange={(event) => update('address2', event.target.value)}
                    placeholder="Near Ganesh Mandir, Dharampeth"
                    autoComplete="address-line2"
                    maxLength={120}
                    aria-invalid={Boolean(errorFor('address2'))}
                    className={fieldClass}
                    style={fieldStyle}
                />
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="City" error={errorFor('city')}>
                    <input
                        value={draft.city}
                        onChange={(event) => update('city', event.target.value)}
                        placeholder="Nagpur"
                        autoComplete="address-level2"
                        maxLength={60}
                        aria-invalid={Boolean(errorFor('city'))}
                        className={fieldClass}
                        style={fieldStyle}
                    />
                </Field>

                <Field label="PIN code" error={errorFor('pincode')}>
                    <input
                        value={draft.pincode}
                        onChange={(event) => update('pincode', event.target.value.replace(/\D/g, ''))}
                        placeholder="440001"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        aria-invalid={Boolean(errorFor('pincode'))}
                        className={fieldClass}
                        style={fieldStyle}
                    />
                </Field>
            </div>

            <Field label="State" error={errorFor('state')}>
                <span className="relative block">
                    <select
                        value={draft.state}
                        onChange={(event) => update('state', event.target.value)}
                        aria-invalid={Boolean(errorFor('state'))}
                        className={`${fieldClass} appearance-none pr-10`}
                        style={fieldStyle}
                    >
                        <option value="" disabled>
                            Choose a state or union territory
                        </option>
                        {STATES.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                    {/* Native picks are the whole point on a phone; this is the
                        affordance a stripped-down select otherwise loses. */}
                    <ChevronDown
                        size={17}
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: Theme.colors.textMuted }}
                    />
                </span>
            </Field>

            {serverError && (
                <p role="alert" className="text-[12px] font-semibold" style={{ color: Theme.colors.accentDark }}>
                    {serverError}
                </p>
            )}

            {/* Full-width stacked actions on phones; side by side from `sm` up. */}
            <div className="mt-1 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center">
                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-70 sm:flex-1"
                    style={{
                        background: `linear-gradient(135deg, ${Theme.colors.accent} 0%, ${Theme.colors.accentLight} 45%, ${Theme.colors.accentDark} 100%)`,
                        color: Theme.colors.background,
                        boxShadow: Theme.Shadow.md,
                    }}
                >
                    {busy && <Loader2 size={17} className="animate-spin" />}
                    {busy ? 'Saving…' : submitLabel}
                </button>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="inline-flex h-12 w-full items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors hover:bg-black/5 disabled:opacity-50 sm:w-auto"
                        style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

function Field({
    label,
    hint,
    error,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold" style={{ color: Theme.colors.text }}>
                {label}
            </span>
            {children}
            {error ? (
                <span className="text-[11.5px] font-semibold" style={{ color: Theme.colors.accentDark }}>
                    {error}
                </span>
            ) : (
                hint && (
                    <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        {hint}
                    </span>
                )
            )}
        </label>
    );
}
