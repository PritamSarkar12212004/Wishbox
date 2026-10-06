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
        settingsPage: '/admin/settings',
    },
};


export default adminConst;
