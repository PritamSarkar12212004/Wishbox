import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertStore } from '@/global/site/alertStore';
import { footerStore } from '@/global/site/footerStore';
import { contactStore } from '@/modules/contact/store/contactStore';
import { homeStore } from '@/modules/home/store/homeStore';
import {
    siteContentApi,
    type SiteContent,
    type SiteContentPatch,
} from './siteContentApi';

/**
 * Website content hooks.
 *
 * One query key serves the whole site: the home hero, the alert strip, the
 * footer, the contact page and the admin editors all read the same object, so a
 * save invalidates every one of them at once. The stores are hydrated alongside the cache
 * because the storefront renders them synchronously on first paint.
 */

export const siteContentKeys = {
    all: ['site-content'] as const,
};

/** Copies server content into the synchronous stores the pages read. */
export function hydrateSiteContent(content: SiteContent): void {
    homeStore.hydrate(content.home);
    alertStore.hydrate(content.alert);
    footerStore.hydrate(content.footer);
    contactStore.hydrate(content.contact);
}

export function useSiteContentQuery() {
    return useQuery({
        queryKey: siteContentKeys.all,
        queryFn: siteContentApi.get,
        // A content edit is rare and the shipped defaults are a safe fallback,
        // so a failed read should not retry forever or block the page.
        retry: 1,
        staleTime: 5 * 60_000,
    });
}

/**
 * Loads the content once for the storefront chrome.
 *
 * Rendered inside `QueryClientProvider` at the app root. It draws nothing: the
 * header, footer and contact page render the shipped defaults until this
 * resolves, then re-render from the API's answer.
 */
export function SiteContentSync() {
    const query = useSiteContentQuery();

    useEffect(() => {
        if (query.data) hydrateSiteContent(query.data);
    }, [query.data]);

    return null;
}

/** Saves whole sections (or resets one) and refreshes every reader. */
export function useUpdateSiteContent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (patch: SiteContentPatch) => siteContentApi.update(patch),
        onSuccess: (content) => {
            hydrateSiteContent(content);
            queryClient.setQueryData(siteContentKeys.all, content);
        },
    });
}
