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

/* ------------------------------------------------------------------ */
/*  Enquiries                                                          */
/* ------------------------------------------------------------------ */

/** One message the storefront sent through the footer card or Contact page. */
export type AdminEnquiry = {
    id: string;
    kind: 'footer' | 'contact';
    name: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
    read: boolean;
    readAt: string | null;
    /** Whether the WhatsApp template reached the gateway. */
    delivered: boolean;
    createdAt: string;
};

export type AdminEnquiryPage = {
    items: AdminEnquiry[];
    total: number;
    unread: number;
    page: number;
    pages: number;
};

/* ------------------------------------------------------------------ */
/*  Quotations                                                         */
/* ------------------------------------------------------------------ */

/** One priced line of a bulk quotation. */
export type AdminQuotationLine = {
    productId: string;
    name: string;
    brand: string;
    hsn: string;
    unit: string;
    qty: number;
    rate: number;
    amount: number;
};

/**
 * A quotation request from the cart, priced by the server.
 *
 * `pdfUrl` is the hosted PDF the buyer and the shop were messaged; `whatsapp`
 * records whether each copy reached the gateway, so a failed message is visible
 * here instead of being guessed at.
 */
export type AdminQuotation = {
    id: string;
    quotationNumber: string;
    status: 'pending' | 'approved' | 'rejected';
    customer: { name: string; phone: string; address: string };
    items: AdminQuotationLine[];
    subtotal: number;
    cgstRate: number;
    cgst: number;
    sgstRate: number;
    sgst: number;
    total: number;
    amountInWords: string;
    pdfUrl: string;
    date: string;
    createdAt: string;
    reviewedAt: string | null;
    whatsapp: {
        admin: { sent: boolean; error?: string };
        customer: { sent: boolean; error?: string };
    };
    note?: string;
};

export type AdminQuotationPage = {
    items: AdminQuotation[];
    total: number;
    pending: number;
    page: number;
    pages: number;
};

export type QuotationReviewInput = {
    status: 'approved' | 'rejected';
    /** Stored on the quotation when the shop decides. */
    note?: string;
};

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
    /* Enquiries: the storefront's footer card and Contact page messages. */
    listEnquiries(params: { status?: 'all' | 'unread'; page?: number } = {}): Promise<AdminEnquiryPage> {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.page) query.set('page', String(params.page));
        const suffix = query.toString();
        return authedRequest<AdminEnquiryPage>(`/admin/enquiries${suffix ? `?${suffix}` : ''}`);
    },

    markEnquiryRead(id: string, read: boolean): Promise<AdminEnquiry> {
        return authedRequest<AdminEnquiry>(`/admin/enquiries/${id}/read`, {
            method: 'PATCH',
            body: { read },
        });
    },

    markAllEnquiriesRead(): Promise<{ updated: number }> {
        return authedRequest<{ updated: number }>('/admin/enquiries/read-all', { method: 'POST' });
    },

    /** Bulk quotation requests: newest first, optionally filtered by status. */
    listQuotations(
        params: { status?: 'all' | 'pending' | 'approved' | 'rejected'; page?: number } = {}
    ): Promise<AdminQuotationPage> {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.page) query.set('page', String(params.page));
        const suffix = query.toString();
        return authedRequest<AdminQuotationPage>(
            `/admin/quotations${suffix ? `?${suffix}` : ''}`
        );
    },

    /** Approve or reject one quotation; the API stamps who decided and when. */
    reviewQuotation(id: string, input: QuotationReviewInput): Promise<AdminQuotation> {
        return authedRequest<AdminQuotation>(`/admin/quotations/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: input,
        });
    },

    updateSettings(patch: Partial<AdminSettings>): Promise<AdminSettings> {
        return authedRequest<AdminSettings>('/admin/settings', { method: 'PATCH', body: patch });
    },
};
