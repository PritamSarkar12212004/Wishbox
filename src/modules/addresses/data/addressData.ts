/**
 * Delivery addresses: the shape, the rules, and how one reads on paper.
 *
 * The rules mirror the API's
 * (`Wishbox-Backend/src/modules/addresses/addresses.validation.ts`) so the form
 * can answer instantly instead of bouncing a round trip off the server. The
 * server is still the authority - it canonicalises the state and is the one
 * whose answer decides what gets stored - so this side stays a *hint*, and any
 * refusal from the API is shown as it comes.
 *
 * `STATES` is deliberately a copy of the backend's canonical list: a select has
 * to render before anything is fetched, and the list of Indian states is not
 * something that changes. Keep the two in step.
 *
 * Both address lines are required. The second one is what a courier actually
 * needs to find the door - "12B, Sunrise Apartments" means nothing without the
 * area - so it is not optional here or in the API.
 */

/** India's 28 states and 8 union territories, in their official spelling. */
export const STATES = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
] as const;

/** PIN codes are six digits and never start with zero. Matches the API. */
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/** A saved address as the API returns it. */
export type DeliveryAddress = {
    id: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    createdAt: string;
    updatedAt: string;
};

/** What the form edits: a saved address with the id, or a blank one. */
export type AddressDraft = {
    address1: string;
    address2: string;
    city: string;
    state: string;
    pincode: string;
};

export const BLANK_ADDRESS: AddressDraft = {
    address1: '',
    address2: '',
    city: '',
    state: '',
    pincode: '',
};

export type AddressField = keyof AddressDraft;
export type AddressErrors = Partial<Record<AddressField, string>>;

/** A saved address back into the shape the form edits. */
export function toDraft(address: DeliveryAddress): AddressDraft {
    return {
        address1: address.address1,
        address2: address.address2 ?? '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
    };
}

/** One line, the way it is shown on an order. */
export function formatAddress(address: DeliveryAddress | AddressDraft): string {
    const second = address.address2?.trim();
    return `${address.address1.trim()}${second ? `, ${second}` : ''}, ${address.city.trim()}, ${address.state.trim()} - ${address.pincode.trim()}`;
}

/**
 * Checks a draft field by field.
 *
 * Every message is written for the shopper and says what to do, because these
 * are the same words the field shows under itself.
 */
export function validateAddress(draft: AddressDraft): AddressErrors {
    const errors: AddressErrors = {};

    const address1 = draft.address1.trim();
    if (address1.length === 0) errors.address1 = 'Enter the flat, house or building number';
    else if (address1.length < 4) errors.address1 = 'That looks too short — add the building or street';
    else if (address1.length > 120) errors.address1 = 'Keep the first address line under 120 characters';

    const address2 = draft.address2.trim();
    if (address2.length === 0) errors.address2 = 'Enter the area, landmark or street';
    else if (address2.length < 3) errors.address2 = 'That looks too short — add the area or landmark';
    else if (address2.length > 120) errors.address2 = 'Keep the second address line under 120 characters';

    const city = draft.city.trim();
    if (city.length === 0) errors.city = 'Enter your city';
    else if (city.length < 2) errors.city = 'That looks too short for a city name';
    else if (city.length > 60) errors.city = 'Keep the city name under 60 characters';

    if (!draft.state) errors.state = 'Choose your state';
    else if (!STATES.includes(draft.state as (typeof STATES)[number])) {
        errors.state = 'Choose an Indian state or union territory';
    }

    const pincode = draft.pincode.trim();
    if (pincode.length === 0) errors.pincode = 'Enter your PIN code';
    else if (!/^\d+$/.test(pincode)) errors.pincode = 'A PIN code is six digits';
    else if (!PINCODE_REGEX.test(pincode)) {
        errors.pincode = pincode.startsWith('0')
            ? 'A PIN code cannot start with 0'
            : 'Enter the 6-digit PIN code';
    }

    return errors;
}

export const hasErrors = (errors: AddressErrors): boolean => Object.keys(errors).length > 0;
