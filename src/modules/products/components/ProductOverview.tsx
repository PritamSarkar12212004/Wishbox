import { useState, memo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Ruler, Layers, Droplets, Shield } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { PRODUCT_HIGHLIGHTS, SPECIFICATIONS, SIZE_GUIDE, GSM_GUIDE, CARE_TIPS } from '../data/productData';

function SectionHeader({ title, icon: Icon }: { title: string; icon: typeof Check }) {
    return (
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight" style={{ color: Theme.colors.text }}>
            {Icon && <Icon size={18} style={{ color: Theme.colors.primaryDark }} />}
            {title}
        </h2>
    );
}

function Panel({ children }: { children: ReactNode }) {
    return (
        <section
            className="rounded-2xl border p-5 md:p-6"
            style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface, boxShadow: Theme.Shadow.sm }}
        >
            {children}
        </section>
    );
}

function Highlights() {
    return (
        <Panel>
            <SectionHeader title="Product Highlights" icon={Check} />
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                {PRODUCT_HIGHLIGHTS.map((h) => (
                    <li key={h} className="flex items-center gap-2.5 text-sm" style={{ color: Theme.colors.textLight }}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: Theme.colors.primaryLight }}>
                            <Check size={12} strokeWidth={3} style={{ color: Theme.colors.primaryDark }} />
                        </span>
                        {h}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

function Description() {
    const [expanded, setExpanded] = useState(false);
    const longText =
        'Every sheet is cut by hand, dried flat and individually inspected to deliver a consistent, premium finish. The fibre blends rich texture with reliable strength, so the paper behaves beautifully whether you fold, cut or glue it.';

    return (
        <Panel>
            <SectionHeader title="About this product" icon={Shield} />
            <div className="mt-4 space-y-3 text-sm leading-relaxed" style={{ color: Theme.colors.textLight }}>
                <p>
                    Premium handmade decorative paper designed for gifting, crafting, event decoration and
                    creative projects. Its smooth matte surface takes ink and paint beautifully, making it a
                    favourite among designers, students and small businesses.
                </p>
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden space-y-3"
                        >
                            <p>{longText}</p>
                            <p className="font-semibold" style={{ color: Theme.colors.text }}>Perfect for:</p>
                            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                {[
                                    'Gift wrapping',
                                    'Wedding decoration',
                                    'Birthday decoration',
                                    'Scrapbooking',
                                    'DIY crafts',
                                    'Festival decoration',
                                    'Event decoration',
                                    'Handmade cards',
                                ].map((use) => (
                                    <li key={use} className="flex items-center gap-2">
                                        <Check size={13} strokeWidth={3} style={{ color: Theme.colors.accent }} />
                                        {use}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-3 flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                style={{ color: Theme.colors.primaryDark }}
            >
                {expanded ? 'Read less' : 'Read more'}
                <ChevronDown size={14} className="transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
            </button>
        </Panel>
    );
}

function Specifications() {
    return (
        <Panel>
            <SectionHeader title="Specifications" icon={Layers} />
            <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {SPECIFICATIONS.map((s) => (
                    <div key={s.label} className="flex items-center justify-between gap-4 border-b py-2.5 text-sm last:border-b-0"
                        style={{ borderColor: Theme.colors.border }}>
                        <dt style={{ color: Theme.colors.textMuted }}>{s.label}</dt>
                        <dd className="font-medium text-right" style={{ color: Theme.colors.text }}>{s.value}</dd>
                    </div>
                ))}
            </dl>
        </Panel>
    );
}

function SizeGuide() {
    return (
        <Panel>
            <SectionHeader title="Paper Size Guide" icon={Ruler} />
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center items-start">
                {SIZE_GUIDE.map((s) => (
                    <div key={s.label} className="flex w-full flex-col items-center rounded-xl border p-3 text-center"
                        style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}>
                        <div
                            className="mt-2 rounded-sm"
                            style={{
                                width: '42px',
                                height: s.width && s.height ? `${Math.round((42 * s.height) / s.width * 100) / 100}px` : '42px',
                                maxHeight: '56px',
                                backgroundColor: Theme.colors.borderStrong,
                            }}
                        />
                        <span className="mt-2.5 text-sm font-bold" style={{ color: Theme.colors.text }}>{s.label}</span>
                        {s.width && s.height ? (
                            <span className="text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                                {s.width} × {s.height} inch
                            </span>
                        ) : (
                            <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>Available</span>
                        )}
                        <span className="text-[10px]" style={{ color: Theme.colors.textMuted }}>{s.note}</span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function GsmGuide() {
    return (
        <Panel>
            <SectionHeader title="GSM Guide" icon={Droplets} />
            <div className="mt-5 flex items-end gap-5">
                {GSM_GUIDE.map((g) => (
                    <div key={g.range} className="flex flex-1 flex-col items-center gap-2.5">
                        <div className="w-full rounded-md"
                            style={{ height: g.height, backgroundColor: g.color }} />
                        <span className="text-xs font-semibold" style={{ color: Theme.colors.text }}>{g.range}</span>
                        <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>{g.label}</span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function CareGuide() {
    return (
        <Panel>
            <SectionHeader title="Usage & Care" icon={Shield} />
            <ul className="mt-4 space-y-2.5 text-sm">
                {CARE_TIPS.map((tip) => (
                    <li key={tip} className="flex items-center gap-2.5" style={{ color: Theme.colors.textLight }}>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: Theme.colors.primaryLight }}>
                            <Check size={12} strokeWidth={3} style={{ color: Theme.colors.primaryDark }} />
                        </span>
                        {tip}
                    </li>
                ))}
            </ul>
        </Panel>
    );
}

export default memo(function ProductOverview() {
    return (
        <div id="overview" className="flex flex-col gap-5">
            <Highlights />
            <Description />
            <Specifications />
            <SizeGuide />
            <GsmGuide />
            <CareGuide />
        </div>
    );
});