import { describe, expect, it } from 'vitest';
import {
    BLANK_ADDRESS,
    STATES,
    formatAddress,
    hasErrors,
    toDraft,
    validateAddress,
    type AddressDraft,
    type DeliveryAddress,
} from './addressData';

/**
 * The form's rules are the API's rules answered instantly, so the guards worth
 * having are the ones that would otherwise reach the server: a missing line, a
 * state that is not Indian, a PIN code that cannot exist. Both address lines are
 * required, which is the rule most likely to regress.
 */

const VALID: AddressDraft = {
    address1: 'Flat 4B, Shanti Residency',
    address2: 'Wardha Road',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
};

const draft = (patch: Partial<AddressDraft>): AddressDraft => ({ ...VALID, ...patch });

describe('validateAddress', () => {
    it('passes a complete address', () => {
        const errors = validateAddress(VALID);
        expect(hasErrors(errors)).toBe(false);
    });

    it('names every missing field on a blank address', () => {
        const errors = validateAddress(BLANK_ADDRESS);
        expect(Object.keys(errors).sort()).toEqual(['address1', 'address2', 'city', 'pincode', 'state']);
    });

    it('requires the area, landmark or street line', () => {
        expect(validateAddress(draft({ address2: '' })).address2).toBe(
            'Enter the area, landmark or street'
        );
        expect(validateAddress(draft({ address2: '   ' })).address2).toBe(
            'Enter the area, landmark or street'
        );
        expect(validateAddress(draft({ address2: 'AB' })).address2).toMatch(/too short/);
        // Three characters is enough for a real locality.
        expect(validateAddress(draft({ address2: 'ABC' })).address2).toBeUndefined();
    });

    it('requires the first line to be a real building address', () => {
        expect(validateAddress(draft({ address1: '' })).address1).toBe(
            'Enter the flat, house or building number'
        );
        expect(validateAddress(draft({ address1: '12' })).address1).toMatch(/too short/);
    });

    it('tells the shopper what is wrong with a PIN code', () => {
        expect(validateAddress(draft({ pincode: '' })).pincode).toBe('Enter your PIN code');
        expect(validateAddress(draft({ pincode: '44001' })).pincode).toBe('Enter the 6-digit PIN code');
        expect(validateAddress(draft({ pincode: '040001' })).pincode).toBe(
            'A PIN code cannot start with 0'
        );
        expect(validateAddress(draft({ pincode: '4400AB' })).pincode).toBe('A PIN code is six digits');
        expect(validateAddress(draft({ pincode: '440001' })).pincode).toBeUndefined();
    });

    it('accepts only states and union territories India actually has', () => {
        expect(STATES).toContain('Maharashtra');
        expect(validateAddress(draft({ state: 'California' })).state).toBe(
            'Choose an Indian state or union territory'
        );
        // The select can only offer the canonical spelling, so a lower-case one
        // is a state that was not chosen.
        expect(validateAddress(draft({ state: 'maharashtra' })).state).toBeDefined();
        expect(validateAddress(draft({ state: 'Jammu and Kashmir' })).state).toBeUndefined();
    });

    it('catches an over-long city or line', () => {
        expect(validateAddress(draft({ city: 'A' })).city).toMatch(/too short/);
        expect(validateAddress(draft({ city: 'N'.repeat(61) })).city).toMatch(/under 60/);
        expect(validateAddress(draft({ address2: 'N'.repeat(121) })).address2).toMatch(/under 120/);
    });
});

describe('formatAddress', () => {
    const saved: DeliveryAddress = {
        id: 'addr-1',
        ...VALID,
        createdAt: '2026-10-06T00:00:00.000Z',
        updatedAt: '2026-10-06T00:00:00.000Z',
    };

    it('writes both lines into one line, the way an order shows it', () => {
        expect(formatAddress(saved)).toBe(
            'Flat 4B, Shanti Residency, Wardha Road, Nagpur, Maharashtra - 440001'
        );
    });

    it('drops a missing second line rather than leaving a gap', () => {
        expect(formatAddress({ ...saved, address2: '' })).toBe(
            'Flat 4B, Shanti Residency, Nagpur, Maharashtra - 440001'
        );
    });

    it('round-trips a saved address back into the form', () => {
        expect(toDraft(saved)).toEqual(VALID);
        expect(toDraft({ ...saved, address2: undefined }).address2).toBe('');
    });
});
