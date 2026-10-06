import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { Bell, Check, Copy, LogOut, MapPin, PackageCheck, RotateCcw, ShieldCheck, Ticket, User, X } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { ApiError } from '@/lib/api/client';
import { inr } from '@/lib/format';
import AddressBookPanel from '@/modules/addresses/components/AddressBookPanel';
import { COUPONS } from '@/modules/products/data/detailData';
import { orderTotal } from '@/modules/history/data/historyData';
import { useOrders } from '@/modules/history/store/store';
import { useReturnRequests } from '@/modules/history/store/returnsStore';
import { useSignOut, useUpdateProfile } from '../api/useAuth';
import { LOGIN_REASONS } from '../data/authData';
import { formatPhone } from '../lib/otp';
import { useIdentity } from '../store/authStore';
import { loginGate } from '../store/loginGate';

export type AccountTab = 'profile' | 'addresses' | 'coupons' | 'updates';

const STATUS_TINT: Record<string, { bg: string; fg: string }> = {
    Delivered: { bg: Theme.colors.primaryLight, fg: Theme.colors.primaryDark },
    Shipped: { bg: Theme.colors.tertiary, fg: Theme.colors.accentDark },
    Processing: { bg: Theme.colors.secondary, fg: Theme.colors.text },
    Cancelled: { bg: Theme.colors.surfaceAlt, fg: Theme.colors.textMuted },
};

const TABS: Array<{ id: AccountTab; label: string; icon: typeof User }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'coupons', label: 'Saved coupons', icon: Ticket },
    { id: 'updates', label: 'Notifications', icon: Bell },
];

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'W';

