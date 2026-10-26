import { memo, useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LOGIN_REASONS } from '@/modules/auth/data/authData';
import { loginGate } from '@/modules/auth/store/loginGate';
import PdpBreadcrumb from '../components/PdpBreadcrumb';
import ProductGallery from '../components/ProductGallery';
import ProductInfo from '../components/ProductInfo';
import ProductOverview from '../components/ProductOverview';
import ProductReviews from '../components/ProductReviews';
import StickyCartBar, { BUY_ZONE_ID } from '../components/StickyCartBar';
import { ErrorState, OutOfStockState } from '../components/ProductStates';
import { PdpSkeleton } from '@/components/ui/skeletons';
import type { CatalogProduct } from '../api/productApi';
import { useCatalogProduct } from '../api/useProducts';
import { galleryForProduct } from '../data/detailData';
import { usePurchase } from '../hooks/usePurchase';
import { COMMERCE_ENABLED } from '@/lib/commerce';
import { useIsWishlisted, wishlistStore } from '../store/store';
import { trackWishlistAdded, trackWishlistRemoved } from '@/modules/wishlist/lib/trackWishlist';

const BASE_TITLE = 'WishBox';

function ProductDetailsContent({ product }: { product: CatalogProduct }) {
    /* Everything below the title comes from the product record: the gallery from
     * its images, the specs and offer from the fields the admin editor writes. */
    const [notifySent, setNotifySent] = useState(false);
    const purchase = usePurchase(product);
    const wishlisted = useIsWishlisted(product.id);

    useEffect(() => {
        document.title = `${product.name} · ${BASE_TITLE}`;
        return () => {
            document.title = BASE_TITLE;
        };
    }, [product.name]);

    const gallery = galleryForProduct(product);

    /* Saving to a wishlist belongs to an account, so the gate wraps the toggle. */
    const toggleWishlist = useCallback(() => {
        loginGate.require(() => {
            const added = wishlistStore.toggle(product);
            // Recorded server-side so the admin panel can count who saved what.
            if (added) trackWishlistAdded(product.id);
            else trackWishlistRemoved(product.id);
            toast.success(added ? 'Added to wishlist' : 'Removed from wishlist', {
                description: product.name,
            });
        }, LOGIN_REASONS.wishlist);
    }, [product]);

    const notifyWhenBack = useCallback(() => {
        loginGate.require(() => {
            setNotifySent(true);
            toast.success(`We'll WhatsApp you when ${product.name} is back in stock.`);
        }, LOGIN_REASONS.notify);
    }, [product.name]);

    return (
        <div>
            <PdpBreadcrumb product={product} />

            <section
                className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 pb-2"
                aria-label="Product details"
            >
                {/* Gallery + buy column sit side by side from tablet width up. */}
                <div
                    id={BUY_ZONE_ID}
                    className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-6 lg:gap-12"
                >
                    <motion.div
                        className="min-w-0 md:col-span-7"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        <ProductGallery
                            key={product.id}
                            images={gallery}
                            variantKey={product.id}
                            badge={product.badge}
                            wishlisted={wishlisted}
                            onToggleWishlist={toggleWishlist}
                        />
                    </motion.div>
                    <motion.div
                        className="min-w-0 md:col-span-5"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
                    >
                        <ProductInfo
                            product={product}
                            purchase={purchase}
                            wishlisted={wishlisted}
                            onToggleWishlist={toggleWishlist}
                        />
                    </motion.div>
                </div>
            </section>

            <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 flex flex-col gap-10 py-10">
                <ProductOverview product={product} />
                {/* Every review and every star on this page comes from the API. */}
                <ProductReviews product={product} />
            </div>

            {!product.available && (
                <OutOfStockState disabled={notifySent} onNotify={notifyWhenBack} />
            )}

            {COMMERCE_ENABLED && product.available && (
                <StickyCartBar
                    product={product}
                    qty={purchase.qty}
                    total={purchase.payableTotal}
                    onAdd={purchase.addToCart}
                />
            )}
        </div>
    );
}

function ProductDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const query = useCatalogProduct(id);

    // The page paints its own shape while the record is on the way, so the
    // gallery and buy column never flash in as a layout shift.
    if (query.isLoading) {
        return <PdpSkeleton />;
    }

    // The API answers 404 for a draft as well as for a missing product, so a
    // shopper can never discover an unpublished one by guessing its URL.
    if (query.error || !query.data) {
        return (
            <ErrorState
                title="Product not found"
                description="The product you are looking for may have been moved or is no longer available. Browse the full collection instead."
                onRetry={() => void query.refetch()}
            />
        );
    }

    return <ProductDetailsContent product={query.data} />;
}

export default memo(ProductDetailsPage);
