import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Globe, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, Field, PageHeader, Panel, PanelHeader, TextInput } from '../components/AdminUI';
import {
    MAX_ALERT_MESSAGES,
    MAX_MARQUEE_SECONDS,
    MIN_MARQUEE_SECONDS,
    alertMessageId,
    alertProblems,
    type AlertContent,
    type AlertMessage,
} from '@/global/site/alertContent';
import { useAlertContent } from '@/global/site/alertStore';
import { useUpdateSiteContent } from '@/modules/site/api/useSiteContent';
import { ApiError } from '@/lib/api/client';

/**
 * Website → Alert bar — the strip above the header.
 *
 * Saved to the API (`PATCH /admin/content`), which is what every visitor's
 * strip renders. The response hydrates the shared store, so the header updates
 * the moment Save returns — on every browser, not just this one.
 */
export default function AlertContentPage() {
    const saved = useAlertContent();
    const [draft, setDraft] = useState<AlertContent>(saved);
    const updateContent = useUpdateSiteContent();

    const problems = useMemo(() => alertProblems(draft), [draft]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

    const patch = (values: Partial<AlertContent>) => setDraft((current) => ({ ...current, ...values }));

    async function save() {
        if (problems.length > 0) return;

        /* Same key order as the stored shape, so the draft compares equal to the
         * saved content and Save turns itself off after writing. */
        const next: AlertContent = {
            phone: draft.phone.trim(),
            email: draft.email.trim(),
            messages: draft.messages.map((message) => ({
                ...message,
                text: message.text.trim(),
            })),
            marqueeSeconds: draft.marqueeSeconds,
        };

        try {
            const result = await updateContent.mutateAsync({ alert: next });
            // What the API stored, not what was sent: the server is the authority.
            setDraft(result.alert);
            toast.success('Alert bar saved', {
                description: 'The storefront strip now shows these details.',
            });
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Could not save the alert bar');
        }
    }

    async function reset() {
        try {
            const result = await updateContent.mutateAsync({ reset: ['alert'] });
            setDraft(result.alert);
            toast('Alert bar reset to the shipped messages');
        } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Could not reset the alert bar');
        }
    }

    return (
        <div>
            <PageHeader
                title="Alert bar"
                description="The strip above the header — support contacts and the scrolling offers."
            >
                <AdminButton onClick={() => window.open('/', '_blank', 'noopener')}>
                    <Globe size={13} />
                    View storefront
                </AdminButton>
                <AdminButton disabled={updateContent.isPending} onClick={() => void reset()}>
                    <RotateCcw size={13} />
                    Reset
                </AdminButton>
                <AdminButton
                    variant="primary"
                    disabled={!dirty || problems.length > 0 || updateContent.isPending}
                    onClick={() => void save()}
                >
                    <Save size={13} />
                    Save alert bar
                </AdminButton>
            </PageHeader>

            {problems.length > 0 && (
                <Panel className="mb-6">
                    <PanelHeader
                        title="Fix these before saving"
                        meta="The strip never links an invalid number or email."
                    />
                    <ul className="flex flex-col gap-1.5 px-4 py-3 text-xs sm:px-5">
                        {problems.map((problem) => (
                            <li key={problem} className="flex items-start gap-2">
                                <span
                                    aria-hidden="true"
                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: Theme.colors.accentDark }}
                                />
                                <span style={{ color: Theme.colors.text }}>{problem}</span>
                            </li>
                        ))}
                    </ul>
                </Panel>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Panel>
                    <PanelHeader title="Support contacts" meta="Shown on the left of the strip" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field
                            label="Phone"
                            hint="Shown with the 📞 icon; the link dials the digits. Empty hides it."
                        >
                            <TextInput
                                type="tel"
                                value={draft.phone}
                                onChange={(event) => patch({ phone: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Email"
                            hint="Shown with the ✉️ icon. Empty hides it."
                        >
                            <TextInput
                                type="email"
                                value={draft.email}
                                onChange={(event) => patch({ email: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Marquee timing" meta="How long one full loop takes" />
                    <div className="px-4 py-4 sm:px-5">
                        <Field
                            label="Seconds per loop"
                            hint={`${MIN_MARQUEE_SECONDS}–${MAX_MARQUEE_SECONDS} seconds. Longer is calmer; shorter is harder to read.`}
                        >
                            <TextInput
                                type="number"
                                min={MIN_MARQUEE_SECONDS}
                                max={MAX_MARQUEE_SECONDS}
                                value={String(draft.marqueeSeconds)}
                                onChange={(event) =>
                                    patch({ marqueeSeconds: Number(event.target.value) })
                                }
                            />
                        </Field>
                    </div>
                </Panel>
            </div>

            <Panel className="mt-6">
                <PanelHeader
                    title="Offers"
                    meta={`${draft.messages.length}/${MAX_ALERT_MESSAGES} messages · the arrow buttons set the order`}
                    action={
                        <AdminButton
                            onClick={() =>
                                patch({
                                    messages: [
                                        ...draft.messages,
                                        {
                                            id: alertMessageId('New offer', draft.messages),
                                            text: 'New offer',
                                        },
                                    ],
                                })
                            }
                            disabled={draft.messages.length >= MAX_ALERT_MESSAGES}
                        >
                            <Plus size={13} />
                            Add message
                        </AdminButton>
                    }
                />

                <ul>
                    {draft.messages.map((message, index) => (
                        <MessageRow
                            key={message.id}
                            message={message}
                            index={index}
                            total={draft.messages.length}
                            onChange={(text) =>
                                patch({
                                    messages: draft.messages.map((row) =>
                                        row.id === message.id ? { ...row, text } : row
                                    ),
                                })
                            }
                            onMove={(delta) => {
                                const next = [...draft.messages];
                                const [row] = next.splice(index, 1);
                                next.splice(index + delta, 0, row);
                                patch({ messages: next });
                            }}
                            onRemove={() =>
                                patch({
                                    messages: draft.messages.filter((row) => row.id !== message.id),
                                })
                            }
                        />
                    ))}
                </ul>

                <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        Messages loop continuously and pause on hover. Leave the list empty to hide the
                        marquee and keep only the contact links.
                    </p>
                </div>
            </Panel>

            <Panel className="mt-6">
                <PanelHeader title="How this goes live" meta="No rebuild, no deploy" />
                <p
                    className="px-4 py-3 text-[11px] leading-relaxed sm:px-5"
                    style={{ color: Theme.colors.textMuted }}
                >
                    Saving writes to the alert store this strip reads, so open pages repaint immediately
                    and reloads keep the change. Like the rest of the website content, this copy is stored
                    in the browser that saves it rather than on the server.
                </p>
            </Panel>
        </div>
    );
}

const IconButton = ({
    label,
    disabled,
    onClick,
    danger,
    children,
}: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
    danger?: boolean;
    children: React.ReactNode;
}) => (
    <AdminButton
        variant={danger ? 'danger' : 'ghost'}
        className="h-8 w-8 px-0"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
    >
        {children}
    </AdminButton>
);

function MessageRow({
    message,
    index,
    total,
    onChange,
    onMove,
    onRemove,
}: {
    message: AlertMessage;
    index: number;
    total: number;
    onChange: (text: string) => void;
    onMove: (delta: number) => void;
    onRemove: () => void;
}) {
    const empty = !message.text.trim();

    return (
        <li
            className="border-t px-4 py-3 sm:px-5"
            style={{ borderColor: Theme.colors.border }}
        >
            <div className="flex items-center gap-2">
                <TextInput
                    aria-label={`Offer ${index + 1}`}
                    placeholder="50% OFF PAPER LANTERNS"
                    value={message.text}
                    onChange={(event) => onChange(event.target.value)}
                />
                <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                        label={`Move ${message.text || 'message'} up`}
                        disabled={index === 0}
                        onClick={() => onMove(-1)}
                    >
                        <ArrowUp size={14} />
                    </IconButton>
                    <IconButton
                        label={`Move ${message.text || 'message'} down`}
                        disabled={index === total - 1}
                        onClick={() => onMove(1)}
                    >
                        <ArrowDown size={14} />
                    </IconButton>
                    <IconButton label={`Remove ${message.text || 'message'}`} danger onClick={onRemove}>
                        <Trash2 size={14} />
                    </IconButton>
                </div>
            </div>
            {empty && (
                <p className="mt-1.5 text-[11px]" style={{ color: Theme.colors.accentDark }}>
                    Give this message some text, or remove it.
                </p>
            )}
        </li>
    );
}
