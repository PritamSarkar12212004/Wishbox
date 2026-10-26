import { useMemo, useState } from 'react';
import { Globe, MessageCircle, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, Field, PageHeader, Panel, PanelHeader, TextArea, TextInput } from '../components/AdminUI';
import {
    contactProblems,
    slugId,
    type ContactContent,
    type ContactTopic,
    type SupportHour,
} from '@/modules/contact/data/contactContent';
import { useContactContent } from '@/modules/contact/store/contactStore';
import { useUpdateSiteContent } from '@/modules/site/api/useSiteContent';
import { ApiError } from '@/lib/api/client';

/**
 * Website → Contact page — every detail the Contact page prints.
 *
 * Saved to the API (`PATCH /admin/content`), which is what every visitor's
 * Contact page renders. The response hydrates the shared store, so the public
 * page updates the moment Save returns — on every browser, not just this one.
 */
export default function ContactContentPage() {
    const saved = useContactContent();
    const [draft, setDraft] = useState<ContactContent>(saved);
    const updateContent = useUpdateSiteContent();

    const problems = useMemo(() => contactProblems(draft), [draft]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

    /** Replaces one section wholesale — the page always writes whole sections. */
    function patchSection<K extends keyof ContactContent>(key: K, values: Partial<ContactContent[K]>) {
        setDraft((current) => ({ ...current, [key]: { ...current[key], ...values } }));
    }

    async function save() {
        if (problems.length > 0) return;

        const trim = (value: string) => value.trim();
        const next: ContactContent = {
            hero: {
                eyebrow: trim(draft.hero.eyebrow),
                title: trim(draft.hero.title),
                lead: trim(draft.hero.lead),
                pills: {
                    whatsapp: trim(draft.hero.pills.whatsapp),
                    email: trim(draft.hero.pills.email),
                    location: trim(draft.hero.pills.location),
                },
            },
            whatsapp: {
                ...draft.whatsapp,
                kicker: trim(draft.whatsapp.kicker),
                number: trim(draft.whatsapp.number),
                bestFor: trim(draft.whatsapp.bestFor),
                meta: trim(draft.whatsapp.meta),
                buttonLabel: trim(draft.whatsapp.buttonLabel),
                copyLabel: trim(draft.whatsapp.copyLabel),
                /* The prefill keeps its trailing space — it is the sentence the
                 * shopper's first word continues. */
                prefill: draft.whatsapp.prefill,
            },
            email: {
                ...draft.email,
                kicker: trim(draft.email.kicker),
                address: trim(draft.email.address),
                bestFor: trim(draft.email.bestFor),
                meta: trim(draft.email.meta),
                buttonLabel: trim(draft.email.buttonLabel),
                subject: trim(draft.email.subject),
                copyLabel: trim(draft.email.copyLabel),
            },
            form: {
                heading: trim(draft.form.heading),
                intro: trim(draft.form.intro),
            },
            call: {
                title: trim(draft.call.title),
                phone: trim(draft.call.phone),
                note: trim(draft.call.note),
            },
            studio: {
                ...draft.studio,
                title: trim(draft.studio.title),
                lines: draft.studio.lines.map(trim).filter(Boolean),
                directionsLabel: trim(draft.studio.directionsLabel),
                directionsUrl: trim(draft.studio.directionsUrl),
            },
            hours: {
                title: trim(draft.hours.title),
                rows: draft.hours.rows.map((row) => ({
                    ...row,
                    days: trim(row.days),
                    time: trim(row.time),
                })),
            },
            social: {
                title: trim(draft.social.title),
                note: trim(draft.social.note),
                instagramUrl: trim(draft.social.instagramUrl),
            },
            topics: draft.topics.map((topic) => ({ ...topic, label: trim(topic.label) })),
        };

        try {
            const result = await updateContent.mutateAsync({ contact: next });
            // What the API stored, not what was sent: the server is the authority.
            setDraft(result.contact);
            toast.success('Contact page saved', {
                description: 'The storefront Contact page now shows these details.',
            });
        } catch (error) {
            toast.error(
                error instanceof ApiError ? error.message : 'Could not save the Contact page'
            );
        }
    }

    async function reset() {
        try {
            const result = await updateContent.mutateAsync({ reset: ['contact'] });
            setDraft(result.contact);
            toast('Contact page reset to the shipped details');
        } catch (error) {
            toast.error(
                error instanceof ApiError ? error.message : 'Could not reset the Contact page'
            );
        }
    }

    return (
        <div>
            <PageHeader
                title="Contact page"
                description="Headline, channels, studio details and enquiry topics — everything the Contact page prints."
            >
                <AdminButton onClick={() => window.open('/contact', '_blank', 'noopener')}>
                    <Globe size={13} />
                    View page
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
                    Save page
                </AdminButton>
            </PageHeader>

            {problems.length > 0 && (
                <Panel className="mb-6">
                    <PanelHeader
                        title="Fix these before saving"
                        meta="The page never prints an invalid email, number or link."
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
                    <PanelHeader title="Hero" meta="The opening block above the two channel cards" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Support badge">
                            <TextInput
                                value={draft.hero.eyebrow}
                                onChange={(event) => patchSection('hero', { eyebrow: event.target.value })}
                            />
                        </Field>
                        <Field label="Headline">
                            <TextInput
                                value={draft.hero.title}
                                onChange={(event) => patchSection('hero', { title: event.target.value })}
                            />
                        </Field>
                        <Field label="Intro paragraph">
                            <TextArea
                                rows={4}
                                value={draft.hero.lead}
                                onChange={(event) => patchSection('hero', { lead: event.target.value })}
                            />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Field label="WhatsApp pill" hint="Empty hides it.">
                                <TextInput
                                    value={draft.hero.pills.whatsapp}
                                    onChange={(event) =>
                                        patchSection('hero', {
                                            pills: { ...draft.hero.pills, whatsapp: event.target.value },
                                        })
                                    }
                                />
                            </Field>
                            <Field label="Email pill" hint="Empty hides it.">
                                <TextInput
                                    value={draft.hero.pills.email}
                                    onChange={(event) =>
                                        patchSection('hero', {
                                            pills: { ...draft.hero.pills, email: event.target.value },
                                        })
                                    }
                                />
                            </Field>
                            <Field label="Location pill" hint="Empty hides it.">
                                <TextInput
                                    value={draft.hero.pills.location}
                                    onChange={(event) =>
                                        patchSection('hero', {
                                            pills: { ...draft.hero.pills, location: event.target.value },
                                        })
                                    }
                                />
                            </Field>
                        </div>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="WhatsApp card"
                        meta="The number, the chat link and its prefilled first line"
                        action={<MessageCircle size={15} style={{ color: Theme.colors.primaryDark }} />}
                    />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Card heading">
                            <TextInput
                                value={draft.whatsapp.kicker}
                                onChange={(event) =>
                                    patchSection('whatsapp', { kicker: event.target.value })
                                }
                            />
                        </Field>
                        <Field
                            label="WhatsApp number"
                            hint="Include the country code — the chat link is built from these digits."
                        >
                            <TextInput
                                type="tel"
                                value={draft.whatsapp.number}
                                onChange={(event) =>
                                    patchSection('whatsapp', { number: event.target.value })
                                }
                            />
                        </Field>
                        <Field label="What it is best for">
                            <TextInput
                                value={draft.whatsapp.bestFor}
                                onChange={(event) =>
                                    patchSection('whatsapp', { bestFor: event.target.value })
                                }
                            />
                        </Field>
                        <Field label="Response time line">
                            <TextInput
                                value={draft.whatsapp.meta}
                                onChange={(event) => patchSection('whatsapp', { meta: event.target.value })}
                            />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Button label">
                                <TextInput
                                    value={draft.whatsapp.buttonLabel}
                                    onChange={(event) =>
                                        patchSection('whatsapp', { buttonLabel: event.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Copy button label">
                                <TextInput
                                    value={draft.whatsapp.copyLabel}
                                    onChange={(event) =>
                                        patchSection('whatsapp', { copyLabel: event.target.value })
                                    }
                                />
                            </Field>
                        </div>
                        <Field
                            label="Prefilled message"
                            hint="Opens in WhatsApp with this already typed. Keep the trailing space."
                        >
                            <TextInput
                                value={draft.whatsapp.prefill}
                                onChange={(event) =>
                                    patchSection('whatsapp', { prefill: event.target.value })
                                }
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Email card" meta="Address, subject and reply expectation" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Card heading">
                            <TextInput
                                value={draft.email.kicker}
                                onChange={(event) => patchSection('email', { kicker: event.target.value })}
                            />
                        </Field>
                        <Field label="Email address">
                            <TextInput
                                type="email"
                                value={draft.email.address}
                                onChange={(event) => patchSection('email', { address: event.target.value })}
                            />
                        </Field>
                        <Field label="What it is best for">
                            <TextInput
                                value={draft.email.bestFor}
                                onChange={(event) => patchSection('email', { bestFor: event.target.value })}
                            />
                        </Field>
                        <Field label="Response time line">
                            <TextInput
                                value={draft.email.meta}
                                onChange={(event) => patchSection('email', { meta: event.target.value })}
                            />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Button label">
                                <TextInput
                                    value={draft.email.buttonLabel}
                                    onChange={(event) =>
                                        patchSection('email', { buttonLabel: event.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Copy button label">
                                <TextInput
                                    value={draft.email.copyLabel}
                                    onChange={(event) =>
                                        patchSection('email', { copyLabel: event.target.value })
                                    }
                                />
                            </Field>
                        </div>
                        <Field label="Email subject" hint="Prefilled in the shopper's mail app.">
                            <TextInput
                                value={draft.email.subject}
                                onChange={(event) => patchSection('email', { subject: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Contact form" meta="Its heading and the line under it" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Form heading">
                            <TextInput
                                value={draft.form.heading}
                                onChange={(event) => patchSection('form', { heading: event.target.value })}
                            />
                        </Field>
                        <Field label="Form intro" hint="The validation hint after it stays automatic.">
                            <TextArea
                                rows={3}
                                value={draft.form.intro}
                                onChange={(event) => patchSection('form', { intro: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Call us" meta="The first card in the side rail" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Card heading">
                            <TextInput
                                value={draft.call.title}
                                onChange={(event) => patchSection('call', { title: event.target.value })}
                            />
                        </Field>
                        <Field label="Phone number" hint="Shown as typed; the link dials the digits.">
                            <TextInput
                                type="tel"
                                value={draft.call.phone}
                                onChange={(event) => patchSection('call', { phone: event.target.value })}
                            />
                        </Field>
                        <Field label="Note" hint="Leave empty to hide it.">
                            <TextInput
                                value={draft.call.note}
                                onChange={(event) => patchSection('call', { note: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Visit the studio" meta="Address lines and the directions link" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Card heading">
                            <TextInput
                                value={draft.studio.title}
                                onChange={(event) => patchSection('studio', { title: event.target.value })}
                            />
                        </Field>
                        <Field label="Address" hint="One line per row. Empty rows are dropped on save.">
                            <TextArea
                                rows={3}
                                value={draft.studio.lines.join('\n')}
                                onChange={(event) =>
                                    patchSection('studio', { lines: event.target.value.split('\n') })
                                }
                            />
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Directions label">
                                <TextInput
                                    value={draft.studio.directionsLabel}
                                    onChange={(event) =>
                                        patchSection('studio', { directionsLabel: event.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Directions URL" hint="Full https:// link. Empty hides it.">
                                <TextInput
                                    type="url"
                                    value={draft.studio.directionsUrl}
                                    onChange={(event) =>
                                        patchSection('studio', { directionsUrl: event.target.value })
                                    }
                                />
                            </Field>
                        </div>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Follow along" meta="The social card in the side rail" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Card heading">
                            <TextInput
                                value={draft.social.title}
                                onChange={(event) => patchSection('social', { title: event.target.value })}
                            />
                        </Field>
                        <Field label="Note">
                            <TextInput
                                value={draft.social.note}
                                onChange={(event) => patchSection('social', { note: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Instagram link"
                            hint="Full https:// URL. Empty hides the icon. WhatsApp and email icons follow the cards above."
                        >
                            <TextInput
                                type="url"
                                value={draft.social.instagramUrl}
                                onChange={(event) =>
                                    patchSection('social', { instagramUrl: event.target.value })
                                }
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Enquiry topics" meta="The form's “What is this about?” menu" />
                    <TopicsEditor
                        topics={draft.topics}
                        onTopics={(topics) => setDraft((current) => ({ ...current, topics }))}
                    />
                </Panel>

                <Panel>
                    <PanelHeader title="Support hours" meta="The last rail card, one row per slot" />
                    <HoursEditor
                        title={draft.hours.title}
                        onTitle={(title) => patchSection('hours', { title })}
                        rows={draft.hours.rows}
                        onRows={(rows) => patchSection('hours', { rows })}
                    />
                </Panel>
            </div>

            <Panel className="mt-6">
                <PanelHeader title="How this goes live" meta="No rebuild, no deploy" />
                <p
                    className="px-4 py-3 text-[11px] leading-relaxed sm:px-5"
                    style={{ color: Theme.colors.textMuted }}
                >
                    Saving writes to the contact store this page reads, so open Contact pages repaint
                    immediately and reloads keep the change. Like the footer and the catalogue, this copy
                    is stored in the browser that saves it rather than on the server.
                </p>
            </Panel>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Row editors                                                        */
/* ------------------------------------------------------------------ */

function RowButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <AdminButton variant="danger" className="h-8 w-8 px-0" aria-label={label} onClick={onClick}>
            {children}
        </AdminButton>
    );
}

function TopicsEditor({
    topics,
    onTopics,
}: {
    topics: ContactTopic[];
    onTopics: (next: ContactTopic[]) => void;
}) {
    const add = () =>
        onTopics([
            ...topics,
            { id: slugId('New topic', topics.map((topic) => topic.id)), label: 'New topic' },
        ]);

    return (
        <>
            <div className="flex justify-end px-4 py-3 sm:px-5">
                <AdminButton onClick={add}>
                    <Plus size={13} />
                    Add topic
                </AdminButton>
            </div>
            <ul>
                {topics.map((topic, index) => (
                    <li
                        key={topic.id}
                        className="flex items-center gap-2 border-t px-4 py-3 sm:px-5"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        <TextInput
                            aria-label={`Enquiry topic ${index + 1}`}
                            value={topic.label}
                            onChange={(event) =>
                                onTopics(
                                    topics.map((row) =>
                                        row.id === topic.id ? { ...row, label: event.target.value } : row
                                    )
                                )
                            }
                        />
                        <RowButton
                            label={`Remove ${topic.label || 'topic'}`}
                            onClick={() => onTopics(topics.filter((row) => row.id !== topic.id))}
                        >
                            <Trash2 size={14} />
                        </RowButton>
                    </li>
                ))}
            </ul>
        </>
    );
}

function HoursEditor({
    title,
    onTitle,
    rows,
    onRows,
}: {
    title: string;
    onTitle: (next: string) => void;
    rows: SupportHour[];
    onRows: (next: SupportHour[]) => void;
}) {
    const update = (id: string, values: Partial<SupportHour>) =>
        onRows(rows.map((row) => (row.id === id ? { ...row, ...values } : row)));

    const add = () =>
        onRows([
            ...rows,
            { id: slugId('new-slot', rows.map((row) => row.id)), days: '', time: '' },
        ]);

    return (
        <>
            <div className="flex items-end gap-3 px-4 py-4 sm:px-5">
                <Field label="Card heading">
                    <TextInput value={title} onChange={(event) => onTitle(event.target.value)} />
                </Field>
                <AdminButton onClick={add}>
                    <Plus size={13} />
                    Add slot
                </AdminButton>
            </div>
            <ul>
                {rows.map((row, index) => (
                    <li
                        key={row.id}
                        className="flex items-center gap-2 border-t px-4 py-3 sm:px-5"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                            <TextInput
                                aria-label={`Support hours row ${index + 1} days`}
                                placeholder="Monday – Friday"
                                value={row.days}
                                onChange={(event) => update(row.id, { days: event.target.value })}
                            />
                            <TextInput
                                aria-label={`Support hours row ${index + 1} time`}
                                placeholder="10:00 AM – 7:00 PM IST"
                                value={row.time}
                                onChange={(event) => update(row.id, { time: event.target.value })}
                            />
                        </div>
                        <RowButton
                            label={`Remove ${row.days || 'slot'}`}
                            onClick={() => onRows(rows.filter((entry) => entry.id !== row.id))}
                        >
                            <Trash2 size={14} />
                        </RowButton>
                    </li>
                ))}
            </ul>
        </>
    );
}
