import { useMemo } from 'react';
import { BadgePercent, Check, Hammer } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { compactCount, inr } from '@/lib/format';
import { COUPONS } from '@/modules/products/data/detailData';
import { PageHeader, Panel, PanelHeader } from '../components/AdminUI';
import DataTable from '../components/DataTable';
import Tile from '../components/Tile';
import type { AdminCoupon } from '../data/adminData';
import { useAdminFeed } from '../hooks/useAdminFeed';

const STATUS_STYLE: Record<AdminCoupon['status'], { bg: string; fg: string }> = {
    Active: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
    Scheduled: { bg: Theme.colors.secondary, fg: Theme.colors.text },
    Expired: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textMuted },
};

/**
 * Coupons & offers is parked behind this switch.
 *
 * Everything the page would show is seeded demo data — the discounts that
 * actually reach a cart come from the storefront's own coupon table, not from
 * this screen — so it presents itself as under development instead of looking
 * like coupon tooling that works. Flip this to `true` to bring the view back.
 */
const COUPONS_TOOLS_READY = false;

export default function CouponsPage() {
    if (!COUPONS_TOOLS_READY) return <CouponsUnderDevelopment />;
    return <CouponsBoard />;
}

/**
 * The under-development notice.
 *
 * It names what is missing rather than hiding the screen, and says the one
 * thing that is genuinely live today: the codes the cart already accepts.
 */
function CouponsUnderDevelopment() {
    const live = Object.keys(COUPONS);

    return (
        <div>
            <PageHeader
                title="Coupons & offers"
                description="Coupon tooling is still being built — this screen is a placeholder for now."
            />

            <Panel>
                <div className="flex flex-col items-center gap-3 px-4 py-14 text-center sm:px-6">
                    <span
                        aria-hidden="true"
                        className="grid h-12 w-12 place-items-center rounded-full"
                        style={{ backgroundColor: Theme.colors.primaryLight, color: Theme.colors.primaryDark }}
                    >
                        <Hammer size={20} />
                    </span>
                    <h2 className="text-base font-bold" style={{ color: Theme.colors.text }}>
                        Under development
                    </h2>
                    <p
                        className="max-w-lg text-xs leading-relaxed"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        Creating codes, scheduling offer windows and per-code redemption reports are not built
                        yet, so this screen is a placeholder rather than a half-working table. Nothing is lost —
                        the codes the storefront already accepts keep applying at the cart.
                    </p>
                    <p
                        className="max-w-lg text-[11px] leading-relaxed"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        Live at checkout:{' '}
                        <span className="font-semibold" style={{ color: Theme.colors.text }}>
                            {live.join(', ')}
                        </span>
                    </p>
                </div>
            </Panel>
        </div>
    );
}

/** The coupon table and its totals, kept whole so the switch stays one line. */
function CouponsBoard() {
    const { dataset } = useAdminFeed();

    const totals = useMemo(
        () => ({
            active: dataset.coupons.filter((coupon) => coupon.status === 'Active').length,
            used: dataset.coupons.reduce((sum, coupon) => sum + coupon.used, 0),
            given: dataset.coupons.reduce((sum, coupon) => sum + coupon.discountGiven, 0),
        }),
        [dataset.coupons]
    );

    const wired = useMemo(() => new Set(Object.keys(COUPONS)), []);

    return (
        <div>
            <PageHeader
                title="Coupons & offers"
                description={`${totals.active} active codes · ${compactCount(totals.used)} redemptions worth ${inr(totals.given)}.`}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Panel>
                    <Tile label="Active codes" value={String(totals.active)} tone="good" />
                </Panel>
                <Panel>
                    <Tile label="Redemptions" value={compactCount(totals.used)} hint="Across the demo year" />
                </Panel>
                <Panel>
                    <Tile label="Discount given" value={inr(totals.given)} tone="warn" />
                </Panel>
                <Panel>
                    <Tile
                        label="Avg per redemption"
                        value={inr(totals.used > 0 ? totals.given / totals.used : 0)}
                    />
                </Panel>
            </div>

            <div className="mt-6">
                <DataTable
                    minWidth={940}
                    rows={dataset.coupons}
                    rowKey={(coupon) => coupon.code}
                    emptyTitle="No coupons"
                    columns={[
                        {
                            key: 'code',
                            header: 'Code',
                            render: (coupon: AdminCoupon) => (
                                <div>
                                    <p className="text-[13px] font-bold tracking-wide">{coupon.code}</p>
                                    <p className="mt-0.5 text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        {coupon.label}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            key: 'value',
                            header: 'Discount',
                            render: (coupon: AdminCoupon) => (
                                <span className="text-xs font-semibold">
                                    {coupon.kind === 'percent' ? `${coupon.value}%` : inr(coupon.value)}
                                </span>
                            ),
                        },
                        {
                            key: 'min',
                            header: 'Min order',
                            hideBelow: 'md',
                            render: (coupon: AdminCoupon) => (
                                <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                    {coupon.minOrder > 0 ? inr(coupon.minOrder) : 'None'}
                                </span>
                            ),
                        },
                        {
                            key: 'used',
                            header: 'Used',
                            align: 'right',
                            render: (coupon: AdminCoupon) => (
                                <span className="text-xs tabular-nums">{compactCount(coupon.used)}</span>
                            ),
                        },
                        {
                            key: 'given',
                            header: 'Discount given',
                            align: 'right',
                            render: (coupon: AdminCoupon) => (
                                <span className="text-[13px] font-bold tabular-nums">{inr(coupon.discountGiven)}</span>
                            ),
                        },
                        {
                            key: 'checkout',
                            header: 'Checkout',
                            hideBelow: 'sm',
                            render: (coupon: AdminCoupon) =>
                                wired.has(coupon.code) ? (
                                    <span
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold"
                                        style={{ color: Theme.colors.primaryDark }}
                                    >
                                        <Check size={12} strokeWidth={3} />
                                        Applies at cart
                                    </span>
                                ) : (
                                    <span className="text-[11px]" style={{ color: Theme.colors.textMuted }}>
                                        Marketing only
                                    </span>
                                ),
                        },
                        {
                            key: 'status',
                            header: 'Status',
                            render: (coupon: AdminCoupon) => (
                                <span
                                    className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                                    style={{
                                        backgroundColor: STATUS_STYLE[coupon.status].bg,
                                        color: STATUS_STYLE[coupon.status].fg,
                                    }}
                                >
                                    {coupon.status}
                                </span>
                            ),
                        },
                        {
                            key: 'expires',
                            header: 'Expires',
                            align: 'right',
                            hideBelow: 'sm',
                            render: (coupon: AdminCoupon) => (
                                <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                                    {coupon.expiresOn}
                                </span>
                            ),
                        },
                    ]}
                />
            </div>

            <Panel className="mt-4">
                <PanelHeader
                    title="How coupons actually apply"
                    meta="Only codes present in the storefront's coupon table discount a cart"
                    action={<BadgePercent size={15} style={{ color: Theme.colors.primaryDark }} />}
                />
                <div className="px-4 py-4 sm:px-5">
                    <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                        <span className="font-semibold" style={{ color: Theme.colors.text }}>
                            {[...wired].join(', ')}
                        </span>{' '}
                        are wired into the cart: the coupon applies to the subtotal and every total — cart, checkout
                        and order history — is recomputed from the same function, so the discount can never disagree
                        between screens. The other codes here are seeded marketing data for the demo.
                    </p>
                </div>
            </Panel>
        </div>
    );
}
