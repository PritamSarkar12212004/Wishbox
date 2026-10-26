/**
 * Alert bar content — the strip above the header: support phone and email on
 * the left, the scrolling sale messages on the right.
 *
 * Edited in the admin's Website → Alert bar screen and read by `MainAlert`, so
 * a new offer or a changed support number is a content edit, not a deploy.
 */

export type AlertMessage = { id: string; text: string };

export type AlertContent = {
    phone: string;
    email: string;
    messages: AlertMessage[];
    /** Seconds for one full marquee loop. */
    marqueeSeconds: number;
};

/** More than this and the loop stops feeling like a highlight reel. */
export const MAX_ALERT_MESSAGES = 10;

export const MIN_MARQUEE_SECONDS = 8;
export const MAX_MARQUEE_SECONDS = 120;

export const DEFAULT_ALERT_CONTENT: AlertContent = {
    phone: '+91 98765 43210',
    email: 'hello@wishbox.in',
    messages: [
        { id: 'paper-lanterns', text: '50% OFF PAPER LANTERNS' },
        { id: 'origami-sets', text: 'BUY 2 GET 1 FREE ON ORIGAMI SETS' },
        { id: 'wall-art', text: '30% OFF WALL ART' },
        { id: 'craft-paper', text: 'CRAFT PAPER FROM $3.99' },
        { id: 'spring-flowers', text: 'NEW SPRING FLOWER COLLECTION' },
        { id: 'bulk-orders', text: 'EXTRA 15% OFF BULK ORDERS' },
        { id: 'gift-wrap', text: 'GIFT WRAP 40% OFF TODAY' },
    ],
    marqueeSeconds: 30,
};

/** Slugifies a message into an id that is unique within the list. */
export function alertMessageId(text: string, messages: AlertMessage[]): string {
    const base =
        text
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'message';
    if (!messages.some((message) => message.id === base)) return base;

    let suffix = 2;
    while (messages.some((message) => message.id === `${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

/** Dial-able link — spaces and punctuation are dropped, the leading + stays. */
export function alertTelHref(phone: string): string {
    const digits = phone.replace(/[^\d+]/g, '');
    return digits.replace(/\D/g, '') ? `tel:${digits}` : '';
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Everything that would make the alert bar misleading or broken. Empty contact
 * fields are allowed — that simply hides that link — but a filled one has to be
 * reachable, and every message row needs text.
 */
export function alertProblems(content: AlertContent): string[] {
    const problems: string[] = [];

    if (content.phone.trim() && content.phone.replace(/\D/g, '').length < 6) {
        problems.push('Phone needs at least 6 digits, or leave it empty to hide it.');
    }

    if (content.email.trim() && !EMAIL_RE.test(content.email.trim())) {
        problems.push('Email must look like name@domain.com, or leave it empty to hide it.');
    }

    if (content.messages.length > MAX_ALERT_MESSAGES) {
        problems.push(`Keep the marquee to ${MAX_ALERT_MESSAGES} messages or fewer.`);
    }

    content.messages.forEach((message, index) => {
        if (!message.text.trim()) {
            problems.push(`Marquee: message ${index + 1} is empty.`);
        }
    });

    if (
        !Number.isFinite(content.marqueeSeconds) ||
        content.marqueeSeconds < MIN_MARQUEE_SECONDS ||
        content.marqueeSeconds > MAX_MARQUEE_SECONDS
    ) {
        problems.push(
            `Marquee speed must be between ${MIN_MARQUEE_SECONDS} and ${MAX_MARQUEE_SECONDS} seconds.`
        );
    }

    return problems;
}
