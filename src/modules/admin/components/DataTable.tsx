import type { ReactNode } from 'react';
import Theme from '@/assets/Theme/Theme';
import { Panel } from './AdminUI';

export type Column<T> = {
    key: string;
    header: string;
    align?: 'left' | 'right';
    /** Hidden on narrow screens to keep the important columns readable. */
    hideBelow?: 'sm' | 'md' | 'lg';
    render: (row: T) => ReactNode;
};

const HIDE_CLASS: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
    sm: 'hidden sm:table-cell',
    md: 'hidden md:table-cell',
    lg: 'hidden lg:table-cell',
};

/**
 * One table for every admin list. Keeps header styling, horizontal scrolling
 * and the empty state identical everywhere.
 */
export default function DataTable<T>({
    columns,
    rows,
    rowKey,
    onRowClick,
    emptyTitle = 'Nothing here yet',
    emptyHint,
    minWidth = 760,
    footer,
}: {
    columns: Array<Column<T>>;
    rows: T[];
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;
    emptyTitle?: string;
    emptyHint?: string;
    minWidth?: number;
    footer?: ReactNode;
}) {
    return (
        <Panel>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" style={{ minWidth }}>
                    <thead>
                        <tr
                            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={`px-4 py-3 sm:px-5 ${
                                        column.align === 'right' ? 'text-right' : ''
                                    } ${column.hideBelow ? HIDE_CLASS[column.hideBelow] : ''}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className="border-t transition-colors"
                                style={{
                                    borderColor: Theme.colors.border,
                                    cursor: onRowClick ? 'pointer' : undefined,
                                }}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`px-4 py-3 align-middle sm:px-5 ${
                                            column.align === 'right' ? 'text-right' : ''
                                        } ${column.hideBelow ? HIDE_CLASS[column.hideBelow] : ''}`}
                                    >
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center">
                                    <p className="text-sm font-semibold">{emptyTitle}</p>
                                    {emptyHint && (
                                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                                            {emptyHint}
                                        </p>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {footer && (
                <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                    {footer}
                </div>
            )}
        </Panel>
    );
}
