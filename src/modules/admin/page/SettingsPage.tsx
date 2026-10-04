import { useState } from 'react';
import { KeyRound, Palette, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { AdminButton, Field, PageHeader, Panel, PanelHeader, TextInput } from '../components/AdminUI';
import ThemePreviewCard from '../components/ThemePreviewCard';
import adminConst from '../consts/adminConst';
import { WEBSITE_THEMES, findWebsiteTheme } from '../consts/themeConst';
import {
    DEFAULT_ADMIN_SETTINGS,
    adminSettingsStore,
    useAdminSettings,
    type AdminSettings,
} from '../store/settingsStore';

export default function SettingsPage() {
    const settings = useAdminSettings();
    const [draft, setDraft] = useState<AdminSettings>(settings);

    const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
    const patch = (values: Partial<AdminSettings>) => setDraft((current) => ({ ...current, ...values }));

    const preview = findWebsiteTheme(draft.websiteTheme);

    return (
        <div>
            <PageHeader
                title="Settings"
                description="Store profile and the website theme. Saved to this browser only."
            >
                <AdminButton
                    onClick={() => {
                        adminSettingsStore.reset();
                        setDraft(DEFAULT_ADMIN_SETTINGS);
                        toast('Settings reset to defaults');
                    }}
                >
                    <RotateCcw size={13} />
                    Reset
                </AdminButton>
                <AdminButton
                    variant="primary"
                    disabled={!dirty}
                    onClick={() => {
                        adminSettingsStore.update(draft);
                        toast.success('Settings saved', {
                            description: 'The storefront chrome picks the new values up on the next load.',
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
                        title="Demo access"
                        meta="Illustrative only — there is no server enforcing this"
                        action={<KeyRound size={15} style={{ color: Theme.colors.primaryDark }} />}
                    />
                    <dl className="flex flex-col gap-3 px-4 py-4 text-xs sm:px-5">
                        <div className="flex items-center justify-between gap-3">
                            <dt style={{ color: Theme.colors.textMuted }}>Admin email</dt>
                            <dd className="font-semibold">{adminConst.demo.email}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt style={{ color: Theme.colors.textMuted }}>Password</dt>
                            <dd className="font-semibold">{adminConst.demo.password}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                            <dt style={{ color: Theme.colors.textMuted }}>Session</dt>
                            <dd className="text-right font-semibold">
                                A localStorage flag, not real authentication
                            </dd>
                        </div>
                    </dl>
                    <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                            Everything on this panel runs in the browser: the catalogue, orders and returns all live in
                            localStorage, so nothing is uploaded anywhere. Wire these screens to a real API before going
                            live.
                        </p>
                    </div>
                </Panel>
            </div>

            {/* ── Website theme ───────────────────────────────────── */}
            <Panel className="mt-6">
                <PanelHeader
                    title="Website theme"
                    meta={`${WEBSITE_THEMES.length} themes · currently ${preview.name}`}
                    action={<Palette size={15} style={{ color: Theme.colors.primaryDark }} />}
                />

                <div className="px-4 py-4 sm:px-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {WEBSITE_THEMES.map((theme) => (
                            <ThemePreviewCard
                                key={theme.id}
                                theme={theme}
                                selected={draft.websiteTheme === theme.id}
                                onSelect={() => patch({ websiteTheme: theme.id })}
                            />
                        ))}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span
                            className="text-[11px]"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            {dirty
                                ? `Draft: ${preview.name} — save changes to keep it.`
                                : `Saved theme: ${preview.name}.`}
                        </span>
                        {draft.websiteTheme !== DEFAULT_ADMIN_SETTINGS.websiteTheme && (
                            <AdminButton onClick={() => patch({ websiteTheme: DEFAULT_ADMIN_SETTINGS.websiteTheme })}>
                                <RotateCcw size={13} />
                                Back to Papercraft
                            </AdminButton>
                        )}
                    </div>
                </div>

                <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        Each card previews a full storefront palette — background, surface, accent, text and corner
                        radius. The selection is stored with the rest of these settings; the demo storefront renders its
                        current look rather than repainting itself live.
                    </p>
                </div>
            </Panel>
        </div>
    );
}