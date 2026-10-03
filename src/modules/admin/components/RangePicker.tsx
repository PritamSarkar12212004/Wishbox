import Theme from '@/assets/Theme/Theme';
import { RANGE_OPTIONS, type DateRange, type RangeKey } from '../lib/analytics';

const toInputValue = (time: number) => {
    const date = new Date(time);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
};

const fromInputValue = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
};

/** Preset window selector, with from/to inputs when "Custom" is active. */
export default function RangePicker({
    value,
    onChange,
    range,
    onCustomRange,
}: {
    value: RangeKey;
    onChange: (key: RangeKey) => void;
    range: DateRange;
    onCustomRange: (range: DateRange) => void;
}) {
    return (
        <div className="flex min-w-0 flex-col items-start gap-2 sm:items-end">
            <div
                role="tablist"
                aria-label="Select reporting period"
                className="flex min-w-0 flex-wrap items-center gap-1.5"
            >
                {RANGE_OPTIONS.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onChange(option.value)}
                            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                            style={{
                                borderColor: isActive ? 'transparent' : Theme.colors.border,
                                backgroundColor: isActive ? Theme.colors.text : Theme.colors.surface,
                                color: isActive ? Theme.colors.background : Theme.colors.text,
                                boxShadow: isActive ? Theme.Shadow.sm : 'none',
                            }}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>

            {value === 'custom' && (
                <div className="flex items-center gap-2 text-[11px]">
                    <input
                        type="date"
                        value={toInputValue(range.from)}
                        max={toInputValue(range.to)}
                        onChange={(event) =>
                            onCustomRange({ from: fromInputValue(event.target.value), to: range.to })
                        }
                        aria-label="Range start date"
                        className="h-8 rounded-lg border px-2 text-[11px]"
                        style={{
                            borderColor: Theme.colors.border,
                            backgroundColor: Theme.colors.surface,
                            color: Theme.colors.text,
                        }}
                    />
                    <span style={{ color: Theme.colors.textMuted }}>to</span>
                    <input
                        type="date"
                        value={toInputValue(range.to)}
                        min={toInputValue(range.from)}
                        onChange={(event) =>
                            onCustomRange({ from: range.from, to: fromInputValue(event.target.value) })
                        }
                        aria-label="Range end date"
                        className="h-8 rounded-lg border px-2 text-[11px]"
                        style={{
                            borderColor: Theme.colors.border,
                            backgroundColor: Theme.colors.surface,
                            color: Theme.colors.text,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
