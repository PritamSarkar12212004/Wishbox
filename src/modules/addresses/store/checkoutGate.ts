import { useSyncExternalStore } from 'react';
import { createStore } from '@/lib/createStore';
import type { DeliveryAddress } from '../data/addressData';

/**
 * The "where should this go?" step of checkout.
 *
 * Buy Now and the cart both need the same thing: a confirmed delivery address
 * before an order exists. `checkoutGate.require(onAddress)` opens the address
 * sheet and remembers what to do with the answer, so the order is placed with
 * the address the shopper actually chose rather than a fixture.
 *
 * It sits *inside* `loginGate`: an action that needs an account verifies first,
 * and continues by opening this one. Dwelling on the mistake of opening it
 * without a session, the sheet simply has no list to show.
 */

type CheckoutState = {
    /** Incremented on every open so the sheet can reset its steps without effects. */
    session: number;
    open: boolean;
    /** Called with the confirmed address; runs once, on completion. */
    pending: ((address: DeliveryAddress) => void) | null;
};

const INITIAL: CheckoutState = { session: 0, open: false, pending: null };

const gate = createStore<CheckoutState>(INITIAL);

export const checkoutGate = {
    subscribe: gate.subscribe,
    get: gate.get,

    require(action: (address: DeliveryAddress) => void): void {
        gate.set((current) => ({
            session: current.session + 1,
            open: true,
            pending: action,
        }));
    },

    /** Dismissed: the order is not placed and the queued action is dropped. */
    close(): void {
        gate.set((current) => ({ ...current, open: false, pending: null }));
    },

    /** An address was confirmed: close, then place the order it was for. */
    complete(address: DeliveryAddress): void {
        const { pending } = gate.get();
        gate.set((current) => ({ ...current, open: false, pending: null }));
        pending?.(address);
    },
};

export function useCheckoutGate(): CheckoutState {
    return useSyncExternalStore(checkoutGate.subscribe, checkoutGate.get, checkoutGate.get);
}
