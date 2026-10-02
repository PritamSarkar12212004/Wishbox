import { useMemo, useState } from 'react';
import { Check, ChevronDown, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import { inr } from '@/lib/format';
import {
    STATUS_STEP,
    TRACK_STEPS,
    orderQty,
    orderSavings,
    orderSubtotal,
    orderTotal,
    type Order,
    type OrderStatus,
} from '@/modules/history/data/historyData';
import { ordersStore, useOrders } from '@/modules/history/store/store';
import { OrderStatusChip, PageHeader, Panel, TextInput } from '../components/AdminUI';

type FilterValue = 'All' | OrderStatus;

const FILTERS: FilterValue[] = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = (
    ['Processing', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]
).map((status) => ({ value: status, label: status }));

export default function OrdersPage() {
    const orders = useOrders();
    const [filter, setFilter] = useState<FilterValue>('All');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string[]>([]);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        return orders.filter((order) => {
            if (filter !== 'All' && order.status !== filter) return false;
            if (!query) return true;
            return (
                order.id.toLowerCase().includes(query) ||
                order.items.some((item) => item.name.toLowerCase().includes(query))
            );
        });
    }, [orders, filter, search]);

    const countFor = (value: FilterValue) =>
        value === 'All' ? orders.length : orders.filter((order) => order.status === value).length;

    const revenue = visible
        .filter((order) => order.status !== 'Cancelled')
        .reduce((sum, order) => sum + orderTotal(order), 0);
    const average = visible.length > 0 ? Math.round(revenue / visible.length) : 0;

    function changeStatus(order: Order, status: OrderStatus) {
        if (status === order.status) return;
        ordersStore.setStatus(order.id, status);
        toast.success(`${order.id} marked ${status.toLowerCase()}`, {
            description: 'The storefront order history updates instantly.',
        });
    }

    function toggle(id: string) {
        setExpanded((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
        );
    }

    return (
        <div>
            <PageHeader
                title="Orders"
                description={`${orders.length} orders · ${inr(revenue)} in the current view · advances tracking on the storefront.`}
            />

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div
                    role="tablist"
                    aria-label="Filter orders by status"
                    className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {FILTERS.map((value) => {
                        const isActive = value === filter;
                        return (
                            <button
                                key={value}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setFilter(value)}
                                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                                style={{
                                    borderColor: isActive ? 'transparent' : Theme.colors.border,
                                    backgroundColor: isActive ? Theme.colors.text : Theme.colors.surface,
                                    color: isActive ? Theme.colors.background : Theme.colors.text,
                                    boxShadow: isActive ? Theme.Shadow.sm : 'none',
                                }}
                            >
                                {value}
                                <span className="text-[10px] tabular-nums" style={{ opacity: 0.6 }}>
                                    {countFor(value)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <p className="hidden text-[11px] sm:block" style={{ color: Theme.colors.textMuted }}>
                        {visible.length} shown · avg {inr(average)}
                    </p>
                    <div className="relative w-full min-w-0 lg:w-64">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: Theme.colors.textMuted }}
                        />
                        <TextInput
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search order id or item"
                            className="pl-9"
                            aria-label="Search orders"
                        />
                    </div>
                </div>
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            <Panel>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[880px] text-left text-sm">
                        <thead>
                            <tr
                                className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                <th scope="col" className="px-4 py-3 sm:px-5">Order</th>
                                <th scope="col" className="px-4 py-3">Items</th>
                                <th scope="col" className="px-4 py-3">Payment</th>
                                <th scope="col" className="px-4 py-3 text-right">Total</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                                <th scope="col" className="px-4 py-3 text-right">Fulfilment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((order) => {
                                const isExpanded = expanded.includes(order.id);
                                return (
                                    <OrderRows
                                        key={order.id}
                                        order={order}
                                        expanded={isExpanded}
                                        onToggle={() => toggle(order.id)}
                                        onChangeStatus={(status) => changeStatus(order, status)}
                                    />
                                );
                            })}

                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <p className="text-sm font-semibold">No orders match</p>
                                        <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                                            Try another status filter or search term.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Row + expanded detail                                              */
/* ------------------------------------------------------------------ */

function OrderRows({
    order,
    expanded,
    onToggle,
    onChangeStatus,
}: {
    order: Order;
    expanded: boolean;
    onToggle: () => void;
    onChangeStatus: (status: OrderStatus) => void;
}) {
    const qty = orderQty(order);
    const cancelled = order.status === 'Cancelled';
    const completedSteps = STATUS_STEP[order.status];

    return (
        <>
            <tr className="border-t" style={{ borderColor: Theme.colors.border }}>
                <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={expanded}
                            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${order.id}`}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors hover:bg-black/5"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            <ChevronDown
                                size={14}
                                className="transition-transform duration-200"
                                style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                            />
                        </button>
                        <div>
                            <p className="text-[13px] font-bold">{order.id}</p>
                            <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                {order.placedOn}
                            </p>
                        </div>
                    </div>
                </td>

                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-2">
                            {order.items.slice(0, 3).map((item) => (
                                <img
                                    key={item.id}
                                    src={item.image}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="h-8 w-8 rounded-lg border-2 object-cover"
                                    style={{ borderColor: Theme.colors.surface }}
                                />
                            ))}
                        </div>
                        <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            {qty} item{qty === 1 ? '' : 's'}
                        </span>
                    </div>
                </td>

                <td className="px-4 py-3 text-xs" style={{ color: Theme.colors.textLight }}>
                    {order.payment}
                </td>

                <td className="px-4 py-3 text-right text-[13px] font-bold tabular-nums">
                    {cancelled ? 'Refunded' : inr(orderTotal(order))}
                </td>

                <td className="px-4 py-3">
                    <OrderStatusChip status={order.status} />
                </td>

                <td className="px-4 py-3">
                    <div className="flex justify-end">
                        <SelectMenu
                            className="w-36"
                            value={order.status}
                            options={STATUS_OPTIONS}
                            onChange={(value) => onChangeStatus(value as OrderStatus)}
                            label={`Status for ${order.id}`}
                            menuHeading="Set status"
                        />
                    </div>
                </td>
            </tr>

            {expanded && (
                <tr style={{ backgroundColor: Theme.colors.surfaceAlt }}>
                    <td colSpan={6} className="px-4 py-4 sm:px-5">
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <div>
                                <p
                                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                    style={{ color: Theme.colors.textMuted }}
                                >
                                    Items
                                </p>
                                <ul className="mt-2 flex flex-col gap-2">
                                    {order.items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
                                            style={{
                                                borderColor: Theme.colors.border,
                                                backgroundColor: Theme.colors.surface,
                                            }}
                                        >
                                            <img
                                                src={item.image}
                                                alt=""
                                                loading="lazy"
                                                decoding="async"
                                                className="h-9 w-9 shrink-0 rounded-md object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold">{item.name}</p>
                                                <p
                                                    className="text-[10.5px]"
                                                    style={{ color: Theme.colors.textMuted }}
                                                >
                                                    {item.brand} · Qty {item.qty}
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-xs font-bold tabular-nums">
                                                {inr(item.price * item.qty)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <p
                                        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                                        style={{ color: Theme.colors.textMuted }}
                                    >
                                        Fulfilment track
                                    </p>
                                    <ol className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2">
                                        {TRACK_STEPS.map((step, index) => {
                                            const done = !cancelled && index < completedSteps;
                                            return (
                                                <li
                                                    key={step}
                                                    className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10.5px] font-semibold"
                                                    style={{
                                                        borderColor: done ? 'transparent' : Theme.colors.border,
                                                        backgroundColor: done
                                                            ? Theme.colors.primaryLight
                                                            : Theme.colors.surface,
                                                        color: done
                                                            ? Theme.colors.primaryDark
                                                            : Theme.colors.textMuted,
                                                    }}
                                                >
                                                    {done ? (
                                                        <Check size={11} strokeWidth={3} />
                                                    ) : (
                                                        <Clock size={11} />
                                                    )}
                                                    {step}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </div>

                                <dl className="flex flex-col gap-1.5 text-xs">
                                    <div className="flex justify-between gap-3">
                                        <dt style={{ color: Theme.colors.textMuted }}>Subtotal</dt>
                                        <dd className="tabular-nums">{inr(orderSubtotal(order))}</dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <dt style={{ color: Theme.colors.textMuted }}>Savings (MRP)</dt>
                                        <dd className="tabular-nums" style={{ color: Theme.colors.primaryDark }}>
                                            − {inr(orderSavings(order))}
                                        </dd>
                                    </div>
                                    {order.discount && order.discount > 0 ? (
                                        <div className="flex justify-between gap-3">
                                            <dt style={{ color: Theme.colors.textMuted }}>Coupon discount</dt>
                                            <dd
                                                className="tabular-nums"
                                                style={{ color: Theme.colors.primaryDark }}
                                            >
                                                − {inr(order.discount)}
                                            </dd>
                                        </div>
                                    ) : null}
                                    <div
                                        className="flex justify-between gap-3 border-t pt-1.5 font-bold"
                                        style={{ borderColor: Theme.colors.border }}
                                    >
                                        <dt>{cancelled ? 'Refunded' : 'Total paid'}</dt>
                                        <dd className="tabular-nums">
                                            {cancelled ? inr(orderSubtotal(order)) : inr(orderTotal(order))}
                                        </dd>
                                    </div>
                                </dl>

                                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                                    {order.address}
                                </p>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
