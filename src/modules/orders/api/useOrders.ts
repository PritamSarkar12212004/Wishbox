import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsSignedIn } from '@/modules/auth/store/authStore';
import { orderApi, type PlaceOrderInput } from './orderApi';

/**
 * Order hooks.
 *
 * Placing an order invalidates both the shopper's history and the admin's
 * dataset: the two read the same collection, and a stale panel that cannot see
 * a brand-new order is exactly the failure this replaces.
 */

export const orderKeys = {
    all: ['orders'] as const,
    list: ['orders', 'mine'] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    returns: ['returns', 'mine'] as const,
};

export function useMyOrders() {
    const signedIn = useIsSignedIn();
    return useQuery({
        queryKey: orderKeys.list,
        queryFn: () => orderApi.list(),
        enabled: signedIn,
    });
}

export function useMyReturns() {
    const signedIn = useIsSignedIn();
    return useQuery({
        queryKey: orderKeys.returns,
        queryFn: () => orderApi.returns(),
        enabled: signedIn,
    });
}

export function usePlaceOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: PlaceOrderInput) => orderApi.place(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.all });
            // The admin panel charts the same rows.
            void queryClient.invalidateQueries({ queryKey: ['admin', 'dataset'] });
        },
    });
}

export function useRequestReturn() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { orderId: string; reason: Parameters<typeof orderApi.requestReturn>[0]['reason']; note?: string }) =>
            orderApi.requestReturn(input),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: orderKeys.returns });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all });
            void queryClient.invalidateQueries({ queryKey: ['admin', 'dataset'] });
        },
    });
}
