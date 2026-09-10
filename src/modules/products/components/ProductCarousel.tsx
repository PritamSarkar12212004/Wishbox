import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { Star, Heart, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Theme from '@/assets/Theme/Theme';
import type { RelatedProduct } from '../data/productData';
import { inr } from '../data/productData';
import { cartStore, wishlistStore } from '../store/store';
import { toast } from 'sonner';

function ProductCard({ product }: { product: RelatedProduct }) {
    const [added, setAdded] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);

    return (
        <div
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            style={{
                borderColor: Theme.colors.border,
                backgroundColor: Theme.colors.surface,
                boxShadow: Theme.Shadow.sm,
            }}
        >
            <Link to={`/product/${product.id}`} className="relative block overflow-hidden" aria-label={product.name}>
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                {product.badge && (
                    <span className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white"
                        style={{ backgroundColor: Theme.colors.accent }}>
                        {product.badge}
                    </span>
                )}
            </Link>

            <button
                type="button"
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wishlisted}
                onClick={() => {
                    setWishlisted((v) => {
                        wishlistStore.add(v ? -1 : 1);
                        return !v;
                    });
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110"
            >
                <Heart size={15} fill={wishlisted ? Theme.colors.accent : 'none'}
                    style={{ color: wishlisted ? Theme.colors.accent : Theme.colors.text }} />
            </button>

            <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug" style={{ color: Theme.colors.text }}>
                    <Link to={`/product/${product.id}`}>{product.name}</Link>
                </h3>
                <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                    <Star size={11} fill="currentColor" style={{ color: Theme.colors.gold }} />
                    <span className="font-medium" style={{ color: Theme.colors.text }}>{product.rating}</span>
                    ({product.reviews.toLocaleString('en-IN')})
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-base font-bold" style={{ color: Theme.colors.text }}>{inr(product.price)}</span>
                    <span className="text-xs line-through" style={{ color: Theme.colors.textMuted }}>{inr(product.mrp)}</span>
                    <span className="text-xs font-semibold" style={{ color: Theme.colors.accent }}>{product.discountPct}% off</span>
                </div>
                <button
                    type="button"
                    disabled={!product.available}
                    onClick={() => {
                        setAdded(true);
                        cartStore.add(1);
                        toast.success('Added to cart', { description: product.name });
                        window.setTimeout(() => setAdded(false), 1600);
                    }}
                    className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                    style={{
                        backgroundColor: added ? '#2E7D5B' : Theme.colors.primaryLight,
                        color: added ? '#fff' : Theme.colors.primaryDark,
                    }}
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={added ? '1' : '0'}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-1.5">
                            {added ? (<><Check size={13} /> Added</>) : (<><Plus size={13} /> Add</>)}
                        </motion.span>
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
}
type Props = {
    title: string;
    products: RelatedProduct[];
    subtitle?: string;
};

const ProductCarousel = memo(function ProductCarousel({ title, products, subtitle }: Props) {
    const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
    const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);

    return (
        <section className="w-full" aria-label={title}>
            <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold tracking-tight" style={{ color: Theme.colors.text }}>{title}</h2>
                    {subtitle && <p className="text-sm" style={{ color: Theme.colors.textMuted }}>{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button ref={setPrevEl} type="button" aria-label={`Previous ${title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
                        style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}>
                        <ChevronLeft size={16} />
                    </button>
                    <button ref={setNextEl} type="button" aria-label={`Next ${title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-black/5"
                        style={{ borderColor: Theme.colors.border, color: Theme.colors.text }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <Swiper
                modules={[Navigation, Keyboard]}
                navigation={{ prevEl, nextEl }}
                keyboard={{ enabled: true }}
                slidesPerView={1.35}
                spaceBetween={12}
                breakpoints={{
                    480: { slidesPerView: 2, spaceBetween: 14 },
                    768: { slidesPerView: 3, spaceBetween: 14 },
                    1100: { slidesPerView: 4, spaceBetween: 16 },
                    1400: { slidesPerView: 5, spaceBetween: 18 },
                }}
            >
                {products.map((p) => (
                    <SwiperSlide key={p.id} className="!h-auto">
                        <ProductCard product={p} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
});

export default ProductCarousel;