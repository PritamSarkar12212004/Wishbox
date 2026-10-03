import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import SelectMenu from '@/components/ui/select-menu';
import { compactCount, inr } from '@/lib/format';
import { AdminButton, AdminStatusChip, PageHeader, Panel, TextInput } from '../components/AdminUI';
import DataTable from '../components/DataTable';
import OrderDetailDialog from '../components/OrderDetailDialog';
import adminConst from '../consts/adminConst';
import { ORDER_STATUS_SLUGS, statusForSlug } from '../consts/orderConst';
import { OPEN_STATUSES, type AdminOrder, type AdminOrderStatus } from '../data/adminData';
import { useAdminFeed } from '../hooks/useAdminFeed';
import { adminOrdersStore } from '../store/adminOrdersStore';

const route = adminConst.route;

export default function OrdersPage() {
    const { status: statusSlug } = useParams<{ status: string }>();
    const navigate = useNavigate();
    const { orders } = useAdminFeed();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<AdminOrder | null>(null);

    const filter = statusForSlug(statusSlug);

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        return orders.filter((order) => {
            if (filter && order.status !== filter) return false;
            if (!query) return true;
            return (
                order.id.toLowerCase().includes(query) ||
                order.customer.toLowerCase().includes(query) ||
                order.city.toLowerCase().includes(query) ||
                order.items.some((item) => item.name.toLowerCase().includes(query))
            );
        });
    }, [orders, filter, search]);

    const counts = useMemo(() => {
        const map = new Map<AdminOrderStatus, number>();
        orders.forEach((order) => map.set(order.status, (map.get(order.status) ?? 0) + 1));
        return map;
    }, [orders]);

    const revenue = visible
        .filter((order) => order.status !== 'Cancelled')
        .reduce((sum, order) => sum + order.amount, 0);
    const awaiting = visible.filter((order) => OPEN_STATUSES.includes(order.status)).length;

    function changeStatus(order: AdminOrder, status: AdminOrderStatus) {
        if (status === order.status) return;
        adminOrdersStore.setStatus(order.id, status);
        toast.success(`${order.id} marked ${status.toLowerCase()}`, {
            description: order.isLive
                ? 'The storefront order history updates instantly.'
                : 'Demo order updated in the admin pipeline.',
        });
    }

    const tabs = [
        { key: 'all', label: 'All', to: route.ordersPage, count: orders.length, active: !filter },
        ...ORDER_STATUS_SLUGS.map((entry) => ({
            key: entry.slug,
            label: entry.label,
            to: route.orderStatusPage(entry.slug),
            count: counts.get(entry.status) ?? 0,
            active: filter === entry.status,
        })),
    ];

    return (
        <div>
            <PageHeader
                title={filter ? `${filter} orders` : 'Orders'}
                description={`${compactCount(visible.length)} orders · ${inr(revenue)} · ${awaiting} still need action.`}
            >
                <AdminButton
                    onClick={() => {
                        adminOrdersStore.reset();
                        toast('Demo order statuses restored');
                    }}
                >
                    <RotateCcw size={13} />
                    Reset demo statuses
                </AdminButton>
            </PageHeader>

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div
                    role="tablist"
                    aria-label="Filter orders by status"
                    className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={tab.active}
                            onClick={() => navigate(tab.to)}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
                            style={{
                                borderColor: tab.active ? 'transparent' : Theme.colors.border,
                                backgroundColor: tab.active ? Theme.colors.text : Theme.colors.surface,
                                color: tab.active ? Theme.colors.background : Theme.colors.text,
                                boxShadow: tab.active ? Theme.Shadow.sm : 'none',
                            }}
                        >
                            {tab.label}
                            <span className="text-[10px] tabular-nums" style={{ opacity: 0.6 }}>
                                {compactCount(tab.count)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full min-w-0 lg:w-72">
                    <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: Theme.colors.textMuted }}
                    />
                    <TextInput
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search order, customer or item"
                        className="pl-9"
                        aria-label="Search orders"
                    />
                </div>
            </div>

            {/* ── Table ───────────────────────────────────────────── */}
            <DataTable
                minWidth={980}
                rows={visible.slice(0, 60)}
                rowKey={(order) => order.id}
                onRowClick={(order) => setSelected(order)}
                emptyTitle="No orders match"
                emptyHint="Try another status filter or search term."
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
                                    {order.isGuest ? ' · guest' : ''}
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: 'items',
                        header: 'Items',
                        hideBelow: 'md',
                        render: (order: AdminOrder) => (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center -space-x-2">
                                    {order.items.slice(0, 3).map((item) => (
                                        <img
                                            key={item.productId}
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
                                    {order.items.reduce((sum, item) => sum + item.qty, 0)} qty
                                </span>
                            </div>
                        ),
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
                        key: 'payment',
                        header: 'Payment',
                        hideBelow: 'lg',
                        render: (order: AdminOrder) => (
                            <div>
                                <p className="text-xs">{order.payment}</p>
                                <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                    {order.paymentStatus}
                                </p>
                            </div>
                        ),
                    },
                    {
                        key: 'status',
                        header: 'Status',
                        render: (order: AdminOrder) => (
                            <div className="flex flex-col items-start gap-1">
                                <AdminStatusChip status={order.status} />
                                {order.delayed && (
                                    <span className="text-[10px] font-semibold" style={{ color: Theme.colors.accentDark }}>
                                        Delayed
                                    </span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: 'action',
                        header: 'Action',
                        align: 'right',
                        render: (order: AdminOrder) => (
                            <div
                                className="flex items-center justify-end gap-2"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <SelectMenu
                                    className="w-36"
                                    value={order.status}
                                    options={adminOrdersStore.statusOptions().map((status) => ({
                                        value: status,
                                        label: status,
                                    }))}
                                    onChange={(value) => changeStatus(order, value as AdminOrderStatus)}
                                    label={`Status for ${order.id}`}
                                    menuHeading="Set status"
                                />
                                <AdminButton onClick={() => setSelected(order)}>View</AdminButton>
                            </div>
                        ),
                    },
                ]}
                footer={
                    visible.length > 60 && (
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Showing the 60 most recent of {compactCount(visible.length)} matching orders — narrow the
                            filter or search to see more.
                        </p>
                    )
                }
            />

            <Panel className="mt-4 p-4">
                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    Demo orders advance through the admin pipeline only. Orders placed on this storefront
                    (<span className="font-semibold">#WB-…</span>) write back to the customer-facing history, so status
                    changes there are what shoppers see.
                </p>
            </Panel>

            <OrderDetailDialog order={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
