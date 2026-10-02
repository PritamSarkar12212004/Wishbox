import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Search } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr, inrCompact } from '@/lib/format';
import { AdminButton, PageHeader, Panel, PanelHeader, PaymentStatusChip, TextInput } from '../components/AdminUI';
import DonutChart from '../components/charts/DonutChart';
import DataTable from '../components/DataTable';
import RangePicker from '../components/RangePicker';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import { PAYMENT_COLORS } from '../consts/paymentConst';
import type { AdminOrder, AdminReturn } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { inRange, paymentAnalytics, rangeLabel, returnsAnalytics } from '../lib/analytics';

const route = adminConst.route;
const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

/* ------------------------------------------------------------------ */
/*  Transactions                                                      */
/* ------------------------------------------------------------------ */

export function PaymentsPage() {
    const { orders, returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');
    const [search, setSearch] = useState('');

    const payments = useMemo(() => paymentAnalytics(orders, range, returns), [orders, range, returns]);

    const transactions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return orders
            .filter((order) => inRange(order.placedAt, range))
            .filter(
                (order) =>
                    !query ||
                    order.id.toLowerCase().includes(query) ||
                    order.customer.toLowerCase().includes(query) ||
                    order.payment.toLowerCase().includes(query)
            )
            .slice(0, 60);
    }, [orders, range, search]);

    return (
        <div>
            <PageHeader
                title="Transactions"
                description={`${inr(payments.collected)} collected · ${inr(payments.pending)} pending · ${rangeLabel(key, range)}.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                <Link to={route.failedPaymentsPage}>
                    <AdminButton variant={payments.failedOrders.length > 0 ? 'primary' : 'ghost'}>
                        Failed payments
                    </AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="flex flex-col gap-6">
                    <Panel>
                        <PanelHeader title="Payment methods" meta="Share of orders by rail" />
                        <div className="px-4 py-5 sm:px-5">
                            <DonutChart
                                centerValue={inrCompact(payments.collected)}
                                centerLabel="Collected"
                                segments={payments.methods.map((row) => ({
                                    label: row.method,
                                    value: row.count,
                                    color: PAYMENT_COLORS[row.method],
                                    meta: inrCompact(row.amount),
                                }))}
                            />
                        </div>
                    </Panel>

                    <Panel>
                        <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: Theme.colors.border }}>
                            <Tile label="Successful" value={inr(payments.collected)} tone="good" />
                            <Tile label="Pending" value={inr(payments.pending)} tone="warn" />
                            <Tile label="Failed" value={inr(payments.failed)} tone="bad" />
                            <Tile label="Refunded" value={inr(payments.refundedAmount)} />
                        </div>
                    </Panel>
                </div>

                <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {compactCount(transactions.length)} transactions shown
                        </p>
                        <div className="relative w-full max-w-xs">
                            <Search
                                size={15}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: Theme.colors.textMuted }}
                            />
                            <TextInput
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search order, customer or rail"
                                className="pl-9"
                                aria-label="Search transactions"
                            />
                        </div>
                    </div>

                    <DataTable
                        minWidth={820}
                        rows={transactions}
                        rowKey={(order) => order.id}
                        emptyTitle="No transactions"
                        emptyHint="Nothing settled in this period."
                        columns={[
                            {
                                key: 'order',
                                header: 'Order',
                                render: (order: AdminOrder) => (
                                    <div>
                                        <p className="text-[13px] font-bold">{order.id}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {DATE.format(order.placedAt)}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'customer',
                                header: 'Customer',
                                hideBelow: 'sm',
                                render: (order: AdminOrder) => (
                                    <span className="text-xs">{order.customer}</span>
                                ),
                            },
                            {
                                key: 'method',
                                header: 'Method',
                                hideBelow: 'md',
                                render: (order: AdminOrder) => <span className="text-xs">{order.payment}</span>,
                            },
                            {
                                key: 'status',
                                header: 'Status',
                                render: (order: AdminOrder) => <PaymentStatusChip status={order.paymentStatus} />,
                            },
                            {
                                key: 'amount',
                                header: 'Amount',
                                align: 'right',
                                render: (order: AdminOrder) => (
                                    <span className="text-[13px] font-bold tabular-nums">{inr(order.amount)}</span>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Refunds                                                           */
/* ------------------------------------------------------------------ */

export function RefundsPage() {
    const { returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('1y');

    const analytics = useMemo(() => returnsAnalytics(returns, range), [returns, range]);
    const refunds = useMemo(
        () => returns.filter((entry) => entry.refundAmount > 0).slice(0, 60),
        [returns]
    );

    return (
        <div>
            <PageHeader
                title="Refunds"
                description={`${inr(analytics.refundPending)} pending · ${inr(analytics.refunded)} already released.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                <Link to={route.returnsPage}>
                    <AdminButton variant="primary">Approve in returns queue</AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Refund pending" value={inr(analytics.refundPending)} tone="warn" hint={rangeLabel(key, range)} />
                </Panel>
                <Panel>
                    <Tile label="Refunded" value={inr(analytics.refunded)} tone="good" />
                </Panel>
                <Panel>
                    <Tile
                        label="Rejected"
                        value={String(analytics.byStatus.find((row) => row.status === 'Rejected')?.count ?? 0)}
                        hint="No refund issued"
                    />
                </Panel>
                <Panel>
                    <Tile label="Requests" value={compactCount(analytics.total)} hint="All statuses" />
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={880}
                    rows={refunds}
                    rowKey={(entry) => entry.id}
                    emptyTitle="No refunds recorded"
                    emptyHint="Nothing has been refunded in this period."
                    columns={[
                        {
                            key: 'return',
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
                            render: (entry: AdminReturn) => <span className="text-xs">{entry.customer}</span>,
                        },
                        {
                            key: 'reason',
                            header: 'Reason',
                            hideBelow: 'md',
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
                            key: 'status',
                            header: 'Status',
                            render: (entry: AdminReturn) => (
                                <span className="text-xs font-semibold">{entry.status}</span>
                            ),
                        },
                        {
                            key: 'amount',
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
                    ]}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Failed payments                                                   */
/* ------------------------------------------------------------------ */

export function FailedPaymentsPage() {
    const { orders, returns } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const payments = useMemo(() => paymentAnalytics(orders, range, returns), [orders, range, returns]);
    const failed = payments.failedOrders;

    return (
        <div>
            <PageHeader
                title="Failed payments"
                description={`${failed.length} payments worth ${inr(payments.failed)} did not complete · ${rangeLabel(key, range)}.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                <Link to={route.paymentsPage}>
                    <AdminButton>All transactions</AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                <Panel>
                    <Tile label="Failed payments" value={String(failed.length)} tone="bad" />
                </Panel>
                <Panel>
                    <Tile label="Value at risk" value={inr(payments.failed)} tone="warn" />
                </Panel>
                <Panel>
                    <Tile label="Pending settlement" value={inr(payments.pending)} hint="Awaiting capture" />
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={860}
                    rows={failed.slice(0, 60)}
                    rowKey={(order) => order.id}
                    emptyTitle="No failed payments"
                    emptyHint="Every payment went through in this period."
                    columns={[
                        {
                            key: 'order',
                            header: 'Order',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-[13px] font-bold">{order.id}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {DATE.format(order.placedAt)}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'customer',
                            header: 'Customer',
                            render: (order: AdminOrder) => (
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold">{order.customer}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {order.email}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'method',
                            header: 'Method',
                            hideBelow: 'sm',
                            render: (order: AdminOrder) => <span className="text-xs">{order.payment}</span>,
                        },
                        {
                            key: 'amount',
                            header: 'Amount',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <span className="text-[13px] font-bold tabular-nums">{inr(order.amount)}</span>
                            ),
                        },
                        {
                            key: 'action',
                            header: '',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <a
                                    href={`mailto:${order.email}?subject=${encodeURIComponent(
                                        `Payment failed for ${order.id}`
                                    )}&body=${encodeURIComponent(
                                        `Hi ${order.customer}, we could not complete the payment of ${inr(
                                            order.amount
                                        )} for order ${order.id}. Reply here and we will send a fresh payment link.`
                                    )}`}
                                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5"
                                    style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                                >
                                    <Mail size={13} />
                                    Payment link
                                </a>
                            ),
                        },
                    ]}
                    footer={
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Sending a payment link needs a gateway integration — this opens a pre-filled email instead.
                        </p>
                    }
                />
            </div>
        </div>
    );
}
