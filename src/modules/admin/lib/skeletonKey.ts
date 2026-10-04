/**
 * Maps an admin URL to the skeleton that best matches the page being loaded.
 *
 * Kept separate from `AdminSkeleton.tsx` (and therefore free of any component)
 * so the skeleton module can stay a components-only file for Fast Refresh.
 */

export type AdminSkeletonKey =
    | 'dashboard'
    | 'orders'
    | 'order-details'
    | 'customers'
    | 'coupons'
    | 'reviews'
    | 'returns'
    | 'shipping'
    | 'tracking'
    | 'couriers'
    | 'payments'
    | 'failed-payments'
    | 'products'
    | 'product-editor'
    | 'categories'
    | 'brands'
    | 'inventory'
    | 'analytics'
    | 'reports'
    | 'notifications'
    | 'settings'
    | 'generic';

/**
 * Longest-match-wins over the admin route table. Written as an explicit switch
 * on the path segments rather than a prefix loop: the route tree is shallow and
 * static, so this stays trivially readable and allocation-free.
 */
export function skeletonKeyFor(pathname: string): AdminSkeletonKey {
    const path = pathname.replace(/^\/admin\/?/, '');
    const [first, second, third] = path.split('/');

    switch (first) {
        case '':
            return 'dashboard';
        case 'orders':
            if (second === 'view') return 'order-details';
            return second === 'returns' ? 'returns' : 'orders';
        case 'customers':
            return 'customers';
        case 'shipping':
            if (second === 'tracking') return 'tracking';
            if (second === 'couriers') return 'couriers';
            return 'shipping';
        case 'payments':
            return second === 'failed' ? 'failed-payments' : 'payments';
        case 'products':
            // `/admin/products/new` and `/admin/products/:id/edit`
            if (second === 'new' || third === 'edit') return 'product-editor';
            if (second === 'categories') return 'categories';
            if (second === 'brands') return 'brands';
            if (second === 'inventory') return 'inventory';
            return 'products';
        case 'analytics':
            return second === 'reports' ? 'reports' : 'analytics';
        case 'coupons':
            return 'coupons';
        case 'reviews':
            return 'reviews';
        case 'notifications':
            return 'notifications';
        case 'settings':
            return 'settings';
        default:
            return 'generic';
    }
}
