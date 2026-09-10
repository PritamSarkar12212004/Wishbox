import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

const items = [
    { label: 'Home', to: '/' },
    { label: 'Paper Decoration', to: '/shop' },
    { label: 'Decorative Paper', to: '/shop' },
];

function PdpBreadcrumb() {
    return (
        <nav aria-label="Breadcrumb" className="px-4 md:px-6 lg:px-8 py-3">
            <ol className="mx-auto max-w-[1400px] flex items-center flex-wrap gap-1 text-sm">
                {items.map((item) => (
                    <li key={item.label} className="flex items-center">
                        <Link
                            to={item.to}
                            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                            style={{ color: Theme.colors.textMuted }}
                        >
                            {item.label === 'Home' && <Home size={14} aria-hidden="true" />}
                            {item.label}
                        </Link>
                        <ChevronRight
                            size={14}
                            aria-hidden="true"
                            style={{ color: Theme.colors.borderStrong }}
                        />
                    </li>
                ))}
                <li
                    aria-current="page"
                    className="px-1.5 py-1 text-sm font-medium"
                    style={{ color: Theme.colors.text }}
                >
                    Premium Handmade Paper
                </li>
            </ol>
        </nav>
    );
}

export default memo(PdpBreadcrumb);