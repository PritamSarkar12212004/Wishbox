/**
 * Contact details, support topics and FAQs for the Contact page.
 * Frontend-only; no backend, API or database is involved.
 */

export const WHATSAPP = {
    display: '+91 98765 43210',
    /** wa.me wants the country code without a leading "+". */
    waNumber: '919876543210',
    /** Prefilled first message for the click-to-chat link. */
    prefill: 'Hi WishBox! I need help with ',
    bestFor: 'Quick questions, order updates & design references',
};

export const EMAIL = {
    display: 'hello@wishbox.in',
    bestFor: 'Bulk orders, invoices, collaborations & press',
};

export const PHONE = {
    display: '+91 98765 43210',
    tel: '+919876543210',
};

export const STUDIO = {
    lines: ['123 Craft Lane, C-Scheme', 'Jaipur, Rajasthan 302001', 'India'],
    directionsUrl: 'https://www.google.com/maps/search/?api=1&query=Jaipur%2C%20Rajasthan',
};

export const SUPPORT_HOURS = [
    { days: 'Monday – Friday', time: '10:00 AM – 7:00 PM IST' },
    { days: 'Saturday', time: '10:00 AM – 4:00 PM IST' },
    { days: 'Sunday', time: 'Closed' },
];

export const SOCIALS = {
    instagram: 'https://www.instagram.com/',
    whatsapp: `https://wa.me/${WHATSAPP.waNumber}`,
    email: `mailto:${EMAIL.display}`,
};

/** What the message is about — drives who picks up the enquiry. */
export const CONTACT_TOPICS = [
    { value: 'order-help', label: 'Order or delivery help' },
    { value: 'product', label: 'Product question' },
    { value: 'bulk', label: 'Bulk / custom order' },
    { value: 'return', label: 'Return or refund' },
    { value: 'collab', label: 'Collaboration or press' },
    { value: 'other', label: 'Something else' },
];

export const CONTACT_FAQS = [
    {
        q: 'How quickly will I hear back?',
        a: 'WhatsApp messages during support hours are usually answered within a couple of hours. Emails get a reply within one business day — we answer every single one.',
    },
    {
        q: 'Can I order custom or bulk quantities?',
        a: 'Yes. Custom sizes, colours and bulk pricing start at 25 units. Pick "Bulk / custom order" in the form and share quantity, GSM and your timeline so we can quote accurately.',
    },
    {
        q: 'Can you help me choose the right paper?',
        a: 'Send us what you are making — invitations, scrapbooking, framing, gifting — and we will suggest the GSM and finish that works best for it.',
    },
    {
        q: 'How do I share design references?',
        a: 'Attach a link in your message, or send files straight on WhatsApp. Images, PDFs and Pinterest links are all fine.',
    },
    {
        q: 'Do you take event and wedding decoration projects?',
        a: 'We do. Share your date, venue and theme, and our team will put together a decoration plan with a full material list.',
    },
];
