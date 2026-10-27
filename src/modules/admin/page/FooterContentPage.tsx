import { useMemo, useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
    Globe,
    PanelBottom,
    Plus,
    RotateCcw,
    Save,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, Field, PageHeader, Panel, PanelHeader, TextArea, TextInput } from '../components/AdminUI';
import {
    MAX_FOOTER_LINKS,
    footerLinkId,
    footerProblems,
    isValidDestination,
    normalizeDestination,
    safeLinkId,
    type FooterContent,
    type FooterLink,
} from '@/global/site/footerContent';
import { useFooterContent } from '@/global/site/footerStore';
import { useUpdateSiteContent } from '@/modules/site/api/useSiteContent';
import { ApiError } from '@/lib/api/client';

/**
 * The API's own words, plus the first field error when it sends one.
 *
 * "Validation failed" alone told the shopkeeper nothing; the details say which
 * field and why ("Keep the Company column to 8 links or fewer").
 */
function failureMessage(error: unknown, fallback: string): string {
    if (!(error instanceof ApiError)) return fallback;
    const details = Array.isArray(error.details) ? error.details : [];
    const first = details.find(
        (detail): detail is { field?: string; message: string } =>
            Boolean(detail) && typeof (detail as { message?: unknown }).message === 'string'
    );
    if (!first) return error.message;
    return first.field ? `${error.message} — ${first.field}: ${first.message}` : first.message;
}

/**
 * Website → Footer — the footer every storefront page renders.
 *
 * Saved to the API (`PATCH /admin/content`), which is what every visitor's
 * footer renders. The response hydrates the shared store, so the whole site
 * updates the moment Save returns — on every browser, not just this one.
 */
