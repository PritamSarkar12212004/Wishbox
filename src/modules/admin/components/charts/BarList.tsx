import Theme from '@/assets/Theme/Theme';

export type BarRow = {
    label: string;
    value: number;
    /** Right-hand caption, e.g. the unit count behind the revenue. */
    meta?: string;
    color?: string;
    image?: string;
};

/** Horizontal bar list — the workhorse for every "by X" breakdown. */
export default function BarList({
    rows,
    format,
    emptyLabel = 'Nothing to show yet.',
}: {
    rows: BarRow[];
    format: (value: number) => string;
    emptyLabel?: string;
}) {
    const max = Math.max(...rows.map((row) => row.value), 0);

    if (rows.length === 0) {
        return (
            <p className="px-4 py-8 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                {emptyLabel}
            </p>
        );
    }

    return (
        <ul className="flex flex-col gap-3.5 px-4 py-4 sm:px-5">
            {rows.map((row) => (
                <li key={row.label}>
                    <div className="flex items-center gap-2.5">
                        {row.image && (
                            <img
                                src={row.image}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="h-8 w-8 shrink-0 rounded-lg object-cover"
                            />
                        )}
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold sm:text-[13px]">
                            {row.label}
                        </span>
                        {row.meta && (
                            <span className="shrink-0 text-[11px] tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                {row.meta}
                            </span>
                        )}
                        <span className="shrink-0 text-xs font-bold tabular-nums">{format(row.value)}</span>
                    </div>
                    <div
                        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                        style={{ backgroundColor: Theme.colors.surfaceAlt }}
                    >
                        <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                                width: `${max > 0 ? Math.max((row.value / max) * 100, row.value > 0 ? 3 : 0) : 0}%`,
                                backgroundColor: row.color ?? Theme.colors.primary,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}
