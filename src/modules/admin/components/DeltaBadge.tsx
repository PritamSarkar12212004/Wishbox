import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

/**
 * Percentage change against the previous period.
 *
 * `invert` marks metrics where a rise is bad news (returns, cancellations,
 * delayed shipments), so the colour follows the business meaning rather than
 * the direction of the arrow.
 */
export default function DeltaBadge({
    value,
    invert = false,
}: {
    value: number | null;
    invert?: boolean;
}) {
    if (value === null) {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }}
            >
                <Minus size={11} />
                new
            </span>
        );
    }

    const flat = Math.abs(value) < 0.5;
    const good = invert ? value < 0 : value > 0;
    const color = flat ? Theme.colors.textMuted : good ? Theme.colors.primaryDark : Theme.colors.accentDark;
    const background = flat
        ? Theme.colors.surfaceAlt
        : good
          ? Theme.colors.primaryLight
          : `color-mix(in srgb, ${Theme.colors.accent} 20%, ${Theme.colors.surface})`;

    return (
        <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
            style={{ backgroundColor: background, color }}
        >
            {flat ? <Minus size={11} /> : value > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {flat ? '0%' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
        </span>
    );
}
