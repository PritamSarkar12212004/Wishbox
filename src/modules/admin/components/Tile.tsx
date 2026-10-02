import Theme from '@/assets/Theme/Theme';

/** Compact metric cell — used inside the grid tiles of every dashboard panel. */
export default function Tile({
    label,
    value,
    hint,
    tone,
    className = '',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'good' | 'warn' | 'bad';
    className?: string;
}) {
    const color =
        tone === 'good'
            ? Theme.colors.primaryDark
            : tone === 'warn'
              ? Theme.colors.secondary
              : tone === 'bad'
                ? Theme.colors.accentDark
                : Theme.colors.text;

    return (
        <div className={`px-4 py-3.5 ${className}`} style={{ backgroundColor: Theme.colors.surface }}>
            <p
                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: Theme.colors.textMuted }}
            >
                {label}
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums" style={{ color }}>
                {value}
            </p>
            {hint && (
                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                    {hint}
                </p>
            )}
        </div>
    );
}
