import { describe, expect, it } from 'vitest';
import {
    countdownLabel,
    formatPhone,
    isCompleteOtp,
    isValidName,
    isValidPhone,
    maskPhone,
    normalizePhone,
    splitOtp,
} from './otp';

describe('phone helpers', () => {
    it('keeps only the ten subscriber digits', () => {
        expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
        expect(normalizePhone('(987) 654-3210')).toBe('9876543210');
        expect(normalizePhone('91-9876543210')).toBe('9876543210');
        expect(normalizePhone('98765')).toBe('98765');
    });

    it('accepts Indian mobile numbers only', () => {
        expect(isValidPhone('9876543210')).toBe(true);
        expect(isValidPhone('+91 98765 43210')).toBe(true);
        expect(isValidPhone('5876543210')).toBe(false);
        expect(isValidPhone('98765')).toBe(false);
        expect(isValidPhone('')).toBe(false);
    });

    it('formats and masks for display', () => {
        expect(formatPhone('9876543210')).toBe('+91 98765 43210');
        expect(maskPhone('9876543210')).toBe('+91 ••••• 43210');
        expect(formatPhone('123')).toBe('123');
    });

    it('requires a real-looking name', () => {
        expect(isValidName('Ananya Sharma')).toBe(true);
        expect(isValidName('  Joe ')).toBe(true);
        expect(isValidName(' A ')).toBe(false);
        expect(isValidName('   ')).toBe(false);
    });
});

describe('otp helpers', () => {
    it('knows when every box is filled', () => {
        expect(isCompleteOtp(['1', '2', '3', '4', '5', '6'])).toBe(true);
        expect(isCompleteOtp(['1', '2', '3', '4', '5', ''])).toBe(false);
        expect(isCompleteOtp(['1', '2', '3', '4', '5'])).toBe(false);
        expect(isCompleteOtp(['1', '2', '3', '4', '5', 'x'])).toBe(false);
    });

    it('splits a pasted code into boxes, padding the empty ones', () => {
        expect(splitOtp('123456')).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(splitOtp('123 456')).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(splitOtp('12')).toEqual(['1', '2', '', '', '', '']);
        expect(splitOtp('')).toEqual(['', '', '', '', '', '']);
    });

    it('formats the resend countdown', () => {
        expect(countdownLabel(30)).toBe('0:30');
        expect(countdownLabel(7)).toBe('0:07');
        expect(countdownLabel(0)).toBe('0:00');
        expect(countdownLabel(-4)).toBe('0:00');
    });
});
