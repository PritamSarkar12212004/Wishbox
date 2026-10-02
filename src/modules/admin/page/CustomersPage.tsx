import { useMemo, useState } from 'react';
import { Mail, Search } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr } from '@/lib/format';
import { PageHeader, Panel, PanelHeader, TextInput } from '../components/AdminUI';
import BarList from '../components/charts/BarList';
import DataTable from '../components/DataTable';
import RangePicker from '../components/RangePicker';
import Tile from '../components/Tile';
import type { AdminCustomer } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { customerAnalytics, netAmount, rangeLabel } from '../lib/analytics';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

type CustomerRow = AdminCustomer & {
    orders: number;
    revenue: number;
    lastOrder: number;
};

export default function CustomersPage() {
    const { dataset, orders, index } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');
    const [search, setSearch] = useState('');

    const analytics = useMemo(
        () => customerAnalytics(orders, range, dataset.customers, index),
        [orders, range, dataset.customers, index]
    );

    const rows = useMemo<CustomerRow[]>(() => {
        const stats = new Map<string, { orders: number; revenue: number; lastOrder: number }>();
        orders.forEach((order) => {
            if (order.isGuest) return;
            const entry = stats.get(order.customerId) ?? { orders: 0, revenue: 0, lastOrder: 0 };
            entry.orders += 1;
            entry.revenue += netAmount(order);
            entry.lastOrder = Math.max(entry.lastOrder, order.placedAt);
            stats.set(order.customerId, entry);
        });

        return dataset.customers
            .filter((customer) => !customer.isGuest)
            .map((customer) => {
                const entry = stats.get(customer.id) ?? { orders: 0, revenue: 0, lastOrder: 0 };
                return {
                    ...customer,
                    orders: entry.orders,
                    revenue: entry.revenue,
                    lastOrder: entry.lastOrder,
                };
            })
            .sort((a, b) => b.revenue - a.revenue);
    }, [orders, dataset.customers]);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter(
            (row) =>
                row.name.toLowerCase().includes(query) ||
                row.email.toLowerCase().includes(query) ||
                row.city.toLowerCase().includes(query)
        );
    }, [rows, search]);

    const topSpenders = rows.filter((row) => row.orders > 0).slice(0, 6);

    return (
        <div>
            <PageHeader
                title="Customers"
                description={`${compactCount(analytics.total)} registered shoppers · ${rangeLabel(key, range)}. Guest checkouts are counted separately and never inflate the customer base.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
                <Panel>
                    <Tile label="Total" value={compactCount(analytics.total)} hint={`${analytics.activeCustomers} have ordered`} />
                </Panel>
                <Panel>
                    <Tile label="New" value={`+${compactCount(analytics.newCustomers)}`} tone="good" hint={rangeLabel(key, range)} />
                </Panel>
                <Panel>
                    <Tile label="Returning" value={`${analytics.recurringShare.toFixed(0)}%`} hint={`${analytics.returning} shoppers`} />
                </Panel>
                <Panel>
                    <Tile label="Guest orders" value={`${analytics.guestShare.toFixed(0)}%`} hint={`${analytics.guestOrders} orders`} />
                </Panel>
                <Panel>
                    <Tile label="Avg order value" value={inr(analytics.averageOrderValue)} />
                </Panel>
                <Panel>
                    <Tile label="Lifetime value" value={inr(analytics.lifetimeValue)} hint="Per active customer" />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                <Panel className="self-start">
                    <PanelHeader title="Top spenders" meta="Lifetime revenue, all orders" />
                    <BarList
                        rows={topSpenders.map((row) => ({
                            label: row.name,
                            value: row.revenue,
                            meta: `${row.orders} orders`,
                        }))}
                        format={inr}
                        emptyLabel="No customer orders yet."
                    />
                </Panel>

                <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {compactCount(visible.length)} customers
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
                                placeholder="Search name, email or city"
                                className="pl-9"
                                aria-label="Search customers"
                            />
                        </div>
                    </div>

                    <DataTable
                        minWidth={820}
                        rows={visible.slice(0, 60)}
                        rowKey={(row) => row.id}
                        emptyTitle="No customers match"
                        emptyHint="Try a different name, email or city."
                        columns={[
                            {
                                key: 'customer',
                                header: 'Customer',
                                render: (row: CustomerRow) => (
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-bold">{row.name}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {row.email}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                key: 'city',
                                header: 'City',
                                hideBelow: 'md',
                                render: (row: CustomerRow) => <span className="text-xs">{row.city}</span>,
                            },
                            {
                                key: 'joined',
                                header: 'Joined',
                                hideBelow: 'lg',
                                render: (row: CustomerRow) => (
                                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                        {DATE.format(row.joinedAt)}
                                    </span>
                                ),
                            },
                            {
                                key: 'orders',
                                header: 'Orders',
                                align: 'right',
                                render: (row: CustomerRow) => <span className="text-xs tabular-nums">{row.orders}</span>,
                            },
                            {
                                key: 'revenue',
                                header: 'Lifetime value',
                                align: 'right',
                                render: (row: CustomerRow) => (
                                    <span className="text-[13px] font-bold tabular-nums">{inr(row.revenue)}</span>
                                ),
                            },
                            {
                                key: 'last',
                                header: 'Last order',
                                align: 'right',
                                hideBelow: 'sm',
                                render: (row: CustomerRow) => (
                                    <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                        {row.lastOrder > 0 ? DATE.format(row.lastOrder) : '—'}
                                    </span>
                                ),
                            },
                            {
                                key: 'contact',
                                header: '',
                                align: 'right',
                                render: (row: CustomerRow) => (
                                    <a
                                        href={`mailto:${row.email}`}
                                        className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70"
                                        style={{ color: Theme.colors.accentDark }}
                                    >
                                        <Mail size={13} />
                                        Email
                                    </a>
                                ),
                            },
                        ]}
                        footer={
                            visible.length > 60 && (
                                <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    Showing the 60 highest-value customers of {compactCount(visible.length)} — search to
                                    narrow the list.
                                </p>
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}
