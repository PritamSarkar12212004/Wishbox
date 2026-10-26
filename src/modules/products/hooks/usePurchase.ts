import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { usePlaceOrder } from '@/modules/orders/api/useOrders';
import { LOGIN_REASONS } from '@/modules/auth/data/authData';
import { loginGate } from '@/modules/auth/store/loginGate';
import { checkoutGate } from '@/modules/addresses/store/checkoutGate';
import { trackCartAdd } from '@/modules/cart/lib/trackCart';
import { ApiError } from '@/lib/api/client';
import { inr } from '@/lib/format';
import type { CatalogProduct, Coupon } from '../api/productApi';
import { useCoupons } from '../api/useProducts';
import { findBulkTier } from '../lib/pricing';
import { MAX_QTY, cartCouponStore, cartStore, discountForAmount } from '../store/store';

export type AppliedCoupon = Coupon;

/**
 * Quantity, bulk-tier pricing and coupon state for the product page.
 * Lives here so the buy column and the sticky mobile bar always agree.
 */
export function usePurchase(product: CatalogProduct) {
    const navigate = useNavigate();
    const placeOrder = usePlaceOrder();
    const coupons = useCoupons();
    const [qty, setQtyState] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

    const tier = findBulkTier(product.bulkTiers, qty);
    /** The same tier, plus the saving it represents against MRP for the badges. */
    const bulkTier = tier
        ? {
              min: tier.minQty,
              max: tier.maxQty,
              unitPrice: tier.unitPrice,
              discountPct:
                  product.mrp > 0
                      ? Math.max(0, Math.round((1 - tier.unitPrice / product.mrp) * 100))
                      : 0,
          }
        : null;
    const unitPrice = tier?.unitPrice ?? product.price;

    const setQty = useCallback((next: number) => {
        setQtyState(Math.min(MAX_QTY, Math.max(1, Math.round(next) || 1)));
    }, []);

    const applyCoupon = useCallback(
        (rawCode?: string) => {
            const code = (rawCode ?? couponInput).trim().toUpperCase();
            if (!code) {
                toast.error('Please enter a coupon code');
                return;
            }
            // The codes come from the API's coupon table - the same rows the order
            // service charges from, so a code shown here is a code that works.
            const coupon = coupons.find((entry) => entry.code === code);
            if (!coupon) {
                toast.error(`Coupon "${code}" is invalid`);
                return;
            }
            if (product.price * qty < coupon.minOrder) {
                toast.error(`Coupon ${code} needs a cart of at least ${inr(coupon.minOrder)}`);
                return;
            }
            setAppliedCoupon(coupon);
            toast.success(`Coupon ${code} applied · ${coupon.label}`);
        },
        [couponInput, coupons, product.price, qty]
    );

    const removeCoupon = useCallback(() => {
        setAppliedCoupon(null);
        setCouponInput('');
        toast.success('Coupon removed');
    }, []);

    const totals = useMemo(() => {
        const subtotal = unitPrice * qty;
        const mrpTotal = product.mrp * qty;
        const couponDiscount = discountForAmount(subtotal, appliedCoupon);
        const payableTotal = Math.max(subtotal - couponDiscount, 0);
        return {
            subtotal,
            mrpTotal,
            couponDiscount,
            payableTotal,
            totalSaving: mrpTotal - payableTotal,
            discountPercent: mrpTotal > 0 ? Math.round((1 - payableTotal / mrpTotal) * 100) : 0,
        };
    }, [appliedCoupon, product.mrp, qty, unitPrice]);

    const addToCart = useCallback(() => {
        cartStore.add(product, qty, unitPrice);
        // Recorded server-side so the admin panel can report real demand.
        trackCartAdd(product.id, qty);
        // The cart applies the same coupon, so the PDP total and the cart agree.
        if (appliedCoupon) cartCouponStore.apply(appliedCoupon);
        toast.success(`${qty} ${qty > 1 ? 'packs' : 'pack'} added to cart`, {
            description: `${product.name} · ${inr(totals.payableTotal)}`,
        });
    }, [product, qty, unitPrice, appliedCoupon, totals.payableTotal]);

    /**
     * Placing an order needs a verified shopper *and* somewhere to send it, so
     * the gates run in order: sign in first, then choose the delivery address,
     * and only then is the order created.
     *
     * Not wired to a button: the storefront has no Buy Now action while that
     * flow is rebuilt. Kept here so the order request stays in one place.
     */
    const buyNow = useCallback(() => {
        loginGate.require(() => {
            checkoutGate.require((address) => {
                // The server prices the basket from the product record; this
                // request only says what was bought and where it goes.
                void placeOrder
                    .mutateAsync({
                        items: [{ productId: product.id, qty }],
                        addressId: address.id,
                        payment: 'COD',
                        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
                    })
                    .then((order) => {
                        toast.success(`Order ${order.id} placed`, {
                            description: `Cash on delivery to ${address.city} — pay when it arrives.`,
                        });
                        navigate('/history');
                    })
                    .catch((error: unknown) => {
                        toast.error(
                            error instanceof ApiError ? error.message : 'Could not place the order'
                        );
                    });
            });
        }, LOGIN_REASONS.placeOrder);
    }, [product.id, qty, appliedCoupon, navigate, placeOrder]);

    return {
        qty,
        setQty,
        couponInput,
        setCouponInput,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        unitPrice,
        bulkTier,
        ...totals,
        addToCart,
        buyNow,
    };
}
