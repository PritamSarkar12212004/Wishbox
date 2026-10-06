import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { authStore, type Session } from '@/modules/auth/store/authStore';
import { adminApi } from './adminApi';

/**
 * What is worth guarding here is the contract with the API: the exact paths,
 * the token on every call, and that a refusal arrives as an `ApiError` carrying
 * the server's own code. The panel's gates hang off those codes, so a silent
 * change of shape would be a security-shaped bug rather than a cosmetic one.
 */

const signedIn = (): Session => ({
    identity: { name: 'Pritam Sarkar', phone: '7796419792', verifiedAt: Date.now() },
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

const pathOf = (url: string) => url.replace(/^.*\/api\/v1/, '');

type Call = { method: string; path: string; body: unknown; authorization?: string };

let calls: Call[] = [];
let respond: (path: string, method: string) => Response;

function stubApi() {
    calls = [];
    respond = () => json(ok(null));

    vi.stubGlobal(
        'fetch',
        vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const path = pathOf(String(input));
            const method = init?.method ?? 'GET';
            const headers = init?.headers as Record<string, string> | undefined;

            calls.push({
                method,
                path,
                body: init?.body ? JSON.parse(String(init.body)) : undefined,
                authorization: headers?.authorization,
            });

            return Promise.resolve(respond(path, method));
        })
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
    authStore.signOut();
});

describe('adminApi', () => {
    it('asks the API who it is talking to, and says so when it is not an admin', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(failed(403, 'FORBIDDEN', 'This account does not have admin access'), 403);

        await expect(adminApi.session()).rejects.toMatchObject({
            status: 403,
            code: 'FORBIDDEN',
        });

        expect(calls[0]).toMatchObject({
            method: 'GET',
            path: '/admin/session',
            authorization: 'Bearer access-1',
        });
    });

    it('reads the dataset in one call', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () =>
            json(
                ok({
                    generatedAt: 1,
                    orders: [],
                    customers: [],
                    returns: [],
                    reviews: [],
                    coupons: [],
                    restocks: [],
                })
            );

        const dataset = await adminApi.dataset();

        expect(calls[0].path).toBe('/admin/dataset');
        expect(dataset.orders).toEqual([]);
    });

    it('patches an order, escaping the id so the # survives the URL', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok({ id: '#ORD2422', status: 'Approved' }));

        const order = await adminApi.updateOrder('#ORD2422', { status: 'Approved' });

        expect(calls[0].method).toBe('PATCH');
        expect(calls[0].path).toBe('/admin/orders/%23ORD2422');
        expect(calls[0].body).toEqual({ status: 'Approved' });
        expect(order.status).toBe('Approved');
    });

    it('sends only the status when a return moves', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok({ id: '#RET-5005', status: 'Approved' }));

        await adminApi.updateReturn('#RET-5005', 'Approved');

        expect(calls[0]).toMatchObject({
            method: 'PATCH',
            path: '/admin/returns/%23RET-5005',
            body: { status: 'Approved' },
            authorization: 'Bearer access-1',
        });
    });

    it('posts a reply, and takes one down with an explicit null', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok({ id: '#REV-7001' }));

        await adminApi.updateReview('#REV-7001', { reply: { message: 'Thanks!' } });
        expect(calls[0].body).toEqual({ reply: { message: 'Thanks!' } });

        await adminApi.updateReview('#REV-7001', { reply: null });
        expect(calls[1].body).toEqual({ reply: null });
    });

    it('deletes a review', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok(null));

        await adminApi.deleteReview('#REV-7001');

        expect(calls[0].method).toBe('DELETE');
        expect(calls[0].path).toBe('/admin/reviews/%23REV-7001');
    });

    it('merges a settings change and hands back the saved object', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok({ storeName: 'WishBox', lowStockThreshold: 25 }));

        const settings = await adminApi.updateSettings({ lowStockThreshold: 25 });

        expect(calls[0]).toMatchObject({
            method: 'PATCH',
            path: '/admin/settings',
            body: { lowStockThreshold: 25 },
        });
        expect(settings.lowStockThreshold).toBe(25);
    });

    it('refuses to call the API at all without a session', async () => {
        stubApi();

        await expect(adminApi.dataset()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
        expect(calls).toHaveLength(0);
    });

    it('keeps the API’s message and code on a validation failure', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () =>
            json(failed(422, 'VALIDATION_ERROR', 'Tell us why the order is being cancelled'), 422);

        const error = await adminApi
            .updateOrder('#ORD2422', { status: 'Cancelled' })
            .catch((thrown: unknown) => thrown);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(422);
        expect((error as ApiError).message).toBe('Tell us why the order is being cancelled');
    });
});
