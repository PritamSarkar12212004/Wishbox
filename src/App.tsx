import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";

import ErrorBoundary from "@/components/ErrorBoundary";
import { PageSkeleton } from "@/components/ui/skeletons";
import MainLayout from "@/layout/MainLayout";
import MainWrapper from "@/layout/wrapper/MainWrapper";
import AccountGate from "@/modules/auth/components/AccountGate";
import AuthSessionSync from "@/modules/auth/components/AuthSessionSync";
import LoginModal from "@/modules/auth/components/LoginModal";
import CheckoutAddressDialog from "@/modules/addresses/components/CheckoutAddressDialog";
import { LOGIN_REASONS } from "@/modules/auth/data/authData";

// Home and the listing stay in the initial bundle…
import HomePage from "./modules/home/page/HomePage";
import ProductPage from "./modules/products/page/ProductPage";
import NotFoundPage from "./modules/error/page/NotFoundPage";

// …everything else (including the swiper/PhotoSwipe-based PDP) is fetched on demand.
const ProductDetailsPage = lazy(
  () => import("./modules/products/page/ProductDetailsPage"),
);
const CartPage = lazy(() => import("./modules/cart/page/CartPage"));
const WishlistPage = lazy(() => import("./modules/wishlist/page/WishlistPage"));
const HistoryPage = lazy(() => import("./modules/history/page/HistoryPage"));
const ContactPage = lazy(() => import("./modules/contact/page/ContactPage"));
const CataloguePage = lazy(() => import("./modules/catalogue/page/CataloguePage"));
// The admin panel is its own shell and its own lazy chunk.
const AdminRoutes = lazy(() => import("./modules/admin/AdminRoutes"));

import homeConst from "./modules/home/consts/homeConst";
import productConst from "./modules/products/consts/productConst";
import wishlistConst from "./modules/wishlist/consts/wishlistConst";
import cartConst from "./modules/cart/consts/cartConst";
import historyConst from "./modules/history/consts/historyConst";
import contactConst from "./modules/contact/consts/contactConst";
import catalogueConst from "./modules/catalogue/consts/catalogueConst";
import notfoundConst from "./modules/error/consts/notfoundConst";

/** Sends the shopper back to the top whenever the route changes. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

/**
 * Fallback for a lazy route chunk: a page-shaped skeleton, not a spinner.
 *
 * The rich, per-screen skeletons for the admin panel live inside the admin
 * chunk itself, so a shopper never downloads a byte of admin loading UI; this
 * is the one outline every code-split route shares while its chunk arrives.
 */
function RouteFallback() {
  return <PageSkeleton />;
}

const MOBILE_ENTRY_KEY = "wishbox.mobile-entry";

/**
 * Phones start on the shop.
 *
 * The home page is a wide, editorial screen; on a phone the useful first view is
 * the listing. The first visit to `/` in a tab is bounced to `/shop` once, and
 * the flag is remembered for that tab - so Home still works when the shopper
 * taps it later, instead of becoming a redirect trap.
 */
/** Answered once per mount, before the first paint, so home never flashes. */
function shouldStartAtShop(): boolean {
  if (!window.matchMedia("(max-width: 767px)").matches) return false;
  if (sessionStorage.getItem(MOBILE_ENTRY_KEY) === "1") return false;
  sessionStorage.setItem(MOBILE_ENTRY_KEY, "1");
  return true;
}

function HomeRoute() {
  const [redirect] = useState(shouldStartAtShop);

  if (redirect) return <Navigate to={productConst.route.productPage} replace />;
  return <HomePage />;
}

/** Storefront chrome: alert bar + header, the page, then the footer. */
function StorefrontShell() {
  return (
    <MainLayout>
      <MainWrapper>
        <Outlet />
      </MainWrapper>
    </MainLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Storefront: shared header/footer chrome */}
            <Route element={<StorefrontShell />}>
              <Route path={homeConst.route.homePage} element={<HomeRoute />} />
              <Route
                path={productConst.route.productPage}
                element={<ProductPage />}
              />
              <Route
                path={productConst.route.productDetailsPage}
                element={<ProductDetailsPage />}
              />
              {/* Account pages: signed-out visits open the login modal and show a locked panel. */}
              <Route
                path={wishlistConst.route.wishlistPage}
                element={
                  <AccountGate
                    reason={LOGIN_REASONS.wishlistPage}
                    title="Your wishlist is one step away"
                    description="Sign in with your WhatsApp number to keep every saved product, price drop and stock alert in one place."
                  >
                    <WishlistPage />
                  </AccountGate>
                }
              />
              <Route path={cartConst.route.cartPage} element={<CartPage />} />
              <Route
                path={historyConst.route.historyPage}
                element={
                  <AccountGate
                    reason={LOGIN_REASONS.orders}
                    title="Your orders, all in one place"
                    description="Sign in to follow deliveries, download invoices and reorder in a tap."
                  >
                    <HistoryPage />
                  </AccountGate>
                }
              />
              <Route
                path={contactConst.route.contactPage}
                element={<ContactPage />}
              />
              {/* Public: anyone can build a catalogue without an account. */}
              <Route
                path={catalogueConst.route.cataloguePage}
                element={<CataloguePage />}
              />
              <Route
                path={notfoundConst.route.notfoundPage}
                element={<NotFoundPage />}
              />
            </Route>                        {/*
                         * Admin: sidebar shell, no storefront header/footer.
                         * The panel's own skeleton lives inside the lazy admin
                         * chunk, so none of it is downloaded while shopping.
                         */}
                        <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </Suspense>
        {/* Revalidates the stored session once, so a dead sign-in is found on
            the first paint instead of the first account action. */}
        <AuthSessionSync />
        {/* Account gate: any action that needs a verified shopper opens this. */}
        <LoginModal />
        {/* Checkout gate: the address sheet the order flow opens once signed in,
            so an order carries the address the shopper actually chose. Kept
            mounted for the Buy Now rebuild; nothing opens it today. */}
        <CheckoutAddressDialog />
      </ErrorBoundary>

      {/* Offsets keep the popups clear of the sticky alert bar + header. */}
      <Toaster
        position="top-center"
        offset={{ top: 128 }}
        mobileOffset={{ top: 112 }}
        richColors
        toastOptions={{
          style: { fontFamily: "Geist Variable, sans-serif" },
        }}
        duration={2000}
      />
    </BrowserRouter>
  );
}

export default App;
