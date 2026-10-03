import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  History,
  MapPin,
  RotateCcw,
  Package,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { cn } from '@/lib/utils';
import { cartStore } from '@/modules/products/store/store';
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
} from '../data/historyData';
import { useOrders } from '../store/store';
import { useReturnRequests, type ReturnRequest } from '../store/returnsStore';
import ReturnRequestDialog from '../components/ReturnRequestDialog';

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

type FilterValue = 'All' | OrderStatus;

const STATUS_STYLES: Record<OrderStatus, { bg: string; fg: string }> = {
  Delivered: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
  Shipped: { bg: Theme.colors.tertiary, fg: Theme.colors.accentDark },
  Processing: { bg: Theme.colors.secondary, fg: Theme.colors.text },
  Cancelled: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textMuted },
};

const FILTERS: FilterValue[] = ['All', 'Delivered', 'Shipped', 'Processing', 'Cancelled'];

const themeVars = {
  '--c-surface-alt': Theme.colors.surfaceAlt,
  '--c-accent-dark': Theme.colors.accentDark,
  '--c-accent-soft': `color-mix(in srgb, ${Theme.colors.accent} 12%, ${Theme.colors.surface})`,
  '--c-primary-dark': Theme.colors.primaryDark,
} as React.CSSProperties;

/* ------------------------------------------------------------------ */
/*  Micro components                                                   */
/* ------------------------------------------------------------------ */

function StatusChip({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px]"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {status === 'Cancelled' && <X size={10} strokeWidth={3} />}
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3"
      style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
    >
      <p
        className="text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px]"
        style={{ color: Theme.colors.textMuted }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-sm font-bold tabular-nums sm:text-lg"
        style={{ color: accent ?? Theme.colors.text }}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={15} className="mt-0.5 shrink-0" style={{ color: Theme.colors.textLight }} />
      <div className="min-w-0">
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: Theme.colors.textMuted }}
        >
          {label}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug sm:text-[13px]" style={{ color: Theme.colors.text }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Order card                                                         */
/* ------------------------------------------------------------------ */

type OrderCardProps = {
  order: Order;
  expanded: boolean;
  onToggle: (id: string) => void;
  returnRequest?: ReturnRequest;
  onReturn: (order: Order) => void;
};

