import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { FLAGSHIP_PRODUCT_ID } from '@/modules/products/data/catalogData';
import { useCatalog } from '@/modules/products/store/catalogStore';
import { inr } from '@/lib/format';

const HERO_IMAGE =
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&h=1400&q=80';

const STATS = [
    { value: '1.2L+', label: 'Sheets made by hand' },
    { value: '34', label: 'Artisans in our studio' },
    { value: '19', label: 'Cities we ship to' },
];

function AnnouncementBar() {
    return (
        <div
            className="relative flex items-center justify-center px-4 py-2.5 text-center"
            style={{ background: Theme.Alert.FlashSale.backgroundGradient }}
        >
            <p
                className="text-[13px] font-medium"
                style={{ color: Theme.Alert.FlashSale.text, fontFamily: Theme.Typography.fontFamily }}
            >
                This week: 20% off garlands and streamers, ends Sunday.
            </p>
        </div>
    );
}

function HeroSection() {
    const catalog = useCatalog();
    const published = catalog.filter((product) => !product.hidden);
    // Falls back to the first published product if the flagship is ever removed in admin.
    const flagship =
        published.find((product) => product.id === FLAGSHIP_PRODUCT_ID) ?? published[0];

    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: Theme.colors.background }}>
            <AnnouncementBar />

            <div className="mx-auto grid max-w-[1500px] items-center gap-8 px-4 py-10 md:grid-cols-2 md:gap-12 md:px-6 lg:gap-16 lg:px-8 lg:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                    >
                        <Sparkles size={12} />
                        Handmade in Jaipur
                    </span>

                    <h1
                        className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                    >
                        Paper &amp; décor for the moments you want to remember
                    </h1>

                    <p
                        className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base"
                        style={{ color: Theme.colors.textLight }}
                    >
                        Small-batch handmade paper, gift wrap and home décor — pressed, cut and finished
                        by hand, then shipped across India.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Link
                            to="/shop"
                            className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                            style={{
                                background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                                color: Theme.colors.background,
                                boxShadow: Theme.Shadow.md,
                            }}
                        >
                            Shop the collection
                            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            to="/about"
                            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors hover:bg-black/5"
                            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                        >
                            Our story
                        </Link>
                    </div>

                    <dl className="mt-9 grid grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: Theme.colors.border }}>
                        {STATS.map((stat) => (
                            <div key={stat.label}>
                                <dt className="sr-only">{stat.label}</dt>
                                <dd>
                                    <span
                                        className="block text-xl font-bold tabular-nums sm:text-2xl"
                                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                                    >
                                        {stat.value}
                                    </span>
                                    <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                                        {stat.label}
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                </motion.div>

                <motion.div
                    className="relative"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
                >
                    <div
                        className="overflow-hidden"
                        style={{ borderRadius: Theme.BorderRadius.xl, boxShadow: Theme.Shadow.lg }}
                    >
                        <img
                            src={HERO_IMAGE}
                            alt="Hands pressing fresh sheets of handmade paper on a wooden deckle"
                            width={1200}
                            height={1400}
                            decoding="async"
                            className="h-[280px] w-full object-cover sm:h-[380px] lg:h-[460px]"
                        />
                    </div>

                    {flagship && (
                        <Link
                            to={`/product/${flagship.id}`}
                            className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg transition-transform hover:-translate-y-0.5 sm:left-6"
                            style={{ backgroundColor: Theme.colors.surface, border: `1px solid ${Theme.colors.border}` }}
                        >
                            <img
                                src={flagship.image}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="h-11 w-11 rounded-lg object-cover"
                            />
                            <span className="min-w-0">
                                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: Theme.colors.textMuted }}>
                                    Bestseller
                                </span>
                                <span className="block max-w-[190px] truncate text-sm font-semibold" style={{ color: Theme.colors.text }}>
                                    {flagship.name}
                                </span>
                                <span className="block text-xs font-bold" style={{ color: Theme.colors.primaryDark }}>
                                    {inr(flagship.price)}
                                </span>
                            </span>
                        </Link>
                    )}
                </motion.div>
            </div>
        </section>
    );
}

export default HeroSection;
