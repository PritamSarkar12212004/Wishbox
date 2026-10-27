import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import { AdminShellSkeleton } from './components/AdminSkeleton';
import AdminAccess from './components/AdminAccess';
import AdminUnderDevelopment from './components/AdminUnderDevelopment';
import adminConst from './consts/adminConst';

/**
 * Admin route tree, loaded on demand from the storefront bundle.
 *
 * Mounted under `/admin/*`, so every path here is relative to that base.
 *
 * Orders, Shipping and Payments are under development, so their whole subtree
 * renders the placeholder from `AdminUnderDevelopment`; the real pages stay in
 * the repo and come back when their key leaves `UNDER_DEVELOPMENT_SECTIONS`.
 *
 * Every page is its own chunk. That keeps the initial admin payload small and
 * — because `AdminLayout` wraps the outlet in a Suspense boundary that reads
 * the URL — a first visit to any screen paints the skeleton shaped like that
 * screen while its chunk arrives. `AdminAccess` stays eager: it is the gate
 * every visitor hits first, and it is tiny.
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
const CustomersPage = lazy(() => import('./page/CustomersPage'));
const InterestPage = lazy(() => import('./page/InterestPage'));
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
const FooterContentPage = lazy(() => import('./page/FooterContentPage'));
const HeroContentPage = lazy(() => import('./page/HeroContentPage'));
const ContactContentPage = lazy(() => import('./page/ContactContentPage'));
const AlertContentPage = lazy(() => import('./page/AlertContentPage'));
const SettingsPage = lazy(() => import('./page/SettingsPage'));

export default function AdminRoutes() {
    return (
        /*
         * First-visit boundary: `AdminLayout` itself is small, but on a cold
         * load it still has to arrive before the sidebar can paint. This
         * fallback draws the whole panel frame so `/admin` never flashes a
         * blank page or the storefront spinner.
         */
        <Suspense fallback={<AdminShellSkeleton />}>
            <Routes>
            {/*
             * The gate wraps the entire panel, so no admin route — and no
             * admin data — is reachable until the API has confirmed this
             * account is an admin.
             */}
            <Route
                element={
                    <AdminAccess>
                        <AdminLayout />
                    </AdminAccess>
                }
            >
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

                {/* Under development: every path in these groups, including
                  * `returns`, `view/:orderId` and the status filters. */}
                <Route path="orders/*" element={<AdminUnderDevelopment section="Orders" />} />

                <Route path="customers" element={<CustomersPage />} />
                <Route path="interest" element={<InterestPage />} />
                {/* Old bookmark: the wishlist report grew into customer interest. */}
                <Route path="wishlist" element={<Navigate to="/admin/interest" replace />} />

                <Route path="shipping/*" element={<AdminUnderDevelopment section="Shipping" />} />

                <Route path="payments/*" element={<AdminUnderDevelopment section="Payments" />} />

                <Route path="analytics">
                    {/* Sales analytics is off while the order screens are rebuilt. */}
                    <Route index element={<AnalyticsCustomersPage />} />
                    <Route path="sales" element={<Navigate to="../customers" replace />} />
                    <Route path="customers" element={<AnalyticsCustomersPage />} />
                    <Route path="products" element={<AnalyticsProductsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                </Route>

                <Route path="coupons" element={<CouponsPage />} />
                <Route path="reviews" element={<ReviewsPage />} />
                <Route path="website">
                    <Route index element={<FooterContentPage />} />
                    <Route path="footer" element={<FooterContentPage />} />
                    <Route path="hero" element={<HeroContentPage />} />
                    <Route path="contact" element={<ContactContentPage />} />
                    <Route path="alert" element={<AlertContentPage />} />
                </Route>
                <Route path="settings" element={<SettingsPage />} />

                <Route path="*" element={<Navigate to={adminConst.route.adminPage} replace />} />
                </Route>
            </Routes>
        </Suspense>
    );
}
