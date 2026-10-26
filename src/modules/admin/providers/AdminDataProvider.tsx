import { useEffect, type ReactNode } from 'react';
import AdminUnavailable from '../components/AdminUnavailable';
import { AdminShellSkeleton } from '../components/AdminSkeleton';
import { useAdminDatasetQuery, useAdminSettingsQuery } from '../api/useAdmin';
import { useSiteContentQuery } from '@/modules/site/api/useSiteContent';
import { adminSettingsStore } from '../store/settingsStore';
import { AdminDatasetContext } from './adminDatasetContext';

/**
 * Loads the panel's data once, then hands it to every screen below.
 *
 * Three things are fetched together: the dataset (which the dashboards derive
 * all their figures from), the store settings and the website content. The
 * settings are mirrored into the local store rather than only kept in the
 * cache, because the storefront reads them synchronously for its low-stock
 * treatment; the content editors mount only once its saved value is in hand, so
 * a draft never starts from the shipped defaults and saves over real content.
 *
 * Nothing below this point renders until both are in hand, so no screen has to
 * handle a half-loaded panel.
 */
export default function AdminDataProvider({ children }: { children: ReactNode }) {
    const datasetQuery = useAdminDatasetQuery();
    const settingsQuery = useAdminSettingsQuery();
    const contentQuery = useSiteContentQuery();
    const settings = settingsQuery.data;

    useEffect(() => {
        if (settings) adminSettingsStore.hydrate(settings);
    }, [settings]);

    const error = datasetQuery.error ?? settingsQuery.error ?? contentQuery.error;

    if (error) {
        return (
            <AdminUnavailable
                error={error}
                onRetry={() => {
                    void datasetQuery.refetch();
                    void settingsQuery.refetch();
                    void contentQuery.refetch();
                }}
            />
        );
    }

    if (!datasetQuery.data || !settings || !contentQuery.data) {
        return <AdminShellSkeleton />;
    }

    return (
        <AdminDatasetContext.Provider value={datasetQuery.data}>{children}</AdminDatasetContext.Provider>
    );
}
