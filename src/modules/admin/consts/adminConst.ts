const adminConst = {
    route: {
        adminPage: '/admin',
        signInPage: '/admin/sign-in',

        /* Catalogue */
        productsPage: '/admin/products',
        addProductPage: '/admin/products/new',
        categoriesPage: '/admin/products/categories',
        brandsPage: '/admin/products/brands',
        inventoryPage: '/admin/products/inventory',

        /* Orders */
        ordersPage: '/admin/orders',
        orderStatusPage: (slug: string) => `/admin/orders/${slug}`,
        returnsPage: '/admin/orders/returns',

        /* Customers */
        customersPage: '/admin/customers',

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
        reviewsPage: '/admin/reviews',
        notificationsPage: '/admin/notifications',
        settingsPage: '/admin/settings',
    },

    /**
     * Demo-only credentials. There is no backend, so this gate is illustrative
     * — it keeps the admin chrome out of casual storefront browsing, nothing
     * more. Real access control would live server-side.
     */
    demo: {
        email: 'admin@wishbox.in',
        password: 'wishbox123',
    },
};

export default adminConst;
