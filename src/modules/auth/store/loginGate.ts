import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/createStore';
import { authStore } from './authStore';

/**
 * The "you need an account for this" gate.
 *
 * Any account-connected action calls `requireLogin(action, reason)`. When the
 * shopper is already verified the action runs immediately; otherwise the modal
 * opens with that reason and the action is remembered, so finishing the OTP
 * step continues exactly what they were doing.
 */

type GateState = {
    /** Incremented on every open so the modal can reset its form without effects. */
    session: number;
    open: boolean;
    reason?: string;
    pending: (() => void) | null;
};

const INITIAL: GateState = { session: 0, open: false, pending: null };

const gate = createStore<GateState>(INITIAL);

export const loginGate = {
    subscribe: gate.subscribe,
    get: gate.get,

    require(action?: () => void, reason?: string): void {
        if (authStore.get()) {
            action?.();
            return;
        }
        gate.set((current) => ({
            session: current.session + 1,
            open: true,
            reason,
            pending: action ?? null,
        }));
    },

    /** Dismissed without verifying — the queued action is dropped. */
    close(): void {
        gate.set((current) => ({ ...current, open: false, pending: null }));
    },

    /** Verified: close, then continue the action that triggered the gate. */
    complete(): void {
        const { pending } = gate.get();
        gate.set((current) => ({ ...current, open: false, pending: null }));
        pending?.();
    },
};

export function useLoginGate(): GateState {
    return useSyncExternalStore(loginGate.subscribe, loginGate.get, loginGate.get);
}

/** Non-hook entry point so any callback (or plain function) can gate itself. */
export const requireLogin = (action?: () => void, reason?: string): void =>
    loginGate.require(action, reason);
