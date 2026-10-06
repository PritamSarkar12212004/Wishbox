import { useMemo, useState } from 'react';
import type { AdminDataset, AdminOrder, AdminReturn, ModeratedReview } from '../data/adminData';
import {
    buildOrderIndex,
    resolveRange,
    type DateRange,
    type OrderIndex,
    type RangeKey,
} from '../lib/analytics';
import { useAdminDatasetValue } from '../providers/adminDatasetContext';
import { useLiveOrders } from '../store/adminOrdersStore';

/**
 * The panel's read layer.
 *
 * Everything comes from the dataset the provider loaded, except the orders
 * placed in this browser, which are merged in on top. That means a screen never
 * fetches: it reads the one dataset the API handed over and derives from it,
 * which is what lets the dashboards chart a full year without paging.
 */

export function useAdminDataset(): AdminDataset {
    return useAdminDatasetValue();
}

/** The server's orders, newest first, with this browser's own merged in. */
export function useAdminOrders(): AdminOrder[] {
    const dataset = useAdminDataset();
    const live = useLiveOrders();

    return useMemo(
        () => [...live, ...dataset.orders].sort((a, b) => b.placedAt - a.placedAt),
        [live, dataset.orders]
    );
}

export function useAdminReturns(): AdminReturn[] {
    return useAdminDataset().returns;
}

export function useAdminReviews(): ModeratedReview[] {
    return useAdminDataset().reviews;
}

export type AdminFeed = {
    dataset: AdminDataset;
    orders: AdminOrder[];
    returns: AdminReturn[];
    index: OrderIndex;
};

export function useAdminFeed(): AdminFeed {
    const dataset = useAdminDataset();
    const orders = useAdminOrders();
    const returns = useAdminReturns();
    const index = useMemo(() => buildOrderIndex(orders), [orders]);

    return { dataset, orders, returns, index };
}

export function useAdminRange(initial: RangeKey = '30d') {
    const [now] = useState(() => Date.now());
    const [key, setKey] = useState<RangeKey>(initial);
    const [custom, setCustom] = useState<DateRange | undefined>();

    const range = useMemo(() => resolveRange(key, now, custom), [key, custom, now]);

    return { now, key, setKey, custom, setCustom, range };
}
