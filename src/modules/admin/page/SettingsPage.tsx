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

export default function SettingsPage() {
    const settings = useAdminSettings();
    const admin = useAdminSession().data?.user;
    const updateSettings = useUpdateSettings();
    const [draft, setDraft] = useState<AdminSettings>(settings);

    const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
    const patch = (values: Partial<AdminSettings>) => setDraft((current) => ({ ...current, ...values }));

    const preview = findWebsiteTheme(draft.websiteTheme);

    return (
        <div>
            <PageHeader
                title="Settings"
                description="Store profile and operational defaults, saved on the server and read by the storefront and the panel."
            >
                <AdminButton
                    onClick={() => {
                        setDraft(DEFAULT_ADMIN_SETTINGS);
                        updateSettings.mutate(DEFAULT_ADMIN_SETTINGS, {
                            onSuccess: () => toast('Settings reset to the shipped defaults'),
                            onError: () => toast.error('Could not reset the settings'),
                        });
                    }}
                >
                    <RotateCcw size={13} />
                    Reset
                </AdminButton>
                <AdminButton
                    variant="primary"
                    disabled={!dirty}
                    onClick={() => {
                        updateSettings.mutate(draft, {
                            onSuccess: () =>
                                toast.success('Settings saved', {
                                    description: 'The storefront picks the new values up on its next load.',
                                }),
                            onError: (error) =>
                                toast.error('Could not save the settings', {
                                    description:
                                        error instanceof Error ? error.message : 'Please try again.',
                                }),
                        });
                    }}
                >
                    <Save size={13} />
                    Save changes
                </AdminButton>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel>
                    <PanelHeader title="Store profile" meta="Shown in the admin chrome" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Store name">
                            <TextInput
                                value={draft.storeName}
                                onChange={(event) => patch({ storeName: event.target.value })}
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