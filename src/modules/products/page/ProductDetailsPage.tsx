import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import PdpBreadcrumb from '../components/PdpBreadcrumb';
import ProductGallery from '../components/ProductGallery';
import ProductInfo from '../components/ProductInfo';
import ProductOverview from '../components/ProductOverview';
import StickyCartBar, { BUY_ZONE_ID } from '../components/StickyCartBar';
import { ErrorState, OutOfStockState } from '../components/ProductStates';
import { FLAGSHIP_PRODUCT_ID, getProduct, type CatalogProduct } from '../data/catalogData';
import { COLORS, PAPER_DETAIL, galleryForProduct, type ColorOption } from '../data/detailData';
import { usePurchase } from '../hooks/usePurchase';
import { useIsWishlisted, wishlistStore } from '../store/store';

const BASE_TITLE = 'WishBox';

function ProductDetailsContent({ product }: { product: CatalogProduct }) {
    /** Only the flagship ships with colour/size/GSM variants and bulk pricing. */
    const detail = product.id === FLAGSHIP_PRODUCT_ID ? PAPER_DETAIL : null;
    const [selectedColor, setSelectedColor] = useState<ColorOption>(COLORS[0]);
    const [notifySent, setNotifySent] = useState(false);
    const purchase = usePurchase(product);
    const wishlisted = useIsWishlisted(product.id);

    useEffect(() => {
        document.title = `${product.name} · ${BASE_TITLE}`;
        return () => {
            document.title = BASE_TITLE;
        };
    }, [product.name]);

    const fallbackGallery = useMemo(() => galleryForProduct(product), [product]);
    const gallery = detail
        ? detail.galleryByColor[selectedColor.name] ?? detail.galleryByColor.Gold
        : fallbackGallery;

    /** Remounting the gallery on variant change resets swiper state without effects. */
    const galleryKey = detail ? selectedColor.name : product.id;

    const handleColorChange = useCallback((color: ColorOption) => {
        if (!color.available) {
            toast.error(`${color.name} is currently unavailable.`);
            return;
        }
        setSelectedColor(color);
    }, []);

    const toggleWishlist = useCallback(() => {
        const added = wishlistStore.toggle(product);
        toast.success(added ? 'Added to wishlist' : 'Removed from wishlist', {
            description: product.name,
        });
    }, [product]);

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
                            key={galleryKey}
                            images={gallery}
                            variantKey={galleryKey}
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
                            detail={detail}
                            purchase={purchase}
                            selectedColor={detail ? selectedColor : null}
                            onColorChange={handleColorChange}
                            wishlisted={wishlisted}
                            onToggleWishlist={toggleWishlist}
                        />
                    </motion.div>
                </div>
            </section>

            <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 flex flex-col gap-10 py-10">
                <ProductOverview product={product} detail={detail} />
            </div>

            {!product.available && (
                <OutOfStockState
                    disabled={notifySent}
                    onNotify={() => {
                        setNotifySent(true);
                        toast.success(`We'll notify you when ${product.name} is back in stock. (Demo)`);
                    }}
                />
            )}

            {product.available && (
                <StickyCartBar product={product} qty={purchase.qty} unitPrice={purchase.unitPrice} />
            )}
        </div>
    );
}

function ProductDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const product = getProduct(id);

    if (!product) {
        return (
            <ErrorState
                title="Product not found"
                description="The product you are looking for may have been moved or is no longer available. Browse the full collection instead."
            />
        );
    }

    return <ProductDetailsContent product={product} />;
}

export default memo(ProductDetailsPage);
