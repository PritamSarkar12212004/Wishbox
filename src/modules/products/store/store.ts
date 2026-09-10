/**
 * Lightweight global stores for cart & wishlist counts.
 * Uses useSyncExternalStore so the header badge, buy buttons and sticky bar
 * stay in sync without a context provider.
 */

type Listener = () => void;

function createStore(initial: number) {
    let value = initial;
    const listeners = new Set<Listener>();
    return {
        get: () => value,
        set: (next: number) => {
            value = next;
            listeners.forEach((l) => l());
        },
        add: (delta = 1) => {
            value += delta;
            listeners.forEach((l) => l());
        },
        subscribe: (l: Listener) => {
            listeners.add(l);
            return () => {
                listeners.delete(l);
            };
        },
    };
}

export const cartStore = createStore(2);
export const wishlistStore = createStore(1);