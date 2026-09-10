import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    Heart,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
    Gift,
    Package,
    LayoutGrid,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { cartStore, wishlistStore } from '../store/store';

const CATEGORIES = [
    'Paper Decoration',
    'Craft & DIY',
    'Gifting',
    'Stationery',
    'Festive Decor',
];

function useCartCount() {
    return useSyncExternalStore(cartStore.subscribe, cartStore.get, () => 2);
}
function useWishlistCount() {
    return useSyncExternalStore(wishlistStore.subscribe, wishlistStore.get, () => 1);
}

export default function PdpHeader() {
    const cartCount = useCartCount();
    const wishlistCount = useWishlistCount();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [query, setQuery] = useState('');
    const accountRef = useRef<HTMLDivElement>(null);
    const catRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
            if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const iconBtn =
        'relative flex h-10 w-10 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/25 hover:bg-black/5';

    return (
        <header
            className="sticky top-0 z-40 w-full"
            style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${Theme.colors.border}`,
                fontFamily: Theme.Typography.fontFamily,
            }}
        >
            <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
                <div className="flex items-center gap-2 sm:gap-3 h-16">
                    <button
                        type="button"
                        aria-label="Open menu"
                        className={`${iconBtn} md:hidden`}
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="PaperCraft home">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: Theme.colors.primary }}>
                            <Gift size={18} style={{ color: Theme.colors.white }} />
                        </span>
                        <span className="text-[22px] font-bold tracking-tight hidden sm:block" style={{ color: Theme.colors.primaryDark }}>
                            Paper<span style={{ color: Theme.colors.accent }}>Craft</span>
                        </span>
                    </Link>
{/* Category dropdown (desktop) */}
                    <div className="relative hidden lg:block" ref={catRef}>
                        <button
                            type="button"
                            onClick={() => setCatOpen((v) => !v)}
                            aria-expanded={catOpen}
                            className="flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/25 hover:bg-black/5"
                            style={{ color: Theme.colors.text }}
                        >
                            <LayoutGrid size={16} />
                            Categories
                            <ChevronDown size={14} className="transition-transform" style={{ transform: catOpen ? 'rotate(180deg)' : undefined }} />
                        </button>
                        <AnimatePresence>
                            {catOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 6 }}
                                    transition={{ duration: 0.16 }}
                                    className="absolute left-0 top-full pt-2 z-50"
                                >
                                    <div className="w-60 rounded-2xl p-2 shadow-xl border bg-white"
                                        style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.lg }}>
                                        {CATEGORIES.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-black/5"
                                                style={{ color: Theme.colors.text }}
                                            >
                                                <Package size={15} style={{ color: Theme.colors.textMuted }} />
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Search */}
                    <form
                        role="search"
                        onSubmit={(e) => e.preventDefault()}
                        className="hidden md:flex flex-1 items-center max-w-xl mx-auto rounded-full border bg-white/80 overflow-hidden transition-all"
                        style={{ borderColor: Theme.colors.border }}
                    >
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products..."
                            aria-label="Search products"
                            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none min-w-0"
                            style={{ color: Theme.colors.text }}
                        />
                        <button
                            type="submit"
                            aria-label="Submit search"
                            className="m-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            <Search size={17} />
                        </button>
                    </form>
{/* Actions */}
                    <div className="flex items-center gap-0.5 ml-auto">
                        <Link to="/wishlist" aria-label={`Wishlist, ${wishlistCount} items`} className={`${iconBtn} hidden sm:flex`}>
                            <Heart size={19} />
                            {wishlistCount > 0 && <Badge count={wishlistCount} />}
                        </Link>
                        <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className={iconBtn}>
                            <ShoppingCart size={19} />
                            {cartCount > 0 && <Badge count={cartCount} />}
                        </Link>
                        <div className="relative" ref={accountRef}>
                            <button
                                type="button"
                                aria-label="Account"
                                aria-expanded={accountOpen}
                                onClick={() => setAccountOpen((v) => !v)}
                                className={`${iconBtn} hidden sm:flex`}
                            >
                                <User size={19} />
                            </button>
                            <AnimatePresence>
                                {accountOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        transition={{ duration: 0.16 }}
                                        className="absolute right-0 top-full pt-2"
                                    >
                                        <div className="w-56 rounded-2xl p-2 border bg-white shadow-xl"
                                            style={{ borderColor: Theme.colors.border, boxShadow: Theme.Shadow.lg }}>
                                            <div className="px-3 py-2.5">
                                                <p className="text-sm font-semibold" style={{ color: Theme.colors.text }}>Welcome</p>
                                                <p className="text-xs" style={{ color: Theme.colors.textMuted }}>Sign in for a faster checkout</p>
                                            </div>
                                            <button type="button" className="w-full rounded-xl bg-black px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85">
                                                Sign In
                                            </button>
                                            {['My Orders', 'Wishlist', 'My Cart'].map((item) => (
                                                <button key={item} type="button"
                                                    className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-black/5"
                                                    style={{ color: Theme.colors.text }}>
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Mobile search */}
                <form className="md:hidden pb-3" onSubmit={(e) => e.preventDefault()} role="search">
                    <div className="flex items-center rounded-full border bg-white/70 overflow-hidden"
                        style={{ borderColor: Theme.colors.border }}>
                        <Search size={16} className="ml-3 shrink-0" style={{ color: Theme.colors.textMuted }} />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search products..."
                            aria-label="Search products"
                            className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                            style={{ color: Theme.colors.text }}
                        />
                    </div>
                </form>
            </div>
{/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.nav
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="md:hidden overflow-hidden border-t bg-white"
                        style={{ borderColor: Theme.colors.border }}
                        aria-label="Mobile navigation"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {CATEGORIES.map((c) => (
                                <Link key={c} to="/shop" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5"
                                    style={{ color: Theme.colors.text }}>
                                    <Package size={15} style={{ color: Theme.colors.textMuted }} />
                                    {c}
                                </Link>
                            ))}
                            <Link to="/wishlist" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5"
                                style={{ color: Theme.colors.text }}>
                                <Heart size={15} style={{ color: Theme.colors.textMuted }} />
                                Wishlist
                                <span className="ml-auto text-xs" style={{ color: Theme.colors.textMuted }}>{wishlistCount}</span>
                            </Link>
                            <Link to="/cart" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-black/5"
                                style={{ color: Theme.colors.text }}>
                                <ShoppingCart size={15} style={{ color: Theme.colors.textMuted }} />
                                Cart
                            </Link>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
}

function Badge({ count }: { count: number }) {
    return (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
            style={{ backgroundColor: Theme.colors.accent, boxShadow: '0 0 0 2px #fff' }}>
            {count}
        </span>
    );
}