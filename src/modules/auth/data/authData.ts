/**
 * One reason per account-connected action.
 *
 * The modal headlines the reason the shopper just hit, so the interruption
 * always explains itself ("Sign in to save this to your wishlist") instead of
 * asking for a phone number out of nowhere.
 */
export const LOGIN_REASONS = {
    wishlist: 'Sign in to save this to your wishlist',
    wishlistPage: 'Sign in to open your wishlist',
    notify: 'Sign in to hear the moment it is back in stock',
    review: 'Sign in to write a review',
    question: 'Sign in to ask the seller a question',
    checkout: 'Sign in to check out',
    placeOrder: 'Sign in to place your order',
    address: 'Sign in to save this delivery address',
    orders: 'Sign in to see your orders',
    returns: 'Sign in to start a return or exchange',
    coupons: 'Sign in to see your saved coupons',
    updates: 'Sign in to see your notifications',
    profile: 'Sign in to open your profile',
    account: 'Sign in to your WishBox account',
} as const;

export type LoginReason = (typeof LOGIN_REASONS)[keyof typeof LOGIN_REASONS];

/** Shared body copy so every entry point reads the same. */
export const AUTH_COPY = {
    stepOneTitle: 'Your details',
    stepOneHint: 'We use your name on invoices and your WhatsApp number to send the code.',
    stepTwoTitle: 'Verify your number',
    stepTwoHint: 'Enter the 6-digit code we just sent on WhatsApp.',
    nameLabel: 'Full name',
    namePlaceholder: 'Ananya Sharma',
    phoneLabel: 'WhatsApp number',
    sendCode: 'Send code on WhatsApp',
    verify: 'Verify & continue',
    verifying: 'Verifying…',
    resend: 'Resend code',
    changeNumber: 'Change number',
    trust: 'No passwords, no spam — just a one-time code on WhatsApp.',
    demoNote: 'Demo mode: there is no SMS gateway, so the code is shown here.',
};
