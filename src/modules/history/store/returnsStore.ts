import { useSyncExternalStore } from 'react';
import { createStore, readStoredJSON } from '@/lib/createStore';

/**
 * Return / exchange requests raised by the shopper.
 *
 * Kept separate from the admin's demo queue (`wishbox.admin.returns.v1`) so the
 * customer's own requests are never confused with the seeded dataset — this is
 * the list the account's notification feed and the order card read from.
 */

export type ReturnReason =
    | 'Damaged in transit'
    | 'Wrong item delivered'
    | 'Not as described'
    | 'Changed my mind'
    | 'Better price elsewhere';

export type ReturnStatus = 'Requested' | 'Approved' | 'Rejected';

export type ReturnRequest = {
    id: string;
    orderId: string;
    productName: string;
    reason: ReturnReason;
    note: string;
    requestedAt: number;
    status: ReturnStatus;
    refundAmount: number;
};

export const RETURN_REASONS: ReturnReason[] = [
    'Damaged in transit',
    'Wrong item delivered',
    'Not as described',
    'Changed my mind',
    'Better price elsewhere',
];

const RETURNS_KEY = 'wishbox.returns.v1';

const requests = createStore<ReturnRequest[]>(
    readStoredJSON<ReturnRequest[]>(RETURNS_KEY, []),
    RETURNS_KEY
);

export const returnsStore = {
    subscribe: requests.subscribe,
    get: requests.get,

    create(input: Omit<ReturnRequest, 'id' | 'requestedAt' | 'status'>): ReturnRequest {
        const next: ReturnRequest = {
            ...input,
            id: `#RET-${10_000 + requests.get().length + 1}`,
            requestedAt: Date.now(),
            status: 'Requested',
        };
        requests.set((current) => [next, ...current]);
        return next;
    },

    reset(): void {
        requests.set(() => []);
    },
};

export function useReturnRequests(): ReturnRequest[] {
    return useSyncExternalStore(returnsStore.subscribe, returnsStore.get, returnsStore.get);
}

export function useReturnForOrder(orderId: string): ReturnRequest | undefined {
    const all = useReturnRequests();
    return all.find((entry) => entry.orderId === orderId);
}
