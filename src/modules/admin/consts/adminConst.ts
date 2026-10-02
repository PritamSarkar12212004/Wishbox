const adminConst = {
    route: {
        adminPage: '/admin',
        signInPage: '/admin/sign-in',
        productsPage: '/admin/products',
        ordersPage: '/admin/orders',
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
