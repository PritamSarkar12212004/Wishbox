/**
 * Pure helpers behind the phone + OTP login flow.
 *
 * Nothing here talks to a network - the code itself is generated and checked by
 * the API (see `../api/authApi`). What is left is what the shopper sees: input
 * normalisation, the masked/pretty phone formats and the countdown label.
 * Keeping it pure means the rules are unit-testable without a DOM.
 */

export const OTP_LENGTH = 6;

/** Seconds before "Resend code" becomes available again. */
export const RESEND_SECONDS = 30;

/** Digits only, capped at the Indian 10-digit subscriber number. */
export function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(-10);
}

/** Indian mobile numbers start 6-9 and are exactly ten digits. */
export function isValidPhone(raw: string): boolean {
    return /^[6-9]\d{9}$/.test(normalizePhone(raw));
}

export function isValidName(raw: string): boolean {
    return raw.trim().length >= 2;
}

/** `9876543210` → `+91 98765 43210` */
export function formatPhone(raw: string): string {
    const digits = normalizePhone(raw);
    if (digits.length !== 10) return digits;
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** `9876543210` → `+91 ••••• 43210` — used on the verification step. */
export function maskPhone(raw: string): string {
    const digits = normalizePhone(raw);
    if (digits.length !== 10) return formatPhone(raw);
    return `+91 ••••• ${digits.slice(5)}`;
}

export function isCompleteOtp(digits: readonly string[]): boolean {
    return digits.length === OTP_LENGTH && digits.every((digit) => /^\d$/.test(digit));
}

/** Splits a pasted code into one character per box, ignoring separators. */
export function splitOtp(raw: string, slots = OTP_LENGTH): string[] {
    const digits = raw.replace(/\D/g, '').slice(0, slots).split('');
    return Array.from({ length: slots }, (_, index) => digits[index] ?? '');
}

/** `00:24` — the resend countdown label. */
export function countdownLabel(seconds: number): string {
    const safe = Math.max(0, Math.floor(seconds));
    return `0:${String(safe).padStart(2, '0')}`;
}
