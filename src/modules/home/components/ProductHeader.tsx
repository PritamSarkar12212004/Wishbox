import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Heart, ShoppingCart, ClipboardList } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

const ProductHeader = () => {
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const categories = [
        'All Categories',
        'Home & Living',
        'Fashion',
        'Electronics',
        'Gifts',
        'Beauty',
        'Toys & Kids',
    ];
    const watchlistCount = 3;
    const cartCount = 2;

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
        minWidth: '160px', // Fixed minimum width to prevent layout shift
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
            <div className="px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 md:h-20 gap-4">
                    <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <a href="/" className="flex items-center" style={logoStyle}>
                            WishBox
                        </a>

                        <div className="relative hidden sm:block" ref={dropdownRef}>
                            <button
                                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                style={buttonStyle}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
                            >
                                <span className="truncate">{selectedCategory}</span>
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
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setIsCategoryOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm transition-colors"
                                            style={{
                                                color: selectedCategory === cat ? Theme.colors.primaryDark : Theme.colors.text,
                                                backgroundColor: selectedCategory === cat ? Theme.colors.surfaceAlt : 'transparent',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => {
                                                (e.target as HTMLElement).style.backgroundColor = Theme.colors.surfaceAlt;
                                            }}
                                            onMouseLeave={(e) => {
                                                (e.target as HTMLElement).style.backgroundColor =
                                                    selectedCategory === cat ? Theme.colors.surfaceAlt : 'transparent';
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className={`flex-1 max-w-xl mx-2 md:mx-4 ${isSearchOpen ? 'block' : 'hidden md:block'}`}>
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

                        <button
                            className="relative p-2 rounded-full hover:bg-opacity-10"
                            style={actionIconStyle}
                            aria-label="Watchlist"
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
                        </button>

                        <button
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
                        </button>

                        <button
                            className="p-2 rounded-full hover:bg-opacity-10 hidden sm:block"
                            style={actionIconStyle}
                            aria-label="Order history"
                        >
                            <ClipboardList size={20} />
                        </button>
                    </div>
                </div>

                {/* Mobile search bar */}
                {isSearchOpen && (
                    <div className="md:hidden pb-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full py-2 pl-10 pr-4 text-sm rounded-full border"
                                style={{
                                    backgroundColor: Theme.colors.surfaceAlt,
                                    border: `1px solid ${Theme.colors.border}`,
                                    color: Theme.colors.text,
                                    borderRadius: Theme.BorderRadius.full,
                                }}
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

export default ProductHeader;