import { useQuery } from '@tanstack/react-query';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import { quotationApi } from './quotationApi';

/**
 * Quotation hooks.
 *
 * `useQuotationDefaults` is what makes the second request effortless: it reads
 * the buyer details of the shopper's last quotation, so the form opens with the
 * name, number and address they used before. Editing them and sending again is
 * itself the update - the new quotation becomes the next default.
 */

export const quotationKeys = {
    config: ['quotations', 'config'] as const,
    defaults: ['quotations', 'defaults'] as const,
    mine: ['quotations', 'mine'] as const,
};

export function useQuotationConfig() {
    return useQuery({
        queryKey: quotationKeys.config,
        queryFn: () => quotationApi.config(),
        staleTime: 60_000,
    });
}

export function useQuotationDefaults(enabled = true) {
    return useQuery({
        queryKey: quotationKeys.defaults,
        enabled,
        queryFn: () => quotationApi.defaults(),
        // Always fresh: the previous send is exactly what this answers.
        staleTime: 0,
    });
}

/** The signed-in shopper's own quotation history, newest first. */
export function useMyQuotations() {
    const signedIn = useIsSignedIn();

    return useQuery({
        queryKey: quotationKeys.mine,
        enabled: signedIn,
        queryFn: () => quotationApi.list(),
    });
}
