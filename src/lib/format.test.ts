import { describe, expect, it } from 'vitest';
import { compactCount, emiFor, inr } from './format';

describe('inr', () => {
    it('rounds and formats in the Indian grouping system', () => {
        expect(inr(249)).toBe('₹249');
        expect(inr(249.6)).toBe('₹250');
        expect(inr(1234567)).toBe('₹12,34,567');
    });
});

describe('compactCount', () => {
    it('compacts thousands, dropping the decimal when exact', () => {
        expect(compactCount(999)).toBe('999');
        expect(compactCount(1000)).toBe('1k');
        expect(compactCount(1248)).toBe('1.2k');
        expect(compactCount(12000)).toBe('12k');
    });
});

describe('emiFor', () => {
    it('rounds the 12-month EMI up to the nearest rupee', () => {
        expect(emiFor(2199)).toBe(184);
        expect(emiFor(1200)).toBe(100);
    });
});
