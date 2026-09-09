import Theme from '@/assets/Theme/Theme';
import Sidebar from '@/modules/products/components/sidebar/SideBar';
import type { MainLayoutProps } from './types/layoutType';

function MainLayout({ children }: MainLayoutProps) {

    return (
        <div className="flex min-h-screen w-full" style={{ backgroundColor: Theme.colors.background }}>
            <Sidebar />
            <div
                className="flex-1 min-w-0 flex flex-col transition-all duration-300"
                style={{
                    marginLeft: '18rem',
                }}
            >
                {children}
            </div>
        </div>
    );
}

export default MainLayout;