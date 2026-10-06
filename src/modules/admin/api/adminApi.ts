import { authedRequest } from '@/modules/auth/api/authApi';
import type { ApiUser } from '@/modules/auth/api/authApi';
import type {
    AdminDataset,
    AdminOrder,
    AdminOrderStatus,
    AdminReturn,
    CancellationReason,
    ModeratedReview,
    ReturnStatus,
} from '../data/adminData';
import type { AdminSettings } from '../store/settingsStore';

/**
 * The admin endpoints, one function per route.
 *
 * Every call goes through `authedRequest`, so it carries the signed-in token
 * and gets the same single silent refresh on an expired one. Authorisation is
 * the server's call: a number that is not on the `ADMIN_PHONES` allowlist is
 * answered with a 403 no matter what this client believes.
 */

/** `GET /admin/session` — proof, from the API, that this account is an admin. */
export type AdminSession = {
    user: ApiUser;
    isAdmin: boolean;
};

/**
 * Everything an admin can change on a placed order.
 *
 * The audit timestamps (`approvedAt`, `cancelledAt`, `refundedAt`) and who did
 * it are absent on purpose: the API stamps those itself, so a client cannot
 * backdate an approval or attribute one to somebody else.
 */
export type AdminOrderPatch = {
    status?: AdminOrderStatus;
    courier?: string;
    trackingId?: string;
    cancellationReason?: CancellationReason;
    /** Proof of the refund that was processed - a data URL or a hosted URL. */
    refundScreenshot?: string;
};

/** A reply to publish, or `null` to take an earlier one down. */
export type AdminReviewPatch = {
    status?: ModeratedReview['status'];
    reply?: { message: string } | null;
};

const orderPath = (id: string) => `/admin/orders/${encodeURIComponent(id)}`;
const returnPath = (id: string) => `/admin/returns/${encodeURIComponent(id)}`;
const reviewPath = (id: string) => `/admin/reviews/${encodeURIComponent(id)}`;

export const adminApi = {
    session(): Promise<AdminSession> {
        return authedRequest<AdminSession>('/admin/session');
    },

    /** The whole panel in one round trip: see the backend's `GET /admin/dataset`. */
    dataset(): Promise<AdminDataset> {
        return authedRequest<AdminDataset>('/admin/dataset');
    },

    updateOrder(id: string, patch: AdminOrderPatch): Promise<AdminOrder> {
        return authedRequest<AdminOrder>(orderPath(id), { method: 'PATCH', body: patch });
    },

    updateReturn(id: string, status: ReturnStatus): Promise<AdminReturn> {
        return authedRequest<AdminReturn>(returnPath(id), { method: 'PATCH', body: { status } });
    },

    updateReview(id: string, patch: AdminReviewPatch): Promise<ModeratedReview> {
        return authedRequest<ModeratedReview>(reviewPath(id), { method: 'PATCH', body: patch });
    },

    deleteReview(id: string): Promise<void> {
        return authedRequest<void>(reviewPath(id), { method: 'DELETE' });
    },

    settings(): Promise<AdminSettings> {
        return authedRequest<AdminSettings>('/admin/settings');
    },

    /** Partial: the API merges what it is given and returns the whole object. */
    updateSettings(patch: Partial<AdminSettings>): Promise<AdminSettings> {
        return authedRequest<AdminSettings>('/admin/settings', { method: 'PATCH', body: patch });
    },
};
