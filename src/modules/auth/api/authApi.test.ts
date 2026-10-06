import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { authStore, type Session } from '../store/authStore';
import { authApi, authedRequest, toIdentity, toSession, type ApiUser } from './authApi';

/**
 * The behaviour worth guarding is the silent refresh: the access token lives 15
 * minutes, so a 401 mid-session is normal, and getting it wrong either signs the
 * shopper out or burns the rotating refresh token with a replay.
 */

const user: ApiUser = {
    id: 'u1',
    name: 'Ananya Sharma',
    phone: '9876543210',
    phoneVerifiedAt: '2026-10-06T09:42:36.589Z',
    role: 'customer',
    createdAt: '2026-10-06T09:42:36.595Z',
    lastLoginAt: '2026-10-06T09:42:36.589Z',
};

const signedIn = (): Session => ({
    identity: toIdentity(user),
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
});

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

const failed = (status: number, code: string, message: string) => ({
    success: false,
    statusCode: status,
    message,
    data: null,
    error: { code, message },
});

const rotatedSession = {
    user,
    accessToken: 'access-2',
    refreshToken: 'refresh-2',
    expiresInSeconds: 900,
};

const pathOf = (url: string) => url.replace(/^.*\/api\/v1/, '');

const authHeaderOf = (init?: RequestInit) =>
    (init?.headers as Record<string, string> | undefined)?.authorization;

afterEach(() => {
    vi.unstubAllGlobals();
    authStore.signOut();
});

describe('authedRequest', () => {
    it('refreshes once, then replays the request with the new token', async () => {
        authStore.setSession(signedIn());

        const calls: string[] = [];
        vi.stubGlobal(
            'fetch',
            vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
                const path = pathOf(String(input));
                calls.push(`${init?.method ?? 'GET'} ${path}`);

                if (path === '/auth/refresh') {
                    return Promise.resolve(json(ok(rotatedSession)));
                }
                // Only the refreshed token is accepted, which is what proves the
                // replay actually carried it.
                return Promise.resolve(
                    authHeaderOf(init) === 'Bearer access-2'
                        ? json(ok(user))
                        : json(failed(401, 'UNAUTHORIZED', 'Your session is no longer valid'), 401)
                );
            })
        );

        await expect(authApi.me()).resolves.toEqual(user);

        expect(calls).toEqual(['GET /auth/me', 'POST /auth/refresh', 'GET /auth/me']);
        expect(authStore.getSession()?.accessToken).toBe('access-2');
        expect(authStore.getSession()?.refreshToken).toBe('refresh-2');
    });

    it('shares one refresh between parallel requests', async () => {
        authStore.setSession(signedIn());

        let refreshes = 0;
        vi.stubGlobal(
            'fetch',
            vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
                const path = pathOf(String(input));

                if (path === '/auth/refresh') {
                    refreshes += 1;
                    const body = JSON.parse(String(init?.body)) as { refreshToken: string };
                    // The stored token has already rotated, so a second refresh
                    // would present a spent token - the replay the server refuses.
                    return Promise.resolve(
                        body.refreshToken === 'refresh-1'
                            ? json(ok(rotatedSession))
                            : json(
                                  failed(401, 'UNAUTHORIZED', 'This session was signed out'),
                                  401
                              )
                    );
                }

                return Promise.resolve(
                    authHeaderOf(init) === 'Bearer access-2'
                        ? json(ok(user))
                        : json(failed(401, 'UNAUTHORIZED', 'expired'), 401)
                );
            })
        );

        await Promise.all([authApi.me(), authApi.me(), authApi.me()]);

        expect(refreshes).toBe(1);
        expect(authStore.getSession()?.refreshToken).toBe('refresh-2');
    });

    it('empties the session when the refresh is refused', async () => {
        authStore.setSession(signedIn());

        vi.stubGlobal(
            'fetch',
            vi.fn((input: RequestInfo | URL) =>
                Promise.resolve(
                    pathOf(String(input)) === '/auth/refresh'
                        ? json(failed(401, 'UNAUTHORIZED', 'This session was signed out'), 401)
                        : json(failed(401, 'UNAUTHORIZED', 'Your session is no longer valid'), 401)
                )
            )
        );

        await expect(authApi.me()).rejects.toBeInstanceOf(ApiError);

        // Nothing usable is left, so no screen should still look signed in.
        expect(authStore.getSession()).toBeNull();
    });

    it('never refreshes for a blocked account', async () => {
        authStore.setSession(signedIn());

        const calls: string[] = [];
        vi.stubGlobal(
            'fetch',
            vi.fn((input: RequestInfo | URL) => {
                calls.push(pathOf(String(input)));
                return Promise.resolve(
                    json(failed(403, 'FORBIDDEN', 'This account has been blocked'), 403)
                );
            })
        );

        const error = (await authApi.me().catch((caught: unknown) => caught)) as ApiError;

        expect(error.status).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
        // A refresh cannot un-block an account, so it must not be attempted.
        expect(calls).toEqual(['/auth/me']);
    });

    it('refuses a protected call with no session, without touching the network', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const error = (await authedRequest('/auth/me').catch((caught: unknown) => caught)) as ApiError;

        expect(error.code).toBe('UNAUTHENTICATED');
        expect(error.status).toBe(401);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('session mapping', () => {
    it('maps a verify response onto the stored session', () => {
        const session = toSession(rotatedSession);

        expect(session.accessToken).toBe('access-2');
        expect(session.refreshToken).toBe('refresh-2');
        expect(session.identity).toEqual({
            name: 'Ananya Sharma',
            phone: '9876543210',
            verifiedAt: Date.parse('2026-10-06T09:42:36.589Z'),
        });
    });

    it('keeps the tokens when only the identity is synced', () => {
        authStore.setSession(signedIn());

        authStore.syncIdentity({ name: 'Ananya S.', phone: '9876543210', verifiedAt: 1 });

        expect(authStore.get()?.name).toBe('Ananya S.');
        expect(authStore.getSession()?.accessToken).toBe('access-1');
    });
});
