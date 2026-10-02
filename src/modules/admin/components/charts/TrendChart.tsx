import { useState } from 'react';
import Theme from '@/assets/Theme/Theme';

/**
 * Responsive SVG trend chart, hand-rolled to keep the bundle free of a charting
 * dependency.
 *
 * The plot uses `preserveAspectRatio="none"` so it fills any width, with
 * `vector-effect="non-scaling-stroke"` keeping line weights honest. Everything
 * that must stay circular or legible (gridline labels, hover dot, tooltip) is
 * plain HTML layered on top rather than SVG text.
 */

export type TrendPoint = {
    label: string;
    value: number;
    /** Same bucket in the previous period — drawn as a dashed comparison line. */
    previous?: number;
    /** Optional secondary volume (e.g. order count) drawn as faint bars. */
    bars?: number;
};

type TrendChartProps = {
    points: TrendPoint[];
    format: (value: number) => string;
    barFormat?: (value: number) => string;
    barLabel?: string;
    previousLabel?: string;
    /** Roughly one tick label per this many points. */
    labelEvery?: number;
};

const WIDTH = 800;
const HEIGHT = 240;
const TOP_PAD = 12;

function niceCeil(value: number): number {
    if (value <= 0) return 1;
    const exponent = Math.floor(Math.log10(value));
    const base = 10 ** exponent;
    const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    return (steps.find((step) => step * base >= value) ?? 10) * base;
}

export default function TrendChart({
    points,
    format,
    barFormat,
    barLabel,
    previousLabel = 'Previous period',
    labelEvery,
}: TrendChartProps) {
    const [hover, setHover] = useState<number | null>(null);

    if (points.length === 0) {
        return (
            <p className="px-4 py-10 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                No data in this period.
            </p>
        );
    }

    const max = niceCeil(
        Math.max(...points.map((point) => Math.max(point.value, point.previous ?? 0)), 0)
    );
    const barMax = Math.max(...points.map((point) => point.bars ?? 0), 0);
    const hasBars = barMax > 0;
    const hasPrevious = points.some((point) => (point.previous ?? 0) > 0);

    const x = (index: number) => (points.length === 1 ? WIDTH / 2 : (index / (points.length - 1)) * WIDTH);
    const y = (value: number) => HEIGHT - (value / max) * (HEIGHT - TOP_PAD);

    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ');
    const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
    const previousLine = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point.previous ?? 0).toFixed(1)}`)
        .join(' ');

    const ticks = [1, 0.75, 0.5, 0.25, 0];
    const step = labelEvery ?? Math.max(1, Math.ceil(points.length / 7));
    const active = hover !== null ? points[hover] : undefined;

    return (
        <div className="relative">
            <div className="flex gap-2.5">
                {/* Y axis */}
                <div
                    className="flex w-14 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums"
                    style={{ height: HEIGHT, color: Theme.colors.textMuted, paddingTop: 2 }}
                >
                    {ticks.map((tick) => (
                        <span key={tick}>{format(max * tick)}</span>
                    ))}
                </div>

                {/* Plot */}
                <div
                    className="relative min-w-0 flex-1"
                    style={{ height: HEIGHT }}
                    onMouseLeave={() => setHover(null)}
                    onMouseMove={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const ratio = (event.clientX - rect.left) / rect.width;
                        const index = Math.round(ratio * (points.length - 1));
                        setHover(Math.min(points.length - 1, Math.max(0, index)));
                    }}
                >
                    <svg
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        preserveAspectRatio="none"
                        className="h-full w-full"
                        role="img"
                        aria-label="Trend chart"
                    >
                        {ticks.map((tick) => (
                            <line
                                key={tick}
                                x1={0}
                                x2={WIDTH}
                                y1={y(max * tick)}
                                y2={y(max * tick)}
                                stroke={Theme.colors.border}
                                strokeWidth={1}
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}

                        {hasBars &&
                            points.map((point, index) => {
                                const width = (WIDTH / points.length) * 0.44;
                                const height = ((point.bars ?? 0) / barMax) * (HEIGHT - TOP_PAD);
                                return (
                                    <rect
                                        key={point.label + index}
                                        x={x(index) - width / 2}
                                        y={HEIGHT - height}
                                        width={width}
                                        height={Math.max(height, 0)}
                                        fill={Theme.colors.secondary}
                                        opacity={0.32}
                                    />
                                );
                            })}

                        {hasPrevious && (
                            <path
                                d={previousLine}
                                fill="none"
                                stroke={Theme.colors.textMuted}
                                strokeWidth={1.5}
                                strokeDasharray="4 4"
                                vectorEffect="non-scaling-stroke"
                            />
                        )}

                        <path d={area} fill={Theme.colors.primary} opacity={0.16} />
                        <path
                            d={line}
                            fill="none"
                            stroke={Theme.colors.primaryDark}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {hover !== null && active && (
                        <>
                            <div
                                className="pointer-events-none absolute top-0 bottom-0 w-px"
                                style={{ left: `${(x(hover) / WIDTH) * 100}%`, backgroundColor: Theme.colors.borderStrong }}
                            />
                            <div
                                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                                style={{
                                    left: `${(x(hover) / WIDTH) * 100}%`,
                                    top: `${(y(active.value) / HEIGHT) * 100}%`,
                                    backgroundColor: Theme.colors.surface,
                                    borderColor: Theme.colors.primaryDark,
                                }}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* X axis */}
            <div className="mt-2 flex justify-between pl-[66px] text-[10px]" style={{ color: Theme.colors.textMuted }}>
                {points
                    .filter((_, index) => index % step === 0 || index === points.length - 1)
                    .map((point) => (
                        <span key={point.label} className="tabular-nums">
                            {point.label}
                        </span>
                    ))}
            </div>

            {/* Legend + hovered readout */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 pl-[66px] text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-4 rounded-full" style={{ backgroundColor: Theme.colors.primary }} />
                    <span style={{ color: Theme.colors.textLight }}>Current period</span>
                </span>
                {hasPrevious && (
                    <span className="inline-flex items-center gap-1.5">
                        <span
                            className="h-0 w-4 border-t-2 border-dashed"
                            style={{ borderColor: Theme.colors.textMuted }}
                        />
                        <span style={{ color: Theme.colors.textLight }}>{previousLabel}</span>
                    </span>
                )}
                {hasBars && (
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2 rounded-sm" style={{ backgroundColor: Theme.colors.secondary }} />
                        <span style={{ color: Theme.colors.textLight }}>{barLabel ?? 'Volume'}</span>
                    </span>
                )}

                {active && (
                    <span className="ml-auto font-semibold tabular-nums" style={{ color: Theme.colors.text }}>
                        {active.label} · {format(active.value)}
                        {active.bars !== undefined && barFormat ? ` · ${barFormat(active.bars)}` : ''}
                    </span>
                )}
            </div>
        </div>
    );
}
