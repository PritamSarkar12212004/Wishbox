import { apiRequest } from '@/lib/api/client';
import { authedRequest } from '@/modules/auth/api/authApi';
import type { AlertContent } from '@/global/site/alertContent';
import type { FooterContent } from '@/global/site/footerContent';
import type { ContactContent } from '@/modules/contact/data/contactContent';
import type { HomeContent } from '@/modules/home/data/homeContent';

/**
 * The website content API.
 *
 * One object holds the sections the admin's Website screens edit: the home
 * hero, the alert strip, the footer and the contact page. Reading is public —
 * the content is the same for every visitor — and writing goes through the
 * admin gate.
 */

export type SiteContent = {
    home: HomeContent;
    alert: AlertContent;
    footer: FooterContent;
    contact: ContactContent;
};

export type SiteContentSection = keyof SiteContent;

export type SiteContentPatch = {
    /** Whole sections, as the admin screens save them. */
    home?: HomeContent;
    alert?: AlertContent;
    footer?: FooterContent;
    contact?: ContactContent;
    /** Sections to restore to the shipped content. */
    reset?: SiteContentSection[];
};

export const siteContentApi = {
    get(): Promise<SiteContent> {
        return apiRequest<SiteContent>('/content');
    },

    update(patch: SiteContentPatch): Promise<SiteContent> {
        return authedRequest<SiteContent>('/admin/content', { method: 'PATCH', body: patch });
    },
};
