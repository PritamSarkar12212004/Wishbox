import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PdpBreadcrumb from '../components/PdpBreadcrumb';
import ProductGallery from '../components/ProductGallery';
import ProductInfo from '../components/ProductInfo';
import ProductOverview from '../components/ProductOverview';
import ReviewsSection from '../components/ReviewsSection';
import QuestionsSection from '../components/QuestionsSection';
import BundleSection from '../components/BundleSection';
import ProductCarousel from '../components/ProductCarousel';
import StickyCartBar, { BUY_ZONE_ID } from '../components/StickyCartBar';



import { COLORS, GALLERY_BY_COLOR, PRODUCT, RELATED_PRODUCTS, RECENTLY_VIEWED } from '../data/productData';
import type { ColorOption } from '../data/productData';
import { wishlistStore } from '../store/store';
import { toast } from 'sonner';
import PdpHeader from '../components/PdpHeader';
import { ProductPageSkeleton, ErrorState, OutOfStockState } from '../components/ProductStates';


type PagePhase = 'loading' | 'ready' | 'error';

function ProductDetailsPage() {
    const [phase, setPhase] = useState<PagePhase>('loading');
    const [retryKey, setRetryKey] = useState(0);
    const [selectedColor, setSelectedColor] = useState<ColorOption>(COLORS[0]);
    const [wishlisted, setWishlisted] = useState(false);
    const [notifySent, setNotifySent] = useState(false);

    const load = useCallback(() => {
        setPhase('loading');
        const timer = window.setTimeout(() => setPhase('ready'), 1200);
        return () => window.clearTimeout(timer);
    }, [retryKey]);

    useEffect(() => {
        const cleanup = load();
        return cleanup;
    }, [load]);

    const handleColorChange = useCallback((color: ColorOption) => {
        if (!color.available) {
            toast.error(`${color.name} is currently unavailable.`);
            return;
        }
        setSelectedColor(color);
    }, []);

    const toggleWishlist = useCallback(() => {
        setWishlisted((v) => {
            wishlistStore.add(v ? -1 : 1);
            toast.success(v ? 'Removed from wishlist' : 'Added to wishlist', { description: PRODUCT.title });
            return !v;
        });
    }, []);

    if (phase === 'loading') {
        return (
            <div>
                <PdpHeader />
                <ProductPageSkeleton />
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div>
                <PdpHeader />
                <ErrorState onRetry={() => setRetryKey((k) => k + 1)} />
            </div>
        );
    }

    const outOfStock = PRODUCT.stockStatus === 'out-of-stock' || PRODUCT.stockStatus === 'coming-soon';
    const gallery = GALLERY_BY_COLOR[selectedColor.name] ?? GALLERY_BY_COLOR.Gold;

    return (
        <div>
            <PdpHeader />
            <PdpBreadcrumb />
            <section
                className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 pb-2"
                aria-label="Product details"
            >
                <div id={BUY_ZONE_ID} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    <motion.div
                        className="min-w-0 lg:col-span-7"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                        <ProductGallery
                            images={gallery}
                            colorName={selectedColor.name}
                            wishlisted={wishlisted}
                            onToggleWishlist={toggleWishlist}
                        />
                    </motion.div>
                    <motion.div
                        className="min-w-0 lg:col-span-5"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
                    >
                        <ProductInfo selectedColor={selectedColor} onColorChange={handleColorChange} />
                    </motion.div>
                </div>
            </section>
            <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 flex flex-col gap-10 py-10">
                <ProductOverview />
                <ReviewsSection />
                <QuestionsSection />
                <BundleSection />
                <ProductCarousel
                    title="You May Also Like"
                    subtitle="Handpicked products for your next creative project"
                    products={RELATED_PRODUCTS}
                />
                <ProductCarousel
                    title="Recently Viewed"
                    products={RECENTLY_VIEWED}
                />
            </div>

            {outOfStock ? (
                <OutOfStockState
                    disabled={notifySent}
                    onNotify={() => {
                        setNotifySent(true);
                        toast.success(`We'll notify you when ${PRODUCT.title} is back in stock. (Demo)`);
                    }}
                />
            ) : null}

            <StickyCartBar price={249} qty={1} />
        </div>
    );
}

export default memo(ProductDetailsPage);