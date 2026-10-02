import Theme from '@/assets/Theme/Theme';

/** Tiny axis-less area chart — the movement hint inside a stat card. */
export default function Sparkline({
    values,
    color = Theme.colors.primary,
    height = 34,
    className = '',
}: {
    values: number[];
    color?: string;
    height?: number;
    className?: string;
}) {
    if (values.length < 2) return <div style={{ height }} className={className} />;

    const width = 120;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = max - min || 1;

    const x = (index: number) => (index / (values.length - 1)) * width;
    const y = (value: number) => height - ((value - min) / span) * (height - 4) - 2;

    const line = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
    const id = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className={className}
            style={{ height, width: '100%' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
            <path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={1.75}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
