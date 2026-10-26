import { API_BASE_URL } from '@/lib/api/client';

/**
 * Where a category's catalogue actually lives.
 *
 * Two kinds of record share one field: an admin who uploaded a file gets a path
 * on our own API (`/categories/paper-craft/catalogue/file`), while an admin who
 * pasted a hosted link stores it absolute. Resolving here means a component can
 * use the value straight in an `href` and both kinds work - on localhost and in
 * production - without the API having to know its own public URL.
 */
export function catalogueHref(catalogue: { url?: string } | undefined): string | undefined {
    const url = catalogue?.url?.trim();
    if (!url) return undefined;
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
}
