import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr } from '@/lib/format';
import { AdminButton, PageHeader, Panel, PanelHeader } from '../components/AdminUI';
import BarList from '../components/charts/BarList';
import DataTable from '../components/DataTable';
import RangePicker from '../components/RangePicker';
import Tile from '../components/Tile';
import { RETURN_STATUSES, type AdminReturn, type ReturnStatus } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { rangeLabel, resolveRange, returnsAnalytics } from '../lib/analytics';
import { useUpdateReturn } from '../api/useAdmin';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

const STATUS_STYLE: Record<ReturnStatus, { bg: string; fg: string }> = {
    Requested: { bg: Theme.colors.secondary, fg: Theme.colors.text },
    Processing: { bg: Theme.colors.tertiary, fg: Theme.colors.text },
    Approved: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
    Rejected: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textMuted },
};

export default function ReturnsPage() {
    const { returns } = useAdminFeed();
    const updateReturn = useUpdateReturn();
    const { key, setKey, range, setCustom } = useAdminRange('1y');
    const [filter, setFilter] = useState<'all' | ReturnStatus>('all');

    const analytics = useMemo(() => returnsAnalytics(returns, range), [returns, range]);
    const allTime = useMemo(() => returnsAnalytics(returns, resolveRange('1y')), [returns]);

    const visible = useMemo(
        () => returns.filter((entry) => filter === 'all' || entry.status === filter),
        [returns, filter]
    );

    const countFor = (status: 'all' | ReturnStatus) =>
        status === 'all'
            ? allTime.total
            : allTime.byStatus.find((entry) => entry.status === status)?.count ?? 0;

    function setStatus(entry: AdminReturn, status: ReturnStatus) {
        updateReturn.mutate(
            { id: entry.id, status },
            {
                onSuccess: () =>
                    toast.success(`${entry.id} marked ${status.toLowerCase()}`, {
                        description: `${entry.orderId} · ${inr(entry.refundAmount)} refund`,
                    }),
                onError: (error) =>
                    toast.error('Could not update the return', {
                        description: error instanceof Error ? error.message : 'Please try again.',
                    }),
            }
        );
    }

    return (
        <div>
            <PageHeader
                title="Returns & refunds"
                description={`${compactCount(allTime.total)} requests in the last year · ${allTime.open} still open.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Requests" value={compactCount(analytics.total)} hint={rangeLabel(key, range)} />
                </Panel>
                <Panel>
                    <Tile label="Open" value={String(analytics.open)} tone="warn" hint="Awaiting a decision" />
                </Panel>
                <Panel>
                    <Tile label="Refund pending" value={inr(analytics.refundPending)} tone="warn" />
                </Panel>
                <Panel>
                    <Tile label="Refunded" value={inr(analytics.refunded)} tone="good" />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Panel>
                    <PanelHeader title="Why customers return" meta={`${rangeLabel(key, range)} · refunded value per reason`} />
                    <BarList
                        rows={analytics.byReason.map((row) => ({
                            label: row.reason,
                            value: row.count,
                            meta: inr(row.refunded),
                        }))}
                        format={compactCount}
                        emptyLabel="No returns in this period."
                    />
                </Panel>

                <Panel>
                    <PanelHeader title="Queue status" meta="Where requests are stuck" />
                    <BarList
                        rows={analytics.byStatus.map((row) => ({
                            label: row.status,
                            value: row.count,
                        }))}
                        format={compactCount}
                    />
                </Panel>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    {(['all', ...RETURN_STATUSES] as const).map((value) => {
                        const active = filter === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFilter(value)}
                                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                                style={{
                                    borderColor: active ? 'transparent' : Theme.colors.border,
                                    backgroundColor: active ? Theme.colors.text : Theme.colors.surface,
                                    color: active ? Theme.colors.background : Theme.colors.text,
                                }}
                            >
                                {value === 'all' ? 'All' : value}
                                <span className="text-[10px] tabular-nums" style={{ opacity: 0.6 }}>
                                    {countFor(value)}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                    {visible.length} shown
                </p>
            </div>

            <DataTable
                minWidth={980}
                rows={visible.slice(0, 60)}
                rowKey={(entry) => entry.id}
                emptyTitle="No returns match"
                emptyHint="Try another status filter."
                columns={[
                    {
                        key: 'id',
                        header: 'Return',
                        render: (entry: AdminReturn) => (
                            <div>
                                <p className="text-[13px] font-bold">{entry.id}</p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {entry.orderId}
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: 'customer',
                        header: 'Customer',
                        render: (entry: AdminReturn) => (
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold">{entry.customer}</p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {entry.city}
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: 'product',
                        header: 'Product',
                        hideBelow: 'md',
                        render: (entry: AdminReturn) => (
                            <div className="flex items-center gap-2.5">
                                <img
                                    src={entry.image}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="h-8 w-8 shrink-0 rounded-lg object-cover"
                                />
                                <span className="truncate text-xs">{entry.productName}</span>
                            </div>
                        ),
                    },
                    {
                        key: 'reason',
                        header: 'Reason',
                        hideBelow: 'lg',
                        render: (entry: AdminReturn) => <span className="text-xs">{entry.reason}</span>,
                    },
                    {
                        key: 'requested',
                        header: 'Requested',
                        hideBelow: 'sm',
                        render: (entry: AdminReturn) => (
                            <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                {DATE.format(entry.requestedAt)}
                            </span>
                        ),
                    },
                    {
                        key: 'refund',
                        header: 'Refund',
                        align: 'right',
                        render: (entry: AdminReturn) => (
                            <div>
                                <p className="text-[13px] font-bold tabular-nums">{inr(entry.refundAmount)}</p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {entry.refunded ? 'Released' : 'Pending'}
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        render: (entry: AdminReturn) => (
                            <span
                                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                                style={{
                                    backgroundColor: STATUS_STYLE[entry.status].bg,
                                    color: STATUS_STYLE[entry.status].fg,
                                }}
                            >
                                {entry.status}
                            </span>
                        ),
                    },
                    {
                        key: 'action',
                        header: 'Action',
                        align: 'right',
                        render: (entry: AdminReturn) => (
                            <div className="flex justify-end gap-1.5">
                                {entry.status === 'Requested' && (
                                    <AdminButton onClick={() => setStatus(entry, 'Processing')}>Process</AdminButton>
                                )}
                                {entry.status !== 'Approved' && (
                                    <AdminButton variant="primary" onClick={() => setStatus(entry, 'Approved')}>
                                        Approve
                                    </AdminButton>
                                )}
                                {entry.status !== 'Rejected' && (
                                    <AdminButton variant="danger" onClick={() => setStatus(entry, 'Rejected')}>
                                        Reject
                                    </AdminButton>
                                )}
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
}
