import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

import Theme from '@/assets/Theme/Theme';
import ErrorBoundary from '@/components/ErrorBoundary';
import MainLayout from '@/layout/MainLayout';
import MainWrapper from '@/layout/wrapper/MainWrapper';

// Home and the listing stay in the initial bundle…
import HomePage from './modules/home/page/HomePage';
import ProductPage from './modules/products/page/ProductPage';
import NotFoundPage from './modules/error/page/NotFoundPage';

// …everything else (including the swiper/PhotoSwipe-based PDP) is fetched on demand.
const ProductDetailsPage = lazy(() => import('./modules/products/page/ProductDetailsPage'));
const CartPage = lazy(() => import('./modules/cart/page/CartPage'));
const WishlistPage = lazy(() => import('./modules/wishlist/page/WishlistPage'));
const HistoryPage = lazy(() => import('./modules/history/page/HistoryPage'));
const ContactPage = lazy(() => import('./modules/contact/page/ContactPage'));
const AboutPage = lazy(() => import('./modules/about/page/AboutPage'));

import homeConst from './modules/home/consts/homeConst';
import productConst from './modules/products/consts/productConst';
import wishlistConst from './modules/wishlist/consts/wishlistConst';
import cartConst from './modules/cart/consts/cartConst';
import historyConst from './modules/history/consts/historyConst';
import contactConst from './modules/contact/consts/contactConst';
import aboutConst from './modules/about/consts/aboutConst';
import notfoundConst from './modules/error/consts/notfoundConst';

/** Sends the shopper back to the top whenever the route changes. */
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [pathname]);
    return null;
}

function RouteFallback() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="mx-auto flex min-h-[50vh] max-w-[1400px] items-center justify-center px-4"
        >
            <div className="flex flex-col items-center gap-3">
                <span
                    className="h-8 w-8 animate-spin rounded-full border-2"
                    style={{ borderColor: Theme.colors.borderStrong, borderTopColor: Theme.colors.primaryDark }}
                />
                <span className="text-xs" style={{ color: Theme.colors.textMuted }}>
                    Loading…
                </span>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <ScrollToTop />
                <MainLayout>
                    <MainWrapper>
                        <Suspense fallback={<RouteFallback />}>
                            <Routes>
                                <Route path={homeConst.route.homePage} element={<HomePage />} />
                                <Route path={productConst.route.productPage} element={<ProductPage />} />
                                <Route
                                    path={productConst.route.productDetailsPage}
                                    element={<ProductDetailsPage />}
                                />
                                <Route path={wishlistConst.route.wishlistPage} element={<WishlistPage />} />
                                <Route path={cartConst.route.cartPage} element={<CartPage />} />
                                <Route path={historyConst.route.historyPage} element={<HistoryPage />} />
                                <Route path={contactConst.route.contactPage} element={<ContactPage />} />
                                <Route path={aboutConst.route.aboutPage} element={<AboutPage />} />
                                <Route path={notfoundConst.route.notfoundPage} element={<NotFoundPage />} />
                            </Routes>
                        </Suspense>
                    </MainWrapper>
                </MainLayout>
            </ErrorBoundary>

            {/* Offsets keep the popups clear of the sticky alert bar + header. */}
            <Toaster
                position="top-center"
                offset={{ top: 128 }}
                mobileOffset={{ top: 112 }}
                richColors
                toastOptions={{
                    style: { fontFamily: 'Geist Variable, sans-serif' },
                }}
            />
        </BrowserRouter>
    );
}

export default App;
