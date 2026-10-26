import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogProduct } from './productApi';
import { authStore, type Session } from '@/modules/auth/store/authStore';
import { productApi } from './productApi';

/**
 * The catalogue contract: exact paths, the admin token on every write, and the
 * query the public listing actually sends. A typo here would show up as an empty
 * shop rather than a type error, because the response is data, not a type.
 */

const session: Session = {
    identity: { name: 'Pritam Sarkar', phone: '7796419792', verifiedAt: Date.now() },
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
let respond: (path: string) => unknown;

beforeEach(() => {
    calls = [];
    respond = () => [];
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

            return Promise.resolve(json(ok(respond(path))));
        })
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    authStore.signOut();
});

const product = (id: string) => ({ id }) as CatalogProduct;

describe('productApi', () => {
    it('asks for the largest page the API allows, with the filters it was given', async () => {
        await productApi.list({ category: 'paper-craft', sort: 'price-asc' });
        expect(calls[0]?.path).toBe(
            '/products?category=paper-craft&sort=price-asc&limit=60&page=1'
        );

        await productApi.list({ page: 4 });
        // The caller's own page is ignored: paging belongs to the client below.
        expect(calls[1]?.path).toBe('/products?limit=60&page=1');
    });

    it('walks every page so the shop is not cut off at sixty products', async () => {
        respond = (path) =>
            path.includes('page=1')
                ? Array.from({ length: 60 }, (_, index) => product(`p-${index}`))
                : [product('last')];

        const products = await productApi.list();

        expect(products).toHaveLength(61);
        expect(calls.map((call) => call.path)).toEqual([
            '/products?limit=60&page=1',
            '/products?limit=60&page=2',
        ]);
    });

    it('escapes a product id in the path', async () => {
        await productApi.get('rose gold/shimmer');
        expect(calls[0]?.path).toBe('/products/rose%20gold%2Fshimmer');
    });

    it('reads the admin listing with visibility=all and the token', async () => {
        await productApi.adminList();
        expect(calls[0]?.path).toBe('/admin/products?visibility=all&limit=60&page=1');
        expect(calls[0]?.authorization).toBe('Bearer access-1');
    });

    it('creates, patches and deletes on the admin routes', async () => {
        await productApi.create({
            name: 'Paper Pack',
            sku: 'WB-PAPER-014',
            brand: 'PaperCraft',
            category: 'paper-craft',
            price: 249,
            mrp: 399,
            image: 'https://example.test/a.jpg',
            description: 'Hand-pressed decorative paper.',
        });

        await productApi.update('paper pack', { price: 199, hidden: true });
        await productApi.remove('paper pack');

        expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
            'POST /admin/products',
            'PATCH /admin/products/paper%20pack',
            'DELETE /admin/products/paper%20pack',
        ]);
        expect(calls[1]?.body).toEqual({ price: 199, hidden: true });
        expect(calls.every((call) => call.authorization === 'Bearer access-1')).toBe(true);
    });

    it('opens a category with just a label', async () => {
        await productApi.createCategory('Gift Wrapping');
        expect(calls[0]?.method).toBe('POST');
        expect(calls[0]?.path).toBe('/admin/categories');
        expect(calls[0]?.body).toEqual({ label: 'Gift Wrapping' });
    });

    it('reads categories and coupons without a token', async () => {
        await productApi.categories();
        await productApi.coupons();

        expect(calls.map((call) => call.path)).toEqual(['/categories', '/coupons']);
        expect(calls.every((call) => call.authorization === undefined)).toBe(true);
    });
});
