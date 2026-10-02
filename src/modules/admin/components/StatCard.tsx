import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Theme from '@/assets/Theme/Theme';
import DeltaBadge from './DeltaBadge';
import Sparkline from './charts/Sparkline';
import { Panel } from './AdminUI';

export default function StatCard({
    icon: Icon,
    label,
    value,
    delta,
    deltaLabel = 'vs previous period',
    invertDelta = false,
    sub,
    spark,
    sparkColor,
    to,
}: {
    icon: ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
    label: string;
    value: string;
    delta?: number | null;
    deltaLabel?: string;
    /** Set when a rise in this metric is bad (returns, cancellations). */
    invertDelta?: boolean;
    sub?: ReactNode;
    spark?: number[];
    sparkColor?: string;
    to?: string;
}) {
    const body = (
        <Panel className={`h-full p-4 ${to ? 'transition-shadow hover:shadow-md' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <p
                    className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: Theme.colors.textMuted }}
                >
                    {label}
                </p>
                <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                >
                    <Icon size={15} />
                </span>
            </div>

            <p
                className="mt-2 truncate text-[26px] leading-tight font-bold tabular-nums"
                style={{ fontFamily: Theme.Typography.headingFamily, color: Theme.colors.text }}
            >
                {value}
            </p>

            {delta !== undefined && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <DeltaBadge value={delta} invert={invertDelta} />
                    <span className="text-[10px]" style={{ color: Theme.colors.textMuted }}>
                        {deltaLabel}
                    </span>
                </div>
            )}

            {sub && (
                <p className="mt-1.5 text-[11px] leading-snug" style={{ color: Theme.colors.textMuted }}>
                    {sub}
                </p>
            )}

            {spark && spark.length > 1 && (
                <div className="mt-3">
                    <Sparkline values={spark} color={sparkColor} />
                </div>
            )}
        </Panel>
    );

    if (!to) return body;

    return (
        <Link to={to} className="block h-full focus:outline-none">
            {body}
        </Link>
    );
}
