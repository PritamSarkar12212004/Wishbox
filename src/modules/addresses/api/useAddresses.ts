import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import type { AddressDraft } from '../data/addressData';
import { addressApi } from './addressApi';

/**
 * The address-book hooks.
 *
 * The list is one query key, and every mutation writes the row the API handed
 * back into that cached list instead of refetching. That matters during
 * checkout: the address a shopper has just typed is usable immediately, and the
 * screen never flickers back to a spinner it did not need.
 */

export const addressKeys = {
    list: ['addresses', 'list'] as const,
};

/** The signed-in shopper's addresses; idle until there is an account. */
export function useAddresses(options: { enabled?: boolean } = {}) {
    const signedIn = useIsSignedIn();

    return useQuery({
        queryKey: addressKeys.list,
        enabled: signedIn && (options.enabled ?? true),
        queryFn: () => addressApi.list(),
    });
}

/** Saves a new address, then puts it at the top of the cached list. */
export function useCreateAddress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (draft: AddressDraft) => addressApi.create(draft),
        onSuccess: (created) => {
            queryClient.setQueryData(addressKeys.list, (current: unknown) =>
                Array.isArray(current) ? [created, ...current] : [created]
            );
        },
    });
}

/** Edits an address in place - the cached row is replaced with the saved one. */
export function useUpdateAddress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: Partial<AddressDraft> }) =>
            addressApi.update(id, patch),
        onSuccess: (updated) => {
            queryClient.setQueryData(addressKeys.list, (current: unknown) =>
                Array.isArray(current)
                    ? current.map((row) =>
                          row && typeof row === 'object' && (row as { id?: string }).id === updated.id
                              ? updated
                              : row
                      )
                    : [updated]
            );
        },
    });
}

/** Removes an address and drops it from the cached list. */
export function useDeleteAddress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => addressApi.remove(id),
        onSuccess: (_removed, id) => {
            queryClient.setQueryData(addressKeys.list, (current: unknown) =>
                Array.isArray(current)
                    ? current.filter(
                          (row) => !row || typeof row !== 'object' || (row as { id?: string }).id !== id
                      )
                    : current
            );
        },
    });
}
