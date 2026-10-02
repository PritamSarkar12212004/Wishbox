import Theme from '@/assets/Theme/Theme';

export type DonutSegment = {
    label: string;
    value: number;
    color: string;
    /** Right-hand caption, e.g. the amount behind the count. */
    meta?: string;
};

/**
 * Donut with a legend. Rendered as stroke-dasharray arcs on a single circle —
 * no dependency, and the centre label stays crisp because it is HTML, not SVG
 * text.
 */
export default function DonutChart({
    segments,
    centerValue,
    centerLabel,
    size = 168,
}: {
    segments: DonutSegment[];
    centerValue: string;
    centerLabel: string;
    size?: number;
}) {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex flex-wrap items-center gap-5">
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg viewBox="0 0 168 168" className="h-full w-full -rotate-90">
                    <circle
                        cx={84}
                        cy={84}
                        r={radius}
                        fill="none"
                        stroke={Theme.colors.surfaceAlt}
                        strokeWidth={18}
                    />
                    {total > 0 &&
                        segments.map((segment) => {
                            const length = (segment.value / total) * circumference;
                            const element = (
                                <circle
                                    key={segment.label}
                                    cx={84}
                                    cy={84}
                                    r={radius}
                                    fill="none"
                                    stroke={segment.color}
                                    strokeWidth={18}
                                    strokeDasharray={`${length} ${circumference - length}`}
                                    strokeDashoffset={-offset}
                                    strokeLinecap="butt"
                                />
                            );
                            offset += length;
                            return element;
                        })}
                </svg>
                <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                    <p
                        className="text-lg font-bold tabular-nums"
                        style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
                    >
                        {centerValue}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: Theme.colors.textMuted }}>
                        {centerLabel}
                    </p>
                </div>
            </div>

            <ul className="flex min-w-[180px] flex-1 flex-col gap-2.5">
                {segments.map((segment) => (
                    <li key={segment.label} className="flex items-center gap-2.5 text-xs">
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: segment.color }}
                        />
                        <span className="min-w-0 flex-1 truncate" style={{ color: Theme.colors.textLight }}>
                            {segment.label}
                        </span>
                        {segment.meta && (
                            <span className="shrink-0 tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                {segment.meta}
                            </span>
                        )}
                        <span className="w-12 shrink-0 text-right font-semibold tabular-nums">
                            {total > 0 ? Math.round((segment.value / total) * 100) : 0}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
