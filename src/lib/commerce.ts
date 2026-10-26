/**
 * Cart and checkout switch.
 *
 * On: orders are placed against the API, which prices the basket, checks stock
 * and writes the order the admin panel fulfils. Payment is cash on delivery
 * until a gateway is added, which is why the checkout copy says so.
 *
 * Kept as a flag because every cart entry point reads it - the header cart icon,
 * the PDP add-to-cart button, the sticky mobile bar, the wishlist's move-to-cart
 * actions, order history's reorder and the `/cart` route - so a launch can be
 * paused in one line without deleting code.
 *
 * Buy Now (one-product direct checkout) is deliberately absent from the UI while
 * it is being rebuilt; Add to Cart is the only purchase action on the storefront.
 * The order API and the address/account gates stay in place for its return.
 */
export const COMMERCE_ENABLED = true;

/** Shown wherever the cart or buy actions would have been. */
export const COMMERCE_COMING_SOON = 'Orders open soon';

/** The one-line explanation beside it — save the piece for later instead. */
export const COMMERCE_COMING_SOON_NOTE =
    'Checkout is not open yet. Wishlist the pieces you love and we will let you know the moment ordering goes live.';
