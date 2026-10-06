import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';
import { authStore, useIsSignedIn } from '../store/authStore';
import { authApi, toIdentity, toSession } from './authApi';

/**
 * The auth hooks every screen uses.
 *
 * They own the one thing components should not have to remember: a successful
 * verify writes the session into the store, and a sign-out empties both the
 * store and the query cache, so no cached answer survives the sign-out.
 */

/** Query keys for this module, in one place so nothing has to guess a string. */
export const authKeys = {
    me: ['auth', 'me'] as const,
};

/**
 * The signed-in shopper, revalidated against the API.
 *
 * Mounted once at app level (see `AuthSessionSync`). It is what turns a stored
 * token into a known-good session on load, and what notices a name that was
 * changed on another device. A 401 it cannot recover from means the session is
 * dead, so the store is emptied rather than left half-signed-in.
 */
export function useCurrentUser() {
    const signedIn = useIsSignedIn();

    return useQuery({
        queryKey: authKeys.me,
        enabled: signedIn,
        queryFn: async () => {
            try {
                const user = await authApi.me();
                authStore.syncIdentity(toIdentity(user));
                return user;
            } catch (error) {
                // The wrapper already tried a refresh; a 401 here is final.
                if (error instanceof ApiError && error.isUnauthorized) authStore.signOut();
                throw error;
            }
        },
    });
}

/** Step 1: send (or resend) the WhatsApp code. */
export function useRequestOtp() {
    return useMutation({
        mutationFn: (input: { phone: string; name?: string }) => authApi.requestOtp(input),
    });
}

/** Step 2: verify the code. A success is what signs the shopper in. */
export function useVerifyOtp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { phone: string; code: string; name?: string }) =>
            authApi.verifyOtp(input),
        onSuccess: (result) => {
            authStore.setSession(toSession(result));
            // Seed the cache with the record we were just handed, so the header
            // shows the shopper without a second round trip.
            queryClient.setQueryData(authKeys.me, result.user);
        },
    });
}

/** Renames the signed-in shopper in the API, then in the store. */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: { name: string }) => authApi.updateProfile(input),
        onSuccess: (user) => {
            queryClient.setQueryData(authKeys.me, user);
            authStore.syncIdentity(toIdentity(user));
        },
    });
}

/**
 * Signs out now, revokes on the server in the background.
 *
 * The local session is dropped first: a sign-out must not wait on a round trip,
 * and the tokens are unusable from this device the moment they are gone. If the
 * revocation request fails the server session simply expires on its own, which
 * is why the failure is not surfaced - there is nothing left to do about it.
 */
export function useSignOut() {
    const queryClient = useQueryClient();

    return (options: { allDevices?: boolean } = {}): void => {
        const current = authStore.getSession();

        authStore.signOut();
        queryClient.clear();

        if (!current) return;

        void authApi
            .logout({
                accessToken: current.accessToken,
                refreshToken: current.refreshToken,
                allDevices: options.allDevices,
            })
            .catch(() => undefined);
    };
}
