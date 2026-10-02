/**
 * Admin settings — persisted, and actually wired up.
 *
 * The low-stock threshold drives the dashboard's inventory alerts and the
 * low-stock list, so changing it here visibly changes the operational views
 * rather than only saving a form.
 */

import { useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';

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
    notifyNewOrders: boolean;
    notifyLowStock: boolean;
    notifyReturns: boolean;
    notifyDailyDigest: boolean;
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
    storeName: 'WishBox',
    supportEmail: 'support@papercraft.in',
    supportPhone: '+91 98765 43210',
    lowStockThreshold: 10,
    freeShippingThreshold: 999,
    codEnabled: true,
    defaultCourier: 'Delhivery',
    notifyNewOrders: true,
    notifyLowStock: true,
    notifyReturns: true,
    notifyDailyDigest: false,
};

const settings = createStore<AdminSettings>(
    { ...DEFAULT_ADMIN_SETTINGS, ...readStoredJSON<Partial<AdminSettings>>(SETTINGS_KEY, {}) },
    SETTINGS_KEY
);

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
