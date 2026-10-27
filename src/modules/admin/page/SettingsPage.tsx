import { useState } from 'react';
import { KeyRound, Palette, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, Field, PageHeader, Panel, PanelHeader, TextInput } from '../components/AdminUI';
import ThemePreviewCard from '../components/ThemePreviewCard';
import { WEBSITE_THEMES, findWebsiteTheme } from '../consts/themeConst';
import { formatPhone } from '@/modules/auth/lib/otp';
import { useAdminSession, useUpdateSettings } from '../api/useAdmin';
import {
    DEFAULT_ADMIN_SETTINGS,
    useAdminSettings,
    type AdminSettings,
} from '../store/settingsStore';
import { DEFAULT_FOOTER_CONTENT } from '@/global/site/footerContent';
import { useFooterContent } from '@/global/site/footerStore';
import { useUpdateSiteContent } from '@/modules/site/api/useSiteContent';

export default function SettingsPage() {
    const settings = useAdminSettings();
    const footer = useFooterContent();
    const admin = useAdminSession().data?.user;
    const updateSettings = useUpdateSettings();
    const updateContent = useUpdateSiteContent();
    const [draft, setDraft] = useState<AdminSettings>(settings);
    /**
     * The store name is website content rather than an admin setting: `GET
     * /content` is public, so saving it here is what makes the header, footer,
     * page titles and catalogue PDFs use it — on every shopper's browser, not
     * just this one. See `global/site/storeIdentity`.
     */
    const [storeName, setStoreName] = useState(footer.storeName);

    const dirty =
        JSON.stringify(draft) !== JSON.stringify(settings) || storeName.trim() !== footer.storeName;
    const patch = (values: Partial<AdminSettings>) => setDraft((current) => ({ ...current, ...values }));

    const preview = findWebsiteTheme(draft.websiteTheme);

    /** Saves both halves: the settings document and the public store name. */
    async function save() {
        const name = storeName.trim();

        try {
            if (name !== footer.storeName) {
                await updateContent.mutateAsync({ footer: { ...footer, storeName: name } });
            }
            await updateSettings.mutateAsync(draft);
            toast.success('Settings saved', {
                description: 'The storefront picks the new values up on its next load.',
            });
        } catch (error) {
            toast.error('Could not save the settings', {
                description: error instanceof Error ? error.message : 'Please try again.',
            });
        }
    }

    /** Back to the shipped settings, including the shipped store name. */
    async function reset() {
        setDraft(DEFAULT_ADMIN_SETTINGS);
        setStoreName(DEFAULT_FOOTER_CONTENT.storeName);

        try {
            await updateContent.mutateAsync({
                footer: { ...footer, storeName: DEFAULT_FOOTER_CONTENT.storeName },
            });
            await updateSettings.mutateAsync(DEFAULT_ADMIN_SETTINGS);
            toast('Settings reset to the shipped defaults');
        } catch (error) {
            toast.error('Could not reset the settings', {
                description: error instanceof Error ? error.message : 'Please try again.',
            });
        }
    }

    return (
        <div>
            <PageHeader
                title="Settings"
                description="Store profile and operational defaults, saved on the server and read by the storefront and the panel."
            >
                <AdminButton
                    disabled={updateSettings.isPending || updateContent.isPending}
                    onClick={() => void reset()}
                >
                    <RotateCcw size={13} />
                    Reset
                </AdminButton>
                <AdminButton
                    variant="primary"
                    disabled={
                        !dirty ||
                        !storeName.trim() ||
                        updateSettings.isPending ||
                        updateContent.isPending
                    }
                    onClick={() => void save()}
                >
                    <Save size={13} />
                    Save changes
                </AdminButton>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel>
                    <PanelHeader
                        title="Store profile"
                        meta="Shown across the storefront and the admin chrome"
                    />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field
                            label="Store name"
                            hint="Used on the storefront header and footer, in page titles and on catalogue PDFs."
                        >
                            <TextInput
                                value={storeName}
                                onChange={(event) => setStoreName(event.target.value)}
                            />
                        </Field>
                        <Field label="Support email">
                            <TextInput
                                type="email"
                                value={draft.supportEmail}
                                onChange={(event) => patch({ supportEmail: event.target.value })}
                            />
                        </Field>
                        <Field label="Support phone">
                            <TextInput
                                value={draft.supportPhone}
                                onChange={(event) => patch({ supportPhone: event.target.value })}
                            />
                        </Field>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader
                        title="Admin access"
                        meta="Checked by the API on every admin request"
                        action={<KeyRound size={15} style={{ color: Theme.colors.primaryDark }} />}
                    />
                    <dl className="flex flex-col gap-3 px-4 py-4 text-xs sm:px-5">
                        <div className="flex items-center justify-between gap-3">
                            <dt style={{ color: Theme.colors.textMuted }}>Signed in as</dt>
                            <dd className="font-semibold">{admin?.name ?? '—'}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt style={{ color: Theme.colors.textMuted }}>WhatsApp number</dt>
                            <dd className="font-semibold">{admin ? formatPhone(admin.phone) : '—'}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                            <dt style={{ color: Theme.colors.textMuted }}>Access</dt>
                            <dd className="text-right font-semibold">Listed in ADMIN_PHONES on the server</dd>
                        </div>
                    </dl>
                    <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                            The panel runs on the same account as the storefront — signing in with an allowlisted
                            WhatsApp number is what opens it. Orders, customers, returns, reviews, the catalogue and
                            these settings are all served by the API, so every change here is visible to anyone who
                            opens the panel, and to every shopper, not just in this browser.
                        </p>
                    </div>
                </Panel>
            </div>

            {/* ── Website theme — under development ───────────────── */}
            <Panel className="mt-6">
                <PanelHeader
                    title="Website theme"
                    meta={`${WEBSITE_THEMES.length} themes · currently ${preview.name} · under development`}
                    action={
                        <span className="flex items-center gap-2">
                            <span
                                className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                                style={{
                                    backgroundColor: Theme.colors.surfaceAlt,
                                    color: Theme.colors.textMuted,
                                }}
                            >
                                Soon
                            </span>
                            <Palette size={15} style={{ color: Theme.colors.primaryDark }} />
                        </span>
                    }
                />

                <div className="px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {WEBSITE_THEMES.map((theme) => (
                            <ThemePreviewCard
                                key={theme.id}
                                theme={theme}
                                selected={draft.websiteTheme === theme.id}
                                disabled
                            />
                        ))}
                    </div>

                    <p className="mt-4 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        Theme switching is switched off for now — {preview.name} stays the live storefront
                        palette. The previews are shown so the next look can be picked deliberately.
                    </p>
                </div>

                <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        Each card previews a storefront palette — background, surface, accent, text and corner radius.
                        Applying one is under development, so the cards are read-only; the saved theme is kept with the
                        rest of these settings and no shopper sees a change from here yet.
                    </p>
                </div>
            </Panel>
        </div>
    );
}