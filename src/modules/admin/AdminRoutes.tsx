import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import adminConst from './consts/adminConst';
import SignInPage from './page/SignInPage';

/**
 * Admin route tree, loaded on demand from the storefront bundle.
 *
 * Mounted under `/admin/*`, so every path here is relative to that base. The
 * order of the `orders` children matters: `returns` is matched before the
 * `:status` filter so it never resolves to a status slug.
 *
 * Every page is its own chunk. That keeps the initial admin payload small and
 * — because `AdminLayout` wraps the outlet in a Suspense boundary that reads
 * the URL — a first visit to any screen paints the skeleton shaped like that
 * screen while its chunk arrives. `SignInPage` stays eager: it is the first
 * thing an unauthenticated visitor needs, and it is tiny.
 */

const DashboardPage = lazy(() => import('./page/DashboardPage'));
const ProductsPage = lazy(() => import('./page/ProductsPage'));
const ProductEditorPage = lazy(() => import('./page/ProductEditorPage'));
const CategoriesPage = lazy(() =>
    import('./page/ProductsPages').then((module) => ({ default: module.CategoriesPage }))
);
const BrandsPage = lazy(() =>
    import('./page/ProductsPages').then((module) => ({ default: module.BrandsPage }))
);
const InventoryPage = lazy(() =>
    import('./page/ProductsPages').then((module) => ({ default: module.InventoryPage }))
);
const OrdersPage = lazy(() => import('./page/OrdersPage'));
const ReturnsPage = lazy(() => import('./page/ReturnsPage'));
const CustomersPage = lazy(() => import('./page/CustomersPage'));
const ShippingPage = lazy(() =>
    import('./page/ShippingPages').then((module) => ({ default: module.ShippingPage }))
);
const TrackingPage = lazy(() =>
    import('./page/ShippingPages').then((module) => ({ default: module.TrackingPage }))
);
const CourierSettingsPage = lazy(() =>
    import('./page/ShippingPages').then((module) => ({ default: module.CourierSettingsPage }))
);
const PaymentsPage = lazy(() =>
    import('./page/PaymentsPages').then((module) => ({ default: module.PaymentsPage }))
);
const FailedPaymentsPage = lazy(() =>
    import('./page/PaymentsPages').then((module) => ({ default: module.FailedPaymentsPage }))
);
const AnalyticsSalesPage = lazy(() =>
    import('./page/AnalyticsPages').then((module) => ({ default: module.AnalyticsSalesPage }))
);
const AnalyticsCustomersPage = lazy(() =>
    import('./page/AnalyticsPages').then((module) => ({ default: module.AnalyticsCustomersPage }))
);
const AnalyticsProductsPage = lazy(() =>
    import('./page/AnalyticsPages').then((module) => ({ default: module.AnalyticsProductsPage }))
);
const ReportsPage = lazy(() =>
    import('./page/AnalyticsPages').then((module) => ({ default: module.ReportsPage }))
);
const CouponsPage = lazy(() => import('./page/CouponsPage'));
const ReviewsPage = lazy(() => import('./page/ReviewsPage'));
const NotificationsPage = lazy(() => import('./page/NotificationsPage'));
const SettingsPage = lazy(() => import('./page/SettingsPage'));

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
