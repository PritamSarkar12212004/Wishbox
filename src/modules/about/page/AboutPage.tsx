import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
    type MotionValue,
} from 'framer-motion';
import {
    ArrowDown,
    ArrowRight,
    Handshake,
    Leaf,
    Mail,
    MessageCircle,
    Scissors,
    Sparkles,
    Wind,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import InstagramIcon from '@/components/icons/InstagramIcon';
import { SOCIALS } from '@/modules/contact/data/contactData';
import {
    CTA,
    FALLBACK_IMAGE,
    GALLERY,
    HERO,
    JOURNEY,
    MATERIALS,
    PROCESS,
    STATS,
    STORY,
    TEAM,
    VALUES,
} from '../data/aboutData';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const VALUE_ICONS: Record<(typeof VALUES)[number]['icon'], typeof Leaf> = {
    handshake: Handshake,
    leaf: Leaf,
    scissors: Scissors,
    wind: Wind,
};

/** Sections sit on the page background; panels use the surface colour. */
const themeVars = {
    '--c-surface-alt': Theme.colors.surfaceAlt,
    '--c-accent-dark': Theme.colors.accentDark,
    '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/* ------------------------------------------------------------------ */
/*  Scroll primitives                                                  */
/* ------------------------------------------------------------------ */

/** Fades + lifts content the first time it scrolls into view. */
function Reveal({
    children,
    delay = 0,
    y = 26,
    className,
}: {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

/** Image that drifts slightly as it passes through the viewport. */
function ParallaxImage({
    src,
    alt,
    className,
    distance = 40,
    rounded = true,
}: {
    src: string;
    alt: string;
    className?: string;
    distance?: number;
    rounded?: boolean;
}) {
    const reduceMotion = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
    const soft = useSpring(y, { stiffness: 90, damping: 26, mass: 0.4 });

    return (
        <div
            ref={ref}
            className={cn('relative overflow-hidden', rounded && 'rounded-3xl', className)}
            style={{ backgroundColor: Theme.colors.surfaceAlt }}
        >
            <motion.img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                style={{ y: reduceMotion ? 0 : soft, scale: 1.12 }}
                className="h-full w-full object-cover"
                onError={(event) => {
                    const el = event.currentTarget;
                    if (!el.dataset.fbk) {
                        el.dataset.fbk = '1';
                        el.src = FALLBACK_IMAGE;
                    }
                }}
            />
        </div>
    );
}

/** Number that counts up when it first enters the viewport. */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
    const reduceMotion = useReducedMotion();
    const [display, setDisplay] = useState(0);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started || reduceMotion) return;
        const duration = 1500;
        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            // easeOutCubic so the number decelerates into its final value.
            setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [started, value, reduceMotion]);

    const shown = reduceMotion ? value : display;

    return (
        <motion.span
            onViewportEnter={() => setStarted(true)}
            viewport={{ once: true, amount: 0.4 }}
            className="tabular-nums"
        >
            {shown.toLocaleString('en-IN')}
            {suffix}
        </motion.span>
    );
}

/** Thin accent line pinned under the sticky header while you read. */
function ReadingProgress({ progress }: { progress: MotionValue<number> }) {
    return (
        <div
            className="sticky top-16 z-40 h-[3px] w-full md:top-20"
            style={{ backgroundColor: Theme.colors.border }}
            aria-hidden="true"
        >
            <motion.div
                className="h-full origin-left"
                style={{
                    scaleX: progress,
                    background: `linear-gradient(90deg, ${Theme.colors.primary}, ${Theme.colors.accent})`,
                }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Sections                                                           */
/* ------------------------------------------------------------------ */

function Hero() {
    const reduceMotion = useReducedMotion();
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
    const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
    const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '34%']);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

    return (
        <section
            ref={ref}
            className="relative isolate flex min-h-[62vh] items-end overflow-hidden sm:min-h-[72vh] lg:min-h-[80vh]"
            aria-label="About WishBox"
        >
            <motion.div
                className="absolute inset-0 -z-10"
                style={{ y: reduceMotion ? 0 : imageY }}
            >
                <img
                    src={HERO.image}
                    alt={HERO.imageAlt}
                    className="h-[118%] w-full object-cover"
                    onError={(event) => {
                        const el = event.currentTarget;
                        if (!el.dataset.fbk) {
                            el.dataset.fbk = '1';
                            el.src = FALLBACK_IMAGE;
                        }
                    }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(105deg, rgba(26,22,20,0.82) 0%, rgba(26,22,20,0.55) 45%, rgba(26,22,20,0.18) 100%)`,
                    }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-40"
                    style={{ background: `linear-gradient(to top, ${Theme.colors.background}, transparent)` }}
                />
            </motion.div>

            <motion.div
                className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 md:pb-16 lg:px-8"
                style={{ y: reduceMotion ? 0 : contentY, opacity: reduceMotion ? 1 : contentOpacity }}
            >
                <span
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm"
                    style={{
                        borderColor: 'rgba(255,255,255,0.32)',
                        backgroundColor: 'rgba(26,22,20,0.35)',
                        color: '#FAF6F0',
                    }}
                >
                    <Sparkles size={12} />
                    {HERO.eyebrow}
                </span>

                <h1
                    className="mt-4 max-w-3xl text-[30px] font-bold leading-[1.08] tracking-tight text-[#FAF6F0] sm:text-5xl lg:text-[56px]"
                    style={{ fontFamily: Theme.Typography?.headingFamily }}
                >
                    {HERO.title}
                </h1>

                <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#EDE4DA] sm:text-base">
                    {HERO.lead}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <Link
                        to="/contact"
                        className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                        style={{
                            background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                            color: Theme.colors.white,
                            boxShadow: Theme.Shadow.lg,
                        }}
                    >
                        Visit the studio
                        <ArrowRight size={15} />
                    </Link>
                    <Link
                        to="/"
                        className="inline-flex h-11 items-center gap-2 rounded-full border px-6 text-[13px] font-semibold text-[#FAF6F0] backdrop-blur-sm transition-colors hover:bg-white/10"
                        style={{ borderColor: 'rgba(255,255,255,0.38)' }}
                    >
                        Browse the paper
                    </Link>
                </div>

                <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-3 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.22)' }}>
                    {HERO.facts.map((fact) => (
                        <div key={fact.label}>
                            <dt
                                className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#D9CEC2] sm:text-[10px]"
                            >
                                {fact.label}
                            </dt>
                            <dd className="mt-1 text-[12.5px] font-semibold text-[#FAF6F0] sm:text-sm">
                                {fact.value}
                            </dd>
                        </div>
                    ))}
                </dl>

                <motion.div
                    className="mt-8 hidden items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#D9CEC2] sm:flex"
                    animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ArrowDown size={14} />
                    Scroll the story
                </motion.div>
            </motion.div>
        </section>
    );
}

function StatsBand() {
    return (
        <section
            className="border-y"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
            aria-label="WishBox by the numbers"
        >
            <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-7 px-4 py-9 sm:px-6 md:grid-cols-4 md:py-11 lg:px-8">
                {STATS.map((stat, index) => (
                    <Reveal key={stat.label} delay={index * 0.08}>
                        <div>
                            <dd
                                className="text-2xl font-bold leading-none sm:text-3xl lg:text-4xl"
                                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                            >
                                <CountUp value={stat.value} suffix={stat.suffix} />
                            </dd>
                            <dt
                                className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] sm:text-xs"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {stat.label}
                            </dt>
                        </div>
                    </Reveal>
                ))}
            </dl>
        </section>
    );
}

function Story() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20" aria-labelledby="story-heading">
            <div className="grid gap-8 md:grid-cols-12 md:gap-10 lg:gap-14">
                <div className="md:col-span-7">
                    <Reveal>
                        <p
                            className="text-[10px] font-bold uppercase tracking-[0.18em]"
                            style={{ color: Theme.colors.primaryDark }}
                        >
                            {STORY.kicker}
                        </p>
                        <h2
                            id="story-heading"
                            className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-4xl"
                            style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                        >
                            {STORY.title}
                        </h2>
                    </Reveal>

                    <div className="mt-5 space-y-4 text-[14px] leading-relaxed sm:text-[15px]" style={{ color: Theme.colors.textLight }}>
                        {STORY.paragraphs.map((paragraph, index) => (
                            <Reveal key={paragraph.slice(0, 24)} delay={0.1 + index * 0.08}>
                                <p>
                                    {index === 0 ? (
                                        <span
                                            className="float-left mr-2 mt-1 font-bold"
                                            style={{
                                                fontFamily: Theme.Typography?.headingFamily,
                                                fontSize: '2.75rem',
                                                lineHeight: '0.85',
                                                color: Theme.colors.primaryDark,
                                            }}
                                        >
                                            {paragraph.charAt(0)}
                                        </span>
                                    ) : null}
                                    {index === 0 ? paragraph.slice(1) : paragraph}
                                </p>
                            </Reveal>
                        ))}

                        <Reveal delay={0.26}>
                            <p
                                className="pt-1 text-base italic"
                                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                            >
                                — {STORY.signature}
                            </p>
                        </Reveal>
                    </div>
                </div>

                <div className="md:col-span-5">
                    <Reveal delay={0.12}>
                        <ParallaxImage
                            src={STORY.image}
                            alt={STORY.imageAlt}
                            className="h-64 w-full sm:h-80 md:h-[430px]"
                            distance={34}
                        />
                    </Reveal>
                    <Reveal delay={0.2}>
                        <div className="-mt-10 ml-auto hidden w-40 lg:block">
                            <ParallaxImage
                                src={STORY.collage}
                                alt={STORY.collageAlt}
                                className="h-40 w-40 shadow-lg"
                                distance={22}
                            />
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function Values() {
    return (
        <section
            className="border-y"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
            aria-labelledby="values-heading"
        >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                <Reveal>
                    <h2
                        id="values-heading"
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                        style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                    >
                        What we will not compromise on
                    </h2>
                    <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                        Four rules the studio has kept since the very first lumpy batch.
                    </p>
                </Reveal>

                <ul className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    {VALUES.map((value, index) => {
                        const Icon = VALUE_ICONS[value.icon];
                        return (
                            <li key={value.title}>
                                <Reveal delay={index * 0.08}>
                                    <div
                                        className="flex h-full flex-col rounded-2xl border p-4 transition-transform duration-300 hover:-translate-y-1 sm:p-5"
                                        style={{
                                            borderColor: Theme.colors.border,
                                            backgroundColor: Theme.colors.surface,
                                            boxShadow: Theme.Shadow.sm,
                                        }}
                                    >
                                        <span
                                            className="grid h-10 w-10 place-items-center rounded-full"
                                            style={{
                                                backgroundColor: Theme.colors.primaryLight,
                                                color: Theme.colors.primaryDark,
                                            }}
                                        >
                                            <Icon size={18} />
                                        </span>
                                        <h3
                                            className="mt-3.5 text-[15px] font-bold"
                                            style={{ color: Theme.colors.text }}
                                        >
                                            {value.title}
                                        </h3>
                                        <p
                                            className="mt-1.5 text-[12.5px] leading-relaxed"
                                            style={{ color: Theme.colors.textLight }}
                                        >
                                            {value.body}
                                        </p>
                                    </div>
                                </Reveal>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

function Journey() {
    const reduceMotion = useReducedMotion();
    const timelineRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: timelineRef,
        offset: ['start 75%', 'end 65%'],
    });
    const lineProgress = useSpring(scrollYProgress, { stiffness: 110, damping: 30, mass: 0.35 });

    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20" aria-labelledby="journey-heading">
            <Reveal>
                <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: Theme.colors.primaryDark }}
                >
                    The journey
                </p>
                <h2
                    id="journey-heading"
                    className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl"
                    style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                >
                    Ten years, one deckle
                </h2>
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                    Scroll the line — every marker is a year the studio changed shape.
                </p>
            </Reveal>

            <div ref={timelineRef} className="relative mt-9 md:mt-12">
                {/* Rail + scroll-linked fill */}
                <div
                    className="absolute bottom-3 left-[15px] top-3 w-px md:left-1/2 md:-translate-x-1/2"
                    style={{ backgroundColor: Theme.colors.border }}
                    aria-hidden="true"
                />
                <motion.div
                    className="absolute bottom-3 left-[15px] top-3 w-[3px] origin-top rounded-full md:left-1/2 md:-translate-x-1/2"
                    style={{
                        scaleY: reduceMotion ? 1 : lineProgress,
                        background: `linear-gradient(to bottom, ${Theme.colors.primary}, ${Theme.colors.accent})`,
                    }}
                    aria-hidden="true"
                />

                <ol className="flex flex-col gap-8 md:gap-12">
                    {JOURNEY.map((milestone, index) => {
                        const rightSide = index % 2 === 1;
                        return (
                            <li
                                key={milestone.year}
                                className="relative pl-10 md:grid md:grid-cols-2 md:gap-12 md:pl-0"
                            >
                                {/* Marker */}
                                <motion.span
                                    className="absolute left-[9px] top-1.5 grid h-4 w-4 place-items-center rounded-full border-2 md:left-1/2 md:-translate-x-1/2"
                                    style={{
                                        borderColor: Theme.colors.background,
                                        backgroundColor: Theme.colors.borderStrong,
                                        zIndex: 1,
                                    }}
                                    initial={{ scale: 0.6, opacity: 0.5 }}
                                    whileInView={{
                                        scale: 1,
                                        opacity: 1,
                                        backgroundColor: Theme.colors.accent,
                                    }}
                                    viewport={{ once: true, amount: 1 }}
                                    transition={{ duration: 0.4 }}
                                />

                                <Reveal
                                    delay={0.05}
                                    y={reduceMotion ? 0 : 28}
                                    className={cn(
                                        rightSide
                                            ? 'md:col-start-2 md:pl-12'
                                            : 'md:col-start-1 md:pr-12 md:text-right'
                                    )}
                                >
                                    <div
                                        className="rounded-2xl border p-4 sm:p-5"
                                        style={{
                                            borderColor: Theme.colors.border,
                                            backgroundColor: Theme.colors.surface,
                                            boxShadow: Theme.Shadow.sm,
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'flex items-center gap-3',
                                                !rightSide && 'md:flex-row-reverse'
                                            )}
                                        >
                                            <span
                                                className="rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
                                                style={{
                                                    backgroundColor: Theme.colors.text,
                                                    color: Theme.colors.background,
                                                }}
                                            >
                                                {milestone.year}
                                            </span>
                                            <img
                                                src={milestone.image}
                                                alt={milestone.imageAlt}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-12 w-12 shrink-0 rounded-xl object-cover"
                                                onError={(event) => {
                                                    const el = event.currentTarget;
                                                    if (!el.dataset.fbk) {
                                                        el.dataset.fbk = '1';
                                                        el.src = FALLBACK_IMAGE;
                                                    }
                                                }}
                                            />
                                        </div>

                                        <h3
                                            className="mt-3 text-[16px] font-bold sm:text-lg"
                                            style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                                        >
                                            {milestone.title}
                                        </h3>
                                        <p
                                            className="mt-1.5 text-[12.5px] leading-relaxed sm:text-[13px]"
                                            style={{ color: Theme.colors.textLight }}
                                        >
                                            {milestone.body}
                                        </p>
                                    </div>
                                </Reveal>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

function Process() {
    return (
        <section
            className="border-y"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
            aria-labelledby="process-heading"
        >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
                <Reveal>
                    <h2
                        id="process-heading"
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                        style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                    >
                        From rag to sheet, in four moves
                    </h2>
                    <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                        One batch takes six days. Here is where every one of them goes.
                    </p>
                </Reveal>

                <ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {PROCESS.map((step, index) => (
                        <li key={step.step} className="relative">
                            <Reveal delay={index * 0.09}>
                                <div
                                    className="flex h-full flex-col overflow-hidden rounded-2xl border"
                                    style={{
                                        borderColor: Theme.colors.border,
                                        backgroundColor: Theme.colors.surface,
                                        boxShadow: Theme.Shadow.sm,
                                    }}
                                >
                                    <div className="relative h-36 w-full overflow-hidden sm:h-40">
                                        <img
                                            src={step.image}
                                            alt={step.imageAlt}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                            onError={(event) => {
                                                const el = event.currentTarget;
                                                if (!el.dataset.fbk) {
                                                    el.dataset.fbk = '1';
                                                    el.src = FALLBACK_IMAGE;
                                                }
                                            }}
                                        />
                                        <span
                                            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em]"
                                            style={{
                                                backgroundColor: 'rgba(26,22,20,0.72)',
                                                color: Theme.colors.background,
                                                backdropFilter: 'blur(4px)',
                                            }}
                                        >
                                            {step.step}
                                        </span>
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <h3 className="text-[15px] font-bold" style={{ color: Theme.colors.text }}>
                                            {step.title}
                                        </h3>
                                        <p
                                            className="mt-1.5 text-[12.5px] leading-relaxed"
                                            style={{ color: Theme.colors.textLight }}
                                        >
                                            {step.body}
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        </li>
                    ))}
                </ol>

                <Reveal delay={0.12}>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                        {MATERIALS.map((item) => (
                            <li
                                key={item.title}
                                className="flex items-start gap-3 rounded-2xl border px-4 py-3.5"
                                style={{
                                    borderColor: Theme.colors.border,
                                    backgroundColor: Theme.colors.surface,
                                }}
                            >
                                <Leaf size={16} className="mt-0.5 shrink-0" style={{ color: Theme.colors.primaryDark }} />
                                <div>
                                    <p className="text-[13px] font-semibold" style={{ color: Theme.colors.text }}>
                                        {item.title}
                                    </p>
                                    <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                                        {item.body}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Reveal>
            </div>
        </section>
    );
}

function Team() {
    const reduceMotion = useReducedMotion();

    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-20" aria-labelledby="team-heading">
            <Reveal>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: Theme.colors.primaryDark }}>
                    The people
                </p>
                <h2
                    id="team-heading"
                    className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl"
                    style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                >
                    Hands behind the paper
                </h2>
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                    Six of the thirty-four people who pull, press, check and pack every sheet.
                </p>
            </Reveal>

            <ul className="mt-7 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:gap-5">
                {TEAM.map((member, index) => (
                    <li key={member.name}>
                        <Reveal delay={(index % 3) * 0.08} y={reduceMotion ? 0 : 22}>
                            <article
                                className="group h-full overflow-hidden rounded-2xl border"
                                style={{
                                    borderColor: Theme.colors.border,
                                    backgroundColor: Theme.colors.surface,
                                    boxShadow: Theme.Shadow.sm,
                                }}
                            >
                                <div className="relative overflow-hidden">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-40 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-48 md:h-56"
                                        onError={(event) => {
                                            const el = event.currentTarget;
                                            if (!el.dataset.fbk) {
                                                el.dataset.fbk = '1';
                                                el.src = FALLBACK_IMAGE;
                                            }
                                        }}
                                    />

                                    {/* Initials badge — also the graceful fallback look */}
                                    <span
                                        className="absolute left-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold sm:left-3 sm:top-3"
                                        style={{
                                            backgroundColor: 'rgba(250,246,240,0.9)',
                                            color: Theme.colors.primaryDark,
                                            backdropFilter: 'blur(4px)',
                                        }}
                                        aria-hidden="true"
                                    >
                                        {member.initials}
                                    </span>

                                    {/* Socials on hover / keyboard focus */}
                                    <div
                                        className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-2.5 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100"
                                        style={{
                                            background: 'linear-gradient(to top, rgba(26,22,20,0.78), transparent)',
                                        }}
                                    >
                                        {[
                                            { href: SOCIALS.instagram, label: `${member.name} on Instagram`, icon: 'instagram' as const },
                                            { href: SOCIALS.whatsapp, label: `WhatsApp about ${member.name}`, icon: 'whatsapp' as const },
                                            { href: SOCIALS.email, label: `Email ${member.name}`, icon: 'mail' as const },
                                        ].map((social) => (
                                            <a
                                                key={social.label}
                                                href={social.href}
                                                target={social.icon === 'mail' ? undefined : '_blank'}
                                                rel={social.icon === 'mail' ? undefined : 'noopener noreferrer'}
                                                aria-label={social.label}
                                                className="grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-110"
                                                style={{ backgroundColor: 'rgba(250,246,240,0.92)', color: Theme.colors.text }}
                                            >
                                                {social.icon === 'instagram' ? (
                                                    <InstagramIcon size={14} color={Theme.colors.accentDark} />
                                                ) : social.icon === 'whatsapp' ? (
                                                    <MessageCircle size={14} />
                                                ) : (
                                                    <Mail size={14} />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3.5 sm:p-4">
                                    <h3 className="text-[14px] font-bold sm:text-[15px]" style={{ color: Theme.colors.text }}>
                                        {member.name}
                                    </h3>
                                    <p
                                        className="mt-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
                                        style={{ color: Theme.colors.primaryDark }}
                                    >
                                        {member.role}
                                    </p>
                                    <p className="mt-2 text-[12px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                                        {member.bio}
                                    </p>
                                </div>
                            </article>
                        </Reveal>
                    </li>
                ))}
            </ul>

            <Reveal delay={0.1}>
                <div
                    className="mt-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                        borderColor: Theme.colors.border,
                        backgroundColor: Theme.colors.surfaceAlt,
                    }}
                >
                    <div>
                        <h3 className="text-[15px] font-bold" style={{ color: Theme.colors.text }}>
                            We are hiring paper-makers
                        </h3>
                        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                            No experience needed — we train every new hand for six weeks. Tell us why paper.
                        </p>
                    </div>
                    <Link
                        to="/contact"
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                        style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                    >
                        Write to us
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </Reveal>
        </section>
    );
}

function StudioGallery() {
    return (
        <section
            className="border-y py-12 md:py-16"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface }}
            aria-labelledby="gallery-heading"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Reveal>
                    <h2
                        id="gallery-heading"
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                        style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                    >
                        Inside the studio
                    </h2>
                    <p className="mt-2 text-[13.5px]" style={{ color: Theme.colors.textLight }}>
                        Swipe through a normal working day in C-Scheme.
                    </p>
                </Reveal>
            </div>

            {/* The strip reveals as one unit: per-tile reveals would leave the
                off-screen tiles (inside the horizontal scroller) invisible. */}
            <Reveal className="mt-6">
                <div
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="list"
                    aria-label="Studio photographs"
                >
                    {GALLERY.map((photo) => (
                        <div
                            key={photo.src}
                            className="h-40 w-56 shrink-0 snap-start overflow-hidden rounded-2xl sm:h-48 sm:w-72 lg:h-56 lg:w-80"
                        >
                            <img
                                src={photo.src}
                                alt={photo.alt}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                                onError={(event) => {
                                    const el = event.currentTarget;
                                    if (!el.dataset.fbk) {
                                        el.dataset.fbk = '1';
                                        el.src = FALLBACK_IMAGE;
                                    }
                                }}
                            />
                        </div>
                    ))}
                </div>
            </Reveal>
        </section>
    );
}

function ClosingCta() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8" aria-labelledby="cta-heading">
            <Reveal>
                <div
                    className="relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 md:py-14"
                    style={{
                        background: `linear-gradient(135deg, ${Theme.colors.surfaceAlt} 0%, ${Theme.colors.surface} 45%, color-mix(in srgb, ${Theme.colors.primaryLight} 34%, ${Theme.colors.surface}) 100%)`,
                        border: `1px solid ${Theme.colors.border}`,
                    }}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full"
                        style={{
                            background: `radial-gradient(circle, color-mix(in srgb, ${Theme.colors.accent} 26%, transparent), transparent 70%)`,
                        }}
                    />
                    <h2
                        id="cta-heading"
                        className="relative text-2xl font-bold tracking-tight sm:text-4xl"
                        style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
                    >
                        {CTA.title}
                    </h2>
                    <p className="relative mt-3 max-w-xl text-[13.5px] leading-relaxed sm:text-sm" style={{ color: Theme.colors.textLight }}>
                        {CTA.body}
                    </p>
                    <div className="relative mt-6 flex flex-wrap gap-2.5">
                        <Link
                            to="/contact"
                            className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-[13px] font-semibold transition-transform hover:-translate-y-0.5"
                            style={{
                                background: `linear-gradient(135deg, ${Theme.colors.accent}, ${Theme.colors.accentDark})`,
                                color: Theme.colors.white,
                                boxShadow: Theme.Shadow.md,
                            }}
                        >
                            Book a studio visit
                            <ArrowRight size={15} />
                        </Link>
                        <Link
                            to="/"
                            className="inline-flex h-11 items-center gap-2 rounded-full border px-6 text-[13px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)]"
                            style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                        >
                            Shop the collection
                        </Link>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function AboutPage() {
    const { scrollYProgress } = useScroll();

    return (
        <div className="min-h-full w-full" style={{ ...themeVars, backgroundColor: Theme.colors.background }}>
            <ReadingProgress progress={scrollYProgress} />
            <Hero />
            <StatsBand />
            <Story />
            <Values />
            <Journey />
            <Process />
            <Team />
            <StudioGallery />
            <ClosingCta />
        </div>
    );
}

export default AboutPage;
