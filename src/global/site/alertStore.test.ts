import { beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_ALERT_CONTENT,
    alertMessageId,
    alertProblems,
    alertTelHref,
} from './alertContent';
import { alertStore } from './alertStore';

beforeEach(() => {
    alertStore.reset();
});

describe('alert store', () => {
    it('starts from the shipped strip', () => {
        expect(alertStore.getSnapshot()).toEqual(DEFAULT_ALERT_CONTENT);
    });

    it('merges an edit without dropping the untouched fields', () => {
        alertStore.update({ phone: '+91 90000 00000', marqueeSeconds: 45 });

        const content = alertStore.getSnapshot();
        expect(content.phone).toBe('+91 90000 00000');
        expect(content.marqueeSeconds).toBe(45);
        expect(content.messages).toEqual(DEFAULT_ALERT_CONTENT.messages);
        expect(content.email).toBe(DEFAULT_ALERT_CONTENT.email);
    });

    it('replaces the offer list wholesale', () => {
        alertStore.update({ messages: [{ id: 'diwali', text: 'DIWALI SALE — 25% OFF' }] });

        expect(alertStore.getSnapshot().messages).toEqual([
            { id: 'diwali', text: 'DIWALI SALE — 25% OFF' },
        ]);
    });

    it('resets back to the shipped strip', () => {
        alertStore.update({ phone: '', messages: [] });
        alertStore.reset();

        expect(alertStore.getSnapshot()).toEqual(DEFAULT_ALERT_CONTENT);
    });
});

describe('alert helpers', () => {
    it('slugifies offer ids and suffixes duplicates', () => {
        const taken = [{ id: 'diwali-sale', text: 'DIWALI SALE' }];
        expect(alertMessageId('Diwali Sale', [])).toBe('diwali-sale');
        expect(alertMessageId('Diwali Sale', taken)).toBe('diwali-sale-2');
        expect(alertMessageId('   ', [])).toBe('message');
    });

    it('builds a dial-able phone link', () => {
        expect(alertTelHref('+91 98765 43210')).toBe('tel:+919876543210');
        expect(alertTelHref('')).toBe('');
    });
});

describe('alert validation', () => {
    it('passes the shipped strip', () => {
        expect(alertProblems(DEFAULT_ALERT_CONTENT)).toEqual([]);
    });

    it('allows empty contacts, which simply hide those links', () => {
        expect(
            alertProblems({ ...DEFAULT_ALERT_CONTENT, phone: '', email: '' })
        ).toEqual([]);
    });

    it('reports bad contacts, empty offers and a silly speed', () => {
        const problems = alertProblems({
            ...DEFAULT_ALERT_CONTENT,
            phone: '123',
            email: 'support@',
            marqueeSeconds: 3,
            messages: [
                { id: 'a', text: '  ' },
                { id: 'b', text: 'OK' },
            ],
        });

        expect(problems.some((problem) => problem.includes('Phone needs at least 6 digits'))).toBe(
            true
        );
        expect(problems.some((problem) => problem.includes('Email must look like'))).toBe(true);
        expect(problems.some((problem) => problem.includes('message 1 is empty'))).toBe(true);
        expect(problems.some((problem) => problem.includes('Marquee speed must be between'))).toBe(
            true
        );
    });
});
