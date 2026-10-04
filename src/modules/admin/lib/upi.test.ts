import { describe, expect, it } from 'vitest';
import { parseUpi } from './upi';

describe('parseUpi', () => {
    it('reads a full upi:// link with every field present', () => {
        expect(parseUpi('upi://pay?pa=wishbox@okaxis&pn=WishBox&am=499&cu=INR&tn=Order%20ORD2442')).toEqual({
            payee: 'WishBox',
            upiId: 'wishbox@okaxis',
            amount: 499,
            note: 'Order ORD2442',
        });
    });

    it('accepts a bare query string without the scheme', () => {
        expect(parseUpi('pa=craft@upi&pn=Papercraft')).toEqual({
            payee: 'Papercraft',
            upiId: 'craft@upi',
            amount: null,
            note: '',
        });
    });

    it('treats a missing amount as "shopper chooses"', () => {
        expect(parseUpi('upi://pay?pa=a@b&pn=A')?.amount).toBeNull();
    });

    it('ignores an amount that is not a number', () => {
        expect(parseUpi('upi://pay?pa=a@b&am=abc')?.amount).toBeNull();
    });

    it('keeps a fixed amount including paise', () => {
        expect(parseUpi('upi://pay?pa=a@b&am=249.50')?.amount).toBe(249.5);
    });

    it('returns null without a pa= payee address', () => {
        expect(parseUpi('upi://pay?pn=WishBox&am=499')).toBeNull();
    });

    it('returns null for blank or non-UPI input', () => {
        expect(parseUpi('')).toBeNull();
        expect(parseUpi('   ')).toBeNull();
        expect(parseUpi('https://example.com/pay')).toBeNull();
    });

    it('leaves the payee name empty when the code omits it', () => {
        expect(parseUpi('upi://pay?pa=only@upi')).toEqual({
            payee: '',
            upiId: 'only@upi',
            amount: null,
            note: '',
        });
    });
});
