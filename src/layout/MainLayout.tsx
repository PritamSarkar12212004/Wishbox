import Theme from '@/assets/Theme/Theme';
import type { MainLayoutProps } from './types/layoutType';

function MainLayout({ children }: MainLayoutProps) {

    return (
        <div className="min-h-screen w-full" style={{ backgroundColor: Theme.colors.background }}>
            {children}
        </div>
    );
}

export default MainLayout;