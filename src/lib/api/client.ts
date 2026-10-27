/**
 * The one place the storefront talks to the WishBox API.
 *
 * Every endpoint answers with the same envelope (`{ success, statusCode,
 * message, data, error }`), so unwrapping it and turning a failure into a typed
 * error lives here instead of in each caller. The origin it talks to is
 * `VITE_API_URL`, never a value written into the source. A failure is always an `ApiError`
 * carrying the backend's error code, so a screen can react to a specific cause
 * (a wrong code, a resend cooldown) rather than matching on message text.
 */

/**
 * Where the API lives, from the environment only (`VITE_API_URL`).
 *
 * Nothing is baked in: the same build can point at a local API, a staging
 * backend or production, and no deployed address sits in the source. Set it in
 * `.env` (or the host's build environment — see `.env.example`).
 *
 * Falling back to the local API keeps a dev server usable when `.env` has not
 * been filled in yet, but it is never right for a deployed build, so it says so
 * loudly instead of quietly talking to the wrong origin.
 */
const configuredBaseUrl = (import.meta.env.VITE_API_URL ?? '').trim();

const LOCAL_API_URL = 'http://localhost:5000/api/v1';

if (!configuredBaseUrl) {
    console.warn(
        `VITE_API_URL is not set — using ${LOCAL_API_URL}. Add VITE_API_URL to .env (or the host's build environment) before deploying.`
    );
}

export const API_BASE_URL = (configuredBaseUrl || LOCAL_API_URL).replace(/\/+$/, '');

export type ApiErrorBody = {
    code: string;
    message: string;
    details?: unknown;
};

/** The shape every WishBox endpoint answers with. */
type ApiEnvelope<T> = {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;
    error: ApiErrorBody | null;
};

type ApiErrorInit = {
    /** 0 when the request never reached the API at all. */
    status: number;
    code: string;
    message: string;
    details?: unknown;
};

export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details: unknown;

    constructor(init: ApiErrorInit) {
        super(init.message);
        this.name = 'ApiError';
        this.status = init.status;
        this.code = init.code;
        this.details = init.details;
    }

    /** No HTTP status: the request never got there (offline, blocked, DNS). */
    get isNetworkError(): boolean {
        return this.status === 0;
    }

    /** The session is missing or no longer valid. */
    get isUnauthorized(): boolean {
        return this.status === 401;
    }
}

export type ApiRequestOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    body?: unknown;
    /** Bearer token for the account endpoints; omitted for the public ones. */
    token?: string | null;
    signal?: AbortSignal;
};

const NETWORK_MESSAGE =
    "We couldn't reach WishBox. Check your connection and try again.";

/** Reads the JSON body without ever throwing on a malformed or empty one. */
async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T> | null> {
    try {
        const text = await response.text();
        return text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
    } catch {
        // A proxy or captive portal can answer with HTML; treat it as no body.
        return null;
    }
}

export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, token, signal } = options;

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                ...(body === undefined ? {} : { 'content-type': 'application/json' }),
                ...(token ? { authorization: `Bearer ${token}` } : {}),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            ...(signal ? { signal } : {}),
        });
    } catch (error) {
        // An abort is the caller unmounting, not a failure worth reporting.
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        throw new ApiError({
            status: 0,
            code: 'NETWORK_ERROR',
            message: NETWORK_MESSAGE,
        });
    }

    const envelope = await readEnvelope<T>(response);

    // A bodiless success (logout) carries no envelope, so there is nothing to
    // unwrap and no `data` to hand back.
    if (response.ok && envelope === null) return undefined as T;

    if (!response.ok || !envelope?.success) {
        const failure = envelope?.error;
        throw new ApiError({
            status: response.status,
            code: failure?.code ?? 'REQUEST_FAILED',
            // The API writes its failures for the shopper, so its message wins.
            message: failure?.message || envelope?.message || NETWORK_MESSAGE,
            details: failure?.details,
        });
    }

    return envelope.data as T;
}
