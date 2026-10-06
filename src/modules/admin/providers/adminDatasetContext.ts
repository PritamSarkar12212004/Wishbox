import { createContext, useContext } from 'react';
import type { AdminDataset } from '../data/adminData';

/**
 * The loaded admin dataset.
 *
 * It lives in a context rather than being fetched per screen because every
 * dashboard derives its figures from the whole year of history: one fetch
 * serves the entire panel, and a mutation updates it in place (see
 * `api/useAdmin`). `null` means "not loaded", which the provider guarantees
 * cannot be observed by anything it renders.
 */
export const AdminDatasetContext = createContext<AdminDataset | null>(null);

export function useAdminDatasetValue(): AdminDataset {
    const dataset = useContext(AdminDatasetContext);

    if (!dataset) {
        throw new Error('useAdminDatasetValue must be used inside AdminDataProvider');
    }

    return dataset;
}