/** Everything behind the account button: profile, coupons and order updates. */
export default function AccountDialog({
    open,
    tab,
    onOpenChange,
}: {
    open: boolean;
    tab: AccountTab;
    onOpenChange: (open: boolean) => void;
}) {
    const identity = useIdentity();
    const signOut = useSignOut();
    const updateProfile = useUpdateProfile();
    const navigate = useNavigate();
    const orders = useOrders();
    const returnRequests = useReturnRequests();
    /* The menu remounts this dialog per (open, tab) pair, so `tab` is the start. */
    const [active, setActive] = useState<AccountTab>(tab);
    const [draftName, setDraftName] = useState(identity?.name ?? '');

    if (!identity) return null;

    const recent = orders.slice(0, 8);

    function copyCode(code: string) {
        if (navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText(code).catch(() => undefined);
        }
        toast.success(`${code} copied`, { description: 'Paste it on the product page or in the cart.' });
    }

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Backdrop className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
                <DialogPrimitive.Popup
                    className="fixed z-[61] w-full outline-none data-open:animate-in data-open:fade-in-0 max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:data-open:slide-in-from-bottom-6 sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,33rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:data-open:zoom-in-95 max-h-[92vh] overflow-y-auto overscroll-contain"
                    style={{
                        backgroundColor: Theme.colors.surface,
                        boxShadow: Theme.Shadow.xl,
                        fontFamily: Theme.Typography.fontFamily,
                        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
                    }}
                >
                    {/* ── Head ──────────────────────────────────────── */}
                    <div
                        className="flex items-center gap-3 px-5 py-5"
                        style={{
                            background: `linear-gradient(135deg, ${Theme.colors.surfaceAlt}, ${Theme.colors.surface})`,
                        }}
                    >
                        <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold"
                            style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                        >
                            {initialsOf(identity.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                            <DialogPrimitive.Title className="truncate text-base font-bold">
                                {identity.name}
                            </DialogPrimitive.Title>
                            <DialogPrimitive.Description
                                className="flex items-center gap-1.5 text-[12px]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                <ShieldCheck size={12} style={{ color: Theme.colors.primaryDark }} />
                                {formatPhone(identity.phone)} · verified
                            </DialogPrimitive.Description>
                        </div>
                        <DialogPrimitive.Close
                            aria-label="Close account"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors hover:bg-black/5"
                            style={{ borderColor: Theme.colors.border, color: Theme.colors.textLight }}
                        >
                            <X size={16} />
                        </DialogPrimitive.Close>
                    </div>

                    {/* ── Tabs ──────────────────────────────────────── */}
                    <div
                        role="tablist"
                        aria-label="Account sections"
                        className="flex gap-1 overflow-x-auto border-y px-3 py-2"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        {TABS.map((entry) => {
                            const isActive = entry.id === active;
                            const Icon = entry.icon;
                            return (
                                <button
                                    key={entry.id}
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setActive(entry.id)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors"
                                    style={{
                                        backgroundColor: isActive ? Theme.colors.text : 'transparent',
                                        color: isActive ? Theme.colors.background : Theme.colors.textLight,
                                    }}
                                >
                                    <Icon size={14} />
                                    {entry.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Panels ────────────────────────────────────── */}
                    <div className="px-5 py-5">
                        {active === 'profile' && (
                            <div role="tabpanel" aria-label="Profile" className="flex flex-col gap-4">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold">Display name</span>
                                    <span className="flex gap-2">
                                        <input
                                            value={draftName}
                                            onChange={(event) => setDraftName(event.target.value)}
                                            maxLength={60}
                                            className="h-11 min-w-0 flex-1 rounded-xl border px-3.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                            style={{
                                                backgroundColor: Theme.colors.surface,
                                                borderColor: Theme.colors.border,
                                                color: Theme.colors.text,
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                updateProfile.mutate(
                                                    { name: draftName },
                                                    {
                                                        onSuccess: () => toast.success('Name updated'),
                                                        onError: (failure) =>
                                                            toast.error(
                                                                failure instanceof ApiError
                                                                    ? failure.message
                                                                    : 'Could not save your name'
                                                            ),
                                                    }
                                                );
                                            }}
                                            disabled={draftName.trim().length < 2 || updateProfile.isPending}
                                            className="h-11 shrink-0 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
                                            style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                                        >
                                            {updateProfile.isPending ? 'Saving…' : 'Save'}
                                        </button>
                                    </span>
                                </label>

                                <div
                                    className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
                                    style={{ backgroundColor: Theme.colors.surfaceAlt }}
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold">WhatsApp number</p>
                                        <p className="mt-0.5 text-[12px]" style={{ color: Theme.colors.textLight }}>
                                            {formatPhone(identity.phone)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenChange(false);
                                            loginGate.require(undefined, LOGIN_REASONS.profile);
                                        }}
                                        className="shrink-0 text-[12px] font-semibold underline-offset-2 hover:underline"
                                        style={{ color: Theme.colors.accentDark }}
                                    >
                                        Change
                                    </button>
                                </div>

                                <nav className="flex flex-col overflow-hidden rounded-xl border" style={{ borderColor: Theme.colors.border }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenChange(false);
                                            navigate('/history');
                                        }}
                                        className="flex items-center gap-2.5 px-3.5 py-3 text-left text-[13px] font-medium transition-colors hover:bg-black/5"
                                    >
                                        <PackageCheck size={15} style={{ color: Theme.colors.primaryDark }} />
                                        My orders
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenChange(false);
                                            navigate('/wishlist');
                                        }}
                                        className="border-t px-3.5 py-3 text-left text-[13px] font-medium transition-colors hover:bg-black/5"
                                        style={{ borderColor: Theme.colors.border }}
                                    >
                                        Wishlist
                                    </button>
                                </nav>

                                <button
                                    type="button"
                                    onClick={() => {
                                        signOut();
                                        onOpenChange(false);
                                        toast('Signed out of your account');
                                    }}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-black/5"
                                    style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.accentDark }}
                                >
                                    <LogOut size={15} />
                                    Sign out
                                </button>

                                <p className="text-[11px] leading-relaxed" style={{ color: Theme.colors.textMuted }}>
                                    Your name, number and saved addresses live on your WishBox account, so they follow you
                                    to any device. Payment is still simulated at checkout.
                                </p>
                            </div>
                        )}

                        {active === 'addresses' && (
                            <div role="tabpanel" aria-label="Saved addresses" className="flex flex-col gap-3">
                                <p className="text-[12px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                                    Saved delivery addresses. Checkout offers these first, so add the ones you actually
                                    use.
                                </p>
                                <AddressBookPanel />
                            </div>
                        )}

                        {active === 'coupons' && (
                            <div role="tabpanel" aria-label="Saved coupons" className="flex flex-col gap-3">
                                <p className="text-[12px] leading-relaxed" style={{ color: Theme.colors.textLight }}>
                                    Every code running in the store right now. Copy one and apply it on any product page or in
                                    the cart.
                                </p>
                                <ul className="flex flex-col gap-2">
                                    {Object.entries(COUPONS).map(([code, coupon]) => (
                                        <li
                                            key={code}
                                            className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3"
                                            style={{ borderColor: Theme.colors.border }}
                                        >
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-bold tracking-[0.08em]">{code}</p>
                                                <p className="mt-0.5 text-[11.5px]" style={{ color: Theme.colors.textMuted }}>
                                                    {coupon.label} · applied at checkout
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => copyCode(code)}
                                                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors hover:bg-black/5"
                                                style={{ borderColor: Theme.colors.borderStrong, color: Theme.colors.text }}
                                            >
                                                <Copy size={13} />
                                                Copy
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {active === 'updates' && (
                            <div role="tabpanel" aria-label="Notifications" className="flex flex-col gap-2">
                                {returnRequests.length > 0 && (
                                    <ul className="flex flex-col gap-2">
                                        {returnRequests.slice(0, 3).map((request) => (
                                            <li
                                                key={request.id}
                                                className="flex items-start gap-3 rounded-xl border px-3.5 py-3"
                                                style={{
                                                    borderColor: Theme.colors.borderStrong,
                                                    backgroundColor: Theme.colors.surfaceAlt,
                                                }}
                                            >
                                                <span
                                                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                                                    style={{
                                                        backgroundColor: Theme.colors.primaryLight,
                                                        color: Theme.colors.primaryDark,
                                                    }}
                                                >
                                                    <RotateCcw size={14} />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12.5px] font-semibold">
                                                        {request.id} · {request.status}
                                                    </p>
                                                    <p className="mt-0.5 text-[11.5px]" style={{ color: Theme.colors.textMuted }}>
                                                        {request.productName} from {request.orderId} · pickup within 24-48 hours
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {recent.length === 0 && returnRequests.length === 0 ? (
                                    <p className="py-6 text-center text-[13px]" style={{ color: Theme.colors.textMuted }}>
                                        No notifications yet — order and delivery updates will land here.
                                    </p>
                                ) : (
                                    <ul className="flex flex-col gap-2">
                                        {recent.map((order) => {
                                            const tint = STATUS_TINT[order.status] ?? {
                                                bg: Theme.colors.surfaceAlt,
                                                fg: Theme.colors.textMuted,
                                            };
                                            return (
                                                <li
                                                    key={order.id}
                                                    className="flex items-start gap-3 rounded-xl border px-3.5 py-3"
                                                    style={{ borderColor: Theme.colors.border }}
                                                >
                                                    <span
                                                        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                                                        style={{ backgroundColor: tint.bg, color: tint.fg }}
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[12.5px] font-semibold">
                                                            {order.id} is {order.status.toLowerCase()}
                                                        </p>
                                                        <p className="mt-0.5 text-[11.5px]" style={{ color: Theme.colors.textMuted }}>
                                                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} ·{' '}
                                                            {inr(orderTotal(order))} · placed {order.placedOn}
                                                        </p>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </DialogPrimitive.Popup>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
