import { Check } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import type { WebsiteTheme } from '../consts/themeConst';

/**
 * A miniature storefront drawn in the theme's own palette.
 *
 * Ten of these sit side by side in Settings, so the preview has to read as a
 * website at a glance: browser chrome, a nav bar, a hero with a call to action
 * and a row of product cards. Everything is built from the preset's own
 * colours and radius — nothing here borrows the admin palette except the frame
 * around it, so the cards stay visually comparable.
 */
export default function ThemePreviewCard({
    theme,
    selected,
    onSelect,
}: {
    theme: WebsiteTheme;
    selected: boolean;
    onSelect: () => void;
    }) {
    const c = theme.colors;
    /* Radii are scaled down with the mockup, with a floor so square themes stay legible. */
    const cardRadius = Math.max(5, theme.radius * 0.55);
    const chipRadius = Math.max(3, theme.radius * 0.35);

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            aria-label={`Use the ${theme.name} website theme`}
            className="group flex flex-col p-2.5 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
                backgroundColor: Theme.colors.surface,
                border: `1px solid ${selected ? Theme.colors.primaryDark : Theme.colors.border}`,
                borderRadius: Theme.BorderRadius.lg,
                boxShadow: selected ? Theme.Shadow.md : Theme.Shadow.sm,
                outlineColor: Theme.colors.primaryDark,
            }}
        >
            {/* ── The mockup ─────────────────────────────────────── */}
            <div
                className="relative overflow-hidden"
                style={{
                    backgroundColor: c.background,
                    border: `1px solid ${c.border}`,
                    borderRadius: cardRadius,
                }}
            >
                {/* Browser chrome */}
                <div className="flex items-center gap-1 px-2.5 pt-2 pb-1.5">
                    {[0, 1, 2].map((dot) => (
                        <span
                            key={dot}
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: c.border }}
                        />
                    ))}
                    <span
                        aria-hidden="true"
                        className="ml-1 h-1.5 flex-1 rounded-full"
                        style={{ backgroundColor: c.border, opacity: 0.7 }}
                    />
                </div>

                {/* Nav bar */}
                <div className="flex items-center gap-1.5 px-2.5 pb-2">
                    <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: c.primary }}
                    />
                    <span
                        aria-hidden="true"
                        className="h-1.5 w-7 rounded-full"
                        style={{ backgroundColor: c.text, opacity: 0.8 }}
                    />
                    <span className="ml-auto flex items-center gap-1">
                        {[7, 9, 6].map((width, index) => (
                            <span
                                key={index}
                                aria-hidden="true"
                                className="h-1.5 rounded-full"
                                style={{ width, backgroundColor: c.text, opacity: 0.4 }}
                            />
                        ))}
                        <span
                            aria-hidden="true"
                            className="ml-0.5 h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: c.accent }}
                        />
                    </span>
                </div>

                {/* Hero */}
                <div className="flex items-center gap-2 px-2.5 pb-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span
                            aria-hidden="true"
                            className="h-2 w-[88%] rounded-full"
                            style={{ backgroundColor: c.text, opacity: 0.92 }}
                        />
                        <span
                            aria-hidden="true"
                            className="h-2 w-[62%] rounded-full"
                            style={{ backgroundColor: c.text, opacity: 0.92 }}
                        />
                        <span
                            aria-hidden="true"
                            className="mt-0.5 h-1.5 w-[74%] rounded-full"
                            style={{ backgroundColor: c.muted, opacity: 0.65 }}
                        />
                        <span
                            aria-hidden="true"
                            className="mt-1 h-4 w-14 shrink-0"
                            style={{ backgroundColor: c.primary, borderRadius: chipRadius }}
                        />
                    </div>
                    <span
                        aria-hidden="true"
                        className="h-[62px] w-[36%] shrink-0"
                        style={{
                            background: `linear-gradient(135deg, ${c.accent}, ${c.primary})`,
                            borderRadius: cardRadius,
                        }}
                    />
                </div>

                {/* Product row */}
                <div className="grid grid-cols-3 gap-1.5 px-2.5 pb-2.5">
                    {[0, 1, 2].map((tile) => (
                        <div
                            key={tile}
                            className="flex flex-col gap-1 p-1.5"
                            style={{
                                backgroundColor: c.surface,
                                border: `1px solid ${c.border}`,
                                borderRadius: cardRadius,
                            }}
                        >
                            <span
                                aria-hidden="true"
                                className="h-6 w-full"
                                style={{ backgroundColor: c.border, borderRadius: chipRadius }}
                            />
                            <span
                                aria-hidden="true"
                                className="h-1.5 w-[82%] rounded-full"
                                style={{ backgroundColor: c.text, opacity: 0.5 }}
                            />
                            <span
                                aria-hidden="true"
                                className="h-1.5 w-[46%] rounded-full"
                                style={{ backgroundColor: c.accent }}
                            />
                        </div>
                    ))}
                </div>

                {selected && (
                    <span
                        className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full"
                        style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                    >
                        <Check size={12} />
                    </span>
                )}
            </div>

            {/* ── Card caption ───────────────────────────────────── */}
            <div className="mt-2.5 flex items-start justify-between gap-2 px-0.5">
                <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-bold" style={{ color: Theme.colors.text }}>
                        {theme.name}
                    </p>
                    <p
                        className="mt-0.5 text-[10.5px] leading-snug"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        {theme.tagline}
                    </p>
                </div>
                <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold tracking-[0.08em] uppercase"
                    style={{
                        backgroundColor: selected ? Theme.colors.primaryLight : Theme.colors.surfaceAlt,
                        color: selected ? Theme.colors.primaryDark : Theme.colors.textMuted,
                    }}
                >
                    {theme.mood}
                </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 px-0.5">
                {[c.background, c.surface, c.primary, c.accent, c.text].map((swatch, index) => (
                    <span
                        key={index}
                        aria-hidden="true"
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: swatch, border: `1px solid ${Theme.colors.border}` }}
                    />
                ))}
                <span
                    className="ml-auto text-[10px] font-semibold"
                    style={{ color: selected ? Theme.colors.primaryDark : Theme.colors.textMuted }}
                >
                    {selected ? 'Active theme' : 'Tap to use'}
                </span>
            </div>
        </button>
    );
}