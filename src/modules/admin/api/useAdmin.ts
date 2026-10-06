import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import type { AdminDataset, AdminOrder, AdminReturn, ModeratedReview } from '../data/adminData';
import { adminSettingsStore, type AdminSettings } from '../store/settingsStore';
import { liveOrderOverride, isLiveOrder } from '../store/adminOrdersStore';
import { adminApi, type AdminOrderPatch, type AdminReviewPatch, type AdminSession } from './adminApi';

/**
 * The admin hooks.
 *
 * Two habits are baked in here so no screen has to remember them:
 *
 *  - **A mutation updates the cached dataset in place** with the row the API
 *    returned. The dataset is megabytes wide, so refetching it after every
 *    status change would be the slowest thing the panel does.
 *  - **Settings are mirrored into the local store.** They are the one thing
 *    the storefront reads synchronously (the low-stock threshold), so the
 *    server value has to land in the browser's copy, not only in the cache.
 */

export const adminKeys = {
    session: ['admin', 'session'] as const,
    dataset: ['admin', 'dataset'] as const,
    settings: ['admin', 'settings'] as const,
};

/**
 * Does the API consider this account an admin?
 *
 * The panel is opened by this answer, not by the role the client has in
 * storage, so a number that was removed from the allowlist loses the panel on
 * its next visit. A 403 is a decision rather than a blip, so it is not retried.
 */
export function useAdminSession() {
    const signedIn = useIsSignedIn();

    return useQuery({
        queryKey: adminKeys.session,
        enabled: signedIn,
        retry: false,
        staleTime: 5 * 60_000,
        queryFn: () => adminApi.session(),
    });
}

/** The dataset. Only mounted behind the gate, so it always runs when it exists. */
export function useAdminDatasetQuery() {
    return useQuery({
        queryKey: adminKeys.dataset,
        queryFn: () => adminApi.dataset(),
        // Heavy and slow-moving: fetched once per visit and then kept current by
        // the mutations below instead of refetching on every navigation.
        staleTime: 10 * 60_000,
        gcTime: 60 * 60_000,
    });
}

export function useAdminSettingsQuery() {
    return useQuery({
        queryKey: adminKeys.settings,
        queryFn: () => adminApi.settings(),
        staleTime: 10 * 60_000,
    });
}

/** Rewrites one row of the cached dataset, without a refetch. */
function usePatchDataset() {
    const queryClient = useQueryClient();

    return (updater: (dataset: AdminDataset) => AdminDataset) => {
        queryClient.setQueryData<AdminDataset>(adminKeys.dataset, (current) =>
            current ? updater(current) : current
        );
    };
}

export function useUpdateOrder() {
    const patchDataset = usePatchDataset();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            patch,
        }: {
            id: string;
            patch: AdminOrderPatch;
        }): Promise<AdminOrder | null> => {
            /*
             * An order placed on this storefront in this browser only exists in
             * this browser, so there is nothing on the server to patch. Its
             * status goes to the storefront's own store and the admin-only
             * fields are kept as a local override, exactly as before.
             */
            if (isLiveOrder(id)) {
                // No server will stamp the approval, so the admin doing it is
                // taken from the session the panel already loaded.
                const actor =
                    queryClient.getQueryData<AdminSession>(adminKeys.session)?.user.name ?? 'Admin';
                liveOrderOverride.apply(id, patch, actor);
                return Promise.resolve(null);
            }
            return adminApi.updateOrder(id, patch);
        },
        onSuccess: (order) => {
            if (!order) return;
            patchDataset((dataset) => ({
                ...dataset,
                orders: dataset.orders.map((entry) => (entry.id === order.id ? order : entry)),
            }));
        },
    });
}

export function useUpdateReturn() {
    const patchDataset = usePatchDataset();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: AdminReturn['status'] }) =>
            adminApi.updateReturn(id, status),
        onSuccess: (entry: AdminReturn) => {
            patchDataset((dataset) => ({
                ...dataset,
                returns: dataset.returns.map((row) => (row.id === entry.id ? entry : row)),
            }));
        },
    });
}

export function useUpdateReview() {
    const patchDataset = usePatchDataset();

    return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: AdminReviewPatch }) =>
            adminApi.updateReview(id, patch),
        onSuccess: (review: ModeratedReview) => {
            patchDataset((dataset) => ({
                ...dataset,
                reviews: dataset.reviews.map((row) => (row.id === review.id ? review : row)),
            }));
        },
    });
}

export function useDeleteReview() {
    const patchDataset = usePatchDataset();

    return useMutation({
        mutationFn: (id: string) => adminApi.deleteReview(id),
        onSuccess: (_result, id) => {
            patchDataset((dataset) => ({
                ...dataset,
                reviews: dataset.reviews.filter((row) => row.id !== id),
            }));
        },
    });
}

/**
 * Saves a settings change to the server, keeping the local store in step.
 *
 * The local store is written first because it is the copy the storefront reads
 * synchronously, and the previous value is put back if the server refuses the
 * change - so the screen can never end up showing a setting that was not saved.
 */
export function useUpdateSettings() {
    return useMutation({
        mutationFn: async (patch: Partial<AdminSettings>) => {
            const previous = adminSettingsStore.getSnapshot();
            adminSettingsStore.update(patch);

            try {
                return await adminApi.updateSettings(patch);
            } catch (error) {
                adminSettingsStore.update(previous);
                throw error;
            }
        },
        onSuccess: (settings: AdminSettings) => {
            adminSettingsStore.hydrate(settings);
        },
    });
}
