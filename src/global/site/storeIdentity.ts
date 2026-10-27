/**
 * The store's display name — one value for the whole app.
 *
 * It lives in the website content (`footer.storeName`), which the admin edits
 * on Settings and on Website → Footer and which `GET /content` serves to every
 * visitor, so the header, the footer, page titles and the catalogue PDF all
 * read the same string instead of each hardcoding the brand. The storefront
 * copy is the synchronous mirror `SiteContentSync` hydrates on load.
 */

import { DEFAULT_FOOTER_CONTENT } from './footerContent';
import { footerStore, useFooterContent } from './footerStore';

/** The saved name, or the shipped one while the content is empty or unfetched. */
export function storeNameSnapshot(): string {
    return footerStore.getSnapshot().storeName.trim() || DEFAULT_FOOTER_CONTENT.storeName;
}

/** React binding for the components that render the name. */
export function useStoreName(): string {
    return useFooterContent().storeName.trim() || DEFAULT_FOOTER_CONTENT.storeName;
}
