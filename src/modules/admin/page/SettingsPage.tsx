import { useState } from 'react';
import { KeyRound, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import { AdminButton, Field, PageHeader, Panel, PanelHeader, TextInput, Toggle } from '../components/AdminUI';
import adminConst from '../consts/adminConst';
import { COURIER_OPTIONS } from '../consts/courierConst';
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

    return (
        <div>
            <PageHeader
                title="Settings"
                description="Store profile, operations thresholds and alerting. Saved to this browser only."
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
                            description: 'Low-stock thresholds update the dashboards immediately.',
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
                    <PanelHeader title="Operations" meta="Thresholds that drive the alerts" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field
                            label="Low stock threshold"
                            hint="Live products at or below this level appear in inventory alerts everywhere."
                        >
                            <TextInput
                                type="number"
                                min={0}
                                value={draft.lowStockThreshold}
                                onChange={(event) => patch({ lowStockThreshold: Number(event.target.value) })}
                            />
                        </Field>
                        <Field label="Free shipping above (₹)" hint="Matches the storefront's shipping promise.">
                            <TextInput
                                type="number"
                                min={0}
                                value={draft.freeShippingThreshold}
                                onChange={(event) => patch({ freeShippingThreshold: Number(event.target.value) })}
                            />
                        </Field>
                        <Field label="Default courier">
                            <SelectMenu
                                variant="field"
                                value={draft.defaultCourier}
                                options={COURIER_OPTIONS}
                                onChange={(value) => patch({ defaultCourier: value })}
                                label="Default courier"
                            />
                        </Field>
                        <div className="border-t pt-1" style={{ borderColor: Theme.colors.border }}>
                            <Toggle
                                checked={draft.codEnabled}
                                onChange={(next) => patch({ codEnabled: next })}
                                label="Cash on delivery"
                                hint="Disable to hide COD at checkout."
                            />
                        </div>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Notifications" meta="What the admin should be told about" />
                    <div className="flex flex-col gap-1 px-4 py-3 sm:px-5">
                        <Toggle
                            checked={draft.notifyNewOrders}
                            onChange={(next) => patch({ notifyNewOrders: next })}
                            label="New orders"
                            hint="Alert as soon as an order is placed."
                        />
                        <Toggle
                            checked={draft.notifyLowStock}
                            onChange={(next) => patch({ notifyLowStock: next })}
                            label="Low stock"
                            hint="Warn when a live product hits the threshold."
                        />
                        <Toggle
                            checked={draft.notifyReturns}
                            onChange={(next) => patch({ notifyReturns: next })}
                            label="Return requests"
                            hint="Alert on every new return or refund request."
                        />
                        <Toggle
                            checked={draft.notifyDailyDigest}
                            onChange={(next) => patch({ notifyDailyDigest: next })}
                            label="Daily digest"
                            hint="A single morning summary instead of live alerts."
                        />
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
        </div>
    );
}
