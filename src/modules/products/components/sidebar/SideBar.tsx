import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home,
    ShoppingBag,
    ShoppingCart,
    Heart,
    History,
    Settings,
    ChevronRight,
    Sparkles,
    X,
} from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Shop All', path: '/shop', icon: ShoppingBag },
    { label: 'Wishlist', path: '/wishlist', icon: Heart },
    { label: 'Cart', path: '/cart', icon: ShoppingCart },
    { label: 'History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const toggleMobile = () => setMobileOpen(!mobileOpen);
    const handleNavClick = () => {
        if (mobileOpen) setMobileOpen(false);
    };

    return (
        <>
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={toggleMobile}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-screen
                    flex flex-col
                    transition-all duration-300 ease-in-out
                    ${collapsed ? 'w-20' : 'w-72'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                style={{
                    backgroundColor: Theme.colors.surface,
                    borderRight: `1px solid ${Theme.colors.border}`,
                    boxShadow: collapsed ? 'none' : Theme.Shadow?.lg,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b" style={{ borderColor: Theme.colors.border }}>
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="flex items-center space-x-2 min-w-0 flex-1"
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {!collapsed && (
                            <>
                                <Sparkles size={24} style={{ color: Theme.colors.accent }} />
                                <span
                                    className="text-xl font-bold"
                                    style={{
                                        fontFamily: Theme.Typography?.headingFamily,
                                        color: Theme.colors.text,
                                    }}
                                >
                                    Wishbox
                                </span>
                            </>
                        )}
                        {collapsed && (
                            <span className="w-full flex justify-center">
                                <Sparkles size={24} style={{ color: Theme.colors.accent }} />
                            </span>
                        )}
                    </button>
                    <button
                        onClick={toggleMobile}
                        className="lg:hidden p-1 rounded-full hover:bg-black/5"
                        style={{ color: Theme.colors.textMuted }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2 py-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={handleNavClick}
                                        className={`
                                            relative flex items-center rounded-lg
                                            transition-colors duration-200
                                            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                                            hover:bg-opacity-40 hover:bg-primaryLight
                                        `}
                                        style={({ isActive: active }) => ({
                                            backgroundColor: active ? Theme.colors.primaryLight : 'transparent',
                                            color: active ? Theme.colors.text : Theme.colors.primaryDark,
                                        })}
                                        // Inline hover effect fallback if Tailwind classes not available
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor = `${Theme.colors.primaryLight}40`; // 40 = 25% opacity
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        <Icon size={20} />
                                        {!collapsed && (
                                            <span className="ml-3 text-sm font-medium">{item.label}</span>
                                        )}

                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* Mobile toggle button */}
            <button
                onClick={toggleMobile}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-full shadow-lg"
                style={{
                    backgroundColor: Theme.colors.primary,
                    color: Theme.colors.white,
                }}
            >
                <ChevronRight size={24} />
            </button>
        </>
    );
};

export default Sidebar;