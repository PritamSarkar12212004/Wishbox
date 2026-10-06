import { ApiError } from '@/lib/api/client';

/**
 * Turns an address API failure into something the shopper can act on.
 *
 * The API writes its own refusals for the shopper - "You can save up to 10
 * addresses", "Enter the 6-digit PIN code" - so its message is used as-is. Only
 * the failures it cannot phrase (a dropped connection, a surprise) get a
 * sentence from here.
 */
export function describeAddressError(failure: unknown): string {
    if (!(failure instanceof ApiError)) return 'Something went wrong. Please try again.';
    if (failure.isNetworkError) {
        return "We couldn't reach WishBox. Check your connection and try again.";
    }
    return failure.message;
}
