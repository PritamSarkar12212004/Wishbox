/**
 * Return / refund workflow overrides.
 *
 * The demo returns are seeded read-only; approving, rejecting or marking one
 * for refund writes an override here so the returns queue actually behaves like
 * a queue. Nothing is persisted to a server — this is the admin demo.
 */

import { useMemo, useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';
import { getAdminDataset, type AdminReturn, type ReturnStatus } from '../data/adminData';

const RETURNS_KEY = 'wishbox.admin.returns.v1';
const RETURNS_VERSION = 1;
const REFUND_STATUSES: ReturnStatus[] = ['Approved'];

type ReturnState = {
    version: number;
    statuses: Record<string, ReturnStatus>;
};

function initialReturnState(): ReturnState {
    const stored = readStoredJSON<ReturnState | null>(RETURNS_KEY, null);
    if (stored && stored.version === RETURNS_VERSION && stored.statuses) return stored;
    return { version: RETURNS_VERSION, statuses: {} };
}

const returns = createStore<ReturnState>(initialReturnState(), RETURNS_KEY);

export const adminReturnsStore = {
    subscribe: returns.subscribe,

    setStatus(id: string, status: ReturnStatus): void {
        returns.set((state) => ({ ...state, statuses: { ...state.statuses, [id]: status } }));
    },

    reset(): void {
        returns.set(() => ({ version: RETURNS_VERSION, statuses: {} }));
    },
};

export function useAdminReturns(): AdminReturn[] {
    const state = useSyncExternalStore(returns.subscribe, returns.get, returns.get);

    return useMemo(() => {
        const seeded = getAdminDataset().returns;
        if (Object.keys(state.statuses).length === 0) return seeded;
        return seeded.map((entry) => {
            const next = state.statuses[entry.id];
            if (!next || next === entry.status) return entry;
            return {
                ...entry,
                status: next,
                // An approved return is what releases the refund.
                refunded: next === 'Rejected' ? false : entry.refunded,
            };
        });
    }, [state]);
}

export const isRefundReleased = (status: ReturnStatus) => REFUND_STATUSES.includes(status);
