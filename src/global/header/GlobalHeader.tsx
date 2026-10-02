import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Search, ChevronDown, Heart, ShoppingCart, ClipboardList } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';
import { useCartCount, useWishlistCount } from '@/modules/products/store/store';
import productConst from '@/modules/products/consts/productConst';

const NAV_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
];

const GlobalHeader = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const activeCategory = searchParams.get('category') ?? 'all';
    const activeCategoryLabel =
        productConst.categories.find((category) => category.value === activeCategory)?.label ??
        'All Categories';

    /** Keeps the selector and the shop listing filter on the same URL state. */
    function selectCategory(value: string) {
        setIsCategoryOpen(false);
        navigate(value === 'all' ? '/shop' : `/shop?category=${value}`);
    }

    const watchlistCount = useWishlistCount();
    const cartCount = useCartCount();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const headerStyle: React.CSSProperties = {
        backgroundColor: Theme.colors.surface,
        borderBottom: `1px solid ${Theme.colors.border}`,
        boxShadow: Theme.Shadow.sm,
        fontFamily: Theme.Typography.fontFamily,
        color: Theme.colors.text,
    };

    const logoStyle: React.CSSProperties = {
        fontFamily: Theme.Typography.headingFamily,
        fontSize: Theme.Typography.fontSize['2xl'],
        color: Theme.colors.primaryDark,
        letterSpacing: '0.5px',
        cursor: 'pointer',
    };

    const buttonStyle: React.CSSProperties = {
        color: Theme.colors.text,
        border: `1px solid ${Theme.colors.border}`,
        borderRadius: Theme.BorderRadius.md,
        backgroundColor: Theme.colors.surfaceAlt,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        justifyContent: 'space-between',
    };

    const actionIconStyle: React.CSSProperties = {
        color: Theme.colors.textLight,
        borderRadius: Theme.BorderRadius.full,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
    };

    return (
        <header style={headerStyle} className="sticky top-0 z-50 w-full">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20 gap-4">
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <Link to="/" className="flex items-center" style={logoStyle}>
                            WishBox
                        </Link>

                        <div className="relative hidden sm:block" ref={dropdownRef}>
                            <button
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                style={buttonStyle}
                                className="flex min-w-[8.5rem] items-center gap-2 px-3 py-2 text-sm font-medium lg:min-w-40"
                            >
                                <span className="truncate">{activeCategoryLabel}</span>
                                <ChevronDown size={16} className={`transition-transform shrink-0 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isCategoryOpen && (
                                <div
                                    className="absolute left-0 mt-1 w-full min-w-[200px] py-2 rounded-lg shadow-lg z-50"
                                    style={{
                                        backgroundColor: Theme.colors.surface,
                                        border: `1px solid ${Theme.colors.borderStrong}`,
                                        boxShadow: Theme.Shadow.lg,
                                    }}
                                >
                                    {productConst.categories.map((category) => {
                                        const isActive = category.value === activeCategory;
                                        return (
                                            <button
                                                key={category.value}
                                                onClick={() => selectCategory(category.value)}
                                                aria-current={isActive ? 'true' : undefined}
                                                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors"
                                                style={{
                                                    color: isActive ? Theme.colors.primaryDark : Theme.colors.text,
                                                    backgroundColor: isActive ? Theme.colors.surfaceAlt : 'transparent',
                                                    fontWeight: isActive ? 600 : 400,
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = Theme.colors.surfaceAlt;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = isActive
                                                        ? Theme.colors.surfaceAlt
                                                        : 'transparent';
                                                }}
                                            >
                                                {category.label}
                                                {isActive && (
                                                    <Check size={14} style={{ color: Theme.colors.primaryDark }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Primary navigation — desktop only */}
                        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
                            {NAV_LINKS.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    end={link.to === '/'}
                                    className="rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-black/5"
                                    style={({ isActive }) => ({
                                        color: isActive ? Theme.colors.primaryDark : Theme.colors.text,
                                        fontWeight: isActive ? 600 : 500,
                                    })}
                                >
                                    {link.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Center: search bar — desktop only; mobile uses the toggle panel below */}
                    <div className="hidden flex-1 md:mx-3 md:block md:max-w-md lg:mx-4 lg:max-w-xl">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full py-2 pl-10 pr-4 text-sm rounded-full border focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: Theme.colors.surfaceAlt,
                                    border: `1px solid ${Theme.colors.border}`,
                                    color: Theme.colors.text,
                                    borderRadius: Theme.BorderRadius.full,
                                }}
                                onFocus={(e) => (e.target.style.borderColor = Theme.colors.primary)}
                                onBlur={(e) => (e.target.style.borderColor = Theme.colors.border)}
                            />
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: Theme.colors.textMuted }}
                            />
                        </div>
                    </div>
{/* Right: Action Icons */}
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                        <button
                            className="md:hidden p-2 rounded-full hover:bg-opacity-10"
                            style={actionIconStyle}
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            aria-label="Toggle search"
                        >
                            <Search size={20} />
                        </button>

                        <Link
                            to="/wishlist"
                            className="relative p-2 rounded-full hover:bg-opacity-10"
                            style={actionIconStyle}
                            aria-label="Wishlist"
                        >
                            <Heart size={20} />
                            {watchlistCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                                    style={{
                                        backgroundColor: Theme.colors.accent,
                                        color: Theme.colors.white,
                                    }}
                                >
                                    {watchlistCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/cart"
                            className="relative p-2 rounded-full hover:bg-opacity-10"
                            style={actionIconStyle}
                            aria-label="Cart"
                        >
                            <ShoppingCart size={20} />
                            {cartCount > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                                    style={{
                                        backgroundColor: Theme.colors.primary,
                                        color: Theme.colors.white,
                                    }}
                                >
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            to="/history"
                            className="p-2 rounded-full hover:bg-opacity-10 hidden sm:block"
                            style={actionIconStyle}
                            aria-label="Order history"
                        >
                            <ClipboardList size={20} />
                        </Link>
                    </div>
                </div>

                {/* Mobile search bar */}
                {isSearchOpen && (
                    <div className="md:hidden pb-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                autoFocus
                                className="w-full py-2 pl-10 pr-4 text-sm rounded-full border focus:outline-none focus:ring-2"
                                style={{
                                    backgroundColor: Theme.colors.surfaceAlt,
                                    border: `1px solid ${Theme.colors.border}`,
                                    color: Theme.colors.text,
                                    borderRadius: Theme.BorderRadius.full,
                                }}
                                onFocus={(e) => (e.target.style.borderColor = Theme.colors.primary)}
                                onBlur={(e) => (e.target.style.borderColor = Theme.colors.border)}
                            />
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: Theme.colors.textMuted }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default GlobalHeader;