export default function FooterContentPage() {
    const saved = useFooterContent();
    const [draft, setDraft] = useState<FooterContent>(saved);
    const updateContent = useUpdateSiteContent();

    const problems = useMemo(() => footerProblems(draft), [draft]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

    const patch = (values: Partial<FooterContent>) =>
        setDraft((current) => ({ ...current, ...values }));

    async function save() {
        if (problems.length > 0) return;

        /* Trim and normalise before saving, so what the footer renders is what
         * is stored (`shop` becomes `/shop`) and the draft matches it exactly.
         * A custom link gets a slug-safe id too - the label is what shoppers see,
         * the id is only a key, so it should never be the reason a save fails. */
        const next: FooterContent = {
            ...draft,
            storeName: draft.storeName.trim(),
            instagramUrl: draft.instagramUrl.trim(),
            whatsappUrl: draft.whatsappUrl.trim(),
            email: draft.email.trim(),
            phone: draft.phone.trim(),
            shopLinks: draft.shopLinks.map((link) => ({
                ...link,
                id: safeLinkId(link.id, link.label),
                label: link.label.trim(),
                to: normalizeDestination(link.to),
            })),
            companyLinks: draft.companyLinks.map((link) => ({
                ...link,
                id: safeLinkId(link.id, link.label),
                label: link.label.trim(),
                to: normalizeDestination(link.to),
            })),
        };

        try {
            const result = await updateContent.mutateAsync({ footer: next });
            // What the API stored, not what was sent: the server is the authority.
            setDraft(result.footer);
            toast.success('Footer saved', {
                description: 'Every storefront page now shows these details.',
            });
        } catch (error) {
            toast.error(failureMessage(error, 'Could not save the footer'), {
                description: 'Nothing was changed. Check the highlighted column and try again.',
            });
        }
    }

    async function reset() {
        try {
            const result = await updateContent.mutateAsync({ reset: ['footer'] });
            setDraft(result.footer);
            toast('Footer reset to the shipped details');
        } catch (error) {
            toast.error(failureMessage(error, 'Could not reset the footer'));
        }
    }

    return (
        <div>
            <PageHeader
                title="Footer"
                description="The footer your shoppers see — brand, link columns, contact details and socials."
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
                    Save footer
                </AdminButton>
            </PageHeader>

            {problems.length > 0 && (
                <Panel className="mb-6">
                    <PanelHeader
                        title="Fix these before saving"
                        meta="The storefront never renders a broken link or an invalid email."
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
                    <PanelHeader title="Brand" meta="The name, line and socials under it" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field
                            label="Store name"
                            hint="The name the whole storefront uses — header, footer, page titles and catalogue PDFs. The same field is on Settings, so either screen renames the shop."
                        >
                            <TextInput
                                value={draft.storeName}
                                onChange={(event) => patch({ storeName: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Tagline"
                            hint="One or two lines — keep it short enough to sit under the logo."
                        >
                            <TextArea
                                rows={3}
                                value={draft.tagline}
                                onChange={(event) => patch({ tagline: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Instagram link"
                            hint="Full https:// URL. Leave empty to hide the icon."
                        >
                            <TextInput
                                type="url"
                                placeholder="https://www.instagram.com/your-studio"
                                value={draft.instagramUrl}
                                onChange={(event) => patch({ instagramUrl: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="WhatsApp link"
                            hint="Full https://wa.me/… link. Leave empty to hide the icon."
                        >
                            <TextInput
                                type="url"
                                placeholder="https://wa.me/91XXXXXXXXXX"
                                value={draft.whatsappUrl}
                                onChange={(event) => patch({ whatsappUrl: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Get in touch" meta="Address, phone and email column" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Column heading">
                            <TextInput
                                value={draft.contactHeading}
                                onChange={(event) => patch({ contactHeading: event.target.value })}
                            />
                        </Field>
                        <Field label="Address" hint="Leave empty to hide the address line.">
                            <TextInput
                                value={draft.address}
                                onChange={(event) => patch({ address: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Phone"
                            hint="Shown as typed; the link dials the digits, so spaces and + are fine."
                        >
                            <TextInput
                                type="tel"
                                value={draft.phone}
                                onChange={(event) => patch({ phone: event.target.value })}
                            />
                        </Field>
                        <Field
                            label="Email"
                            hint="Used for the contact line and the footer's email icon."
                        >
                            <TextInput
                                type="email"
                                value={draft.email}
                                onChange={(event) => patch({ email: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <LinkColumnEditor
                    title="Shop column"
                    meta="Links to the catalogue and the shopper's own pages"
                    headingLabel="Column heading"
                    heading={draft.shopHeading}
                    onHeading={(shopHeading) => patch({ shopHeading })}
                    links={draft.shopLinks}
                    onLinks={(shopLinks) => patch({ shopLinks })}
                />

                <LinkColumnEditor
                    title="Company column"
                    meta="Pages about the studio and how to reach it"
                    headingLabel="Column heading"
                    heading={draft.companyHeading}
                    onHeading={(companyHeading) => patch({ companyHeading })}
                    links={draft.companyLinks}
                    onLinks={(companyLinks) => patch({ companyLinks })}
                />

                <Panel>
                    <PanelHeader title="WhatsApp sign-up" meta="The subscribe card in the footer" />
                    <div className="px-4 py-4 sm:px-5">
                        <Field
                            label="Card heading"
                            hint="The number field and its checks stay as they are."
                        >
                            <TextInput
                                value={draft.subscribeHeading}
                                onChange={(event) => patch({ subscribeHeading: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Bottom bar" meta="The fine print beside “Back to top”" />
                    <div className="px-4 py-4 sm:px-5">
                        <Field
                            label="Copyright line"
                            hint="Leave empty to hide it. The year is whatever you type."
                        >
                            <TextInput
                                value={draft.copyright}
                                onChange={(event) => patch({ copyright: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>
            </div>

            <Panel className="mt-6">
                <PanelHeader
                    title="How this goes live"
                    meta="No rebuild, no deploy"
                    action={<PanelBottom size={15} style={{ color: Theme.colors.primaryDark }} />}
                />
                <p
                    className="px-4 py-3 text-[11px] leading-relaxed sm:px-5"
                    style={{ color: Theme.colors.textMuted }}
                >
                    Saving writes to the footer store the storefront reads, so open pages repaint
                    immediately and reloads keep the change. Like the product catalogue, this copy
                    is stored in the browser that saves it rather than on the server — a visitor on
                    another device sees the shipped defaults until the content moves to the API.
                </p>
            </Panel>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Link column editor                                                 */
/* ------------------------------------------------------------------ */

function LinkColumnEditor({
    title,
    meta,
    headingLabel,
    heading,
    onHeading,
    links,
    onLinks,
}: {
    title: string;
    meta: string;
    headingLabel: string;
    heading: string;
    onHeading: (next: string) => void;
    links: FooterLink[];
    onLinks: (next: FooterLink[]) => void;
}) {
    const update = (id: string, values: Partial<FooterLink>) =>
        onLinks(links.map((link) => (link.id === id ? { ...link, ...values } : link)));

    const move = (index: number, delta: number) => {
        const next = [...links];
        const [row] = next.splice(index, 1);
        next.splice(index + delta, 0, row);
        onLinks(next);
    };

    const remove = (id: string) => onLinks(links.filter((link) => link.id !== id));

    const add = () =>
        onLinks([
            ...links,
            { id: footerLinkId('New link', links), label: 'New link', to: '/' },
        ]);

    return (
        <Panel>
            <PanelHeader
                title={title}
                meta={meta}
                action={
                    <AdminButton onClick={add} disabled={links.length >= MAX_FOOTER_LINKS}>
                        <Plus size={13} />
                        Add link
                    </AdminButton>
                }
            />

            <div className="px-4 py-4 sm:px-5">
                <Field label={headingLabel}>
                    <TextInput value={heading} onChange={(event) => onHeading(event.target.value)} />
                </Field>
            </div>

            {links.length === 0 ? (
                <p
                    className="border-t px-4 py-5 text-center text-xs sm:px-5"
                    style={{ borderColor: Theme.colors.border, color: Theme.colors.textMuted }}
                >
                    No links yet — add one to show this column.
                </p>
            ) : (
                <ul>
                    {links.map((link, index) => {
                        const invalid =
                            !link.label.trim() ||
                            !isValidDestination(normalizeDestination(link.to));
                        return (
                            <li
                                key={link.id}
                                className="border-t px-4 py-3 sm:px-5"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                                        <TextInput
                                            aria-label={`${title} link ${index + 1} label`}
                                            placeholder="Label"
                                            value={link.label}
                                            onChange={(event) =>
                                                update(link.id, { label: event.target.value })
                                            }
                                        />
                                        <TextInput
                                            aria-label={`${title} link ${index + 1} destination`}
                                            placeholder="/shop or https://…"
                                            value={link.to}
                                            onChange={(event) =>
                                                update(link.id, { to: event.target.value })
                                            }
                                            onBlur={(event) =>
                                                update(link.id, {
                                                    to: normalizeDestination(event.target.value),
                                                })
                                            }
                                        />
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <AdminButton
                                            className="h-8 w-8 px-0"
                                            aria-label={`Move ${link.label || 'link'} up`}
                                            disabled={index === 0}
                                            onClick={() => move(index, -1)}
                                        >
                                            <ArrowUp size={14} />
                                        </AdminButton>
                                        <AdminButton
                                            className="h-8 w-8 px-0"
                                            aria-label={`Move ${link.label || 'link'} down`}
                                            disabled={index === links.length - 1}
                                            onClick={() => move(index, 1)}
                                        >
                                            <ArrowDown size={14} />
                                        </AdminButton>
                                        <AdminButton
                                            variant="danger"
                                            className="h-8 w-8 px-0"
                                            aria-label={`Remove ${link.label || 'link'}`}
                                            onClick={() => remove(link.id)}
                                        >
                                            <Trash2 size={14} />
                                        </AdminButton>
                                    </div>
                                </div>

                                {invalid && (
                                    <p
                                        className="mt-1.5 text-[11px]"
                                        style={{ color: Theme.colors.accentDark }}
                                    >
                                        Add a label and a destination — a /path on this site or a
                                        full https://, mailto: or tel: link.
                                    </p>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    {links.length}/{MAX_FOOTER_LINKS} links · destinations such as{' '}
                    <code>/shop</code> stay inside the site; the arrow buttons set the order.
                </p>
            </div>
        </Panel>
    );
}
