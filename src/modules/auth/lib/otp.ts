/**
 * Pure helpers behind the phone + OTP login flow.
 *
 * There is no backend in this project, so nothing here talks to a network — it
 * only normalises what the shopper typed and produces the demo code. Keeping it
 * pure means the rules are unit-testable without a DOM.
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

/** A six-digit demo code; crypto keeps it from looking patterned. */
export function generateOtp(): string {
    const buffer = new Uint32Array(OTP_LENGTH);
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
        crypto.getRandomValues(buffer);
        return [...buffer].map((value) => String(value % 10)).join('');
    }
    return Array.from({ length: OTP_LENGTH }, () => String(Math.floor(Math.random() * 10))).join('');
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
