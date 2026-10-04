/**
 * UPI payment-code parsing.
 *
 * Kept in a lib rather than the page so the admin components file stays
 * components-only for Fast Refresh — and so the parser can be unit tested
 * without rendering anything.
 *
 * There is no camera and no backend in this demo, so "scanning" a QR means
 * reading the payment string it encodes. Every UPI code carries one:
 * `upi://pay?pa=<upi id>&pn=<payee>&am=<amount>&cu=INR&tn=<note>`.
 */

export type UpiDetails = {
    /** Payee name (`pn`), empty when the code omits it. */
    payee: string;
    /** Virtual payment address (`pa`) — the only required field. */
    upiId: string;
    /** Rupee amount (`am`) when the code fixes one, otherwise null. */
    amount: number | null;
    /** Transaction note (`tn`), empty when absent. */
    note: string;
};

/**
 * Reads the payee out of a payment string. Returns null for anything without a
 * `pa=` value, which is what makes a string recognisably a UPI code.
 *
 * Accepts either a full `upi://pay?…` link or a bare `pa=…&pn=…` query, so a
 * payload copied from any payment app works.
 */
export function parseUpi(value: string): UpiDetails | null {
    const raw = value.trim();
    if (!raw) return null;

    const query = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
    const params = new URLSearchParams(query);

    const upiId = params.get('pa')?.trim() ?? '';
    if (!upiId) return null;

    const amountText = params.get('am')?.trim() ?? '';
    const amount = amountText !== '' && Number.isFinite(Number(amountText)) ? Number(amountText) : null;

    return {
        payee: params.get('pn')?.trim() ?? '',
        upiId,
        amount,
        note: params.get('tn')?.trim() ?? '',
    };
}
