import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import adminConst from './consts/adminConst';
import { AnalyticsCustomersPage, AnalyticsProductsPage, AnalyticsSalesPage, ReportsPage } from './page/AnalyticsPages';
import CouponsPage from './page/CouponsPage';
import CustomersPage from './page/CustomersPage';
import DashboardPage from './page/DashboardPage';
import NotificationsPage from './page/NotificationsPage';
import OrdersPage from './page/OrdersPage';
import { FailedPaymentsPage, PaymentsPage, RefundsPage } from './page/PaymentsPages';
import ProductEditorPage from './page/ProductEditorPage';
import ProductsPage from './page/ProductsPage';
import { BrandsPage, CategoriesPage, InventoryPage } from './page/ProductsPages';
import ReturnsPage from './page/ReturnsPage';
import ReviewsPage from './page/ReviewsPage';
import SettingsPage from './page/SettingsPage';
import { CourierSettingsPage, ShippingPage, TrackingPage } from './page/ShippingPages';
import SignInPage from './page/SignInPage';

/**
 * Admin route tree, loaded on demand from the storefront bundle.
 *
 * Mounted under `/admin/*`, so every path here is relative to that base. The
 * order of the `orders` children matters: `returns` is matched before the
 * `:status` filter so it never resolves to a status slug.
 */
export default function AdminRoutes() {
    return (
        <Routes>
            <Route path="sign-in" element={<SignInPage />} />

            <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />

                <Route path="products">
                    <Route index element={<ProductsPage />} />
                    <Route path="new" element={<ProductEditorPage />} />
                    {/* Static paths are ranked first, so `categories` never reads as an id. */}
                    <Route path=":id/edit" element={<ProductEditorPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="brands" element={<BrandsPage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                </Route>

                <Route path="orders">
                    <Route index element={<OrdersPage />} />
                    <Route path="returns" element={<ReturnsPage />} />
                    <Route path=":status" element={<OrdersPage />} />
                </Route>

                <Route path="customers" element={<CustomersPage />} />

                <Route path="shipping">
                    <Route index element={<ShippingPage />} />
                    <Route path="tracking" element={<TrackingPage />} />
                    <Route path="couriers" element={<CourierSettingsPage />} />
                </Route>

                <Route path="payments">
                    <Route index element={<PaymentsPage />} />
                    <Route path="refunds" element={<RefundsPage />} />
                    <Route path="failed" element={<FailedPaymentsPage />} />
                </Route>

                <Route path="analytics">
                    <Route index element={<AnalyticsSalesPage />} />
                    <Route path="sales" element={<AnalyticsSalesPage />} />
                    <Route path="customers" element={<AnalyticsCustomersPage />} />
                    <Route path="products" element={<AnalyticsProductsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                </Route>

                <Route path="coupons" element={<CouponsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />

                <Route path="*" element={<Navigate to={adminConst.route.adminPage} replace />} />
            </Route>
        </Routes>
    );
}
