import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { placeOrder } from '@/modules/history/store/store';
import { inr } from '@/lib/format';
import { COUPONS, findBulkTier, type Coupon } from '../data/detailData';
import { FLAGSHIP_PRODUCT_ID, type CatalogProduct } from '../data/catalogData';
import { MAX_QTY, cartCouponStore, cartStore, discountForAmount } from '../store/store';

export type AppliedCoupon = Coupon & { code: string };

/**
 * Quantity, bulk-tier pricing and coupon state for the product page.
 * Lives here so the buy column and the sticky mobile bar always agree.
 */
export function usePurchase(product: CatalogProduct) {
    const navigate = useNavigate();
    const [qty, setQtyState] = useState(1);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

    const bulkTier = product.id === FLAGSHIP_PRODUCT_ID ? findBulkTier(qty) : null;
    const unitPrice = bulkTier?.unitPrice ?? product.price;

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
            const coupon = COUPONS[code];
            if (coupon) {
                setAppliedCoupon({ code, ...coupon });
                toast.success(`Coupon ${code} applied · ${coupon.label}`);
            } else {
                toast.error(`Coupon "${code}" is invalid`);
            }
        },
        [couponInput]
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
        // The cart applies the same coupon, so the PDP total and the cart agree.
        if (appliedCoupon) cartCouponStore.apply(appliedCoupon);
        toast.success(`${qty} ${qty > 1 ? 'packs' : 'pack'} added to cart`, {
            description: `${product.name} · ${inr(totals.payableTotal)}`,
        });
    }, [product, qty, unitPrice, appliedCoupon, totals.payableTotal]);

    const buyNow = useCallback(() => {
        const order = placeOrder({
            items: [
                {
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    image: product.image,
                    qty,
                    price: unitPrice,
                    mrp: product.mrp,
                    rating: product.rating,
                },
            ],
            discount: discountForAmount(unitPrice * qty, appliedCoupon),
        });
        toast.success(`Order ${order.id} placed`, {
            description: 'Demo checkout — no payment is taken.',
        });
        navigate('/history');
    }, [product, qty, unitPrice, appliedCoupon, navigate]);

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
