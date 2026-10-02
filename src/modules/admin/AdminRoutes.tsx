import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import adminConst from './consts/adminConst';
import DashboardPage from './page/DashboardPage';
import OrdersPage from './page/OrdersPage';
import ProductsPage from './page/ProductsPage';
import SignInPage from './page/SignInPage';

/**
 * Admin route tree, loaded on demand from the storefront bundle.
 *
 * Mounted under `/admin/*`, so every path here is relative to that base.
 */
export default function AdminRoutes() {
    return (
        <Routes>
            <Route path="sign-in" element={<SignInPage />} />

            <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="*" element={<Navigate to={adminConst.route.adminPage} replace />} />
            </Route>
        </Routes>
    );
}
