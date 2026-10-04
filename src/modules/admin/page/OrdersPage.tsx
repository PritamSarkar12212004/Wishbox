import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr } from '@/lib/format';
import { AdminButton, AdminStatusChip, PageHeader, Panel, TextInput } from '../components/AdminUI';
import DataTable from '../components/DataTable';
import adminConst from '../consts/adminConst';
import { statusForSlug } from '../consts/orderConst';
import { OPEN_STATUSES, type AdminOrder } from '../data/adminData';
import { useAdminFeed } from '../hooks/useAdminFeed';
import { adminOrdersStore } from '../store/adminOrdersStore';

export default function OrdersPage() {
    const { status: statusSlug } = useParams<{ status: string }>();
    const navigate = useNavigate();
    const { orders } = useAdminFeed();
    const [search, setSearch] = useState('');

    const filter = statusForSlug(statusSlug);

    /** View opens the full-screen order sheet — where every status action now lives. */
    const openOrder = (order: AdminOrder) => navigate(adminConst.route.orderDetailsPage(order.id));

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

    const revenue = visible
        .filter((order) => order.status !== 'Cancelled')
        .reduce((sum, order) => sum + order.amount, 0);
    const awaiting = visible.filter((order) => OPEN_STATUSES.includes(order.status)).length;

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

            {/* ── Search ──────────────────────────────────────────── */}
            {/* Status filtering lives in the sidebar — nothing here re-selects it. */}
            <div className="mb-4 flex justify-end">
                <div className="relative w-full min-w-0 sm:max-w-xs">
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
                onRowClick={(order) => openOrder(order)}
                emptyTitle="No orders match"
                emptyHint="Pick a different status in the sidebar, or try another search term."
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
                                <AdminButton onClick={() => openOrder(order)}>View</AdminButton>
                            </div>
                        ),
                    },
                ]}
                footer={
                    visible.length > 60 && (
                        <p className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                            Showing the 60 most recent of {compactCount(visible.length)} matching orders — narrow the
                            sidebar filter or search to see more.
                        </p>
                    )
                }
            />

            <Panel className="mt-4 p-4">
                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    Open an order to approve it, mark it shipped with a courier and AWB, or cancel it — status actions
                    live in the order sheet. Demo orders advance through the admin pipeline only; orders placed on this
                    storefront (<span className="font-semibold">#WB-…</span>) write back to the customer-facing history,
                    so status changes there are what shoppers see.
                </p>
            </Panel>
        </div>
    );
}
