/**
 * Minimal persistent external store.
 *
 * State lives in memory, any component can subscribe via useSyncExternalStore,
 * and when a storage key is supplied the value is persisted to localStorage and
 * kept in sync across tabs. Without a browser (tests, SSR) it degrades to a
 * plain in-memory store.
 */

export type Listener = () => void;

export type ExternalStore<T> = {
    get: () => T;
    set: (updater: (current: T) => T) => void;
    subscribe: (listener: Listener) => () => void;
};

export const canUseStorage = typeof window !== 'undefined' && 'localStorage' in window;

/** Reads a JSON value from localStorage, falling back on missing/corrupt data. */
export function readStoredJSON<T>(key: string, fallback: T): T {
    if (!canUseStorage) return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        // Corrupt payload — start clean rather than crash the app.
        return fallback;
    }
}

export function writeStoredJSON(key: string, value: unknown): void {
    if (!canUseStorage) return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage may be full or blocked (private mode); stores still work in-memory.
    }
}

/** Creates a store that optionally persists under `persistKey`. */
export function createStore<T>(initial: T, persistKey?: string): ExternalStore<T> {
    let value = initial;
    const listeners = new Set<Listener>();
    const emit = () => listeners.forEach((listener) => listener());

    if (canUseStorage && persistKey) {
        // Keep multiple tabs in sync when localStorage changes elsewhere.
        window.addEventListener('storage', (event) => {
            if (event.key !== persistKey || event.newValue === null) return;
            try {
                value = JSON.parse(event.newValue) as T;
                emit();
            } catch {
                /* ignore malformed cross-tab writes */
            }
        });
    }

    return {
        get: () => value,
        set: (updater) => {
            value = updater(value);
            if (persistKey) writeStoredJSON(persistKey, value);
            emit();
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
