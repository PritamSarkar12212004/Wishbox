import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, API_BASE_URL, apiRequest } from './client';

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

const ok = (data: unknown) => ({
    success: true,
    statusCode: 200,
    message: 'ok',
    data,
    error: null,
});

const failed = (status: number, code: string, message: string, details?: unknown) => ({
    success: false,
    statusCode: status,
    message,
    data: null,
    error: { code, message, details },
});

/** Replaces global fetch for one test and hands back the spy. */
function stubFetch(implementation: (url: string, init: RequestInit) => Promise<Response> | Response) {
    const mock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
        Promise.resolve(implementation(String(input), init ?? {}))
    );
    vi.stubGlobal('fetch', mock);
    return mock;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('apiRequest', () => {
    it('unwraps the envelope and returns its data', async () => {
        stubFetch(() => json(ok({ id: 'u1', name: 'Ananya' })));

        await expect(apiRequest('/auth/me')).resolves.toEqual({ id: 'u1', name: 'Ananya' });
    });

    it('builds the url from the configured base', async () => {
        const mock = stubFetch(() => json(ok(null)));

        await apiRequest('/auth/me');

        expect(mock.mock.calls[0]?.[0]).toBe(`${API_BASE_URL}/auth/me`);
    });

    it('sends a JSON body and a bearer token when asked', async () => {
        const mock = stubFetch(() => json(ok(null)));

        await apiRequest('/users/me', {
            method: 'PATCH',
            body: { name: 'Ananya' },
            token: 'access-1',
        });

        const init = mock.mock.calls[0]?.[1];
        expect(init?.method).toBe('PATCH');
        expect(init?.body).toBe(JSON.stringify({ name: 'Ananya' }));

        const headers = init?.headers as Record<string, string>;
        expect(headers.authorization).toBe('Bearer access-1');
        expect(headers['content-type']).toBe('application/json');
    });

    it('sends no body or auth header for a plain read', async () => {
        const mock = stubFetch(() => json(ok(null)));

        await apiRequest('/auth/me');

        const init = mock.mock.calls[0]?.[1];
        expect(init?.body).toBeUndefined();
        expect((init?.headers as Record<string, string>).authorization).toBeUndefined();
    });

    it('turns a failed envelope into an ApiError carrying the API code', async () => {
        stubFetch(() =>
            json(
                failed(400, 'OTP_INVALID', 'That code is not correct. 4 attempts left.', {
                    attemptsRemaining: 4,
                }),
                400
            )
        );

        const caught = await apiRequest('/auth/otp/verify', { method: 'POST', body: {} }).catch(
            (error: unknown) => error
        );

        expect(caught).toBeInstanceOf(ApiError);
        const error = caught as ApiError;
        expect(error.status).toBe(400);
        expect(error.code).toBe('OTP_INVALID');
        // The API writes its failures for the shopper, so its wording is kept.
        expect(error.message).toBe('That code is not correct. 4 attempts left.');
        expect(error.details).toEqual({ attemptsRemaining: 4 });
        expect(error.isNetworkError).toBe(false);
        expect(error.isUnauthorized).toBe(false);
    });

    it('marks a 401 as unauthorized', async () => {
        stubFetch(() => json(failed(401, 'UNAUTHORIZED', 'Your session is no longer valid'), 401));

        const error = (await apiRequest('/auth/me').catch((caught: unknown) => caught)) as ApiError;

        expect(error.isUnauthorized).toBe(true);
    });

    it('reports an unreachable API as a network error rather than crashing', async () => {
        stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

        const error = (await apiRequest('/auth/me').catch((caught: unknown) => caught)) as ApiError;

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(0);
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.isNetworkError).toBe(true);
    });

    it('lets an abort through untouched so callers can ignore it', async () => {
        const abort = new DOMException('aborted', 'AbortError');
        stubFetch(() => Promise.reject(abort));

        await expect(apiRequest('/auth/me')).rejects.toBe(abort);
    });

    it('returns nothing for a bodiless success', async () => {
        stubFetch(() => new Response(null, { status: 200 }));

        await expect(
            apiRequest('/auth/logout', { method: 'POST', body: {} })
        ).resolves.toBeUndefined();
    });

    it('survives a non-JSON body from something in front of the API', async () => {
        stubFetch(
            () =>
                new Response('<html>bad gateway</html>', {
                    status: 502,
                    headers: { 'content-type': 'text/html' },
                })
        );

        const error = (await apiRequest('/auth/me').catch((caught: unknown) => caught)) as ApiError;

        expect(error.status).toBe(502);
        expect(error.code).toBe('REQUEST_FAILED');
        expect(error.message.length).toBeGreaterThan(0);
    });
});
