/**
 * Admin sections switched off while they are rebuilt.
 *
 * One list drives the whole panel: `AdminLayout` greys these entries out in the
 * sidebar, and `AdminRoutes` renders the under-development panel for their paths
 * instead of the half-built screens. Remove a key here to bring a section back.
 */
export const UNDER_DEVELOPMENT_SECTIONS: readonly string[] = ['orders', 'shipping', 'payments'];

export const isUnderDevelopment = (section: string) => UNDER_DEVELOPMENT_SECTIONS.includes(section);

const adminConst = {
    route: {
        adminPage: '/admin',

        /* Catalogue */
        productsPage: '/admin/products',
        addProductPage: '/admin/products/new',
        categoriesPage: '/admin/products/categories',
        brandsPage: '/admin/products/brands',
        inventoryPage: '/admin/products/inventory',

        /* Orders */
        ordersPage: '/admin/orders',
        orderStatusPage: (slug: string) => `/admin/orders/${slug}`,
        /** Full-page order sheet. Ids contain '#', so they must be encoded. */
        orderDetailsPage: (id: string) => `/admin/orders/view/${encodeURIComponent(id)}`,
        returnsPage: '/admin/orders/returns',

        /* Customers */
        customersPage: '/admin/customers',
        /** Wishlist saves + add-to-cart demand, in one report. */
        interestPage: '/admin/interest',

        /* Shipping */
        shippingPage: '/admin/shipping',
        trackingPage: '/admin/shipping/tracking',
        couriersPage: '/admin/shipping/couriers',

        /* Payments */
        paymentsPage: '/admin/payments',
        refundsPage: '/admin/payments/refunds',
        failedPaymentsPage: '/admin/payments/failed',

        /* Analytics */
        analyticsSalesPage: '/admin/analytics/sales',
        analyticsCustomersPage: '/admin/analytics/customers',
        analyticsProductsPage: '/admin/analytics/products',
        reportsPage: '/admin/analytics/reports',

        /* Operations */
        couponsPage: '/admin/coupons',
        /** Website content: the footer lives at the group root. */
        websiteContentPage: '/admin/website',
        websiteContactPage: '/admin/website/contact',
        websiteAlertPage: '/admin/website/alert',
        reviewsPage: '/admin/reviews',
        settingsPage: '/admin/settings',
    },
};


export default adminConst;
