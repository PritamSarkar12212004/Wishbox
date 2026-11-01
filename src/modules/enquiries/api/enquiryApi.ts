import { authedRequest } from '@/modules/auth/api/authApi';

/**
 * The footer's WhatsApp enquiry.
 *
 * The shop number, the approved template id and the gateway token all live on
 * the server, so the browser only says which number to reply to. The name in
 * the message comes from the signed-in account rather than a typed field, which
 * is why the card is account-gated.
 */
/** What the Contact page's message form sends. */
export type ContactEnquiryInput = {
    name: string;
    email?: string;
    phone?: string;
    /** The chosen topic's label, e.g. "Order or delivery help". */
    subject: string;
    message: string;
    consent: boolean;
};

export const enquiryApi = {
    /** The footer's number-only enquiry. */
    send(phone: string): Promise<{ sent: boolean }> {
        return authedRequest<{ sent: boolean }>('/enquiries', {
            method: 'POST',
            body: { phone },
        });
    },

    /** The Contact page's full message, delivered as an approved template. */
    sendContact(input: ContactEnquiryInput): Promise<{ sent: boolean }> {
        return authedRequest<{ sent: boolean }>('/enquiries/contact', {
            method: 'POST',
            body: input,
        });
    },
};
