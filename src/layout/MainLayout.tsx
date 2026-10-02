import Theme from '@/assets/Theme/Theme';
import type { MainLayoutProps } from './types/layoutType';

function MainLayout({ children }: MainLayoutProps) {

    return (
        <div
            className="min-h-screen w-full"
            style={{
                backgroundColor: Theme.colors.background,
                // Sticky action bars (e.g. the PDP buy bar) reserve their height here
                // so they never cover the footer on small screens.
                paddingBottom: 'var(--sticky-action-offset, 0px)',
            }}
        >
            {children}
        </div>
    );
}

export default MainLayout;