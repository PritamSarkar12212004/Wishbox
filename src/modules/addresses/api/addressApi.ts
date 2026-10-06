import { authedRequest } from '@/modules/auth/api/authApi';
import type { AddressDraft, DeliveryAddress } from '../data/addressData';

/**
 * The address-book endpoints, one function per route.
 *
 * Every call goes through `authedRequest`, so it carries the signed-in token,
 * gets the same single silent refresh on an expired one, and never reaches the
 * network at all without a session. Ownership is the server's call: a query it
 * cannot find for *this* shopper is a 404, so there is nothing here to keep in
 * step with who is asking.
 *
 * The requests send the address *parts* - never one formatted string - because
 * the parts are what the server stores and what the form edits.
 */

const addressPath = (id: string) => `/addresses/${encodeURIComponent(id)}`;

export const addressApi = {
    /** All of this shopper's addresses, newest first. */
    list(): Promise<DeliveryAddress[]> {
        return authedRequest<DeliveryAddress[]>('/addresses');
    },

    /** Saves a new address. Answers 201 with the stored (state-canonicalised) row. */
    create(draft: AddressDraft): Promise<DeliveryAddress> {
        return authedRequest<DeliveryAddress>('/addresses', { method: 'POST', body: draft });
    },

    /**
     * Changes only the fields given.
     *
     * A blank `address2` is a real instruction - it is how the form clears the
     * second line - so it is passed through rather than dropped as empty.
     */
    update(id: string, patch: Partial<AddressDraft>): Promise<DeliveryAddress> {
        return authedRequest<DeliveryAddress>(addressPath(id), { method: 'PATCH', body: patch });
    },

    remove(id: string): Promise<void> {
        return authedRequest<void>(addressPath(id), { method: 'DELETE' });
    },
};
