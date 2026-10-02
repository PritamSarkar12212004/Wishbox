import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CreditCard, Package, RotateCcw, ShoppingBag, Truck, X } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { useCatalog } from '@/modules/products/store/catalogStore';
import { AdminButton, PageHeader, Panel, PanelHeader } from '../components/AdminUI';
import Tile from '../components/Tile';
import { useAdminFeed, useAdminRange } from '../hooks/useAdminFeed';
import { buildAlerts, inventoryAnalytics, rangeLabel, type AdminAlert } from '../lib/analytics';
import { useAdminSettings } from '../store/settingsStore';

const KIND_ICON = {
    stock: Package,
    delivery: Truck,
    return: RotateCcw,
    payment: CreditCard,
    order: ShoppingBag,
} as const;

const KIND_LABEL = {
    stock: 'Inventory',
    delivery: 'Delivery',
    return: 'Returns',
    payment: 'Payments',
    order: 'Orders',
} as const;

function timeAgo(at: number, now: number): string {
    const minutes = Math.max(0, Math.round((now - at) / 60_000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.round(days / 30)}mo ago`;
}

export default function NotificationsPage() {
    const { orders, returns, dataset } = useAdminFeed();
    const settings = useAdminSettings();
    const products = useCatalog();
    const { now, key, range } = useAdminRange('30d');
    const [dismissed, setDismissed] = useState<string[]>([]);

    const alerts = useMemo(() => {
        const inventory = inventoryAnalytics(products, dataset.restocks, settings.lowStockThreshold, now);
        return buildAlerts(orders, inventory, returns, range);
    }, [orders, products, dataset.restocks, settings.lowStockThreshold, returns, range, now]);

    const visible = alerts.filter((alert) => !dismissed.includes(alert.id));

    const counts = useMemo(() => {
        const map = new Map<AdminAlert['kind'], number>();
        alerts.forEach((alert) => map.set(alert.kind, (map.get(alert.kind) ?? 0) + 1));
        return map;
    }, [alerts]);

    return (
        <div>
            <PageHeader
                title="Notifications"
                description={`${visible.length} things worth attention · derived from ${rangeLabel(key, range).toLowerCase()} of activity.`}
            >
                <AdminButton onClick={() => setDismissed(alerts.map((alert) => alert.id))}>Clear all</AdminButton>
            </PageHeader>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                {(['stock', 'delivery', 'return', 'payment', 'order'] as const).map((kind) => (
                    <Panel key={kind}>
                        <Tile
                            label={KIND_LABEL[kind]}
                            value={String(counts.get(kind) ?? 0)}
                            tone={kind === 'stock' || kind === 'payment' ? 'warn' : undefined}
                        />
                    </Panel>
                ))}
            </div>

            <div className="mt-6">
                <Panel>
                    <PanelHeader
                        title="Alert feed"
                        meta="Low stock, delayed shipments, open returns, failed payments and new orders"
                        action={<Bell size={15} style={{ color: Theme.colors.primaryDark }} />}
                    />
                    <ul>
                        {visible.slice(0, 40).map((alert) => {
                            const Icon = KIND_ICON[alert.kind];
                            return (
                                <li
                                    key={alert.id}
                                    className="flex items-start gap-3 border-t px-4 py-3.5 first:border-t-0 sm:px-5"
                                    style={{ borderColor: Theme.colors.border }}
                                >
                                    <span
                                        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                                        style={{
                                            backgroundColor: Theme.colors.surfaceAlt,
                                            color:
                                                alert.kind === 'payment' || alert.kind === 'stock'
                                                    ? Theme.colors.accentDark
                                                    : Theme.colors.primaryDark,
                                        }}
                                    >
                                        <Icon size={15} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold sm:text-[13px]">{alert.title}</p>
                                        <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                            {alert.detail}
                                        </p>
                                        <Link
                                            to={alert.href}
                                            className="mt-1.5 inline-block text-[11px] font-semibold transition-colors hover:opacity-70"
                                            style={{ color: Theme.colors.accentDark }}
                                        >
                                            Open
                                        </Link>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2">
                                        <span className="text-[10px]" style={{ color: Theme.colors.textMuted }}>
                                            {timeAgo(alert.at, now)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setDismissed((current) => [...current, alert.id])}
                                            aria-label={`Dismiss ${alert.title}`}
                                            className="grid h-6 w-6 place-items-center rounded-md transition-colors hover:bg-black/5"
                                            style={{ color: Theme.colors.textMuted }}
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                        {visible.length === 0 && (
                            <li className="px-4 py-12 text-center">
                                <p className="text-sm font-semibold">You are all caught up</p>
                                <p className="mt-1 text-xs" style={{ color: Theme.colors.textMuted }}>
                                    No alerts for this period.
                                </p>
                            </li>
                        )}
                    </ul>
                </Panel>
            </div>

            <Panel className="mt-4 p-4">
                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                    Alerts are computed from live data — stock comes from the catalogue, delays from the shipment feed,
                    returns and payments from the demo dataset. Delivery to email or a messaging channel would need a
                    backend; the toggles live in Settings.
                </p>
            </Panel>
        </div>
    );
}
