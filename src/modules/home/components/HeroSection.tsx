import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { useHomeContent } from '../store/homeStore';

/**
 * The storefront hero.
 *
 * The copy is the admin's (`GET /content` → `home.hero`), edited on Website →
 * Home hero, so a headline change goes live without a deploy. Copy and one call
 * to action only: the photography lives on the product cards below, and the
 * alert strip above already carries the running offers.
 */
function HeroSection() {
    const { hero } = useHomeContent();

    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: Theme.colors.background }}>
            <div className="mx-auto max-w-[1500px] px-4 py-14 md:px-6 md:py-20 lg:px-8 lg:py-24">
                <motion.div
                    className="mx-auto flex max-w-3xl flex-col items-center text-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {hero.eyebrow.trim() && (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                            style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                        >
                            <Sparkles size={12} />
                            {hero.eyebrow}
                        </span>
                    )}

                    {/* An empty headline renders nothing rather than a blank heading. */}
                    {hero.title.trim() && (
                        <h1
                            className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
                            style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                        >
                            {hero.title}
                        </h1>
                    )}

                    {hero.lead.trim() && (
                        <p
                            className="mt-4 max-w-xl text-sm leading-relaxed sm:text-base"
                            style={{ color: Theme.colors.textLight }}
                        >
                            {hero.lead}
                        </p>
                    )}

                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
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
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

export default HeroSection;
