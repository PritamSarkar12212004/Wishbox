/**
 * Admin settings — persisted, and actually wired up.
 *
 * The low-stock threshold drives the dashboard's inventory alerts and the
 * low-stock list; the website theme is the admin's chosen storefront look.
 *
 * Operations values (thresholds, courier, COD) are edited on the Shipping →
 * Courier Settings screen and read by the dashboards, so they stay in this
 * store even though the Settings page no longer shows them.
 */

import { useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { DEFAULT_WEBSITE_THEME_ID } from '../consts/themeConst';

const SETTINGS_KEY = 'wishbox.admin.settings.v1';

export type AdminSettings = {
    storeName: string;
    supportEmail: string;
    supportPhone: string;
    /** Live products at or below this stock level are "low stock". */
    lowStockThreshold: number;
    freeShippingThreshold: number;
    codEnabled: boolean;
    defaultCourier: string;
    /** Id of the selected website theme — see `consts/themeConst.ts`. */
    websiteTheme: string;
    /**
     * The UPI QR shoppers scan to pay. Stored as an image data URL (or a hosted
     * URL the admin pasted). Empty means it has not been uploaded yet.
     */
    paymentQr: string;
    /** When the QR was last replaced — 0 until the first upload. */
    paymentQrUpdatedAt: number;
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
    storeName: 'WishBox',
    supportEmail: 'support@papercraft.in',
    supportPhone: '+91 98765 43210',
    lowStockThreshold: 10,
    freeShippingThreshold: 999,
    codEnabled: true,
    defaultCourier: 'Delhivery',
    websiteTheme: DEFAULT_WEBSITE_THEME_ID,
    paymentQr: '',
    paymentQrUpdatedAt: 0,
};

/**
 * Reads the saved settings, keeping only keys this version knows about.
 *
 * Older builds stored notification toggles that no longer exist; spreading the
 * raw payload would carry them forward forever (and re-persist them on every
 * save), so the stored value is filtered against the current shape.
 */
function readSettings(): AdminSettings {
    const stored = readStoredJSON<Partial<AdminSettings>>(SETTINGS_KEY, {});
    const merged = { ...DEFAULT_ADMIN_SETTINGS };

    (Object.keys(DEFAULT_ADMIN_SETTINGS) as Array<keyof AdminSettings>).forEach((key) => {
        const value = stored[key];
        if (value !== undefined) {
            // The union of value types is wide; each key keeps its own default type.
            (merged as Record<string, unknown>)[key] = value;
        }
    });

    return merged;
}

const settings = createStore<AdminSettings>(readSettings(), SETTINGS_KEY);

export const adminSettingsStore = {
    subscribe: settings.subscribe,
    getSnapshot: settings.get,
    update(patch: Partial<AdminSettings>): void {
        settings.set((current) => ({ ...current, ...patch }));
    },
    reset(): void {
        settings.set(() => DEFAULT_ADMIN_SETTINGS);
    },
};

export function useAdminSettings(): AdminSettings {
    return useSyncExternalStore(
        adminSettingsStore.subscribe,
        adminSettingsStore.getSnapshot,
        adminSettingsStore.getSnapshot
    );
}
