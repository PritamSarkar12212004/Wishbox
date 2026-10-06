import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

/**
 * The app's single query cache.
 *
 * Retries are deliberately narrow: an API that answered with a rejection will
 * answer the same way again, so only a request that never arrived is retried.
 * Without that rule a wrong OTP would be sent three times.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Storefront data changes slowly; a minute of freshness keeps
            // navigation from re-fetching on every mount.
            staleTime: 60_000,
            gcTime: 30 * 60_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
                if (error instanceof ApiError && !error.isNetworkError) return false;
                return failureCount < 2;
            },
        },
        mutations: {
            // A mutation is a user action: they can see it fail and retry.
            retry: false,
        },
    },
});
