/**
 * Contact page content — every detail the page prints, in one editable object.
 *
 * The admin's Website → Contact page screen edits this shape and the Contact
 * page renders it, so a phone number or studio address changes in one place
 * instead of being hunted through JSX. Defaults are the shipped page.
 */

export type ContactTopic = { id: string; label: string };

export type SupportHour = { id: string; days: string; time: string };

export type ContactContent = {
    hero: {
        eyebrow: string;
        title: string;
        lead: string;
        pills: { whatsapp: string; email: string; location: string };
    };
    whatsapp: {
        kicker: string;
        number: string;
        bestFor: string;
        meta: string;
        buttonLabel: string;
        /** Prefilled first message for the click-to-chat link. */
        prefill: string;
        copyLabel: string;
    };
    email: {
        kicker: string;
        address: string;
        bestFor: string;
        meta: string;
        buttonLabel: string;
        subject: string;
        copyLabel: string;
    };
    form: {
        heading: string;
        intro: string;
    };
    call: {
        title: string;
        phone: string;
        note: string;
    };
    studio: {
        title: string;
        lines: string[];
        directionsLabel: string;
        directionsUrl: string;
    };
    hours: {
        title: string;
        rows: SupportHour[];
    };
    social: {
        title: string;
        note: string;
        instagramUrl: string;
    };
    topics: ContactTopic[];
};

export const DEFAULT_CONTACT_CONTENT: ContactContent = {
    hero: {
        eyebrow: 'WishBox support',
        title: "Let's talk — we are a message away",
        lead: 'Questions about an order, a custom size, bulk pricing or your next DIY project — pick whichever channel suits you. A real human from the studio reads every message.',
        pills: {
            whatsapp: 'WhatsApp · usually a couple of hours',
            email: 'Email · within one business day',
            location: 'Based in Jaipur, India',
        },
    },
    whatsapp: {
        kicker: 'WhatsApp us',
        number: '+91 98765 43210',
        bestFor: 'Quick questions, order updates & design references',
        meta: 'Mon–Sat · 10:00 AM – 7:00 PM IST',
        buttonLabel: 'Start chat',
        prefill: 'Hi WishBox! I need help with ',
        copyLabel: 'Copy number',
    },
    email: {
        kicker: 'Email us',
        address: 'hello@wishbox.in',
        bestFor: 'Bulk orders, invoices, collaborations & press',
        meta: 'Replies within one business day',
        buttonLabel: 'Send an email',
        subject: 'WishBox enquiry',
        copyLabel: 'Copy address',
    },
    form: {
        heading: 'Send us a message',
        intro: 'Tell us what you need and we will reply on email — or on WhatsApp if you share your number.',
    },
    call: {
        title: 'Call us',
        phone: '+91 98765 43210',
        note: 'Quickest for order updates and delivery questions.',
    },
    studio: {
        title: 'Visit the studio',
        lines: ['123 Craft Lane, C-Scheme', 'Jaipur, Rajasthan 302001', 'India'],
        directionsLabel: 'Get directions',
        directionsUrl: 'https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20Rajasthan',
    },
    hours: {
        title: 'Support hours',
        rows: [
            { id: 'weekdays', days: 'Monday – Friday', time: '10:00 AM – 7:00 PM IST' },
            { id: 'saturday', days: 'Saturday', time: '10:00 AM – 4:00 PM IST' },
            { id: 'sunday', days: 'Sunday', time: 'Closed' },
        ],
    },
    social: {
        title: 'Follow along',
        note: 'New drops, studio notes and behind-the-scenes reels.',
        instagramUrl: 'https://www.instagram.com/',
    },
    topics: [
        { id: 'order-help', label: 'Order or delivery help' },
        { id: 'product', label: 'Product question' },
        { id: 'bulk', label: 'Bulk / custom order' },
        { id: 'return', label: 'Return or refund' },
        { id: 'collab', label: 'Collaboration or press' },
        { id: 'other', label: 'Something else' },
    ],
};

/** Digits only — `wa.me` and `tel:` both want the number without punctuation. */
export function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

/** The click-to-chat link, with the prefilled first message. */
export function whatsappLink(content: ContactContent): string {
    const digits = digitsOnly(content.whatsapp.number);
    // The typed text is kept verbatim (trailing space included), so a prefilled
    // message never runs straight into the shopper's first word.
    const prefill = content.whatsapp.prefill;
    return prefill.trim()
        ? `https://wa.me/${digits}?text=${encodeURIComponent(prefill)}`
        : `https://wa.me/${digits}`;
}

/** The bare chat link — no prefilled text, used by the small footer icons. */
export function whatsappPlainLink(content: ContactContent): string {
    return `https://wa.me/${digitsOnly(content.whatsapp.number)}`;
}

export function mailtoLink(content: ContactContent): string {
    return `mailto:${content.email.address.trim()}`;
}

export function telHref(phone: string): string {
    const digits = digitsOnly(phone);
    return digits ? `tel:+${digits.replace(/^0+/, '')}` : '';
}

/** Slugifies a topic label into an id that is unique within the list. */
export function slugId(label: string, taken: string[]): string {
    const base =
        label
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') || 'item';
    if (!taken.includes(base)) return base;

    let suffix = 2;
    while (taken.includes(`${base}-${suffix}`)) suffix += 1;
    return `${base}-${suffix}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const HTTP_RE = /^https?:\/\/\S+$/i;

/**
 * Everything that would print a broken contact detail. The admin blocks Save
 * while this is non-empty, so the page can never show an undialable number, a
 * mistyped email or a dead directions link.
 */
export function contactProblems(content: ContactContent): string[] {
    const problems: string[] = [];

    if (!content.hero.eyebrow.trim()) problems.push('Hero: the support badge needs a label.');
    if (!content.hero.title.trim()) problems.push('Hero: a title is required.');

    if (!content.whatsapp.kicker.trim()) problems.push('WhatsApp card: a heading is required.');
    if (digitsOnly(content.whatsapp.number).length < 10) {
        problems.push('WhatsApp card: enter the full number with its country code.');
    }

    if (!content.email.kicker.trim()) problems.push('Email card: a heading is required.');
    if (!EMAIL_RE.test(content.email.address.trim())) {
        problems.push('Email card: the address must look like name@domain.com.');
    }

    if (!content.form.heading.trim()) problems.push('Form: a heading is required.');

    if (!content.call.title.trim()) problems.push('Call us: a heading is required.');
    if (digitsOnly(content.call.phone).length < 6) {
        problems.push('Call us: the phone number needs at least 6 digits.');
    }

    if (!content.studio.title.trim()) problems.push('Studio: a heading is required.');
    if (content.studio.directionsUrl.trim() && !HTTP_RE.test(content.studio.directionsUrl.trim())) {
        problems.push('Studio: the directions link must be a full https:// URL.');
    }

    content.hours.rows.forEach((row, index) => {
        if (!row.days.trim()) problems.push(`Support hours: row ${index + 1} needs days.`);
        if (!row.time.trim()) problems.push(`Support hours: row ${index + 1} needs a time.`);
    });

    if (content.social.instagramUrl.trim() && !HTTP_RE.test(content.social.instagramUrl.trim())) {
        problems.push('Follow along: the Instagram link must be a full https:// URL.');
    }

    if (content.topics.length === 0) problems.push('Form: keep at least one enquiry topic.');
    content.topics.forEach((topic, index) => {
        if (!topic.label.trim()) problems.push(`Enquiry topics: row ${index + 1} needs a label.`);
    });

    return problems;
}
