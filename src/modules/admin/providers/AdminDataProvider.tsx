import { useEffect, type ReactNode } from 'react';
import AdminUnavailable from '../components/AdminUnavailable';
import { AdminShellSkeleton } from '../components/AdminSkeleton';
import { useAdminDatasetQuery, useAdminSettingsQuery } from '../api/useAdmin';
import { adminSettingsStore } from '../store/settingsStore';
import { AdminDatasetContext } from './adminDatasetContext';

/**
 * Loads the panel's data once, then hands it to every screen below.
 *
 * Two things are fetched together: the dataset (which the dashboards derive all
 * their figures from) and the store settings. The settings are mirrored into
 * the local store rather than only kept in the cache, because the storefront
 * reads them synchronously for its low-stock treatment.
 *
 * Nothing below this point renders until both are in hand, so no screen has to
 * handle a half-loaded panel.
 */
export default function AdminDataProvider({ children }: { children: ReactNode }) {
    const datasetQuery = useAdminDatasetQuery();
    const settingsQuery = useAdminSettingsQuery();
    const settings = settingsQuery.data;

    useEffect(() => {
        if (settings) adminSettingsStore.hydrate(settings);
    }, [settings]);

    const error = datasetQuery.error ?? settingsQuery.error;

    if (error) {
        return (
            <AdminUnavailable
                error={error}
                onRetry={() => {
                    void datasetQuery.refetch();
                    void settingsQuery.refetch();
                }}
            />
        );
    }

    if (!datasetQuery.data || !settings) {
        return <AdminShellSkeleton />;
    }

    return (
        <AdminDatasetContext.Provider value={datasetQuery.data}>{children}</AdminDatasetContext.Provider>
    );
}
