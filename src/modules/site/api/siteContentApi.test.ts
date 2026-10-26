import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authStore, type Session } from '@/modules/auth/store/authStore';
import { alertStore } from '@/global/site/alertStore';
import { footerStore } from '@/global/site/footerStore';
import { contactStore } from '@/modules/contact/store/contactStore';
import { DEFAULT_ALERT_CONTENT } from '@/global/site/alertContent';
import { DEFAULT_FOOTER_CONTENT } from '@/global/site/footerContent';
import { DEFAULT_CONTACT_CONTENT } from '@/modules/contact/data/contactContent';
import { siteContentApi, type SiteContent } from './siteContentApi';
import { hydrateSiteContent } from './useSiteContent';

/**
 * The website content contract: one public read, an admin-protected write, and
 * a response that lands in the three synchronous stores the pages read.
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

const content: SiteContent = {
    alert: { ...DEFAULT_ALERT_CONTENT, phone: '+91 90000 00000' },
    footer: { ...DEFAULT_FOOTER_CONTENT, storeName: 'Paper & Post' },
    contact: {
        ...DEFAULT_CONTACT_CONTENT,
        hero: { ...DEFAULT_CONTACT_CONTENT.hero, title: 'Talk to the studio' },
    },
};

beforeEach(() => {
    calls = [];
    authStore.setSession(session);
    alertStore.reset();
    footerStore.reset();
    contactStore.reset();

    vi.stubGlobal(
        'fetch',
        vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const headers = init?.headers as Record<string, string> | undefined;
            calls.push({
                method: init?.method ?? 'GET',
                path: pathOf(String(input)),
                body: init?.body ? JSON.parse(String(init.body)) : undefined,
                authorization: headers?.authorization,
            });
            return Promise.resolve(json(ok(content)));
        })
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    authStore.signOut();
});

describe('siteContentApi', () => {
    it('reads the content publicly', async () => {
        const result = await siteContentApi.get();

        expect(result.footer.storeName).toBe('Paper & Post');
        expect(calls[0]).toMatchObject({ method: 'GET', path: '/content' });
        expect(calls[0]?.authorization).toBeUndefined();
    });

    it('writes whole sections through the admin route with the token', async () => {
        await siteContentApi.update({ footer: content.footer, reset: ['alert'] });

        expect(calls[0]?.method).toBe('PATCH');
        expect(calls[0]?.path).toBe('/admin/content');
        expect(calls[0]?.body).toEqual({ footer: content.footer, reset: ['alert'] });
        expect(calls[0]?.authorization).toBe('Bearer access-1');
    });
});

describe('hydrateSiteContent', () => {
    it('fills all three stores from the server response', () => {
        hydrateSiteContent(content);

        expect(alertStore.getSnapshot().phone).toBe('+91 90000 00000');
        expect(footerStore.getSnapshot().storeName).toBe('Paper & Post');
        expect(contactStore.getSnapshot().hero.title).toBe('Talk to the studio');
    });
});
