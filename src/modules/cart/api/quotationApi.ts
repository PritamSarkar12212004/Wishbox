import { apiRequest } from '@/lib/api/client';
import { authedRequest } from '@/modules/auth/api/authApi';

/**
 * Bulk quotation requests.
 *
 * The cart sends quantities, never money: the API prices every line from the
 * product records at the quantity asked for, applies the bulk tiers, adds
 * CGST 9% and SGST 9%, and hands back the same figures it prints on the PDF.
 * Creating one also produces the PDF, hosts it, and sends the shop and the
 * buyer each a WhatsApp template message carrying its link.
 */

/** One priced line, as it appears on the PDF and in the panel. */
export type QuotationLine = {
    productId: string;
    name: string;
    brand: string;
    hsn: string;
    unit: string;
    qty: number;
    rate: number;
    amount: number;
};

/** The cart's live breakdown - priced, but nothing stored and nothing sent. */
export type QuotationPreview = {
    items: QuotationLine[];
    subtotal: number;
    cgstRate: number;
    cgst: number;
    sgstRate: number;
    sgst: number;
    total: number;
    amountInWords: string;
};

export type QuotationStatus = 'pending' | 'approved' | 'rejected';

/** A stored quotation, as the panel and the buyer's history read it. */
export type Quotation = QuotationPreview & {
    id: string;
    quotationNumber: string;
    status: QuotationStatus;
    customer: { name: string; phone: string; address: string };
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

/** What the next request opens with: the last quotation's buyer details. */
export type QuotationDefaults = {
    name: string;
    phone: string;
    address: string;
};

/** The shopper's quotation history, one page at a time. */
export type QuotationPage = {
    items: Quotation[];
    total: number;
    pending: number;
    page: number;
    pages: number;
};

export type QuotationInput = {
    /** The cart, as product ids and quantities. */
    items: Array<{ productId: string; qty: number }>;
    /** Defaults to the signed-in account's name. */
    name?: string;
    /** Ten digits; defaults to the account's number. */
    phone?: string;
    address: string;
};

/** Public tax & quotation configuration stored in the database. */
export type QuotationPublicConfig = {
    cgstRate: number;
    sgstRate: number;
    defaultHsn: string;
    defaultUnit: string;
    storeName: string;
    ownerLine?: string;
    phone?: string;
    gstin: string;
    state: string;
    paymentTerm: string;
};

export const quotationApi = {
    config(): Promise<QuotationPublicConfig> {
        return apiRequest<QuotationPublicConfig>('/quotations/config');
    },

    preview(items: QuotationInput['items']): Promise<QuotationPreview> {
        return authedRequest<QuotationPreview>('/quotations/preview', {
            method: 'POST',
            body: { items },
        });
    },

    /**
     * Asks for the quotation.
     *
     * Answers 201 with the stored record - including `pdfUrl`, which is the
     * hosted PDF both WhatsApp messages were sent with.
     */
    create(input: QuotationInput): Promise<Quotation> {
        return authedRequest<Quotation>('/quotations', { method: 'POST', body: input });
    },

    /** The buyer details of the last quotation, for the next request's prefill. */
    defaults(): Promise<QuotationDefaults> {
        return authedRequest<QuotationDefaults>('/quotations/defaults');
    },

    /** The shopper's own quotation history. */
    list(): Promise<QuotationPage> {
        return authedRequest<QuotationPage>('/quotations');
    },
};
