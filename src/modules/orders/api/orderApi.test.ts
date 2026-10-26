import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore, type Session } from '@/modules/auth/store/authStore';
import { orderApi } from './orderApi';

/**
 * The order contract: quantities and an address go in, and the token goes on
 * every call. Nothing in the request names a price - that is the whole point of
 * the server-priced checkout, so it is worth pinning.
 */

const session: Session = {
    identity: { name: 'Ananya Sharma', phone: '9876500011', verifiedAt: Date.now() },
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
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

const pathOf = (url: string) => url.replace(/^.*\/api\/v1/, '');

type Call = { method: string; path: string; body: unknown; authorization?: string };

let calls: Call[] = [];

beforeEach(() => {
    calls = [];
    authStore.setSession(session);

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

            return Promise.resolve(json(ok(null)));
        })
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    authStore.signOut();
});

describe('orderApi', () => {
    it('places an order with products, quantities and an address - no prices', async () => {
        await orderApi.place({
            items: [{ productId: 'premium-handmade-decorative-paper', qty: 12 }],
            addressId: '64b7f9c2f1a2b3c4d5e6f7a8',
            payment: 'COD',
            couponCode: 'PAPER10',
        });

        expect(calls[0]?.method).toBe('POST');
        expect(calls[0]?.path).toBe('/orders');
        expect(calls[0]?.authorization).toBe('Bearer access-1');
        expect(calls[0]?.body).toEqual({
            items: [{ productId: 'premium-handmade-decorative-paper', qty: 12 }],
            addressId: '64b7f9c2f1a2b3c4d5e6f7a8',
            payment: 'COD',
            couponCode: 'PAPER10',
        });
    });

    it('reads the shopper’s history', async () => {
        await orderApi.list();
        expect(calls[0]?.path).toBe('/orders');
        expect(calls[0]?.authorization).toBe('Bearer access-1');
    });

    it('escapes the order number and sends only the reason and note', async () => {
        await orderApi.requestReturn({
            orderId: '#WB-1001',
            reason: 'Damaged in transit',
            note: 'Box was crushed',
        });

        expect(calls[0]?.method).toBe('POST');
        expect(calls[0]?.path).toBe('/orders/%23WB-1001/returns');
        expect(calls[0]?.body).toEqual({
            reason: 'Damaged in transit',
            note: 'Box was crushed',
        });
    });

    it('omits an empty note rather than sending a blank string', async () => {
        await orderApi.requestReturn({ orderId: '#WB-1002', reason: 'Changed my mind', note: '  ' });
        expect(calls[0]?.body).toEqual({ reason: 'Changed my mind', note: undefined });
    });

    it('reads the shopper’s return requests', async () => {
        await orderApi.returns();
        expect(calls[0]?.path).toBe('/returns');
    });
});
