import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import { compactCount, inr } from '@/lib/format';
import { AdminButton, AdminStatusChip, Field, PageHeader, Panel, PanelHeader, TextInput, Toggle } from '../components/AdminUI';
import DataTable from '../components/DataTable';
import RangePicker from '../components/RangePicker';
import Tile from '../components/Tile';
import adminConst from '../consts/adminConst';
import { COURIERS, COURIER_OPTIONS } from '../consts/courierConst';
import { IN_TRANSIT_STATUSES, type AdminOrder } from '../data/adminData';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { deliveryAnalytics, inRange, rangeLabel } from '../lib/analytics';
import { useUpdateSettings } from '../api/useAdmin';
import { useAdminSettings } from '../store/settingsStore';

const route = adminConst.route;

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' });

/* ------------------------------------------------------------------ */
/*  Shipments                                                         */
/* ------------------------------------------------------------------ */

export function ShippingPage() {
    const { orders } = useAdminFeed();
    const { key, setKey, range, setCustom } = useAdminRange('30d');

    const delivery = useMemo(() => deliveryAnalytics(orders, range), [orders, range]);

    const shipments = useMemo(
        () =>
            orders
                .filter((order) => inRange(order.placedAt, range) && IN_TRANSIT_STATUSES.includes(order.status))
                .slice(0, 60),
        [orders, range]
    );

    return (
        <div>
            <PageHeader
                title="Shipments"
                description={`${compactCount(delivery.inTransit)} parcels in the courier network · ${delivery.delayed.length} running late.`}
            >
                <RangePicker value={key} onChange={setKey} range={range} onCustomRange={setCustom} />
                <Link to={route.trackingPage}>
                    <AdminButton variant="primary">
                        Track delayed
                        <ArrowRight size={13} />
                    </AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                <Panel>
                    <Tile
                        label="Awaiting approval"
                        value={String(delivery.awaitingPickup)}
                        hint="Not handed over yet"
                    />
                </Panel>
                <Panel>
                    <Tile
                        label="Shipped"
                        value={String(delivery.rows.find((row) => row.status === 'Shipped')?.count ?? 0)}
                        hint="With the courier"
                    />
                </Panel>
                <Panel>
                    <Tile label="In transit" value={String(delivery.inTransit)} tone="warn" hint="Shipped or out for delivery" />
                </Panel>
                <Panel>
                    <Tile label="Delivered" value={compactCount(delivery.delivered)} tone="good" hint={rangeLabel(key, range)} />
                </Panel>
                <Panel>
                    <Tile
                        label="Delayed"
                        value={String(delivery.delayed.length)}
                        tone="bad"
                        hint={`Worth ${inr(delivery.delayed.reduce((sum, order) => sum + order.amount, 0))}`}
                    />
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={940}
                    rows={shipments}
                    rowKey={(order) => order.id}
                    emptyTitle="Nothing in transit"
                    emptyHint="No parcels are with a courier in this period."
                    columns={[
                        {
                            key: 'order',
                            header: 'Order',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-[13px] font-bold">{order.id}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {order.placedOn}
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
                                        {order.city}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'courier',
                            header: 'Courier',
                            hideBelow: 'sm',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-xs font-semibold">{order.courier ?? '—'}</p>
                                    <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                        {order.trackingId ?? 'no AWB'}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'amount',
                            header: 'Value',
                            align: 'right',
                            hideBelow: 'md',
                            render: (order: AdminOrder) => (
                                <span className="text-xs tabular-nums">{inr(order.amount)}</span>
                            ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (order: AdminOrder) => <AdminStatusChip status={order.status} />,
                        },
                        {
                            key: 'delay',
                            header: 'Delay',
                            align: 'right',
                            render: (order: AdminOrder) =>
                                order.delayed ? (
                                    <span className="text-[11px] font-bold" style={{ color: Theme.colors.accentDark }}>
                                        Delayed
                                    </span>
                                ) : (
                                    <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        On track
                                    </span>
                                ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tracking                                                          */
/* ------------------------------------------------------------------ */

export function TrackingPage() {
    const { orders } = useAdminFeed();
    const [search, setSearch] = useState('');

    const delayed = useMemo(() => orders.filter((order) => order.delayed), [orders]);

    const courierStats = useMemo(() => {
        const map = new Map<string, { total: number; delivered: number; moving: number; delayed: number }>();
        orders.forEach((order) => {
            if (!order.courier) return;
            const entry = map.get(order.courier) ?? { total: 0, delivered: 0, moving: 0, delayed: 0 };
            entry.total += 1;
            if (order.status === 'Delivered') entry.delivered += 1;
            if (IN_TRANSIT_STATUSES.includes(order.status)) entry.moving += 1;
            if (order.delayed) entry.delayed += 1;
            map.set(order.courier, entry);
        });
        return [...map.entries()]
            .map(([courier, entry]) => ({ courier, ...entry }))
            .sort((a, b) => b.total - a.total);
    }, [orders]);

    const matches = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return [];
        return orders
            .filter(
                (order) =>
                    (order.trackingId ?? '').toLowerCase().includes(query) ||
                    order.id.toLowerCase().includes(query) ||
                    order.customer.toLowerCase().includes(query)
            )
            .slice(0, 20);
    }, [orders, search]);

    return (
        <div>
            <PageHeader
                title="Tracking"
                description={`${delayed.length} shipments are past their expected delivery window. Courier performance covers ${compactCount(orders.length)} orders.`}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Delayed shipments" value={String(delayed.length)} tone="bad" hint="Past expected delivery" />
                </Panel>
                <Panel>
                    <Tile
                        label="Delayed value"
                        value={inr(delayed.reduce((sum, order) => sum + order.amount, 0))}
                        tone="warn"
                        hint="Revenue at risk"
                    />
                </Panel>
                <Panel>
                    <Tile label="Couriers active" value={String(courierStats.length)} hint="Carrying live orders" />
                </Panel>
                <Panel>
                    <Tile
                        label="Delivered"
                        value={compactCount(orders.filter((order) => order.status === 'Delivered').length)}
                        tone="good"
                        hint="All time"
                    />
                </Panel>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div>
                    <Panel>
                        <PanelHeader
                            title="Track a shipment"
                            meta="Search by AWB, order id or customer"
                            action={<Truck size={15} style={{ color: Theme.colors.primaryDark }} />}
                        />
                        <div className="px-4 py-4 sm:px-5">
                            <div className="relative">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                                    style={{ color: Theme.colors.textMuted }}
                                />
                                <TextInput
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="e.g. DLV28492013"
                                    className="pl-9"
                                    aria-label="Search shipments"
                                />
                            </div>
                        </div>

                        {search.trim().length > 0 && (
                            <ul>
                                {matches.map((order) => (
                                    <li
                                        key={order.id}
                                        className="flex flex-wrap items-center gap-3 border-t px-4 py-3 sm:px-5"
                                        style={{ borderColor: Theme.colors.border }}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold">
                                                {order.trackingId ?? order.id}
                                                {order.delayed && (
                                                    <span className="ml-2 text-[10px] font-bold" style={{ color: Theme.colors.accentDark }}>
                                                        DELAYED
                                                    </span>
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                                {order.id} · {order.customer}, {order.city} · {order.courier}
                                            </p>
                                        </div>
                                        <AdminStatusChip status={order.status} />
                                    </li>
                                ))}
                                {matches.length === 0 && (
                                    <li className="px-4 py-8 text-center text-xs" style={{ color: Theme.colors.textMuted }}>
                                        No shipment matches “{search}”.
                                    </li>
                                )}
                            </ul>
                        )}
                    </Panel>
                </div>

                <Panel className="self-start">
                    <PanelHeader title="Courier performance" meta="On-time behaviour across the seeded year" />
                    <ul>
                        {courierStats.map((entry) => {
                            const onTime = entry.total > 0 ? ((entry.total - entry.delayed) / entry.total) * 100 : 0;
                            return (
                                <li
                                    key={entry.courier}
                                    className="border-t px-4 py-3 first:border-t-0 sm:px-5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold">{entry.courier}</p>
                                        <p className="text-[11px] tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                            {compactCount(entry.total)} shipments
                                        </p>
                                    </div>
                                    <div
                                        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                                        style={{ backgroundColor: Theme.colors.surfaceAlt }}
                                    >
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${onTime}%`, backgroundColor: Theme.colors.primary }}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {onTime.toFixed(1)}% on time · {entry.moving} moving · {entry.delayed} delayed
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={880}
                    rows={delayed.slice(0, 40)}
                    rowKey={(order) => order.id}
                    emptyTitle="No delayed shipments"
                    emptyHint="Every parcel is inside its delivery window."
                    columns={[
                        {
                            key: 'order',
                            header: 'Order',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-[13px] font-bold">{order.id}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        Placed {DATE.format(order.placedAt)}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'customer',
                            header: 'Customer',
                            render: (order: AdminOrder) => (
                                <span className="text-xs">
                                    {order.customer} · {order.city}
                                </span>
                            ),
                        },
                        {
                            key: 'courier',
                            header: 'Courier',
                            hideBelow: 'sm',
                            render: (order: AdminOrder) => (
                                <div>
                                    <p className="text-xs font-semibold">{order.courier}</p>
                                    <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: Theme.colors.textMuted }}>
                                        {order.trackingId}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (order: AdminOrder) => <AdminStatusChip status={order.status} />,
                        },
                        {
                            key: 'escalate',
                            header: '',
                            align: 'right',
                            render: (order: AdminOrder) => (
                                <AdminButton
                                    onClick={() =>
                                        toast.success(`Escalated ${order.id} with ${order.courier}`, {
                                            description: 'Demo only — a real integration would raise a courier ticket.',
                                        })
                                    }
                                >
                                    Escalate
                                </AdminButton>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Courier settings                                                  */
/* ------------------------------------------------------------------ */

export function CourierSettingsPage() {
    const settings = useAdminSettings();
    const updateSettings = useUpdateSettings();

    return (
        <div>
            <PageHeader
                title="Courier settings"
                description="Defaults applied to new shipments and the storefront's shipping promise."
            >
                <Link to={route.trackingPage}>
                    <AdminButton>
                        Tracking
                        <ArrowRight size={13} />
                    </AdminButton>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel>
                    <PanelHeader title="Dispatch defaults" meta="Saved to this browser" />
                    <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
                        <Field label="Default courier" hint="Pre-selected when an order is packed.">
                            <SelectMenu
                                variant="field"
                                value={settings.defaultCourier}
                                options={COURIER_OPTIONS}
                                onChange={(value) => {
                                    updateSettings.mutate(
                                        { defaultCourier: value },
                                        {
                                            onSuccess: () => toast.success(`Default courier set to ${value}`),
                                            onError: () => toast.error('Could not save the default courier'),
                                        }
                                    );
                                }}
                                label="Default courier"
                            />
                        </Field>

                        <Field
                            label="Free shipping above (₹)"
                            hint="Orders at or above this value ship free on the storefront."
                        >
                            <TextInput
                                type="number"
                                min={0}
                                value={settings.freeShippingThreshold}
                                onChange={(event) =>
                                    updateSettings.mutate(
                                        { freeShippingThreshold: Number(event.target.value) },
                                        {
                                            onError: () =>
                                                toast.error('Could not save the free shipping threshold'),
                                        }
                                    )
                                }
                            />
                        </Field>

                        <div className="border-t pt-1" style={{ borderColor: Theme.colors.border }}>
                            <Toggle
                                checked={settings.codEnabled}
                                onChange={(next) => {
                                    updateSettings.mutate(
                                        { codEnabled: next },
                                        {
                                            onSuccess: () =>
                                                toast.success(
                                                    next ? 'Cash on delivery enabled' : 'Cash on delivery disabled'
                                                ),
                                            onError: () => toast.error('Could not save the cash on delivery setting'),
                                        }
                                    );
                                }}
                                label="Cash on delivery"
                                hint="Hide the COD option at checkout when disabled."
                            />
                        </div>
                    </div>
                </Panel>

                <Panel>
                    <PanelHeader title="Active couriers" meta={`${COURIERS.length} partners in the demo network`} />
                    <ul>
                        {COURIERS.map((courier) => (
                            <li
                                key={courier}
                                className="flex items-center justify-between gap-3 border-t px-4 py-3 first:border-t-0 sm:px-5"
                                style={{ borderColor: Theme.colors.border }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="grid h-8 w-8 place-items-center rounded-lg"
                                        style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                                    >
                                        <Truck size={15} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold">{courier}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {courier === settings.defaultCourier ? 'Default for new shipments' : 'Available'}
                                        </p>
                                    </div>
                                </div>
                                {courier !== settings.defaultCourier && (
                                    <AdminButton
                                        onClick={() => {
                                            updateSettings.mutate(
                                                { defaultCourier: courier },
                                                {
                                                    onSuccess: () =>
                                                        toast.success(`Default courier set to ${courier}`),
                                                    onError: () =>
                                                        toast.error('Could not save the default courier'),
                                                }
                                            );
                                        }}
                                    >
                                        Make default
                                    </AdminButton>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: Theme.colors.border }}>
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Courier rates, serviceable pincodes and label printing would come from each partner's API —
                            this demo stores the dispatch defaults only.
                        </p>
                    </div>
                </Panel>
            </div>
        </div>
    );
}
