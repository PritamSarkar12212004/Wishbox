import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Heart, LogOut, PackageCheck, Ticket, User, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import Theme from '@/assets/Theme/Theme';
import { useSignOut } from '../api/useAuth';
import { LOGIN_REASONS } from '../data/authData';
import { formatPhone } from '../lib/otp';
import { useIdentity } from '../store/authStore';
import { loginGate } from '../store/loginGate';
import AccountDialog, { type AccountTab } from './AccountDialog';

const initialsOf = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('') || 'W';

/**
 * Header account control.
 *
 * Signed out it is the "Sign in" entry point; signed in it shows the shopper's
 * initials and opens a menu for the account-connected surfaces (profile, orders,
 * wishlist, saved coupons and notifications).
 */
export default function AccountMenu() {
    const identity = useIdentity();
    const signOut = useSignOut();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dialog, setDialog] = useState<{ open: boolean; tab: AccountTab }>({ open: false, tab: 'profile' });
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setMenuOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

    function openDialog(tab: AccountTab) {
        setMenuOpen(false);
        setDialog({ open: true, tab });
    }

    if (!identity) {
        return (
            <button
                type="button"
                onClick={() => loginGate.require(undefined, LOGIN_REASONS.account)}
                className="inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors hover:bg-black/5"
                style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt, color: Theme.colors.text }}
            >
                <UserRound size={18} />
                <span className="hidden sm:inline">Sign in</span>
            </button>
        );
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`Account menu for ${identity.name}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border pl-1 pr-2.5 transition-colors hover:bg-black/5"
                style={{ borderColor: Theme.colors.border, backgroundColor: Theme.colors.surfaceAlt }}
            >
                <span
                    className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold"
                    style={{ backgroundColor: Theme.colors.primaryDark, color: Theme.colors.white }}
                >
                    {initialsOf(identity.name)}
                </span>
                <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline" style={{ color: Theme.colors.text }}>
                    {identity.name.split(' ')[0]}
                </span>
                <ChevronDown
                    size={15}
                    className={`shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    style={{ color: Theme.colors.textMuted }}
                />
            </button>

            {menuOpen && (
                <div
                    role="menu"
                    aria-label="Account"
                    className="absolute right-0 top-full z-50 mt-2 w-[17rem] overflow-hidden rounded-2xl border"
                    style={{
                        backgroundColor: Theme.colors.surface,
                        borderColor: Theme.colors.border,
                        boxShadow: Theme.Shadow.lg,
                    }}
                >
                    <div className="px-4 py-3.5" style={{ backgroundColor: Theme.colors.surfaceAlt }}>
                        <p className="truncate text-sm font-bold" style={{ color: Theme.colors.text }}>
                            {identity.name}
                        </p>
                        <p className="mt-0.5 text-[11.5px]" style={{ color: Theme.colors.textLight }}>
                            {formatPhone(identity.phone)} · verified
                        </p>
                    </div>

                    <div className="p-1.5">
                        <MenuButton
                            icon={PackageCheck}
                            label="My orders"
                            hint="Track and reorder"
                            onClick={() => {
                                setMenuOpen(false);
                                navigate('/history');
                            }}
                        />
                        <MenuButton
                            icon={Heart}
                            label="Wishlist"
                            hint="Saved products"
                            onClick={() => {
                                setMenuOpen(false);
                                navigate('/wishlist');
                            }}
                        />
                        <MenuButton icon={Ticket} label="Saved coupons" onClick={() => openDialog('coupons')} />
                        <MenuButton icon={Bell} label="Notifications" onClick={() => openDialog('updates')} />
                        <MenuButton icon={User} label="My profile" onClick={() => openDialog('profile')} />
                    </div>

                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            signOut();
                            setMenuOpen(false);
                            toast('Signed out of your account');
                        }}
                        className="flex w-full items-center gap-2.5 border-t px-4 py-3 text-[13px] font-semibold transition-colors hover:bg-black/5"
                        style={{ borderColor: Theme.colors.border, color: Theme.colors.accentDark }}
                    >
                        <LogOut size={15} />
                        Sign out
                    </button>
                </div>
            )}

            <AccountDialog
                key={`${dialog.tab}-${dialog.open ? 'open' : 'closed'}`}
                open={dialog.open}
                tab={dialog.tab}
                onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
            />
        </div>
    );
}

function MenuButton({
    icon: Icon,
    label,
    hint,
    onClick,
}: {
    icon: typeof User;
    label: string;
    hint?: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-black/5"
        >
            <Icon size={16} style={{ color: Theme.colors.primaryDark }} />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold" style={{ color: Theme.colors.text }}>
                    {label}
                </span>
                {hint && (
                    <span className="mt-0.5 block truncate text-[11px]" style={{ color: Theme.colors.textMuted }}>
                        {hint}
                    </span>
                )}
            </span>
        </button>
    );
}