const OrderCard = memo(function OrderCard({
  order,
  expanded,
  onToggle,
  returnRequest,
  onReturn,
}: OrderCardProps) {
  const qty = orderQty(order);
  const total = orderTotal(order);
  const savings = orderSavings(order);
  const cancelled = order.status === 'Cancelled';
  const completedSteps = STATUS_STEP[order.status];

  function reorder() {
    order.items.forEach((item) => cartStore.add(item, item.qty));
    toast.success(`${qty} item${qty > 1 ? 's' : ''} from ${order.id} added to cart`);
  }

  return (
    <article
      className="overflow-hidden"
      style={{
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.BorderRadius.xl,
        border: `1px solid ${Theme.colors.border}`,
        boxShadow: Theme.Shadow.sm,
      }}
    >
      {/* ── Collapsed summary row (whole row is the toggle) ── */}
      <button
        type="button"
        onClick={() => onToggle(order.id)}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-3 p-3.5 text-left transition-colors hover:bg-[var(--c-surface-alt)] sm:flex-row sm:items-center sm:gap-5 sm:p-5"
      >
        {/* Thumbnails */}
        <div className="flex items-center -space-x-3">
          {order.items.slice(0, 4).map((item) => (
            <img
              key={item.id}
              src={item.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-11 w-11 rounded-xl border-2 object-cover sm:h-12 sm:w-12"
              style={{ borderColor: Theme.colors.surface }}
            />
          ))}
          {order.items.length > 4 && (
            <span
              className="grid h-11 w-11 place-items-center rounded-xl border-2 text-[10px] font-bold sm:h-12 sm:w-12"
              style={{
                borderColor: Theme.colors.surface,
                backgroundColor: Theme.colors.surfaceAlt,
                color: Theme.colors.textMuted,
              }}
            >
              +{order.items.length - 4}
            </span>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-bold sm:text-[15px]" style={{ color: Theme.colors.text }}>
              {order.id}
            </span>
            <StatusChip status={order.status} />
          </div>
          <p className="mt-1 text-[11px] sm:text-xs" style={{ color: Theme.colors.textMuted }}>
            Placed {order.placedOn} · {order.items.length} line
            {order.items.length > 1 ? 's' : ''} · {qty} item{qty > 1 ? 's' : ''}
          </p>
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="sm:text-right">
            <p
              className="text-base font-bold tabular-nums leading-none sm:text-lg"
              style={{ color: cancelled ? Theme.colors.textMuted : Theme.colors.text }}
            >
              {cancelled ? 'Refunded' : inr(total)}
            </p>
            <p className="mt-1 text-[10px] sm:text-[11px]" style={{ color: Theme.colors.textMuted }}>
              {order.payment}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={cn('shrink-0 transition-transform duration-200', expanded && 'rotate-180')}
            style={{ color: Theme.colors.textMuted }}
          />
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="border-t" style={{ borderColor: Theme.colors.border }}>
          {/* Items in this order */}
          <ul>
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 border-t px-3.5 py-3 first:border-t-0 sm:gap-4 sm:px-5 sm:py-4"
                style={{ borderColor: Theme.colors.border }}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product/${item.id}`}
                    className="line-clamp-2 text-[12.5px] font-semibold leading-snug transition-colors hover:text-[var(--c-accent-dark)] sm:text-sm"
                    style={{ color: Theme.colors.text }}
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-[10.5px] sm:text-xs" style={{ color: Theme.colors.textMuted }}>
                    {item.brand} · Qty {item.qty}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className="text-[12.5px] font-bold tabular-nums sm:text-sm"
                    style={{ color: Theme.colors.text }}
                  >
                    {inr(item.price * item.qty)}
                  </p>
                  {item.mrp > item.price && (
                    <p
                      className="text-[10px] tabular-nums line-through sm:text-[11px]"
                      style={{ color: Theme.colors.textMuted }}
                    >
                      {inr(item.mrp * item.qty)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Tracking */}
          <div
            className="border-t px-3.5 py-3.5 sm:px-5 sm:py-4"
            style={{ borderColor: Theme.colors.border }}
          >
            <p
              className="text-[9px] font-semibold uppercase tracking-[0.14em] sm:text-[10px]"
              style={{ color: Theme.colors.textMuted }}
            >
              Tracking
            </p>

            {cancelled ? (
              <p
                className="mt-2 flex items-start gap-2 text-[12px] sm:text-[13px]"
                style={{ color: Theme.colors.accentDark }}
              >
                <X size={14} className="mt-0.5 shrink-0" />
                <span>
                  Order cancelled — {inr(orderSubtotal(order))} refunded to {order.payment}.
                </span>
              </p>
            ) : (
              <ol className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TRACK_STEPS.map((step, index) => {
                  const done = index < completedSteps;
                  return (
                    <li
                      key={step}
                      className="flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10.5px] font-semibold sm:gap-2 sm:px-3 sm:text-xs"
                      style={{
                        borderColor: done ? 'transparent' : Theme.colors.border,
                        backgroundColor: done ? Theme.colors.primaryLight : Theme.colors.surfaceAlt,
                        color: done ? Theme.colors.primaryDark : Theme.colors.textMuted,
                      }}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : <Clock size={12} />}
                      {step}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Details + totals */}
          <div
            className="grid grid-cols-1 gap-x-8 gap-y-4 border-t px-3.5 py-4 sm:grid-cols-2 sm:px-5"
            style={{ borderColor: Theme.colors.border }}
          >
            <div className="space-y-3.5">
              <DetailRow icon={CreditCard} label="Payment method" value={order.payment} />
              <DetailRow icon={MapPin} label="Delivery address" value={order.address} />
              <DetailRow
                icon={Package}
                label="Contains"
                value={`${qty} item${qty > 1 ? 's' : ''} across ${order.items.length} product${
                  order.items.length > 1 ? 's' : ''
                }`}
              />
            </div>

            <dl className="space-y-2 text-[12px] sm:text-[13px]" style={{ color: Theme.colors.text }}>
              <div className="flex items-baseline justify-between gap-3">
                <dt style={{ color: Theme.colors.textMuted }}>Subtotal</dt>
                <dd className="tabular-nums">{inr(orderSubtotal(order))}</dd>
              </div>
              {savings > 0 && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt style={{ color: Theme.colors.textMuted }}>Discount savings</dt>
                  <dd className="tabular-nums" style={{ color: Theme.colors.primaryDark }}>
                    − {inr(savings)}
                  </dd>
                </div>
              )}
              {order.discount && order.discount > 0 && (
                <div className="flex items-baseline justify-between gap-3">
                  <dt style={{ color: Theme.colors.textMuted }}>Coupon discount</dt>
                  <dd className="tabular-nums" style={{ color: Theme.colors.primaryDark }}>
                    − {inr(order.discount)}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt style={{ color: Theme.colors.textMuted }}>Delivery</dt>
                <dd className="tabular-nums">
                  {order.shipping === 0 ? 'Free' : inr(order.shipping)}
                </dd>
              </div>
              <div
                className="flex items-baseline justify-between gap-3 border-t pt-2.5 font-bold"
                style={{ borderColor: Theme.colors.border }}
              >
                <dt>{cancelled ? 'Amount refunded' : 'Total paid'}</dt>
                <dd className="tabular-nums">
                  {cancelled ? inr(orderSubtotal(order)) : inr(total)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Actions */}
          <div
            className="flex flex-wrap gap-2 border-t px-3.5 py-3.5 sm:px-5 sm:py-4"
            style={{ borderColor: Theme.colors.border }}
          >
            <button
              type="button"
              onClick={reorder}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11.5px] font-semibold text-white transition-transform active:scale-[0.98] sm:h-10 sm:flex-none sm:px-5 sm:text-[13px]"
              style={{ backgroundColor: Theme.colors.primaryDark, boxShadow: Theme.Shadow.sm }}
            >
              <RefreshCw size={13} />
              Reorder
            </button>
            <button
              type="button"
              onClick={() => toast.success(`Invoice for ${order.id} is on its way to your inbox`)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[11.5px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)] sm:h-10 sm:flex-none sm:px-5 sm:text-[13px]"
              style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
            >
              <Download size={13} />
              Invoice
            </button>
            {order.status === 'Delivered' &&
              (returnRequest ? (
                <span
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[11.5px] font-semibold sm:h-10 sm:flex-none sm:text-[13px]"
                  style={{ backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.primaryDark }}
                >
                  <RotateCcw size={13} />
                  {returnRequest.id} · {returnRequest.status.toLowerCase()}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onReturn(order)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[11.5px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)] sm:h-10 sm:flex-none sm:px-5 sm:text-[13px]"
                  style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                >
                  <RotateCcw size={13} />
                  Return / Exchange
                </button>
              ))}
            <Link
              to="/"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[11.5px] font-semibold transition-colors hover:bg-[var(--c-surface-alt)] sm:h-10 sm:flex-none sm:px-5 sm:text-[13px]"
              style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
            >
              Buy again
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </article>
  );
});

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function HistoryPage() {
  const orders = useOrders();
  const returnRequests = useReturnRequests();
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [expanded, setExpanded] = useState<string[]>(() =>
    orders[0] ? [orders[0].id] : []
  );

  const visible = useMemo(
    () => (filter === 'All' ? orders : orders.filter((o) => o.status === filter)),
    [filter, orders]
  );

  const totalItems = useMemo(() => orders.reduce((n, o) => n + orderQty(o), 0), [orders]);
  const totalSpent = useMemo(() => orders.reduce((s, o) => s + orderTotal(o), 0), [orders]);
  const totalSaved = useMemo(() => orders.reduce((s, o) => s + orderSavings(o), 0), [orders]);

  const countFor = (value: FilterValue) =>
    value === 'All' ? orders.length : orders.filter((o) => o.status === value).length;

  function toggle(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="min-h-full w-full" style={{ ...themeVars, backgroundColor: Theme.colors.background }}>
      <div className="w-full px-4 py-8 sm:py-10 md:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="mb-6 sm:mb-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:text-[var(--c-accent-dark)]"
            style={{ color: Theme.colors.textMuted }}
          >
            <ArrowLeft size={13} />
            Continue shopping
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
              style={{ backgroundColor: Theme.colors.secondary }}
            >
              <History size={20} style={{ color: Theme.colors.text }} />
            </div>
            <div className="min-w-0">
              <h1
                className="text-2xl font-bold tracking-tight sm:text-4xl"
                style={{ fontFamily: Theme.Typography?.headingFamily, color: Theme.colors.text }}
              >
                Order History
              </h1>
              <p className="mt-0.5 text-[12px] sm:mt-1 sm:text-sm" style={{ color: Theme.colors.textMuted }}>
                {orders.length} orders · {totalItems} items · grouped with full details
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3 sm:max-w-2xl">
            <Stat label="Orders" value={String(orders.length)} />
            <Stat label="Items bought" value={String(totalItems)} />
            <Stat label="You saved" value={inr(totalSaved)} accent={Theme.colors.primaryDark} />
          </div>
          <p className="mt-2 text-[11px] sm:text-xs" style={{ color: Theme.colors.textMuted }}>
            Lifetime spend <span style={{ color: Theme.colors.text, fontWeight: 700 }}>{inr(totalSpent)}</span>
          </p>
        </header>

        {/* ── Status filter ── */}
        <div className="mb-5 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
            {FILTERS.map((value) => {
              const active = filter === value;
              const count = countFor(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  aria-pressed={active}
                  className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11.5px] font-semibold transition-all sm:text-xs',
                    active
                      ? 'shadow-sm'
                      : 'hover:border-[var(--c-accent-dark)] hover:text-[var(--c-accent-dark)]'
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: Theme.colors.text,
                          color: Theme.colors.background,
                          borderColor: Theme.colors.text,
                        }
                      : { borderColor: Theme.colors.border, color: Theme.colors.textMuted }
                  }
                >
                  {value}
                  <span
                    className="rounded-full px-1.5 text-[9.5px] tabular-nums sm:text-[10px]"
                    style={
                      active
                        ? { backgroundColor: 'rgba(255,255,255,0.18)', color: Theme.colors.background }
                        : { backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.textMuted }
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Grouped orders ── */}
        {visible.length === 0 ? (
          <div
            className="rounded-2xl border px-6 py-14 text-center"
            style={{ backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border }}
          >
            <Package size={26} className="mx-auto" style={{ color: Theme.colors.textLight }} />
            <p className="mt-3 text-sm font-semibold" style={{ color: Theme.colors.text }}>
              No {filter.toLowerCase()} orders
            </p>
            <button
              type="button"
              onClick={() => setFilter('All')}
              className="mt-3 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: Theme.colors.accentDark }}
            >
              Show all orders
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={expanded.includes(order.id)}
                onToggle={toggle}
                returnRequest={returnRequests.find((entry) => entry.orderId === order.id)}
                onReturn={setReturnOrder}
              />
            ))}
          </div>
        )}
      </div>

      <ReturnRequestDialog
        order={returnOrder}
        onOpenChange={(open) => {
          if (!open) setReturnOrder(null);
        }}
      />
    </div>
  );
}

export default HistoryPage;
