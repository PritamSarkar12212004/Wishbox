import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { authStore, type Session } from '@/modules/auth/store/authStore';
import type { AddressDraft } from '../data/addressData';
import { addressApi } from './addressApi';

/**
 * What is worth guarding here is the contract with the API: the exact paths,
 * the token on every call, that an id is escaped, and that a refusal arrives as
 * an `ApiError` carrying the server's own code and wording - because the form
 * shows that wording verbatim.
 */

const signedIn = (): Session => ({
    identity: { name: 'Pritam Sarkar', phone: '7796419792', verifiedAt: Date.now() },
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
});

const DRAFT: AddressDraft = {
    address1: 'Flat 4B, Shanti Residency',
    address2: 'Wardha Road',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
};

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

describe('addressApi', () => {
    it('saves an address with the signed-in token', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok({ id: 'addr-1', ...DRAFT }), 201);

        const saved = await addressApi.create(DRAFT);

        expect(calls[0]).toMatchObject({
            method: 'POST',
            path: '/addresses',
            body: DRAFT,
            authorization: 'Bearer access-1',
        });
        expect(saved.id).toBe('addr-1');
    });

    it('lists the saved addresses', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok([{ id: 'addr-1', ...DRAFT }]));

        const addresses = await addressApi.list();

        expect(calls[0]).toMatchObject({ method: 'GET', path: '/addresses' });
        expect(addresses).toHaveLength(1);
        expect(addresses[0]!.city).toBe('Nagpur');
    });

    it('patches only what changed, escaping the id', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok({ id: 'addr/1', city: 'Pune' }));

        await addressApi.update('addr/1', { city: 'Pune' });

        expect(calls[0]).toMatchObject({
            method: 'PATCH',
            path: '/addresses/addr%2F1',
            body: { city: 'Pune' },
        });
    });

    it('deletes an address', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () => json(ok(null));

        await addressApi.remove('addr-1');

        expect(calls[0]).toMatchObject({ method: 'DELETE', path: '/addresses/addr-1' });
    });

    it('refuses to call the API at all without a session', async () => {
        stubApi();

        await expect(addressApi.list()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
        expect(calls).toHaveLength(0);
    });

    it('keeps the API’s own message and code on a refusal', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () =>
            json(
                failed(422, 'VALIDATION_ERROR', 'Enter the area, landmark or street'),
                422
            );

        const error = await addressApi.create(DRAFT).catch((thrown: unknown) => thrown);

        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(422);
        expect((error as ApiError).message).toBe('Enter the area, landmark or street');
    });

    it('surfaces the address-book cap the way the API words it', async () => {
        authStore.setSession(signedIn());
        stubApi();
        respond = () =>
            json(
                failed(
                    409,
                    'CONFLICT',
                    'You can save up to 10 addresses. Delete one to add another.'
                ),
                409
            );

        await expect(addressApi.create(DRAFT)).rejects.toMatchObject({
            status: 409,
            code: 'CONFLICT',
        });
    });
});
