import { beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_CONTACT_CONTENT,
    contactProblems,
    mailtoLink,
    slugId,
    telHref,
    whatsappLink,
    whatsappPlainLink,
} from '../data/contactContent';
import { contactStore } from './contactStore';

beforeEach(() => {
    contactStore.reset();
});

describe('contact store', () => {
    it('starts from the shipped page', () => {
        expect(contactStore.getSnapshot()).toEqual(DEFAULT_CONTACT_CONTENT);
    });

    it('replaces a section without touching the others', () => {
        contactStore.update({
            whatsapp: { ...DEFAULT_CONTACT_CONTENT.whatsapp, number: '+91 90000 00000' },
        });

        const content = contactStore.getSnapshot();
        expect(content.whatsapp.number).toBe('+91 90000 00000');
        expect(content.email).toEqual(DEFAULT_CONTACT_CONTENT.email);
        expect(content.topics).toEqual(DEFAULT_CONTACT_CONTENT.topics);
    });

    it('replaces the enquiry topics wholesale', () => {
        contactStore.update({ topics: [{ id: 'gifting', label: 'Gifting advice' }] });

        expect(contactStore.getSnapshot().topics).toEqual([
            { id: 'gifting', label: 'Gifting advice' },
        ]);
    });

    it('resets back to the shipped page', () => {
        contactStore.update({ hero: { ...DEFAULT_CONTACT_CONTENT.hero, title: 'Changed' } });
        contactStore.reset();

        expect(contactStore.getSnapshot()).toEqual(DEFAULT_CONTACT_CONTENT);
    });
});

describe('contact links', () => {
    it('builds the WhatsApp chat link, keeping the prefilled message', () => {
        expect(whatsappPlainLink(DEFAULT_CONTACT_CONTENT)).toBe('https://wa.me/919876543210');

        const link = whatsappLink(DEFAULT_CONTACT_CONTENT);
        expect(link.startsWith('https://wa.me/919876543210?text=')).toBe(true);
        expect(link.endsWith('with%20')).toBe(true); // trailing space survives
    });

    it('drops the prefilled text when the message is blank', () => {
        const link = whatsappLink({
            ...DEFAULT_CONTACT_CONTENT,
            whatsapp: { ...DEFAULT_CONTACT_CONTENT.whatsapp, prefill: '   ' },
        });
        expect(link).toBe('https://wa.me/919876543210');
    });

    it('builds mail and dial links', () => {
        expect(mailtoLink(DEFAULT_CONTACT_CONTENT)).toBe('mailto:hello@wishbox.in');
        expect(telHref('+91 98765 43210')).toBe('tel:+919876543210');
        expect(telHref('')).toBe('');
    });

    it('slugifies topic ids and suffixes duplicates', () => {
        expect(slugId('Bulk orders', [])).toBe('bulk-orders');
        expect(slugId('Bulk orders', ['bulk-orders'])).toBe('bulk-orders-2');
        expect(slugId('  ', [])).toBe('item');
    });
});

describe('contact validation', () => {
    it('passes the shipped page', () => {
        expect(contactProblems(DEFAULT_CONTACT_CONTENT)).toEqual([]);
    });

    it('reports a bad email, short numbers, links and empty rows', () => {
        const problems = contactProblems({
            ...DEFAULT_CONTACT_CONTENT,
            email: { ...DEFAULT_CONTACT_CONTENT.email, address: 'hello@' },
            whatsapp: { ...DEFAULT_CONTACT_CONTENT.whatsapp, number: '12345' },
            call: { ...DEFAULT_CONTACT_CONTENT.call, phone: '12' },
            studio: {
                ...DEFAULT_CONTACT_CONTENT.studio,
                directionsUrl: 'maps.google.com/jaipur',
            },
            social: { ...DEFAULT_CONTACT_CONTENT.social, instagramUrl: 'instagram.com/studio' },
            hours: {
                ...DEFAULT_CONTACT_CONTENT.hours,
                rows: [{ id: 'weekdays', days: '', time: '' }],
            },
            topics: [{ id: 'other', label: '' }],
        });

        expect(problems.some((problem) => problem.includes('name@domain.com'))).toBe(true);
        expect(problems.some((problem) => problem.includes('WhatsApp card'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Call us'))).toBe(true);
        expect(problems.some((problem) => problem.includes('directions link'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Instagram link'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Support hours: row 1 needs days'))).toBe(
            true
        );
        expect(problems.some((problem) => problem.includes('Enquiry topics: row 1'))).toBe(true);
    });

    it('requires at least one enquiry topic', () => {
        const problems = contactProblems({ ...DEFAULT_CONTACT_CONTENT, topics: [] });
        expect(problems.some((problem) => problem.includes('at least one enquiry topic'))).toBe(true);
    });
});
