import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import { Keyboard, Thumbs, FreeMode } from 'swiper/modules';
import { ChevronLeft, ChevronRight, ZoomIn, Play, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/thumbs';
import 'photoswipe/style.css';
import Theme from '@/assets/Theme/Theme';
import type { GalleryItem } from '../data/productData';

const BADGES = [
    { label: 'NEW', color: '#2C2420' },
    { label: 'BESTSELLER', color: '#C97B5D' },
    { label: 'SALE', color: '#7C9A7A' },
];

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
    );
    useEffect(() => {
        const onChange = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onChange);
        return () => window.removeEventListener('resize', onChange);
    }, []);
    return isDesktop;
}

type Props = {
    images: GalleryItem[];
    colorName: string;
    wishlisted: boolean;
    onToggleWishlist: () => void;
};

const ProductGallery = memo(function ProductGallery({ images, colorName, wishlisted, onToggleWishlist }: Props) {
    const isDesktop = useIsDesktop();
    const [thumbs, setThumbs] = useState<SwiperClass | null>(null);
    const mainRef = useRef<SwiperClass | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [playingVideo, setPlayingVideo] = useState(false);

    const imageSlides = images.filter((i) => i.type !== 'video');

    const openLightbox = useCallback(
        (index: number) => {
            const item = images[index];
            if (item?.type === 'video') return;
            const lightbox = new PhotoSwipeLightbox({
                dataSource: imageSlides.map((img) => ({
                    src: img.src,
                    w: img.width,
                    h: img.height,
                    alt: img.alt,
                })),
                index: imageSlides.findIndex((img) => img.id === item?.id),
                pswpModule: PhotoSwipe,
                bgOpacity: 0.94,
                paddingFn: () => ({ top: 40, bottom: 40, left: 16, right: 16 }),
                loop: true,
            });
            lightbox.init();
            lightbox.loadAndOpen(0);
        },
        [images, imageSlides]
    );

    useEffect(() => {
        setActiveIndex(0);
        setPlayingVideo(false);
        mainRef.current?.slideTo(0, 0);
    }, [colorName]);

    const totalSlides = images.length;
    const isVideoActive = images[activeIndex]?.type === 'video';

    return (
        <div className="flex min-w-0 w-full gap-3 lg:gap-5">
            {/* Vertical thumbs — desktop */}
            {isDesktop && (
                <div className="hidden lg:block w-[84px] shrink-0">
                    <Swiper
                        key={`thumbs-v-${colorName}`}
                        direction="vertical"
                        modules={[Thumbs, FreeMode]}
                        slidesPerView={5.5}
                        spaceBetween={10}
                        freeMode
                        watchSlidesProgress
                        onSwiper={setThumbs}
                        className="gallery-thumbs-v !overflow-hidden"
                        style={{ height: 520 }}
                    >
                        {images.map((img, i) => (
                            <SwiperSlide key={img.id} className="!h-auto cursor-pointer">
                                <ThumbSlide item={img} active={activeIndex === i} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            )}

            {/* Main + mobile thumbs */}
            <div className="flex-1 min-w-0 space-y-3">
                <div className="relative group" style={{ borderRadius: Theme.BorderRadius.lg, boxShadow: Theme.Shadow.md }}>
                    <div className="overflow-hidden" style={{ borderRadius: Theme.BorderRadius.lg, backgroundColor: Theme.colors.surface }}>
                        <Swiper
                            key={`main-${colorName}`}
                            modules={[Keyboard, Thumbs]}
                            thumbs={thumbs && !thumbs.destroyed ? { swiper: thumbs } : undefined}
                            keyboard={{ enabled: true, onlyInViewport: false }}
                            grabCursor
                            spaceBetween={0}
                            slidesPerView={1}
                            onSwiper={(s) => (mainRef.current = s)}
                            onSlideChange={(s) => {
                                setActiveIndex(s.activeIndex);
                                setPlayingVideo(false);
                            }}
                            className="gallery-main !overflow-hidden"
                        >
                            {images.map((img, i) => (
                                <SwiperSlide key={img.id}>
                                    <GallerySlide
                                        item={img}
                                        active={activeIndex === i}
                                        isDesktop={isDesktop}
                                        playing={playingVideo}
                                        onToggleVideo={() => setPlayingVideo((v) => !v)}
                                        onOpen={() => openLightbox(i)}
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>

                        {/* Badges */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
                            {BADGES.map((b) => (
                                <span
                                    key={b.label}
                                    className="rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm"
                                    style={{ backgroundColor: b.color }}
                                >
                                    {b.label}
                                </span>
                            ))}
                        </div>

                        {/* Wishlist */}
                        <button
                            type="button"
                            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                            aria-pressed={wishlisted}
                            onClick={onToggleWishlist}
                            className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition-transform hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                    key={wishlisted ? 'on' : 'off'}
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.6, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                >
                                    <Heart
                                        size={19}
                                        style={{ color: wishlisted ? Theme.colors.accent : Theme.colors.text }}
                                        fill={wishlisted ? Theme.colors.accent : 'none'}
                                    />
                                </motion.span>
                            </AnimatePresence>
                        </button>

                        {/* Desktop zoom hint */}
                        {isDesktop && (
                            <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                                    <ZoomIn size={14} />
                                    Click to zoom
                                </span>
                            </div>
                        )}
{/* Prev / Next */}
                        <button
                            type="button"
                            aria-label="Previous image"
                            onClick={() => mainRef.current?.slidePrev()}
                            className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white md:flex outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            aria-label="Next image"
                            onClick={() => mainRef.current?.slideNext()}
                            className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white md:flex outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                        >
                            <ChevronRight size={18} />
                        </button>

                        {/* Counter */}
                        <div className="absolute bottom-3 right-3 z-10">
                            <span
                                role="status"
                                aria-label={`Slide ${activeIndex + 1} of ${totalSlides}`}
                                className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
                            >
                                {activeIndex + 1} / {totalSlides}
                            </span>
                        </div>
                    </div>

                    {/* Inline video player */}
                    <AnimatePresence>
                        {isVideoActive && playingVideo && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-20 bg-black"
                                style={{ borderRadius: Theme.BorderRadius.lg }}
                            >
                                <video
                                    src={images[activeIndex]?.videoSrc}
                                    className="h-full w-full object-contain"
                                    controls
                                    autoPlay
                                    playsInline
                                    onEnded={() => setPlayingVideo(false)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Horizontal thumbs — mobile */}
                {!isDesktop && (
                    <div className="lg:hidden">
                        <Swiper
                            key={`thumbs-h-${colorName}`}
                            modules={[Thumbs, FreeMode]}
                            slidesPerView={5}
                            spaceBetween={8}
                            freeMode
                            watchSlidesProgress
                            onSwiper={setThumbs}
                            className="gallery-thumbs-h"
                        >
                            {images.map((img, i) => (
                                <SwiperSlide key={img.id} className="!w-auto cursor-pointer">
                                    <ThumbSlide item={img} active={activeIndex === i} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}
            </div>
        </div>
    );
});

function ThumbSlide({ item, active }: { item: GalleryItem; active: boolean }) {
    return (
        <div
            role="button"
            tabIndex={0}
            aria-label={`View image - ${item.alt}`}
            aria-current={active ? 'true' : undefined}
            className={`relative h-20 w-full overflow-hidden rounded-lg transition-all duration-200 border-2 ${
                active ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{ borderColor: active ? Theme.colors.primaryDark : 'transparent', borderWidth: 2 }}
        >
            <img
                src={item.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
            />
            {item.type === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                        <Play size={12} fill="currentColor" style={{ color: Theme.colors.text }} />
                    </span>
                </span>
            )}
        </div>
    );
}

function GallerySlide({
    item,
    active,
    isDesktop,
    playing,
    onToggleVideo,
    onOpen,
}: {
    item: GalleryItem;
    active: boolean;
    isDesktop: boolean;
    playing: boolean;
    onToggleVideo: () => void;
    onOpen: () => void;
}) {
    if (item.type === 'video') {
        return (
            <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                    src={item.medium}
                    alt={item.alt}
                    loading={active ? 'eager' : 'lazy'}
                    decoding={active ? 'sync' : 'async'}
                    className="h-full w-full object-cover"
                />
                {!playing && (
                    <button
                        type="button"
                        aria-label="Play product video"
                        onClick={onToggleVideo}
                        className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform hover:scale-110"
                    >
                        <Play size={26} fill="currentColor" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <button
            type="button"
            aria-label={`Open image fullscreen - ${item.alt}`}
            onClick={onOpen}
            className="relative block h-full w-full cursor-zoom-in outline-none"
        >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
                <img
                    src={item.medium}
                    alt={item.alt}
                    loading={active ? 'eager' : 'lazy'}
                    decoding={active ? 'sync' : 'async'}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    onError={(e) => {
                        // Graceful fallback to a generic craft image if a photo fails to load.
                        const el = e.currentTarget;
                        if (!el.dataset.fbk) {
                            el.dataset.fbk = '1';
                            el.src =
                                'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80';
                        }
                    }}
                />
                {isDesktop && (
                    <span
                        aria-hidden="true"
                        className="absolute right-3 top-3 hidden rounded-full bg-white/85 p-1.5 opacity-0 transition-opacity duration-300 md:block group-hover/main:opacity-100"
                    >
                        <ZoomIn size={14} />
                    </span>
                )}
            </div>
        </button>
    );
}

export default ProductGallery;