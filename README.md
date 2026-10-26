# WishBox — storefront frontend

A storefront for handmade paper, gift wrap and home décor, built as a single-page
React app against the WishBox API. **Products, categories, accounts, orders and
returns are all stored in MongoDB** — the browser keeps only the cart, the wishlist
and cached store settings. There is no in-repo catalogue and no demo order history:
if the API is unreachable, the shop says so instead of rendering fixtures.

## Stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Runtime    | Node ≥ 20.19                                                           |
| UI         | React 19, TypeScript 6 (strict), Vite 8                                |
| Styling    | Tailwind CSS v4 + shadcn/ui primitives on Base UI, design tokens in `src/assets/Theme` |
| Motion     | framer-motion                                                          |
| Media      | swiper (gallery) + PhotoSwipe (lightbox), custom video player          |
| Feedback   | sonner toasts                                                          |
| Routing    | react-router-dom 7 with lazy-loaded secondary routes                   |
| Data       | TanStack Query v5 — one shared cache for everything the API owns       |
| Testing    | Vitest (node environment)                                              |

## Scripts

```bash
npm install
npm run dev        # start the dev server
npm run build      # typecheck (tsc -b) then bundle for production
npm run preview    # serve the production build locally
npm run lint       # eslint
npm run typecheck  # tsc -b only
npm test           # run the unit test suite once
npm run test:watch # re-run tests on change
```

## Project structure

```
src/
  assets/Theme/           design tokens (colors, shadows, radii, typography)
  components/ui/          shadcn/ui primitives (skeleton, select-menu, …)
  components/ErrorBoundary.tsx
  global/header/          alert marquee, header and footer (API-backed content)
  layout/                 page shell: alert + header + main + footer
  lib/                    shared helpers (cn, currency, colour, image fallback,
                          persistent store factory)
    api/client.ts         the API: envelope unwrapping and a typed ApiError
    api/queryClient.ts    the shared query cache and its retry rules
  modules/
    products/             catalogue API, PDP, listing, cart/wishlist/coupon stores
      api/productApi.ts   products, categories and coupons (public + admin writes)
      api/useProducts.ts  TanStack Query hooks and cache invalidation
      data/detailData.ts  gallery assembly from a product's own images
      hooks/              catalogue filters, purchase state
      store/store.ts      persisted cart, coupon and wishlist stores
    orders/               checkout, order history and return requests (API)
      api/orderApi.ts     POST /orders, GET /orders, returns
      api/useOrders.ts    the hooks every order screen uses
    auth/                 phone + OTP account gate: session store, login gate,
                          modal, header account menu and account dialog
      api/authApi.ts      the auth endpoints + silent refresh-and-replay
      api/useAuth.ts      the TanStack Query hooks every screen uses
      api/session store   the verified identity and the token pair
    history/              order history page, its API view-model mapping and
                          the return/exchange dialog
    admin/                admin panel: dashboard, catalogue, orders, customers,
                          shipping, payments, analytics, settings
      data/adminData.ts   the API's dataset contract (types, not fixtures)
      lib/analytics.ts    every dashboard number, range and breakdown
      store/              cached settings
    home/ cart/ wishlist/ contact/ error/
```

Each feature folder follows the same shape: `page/`, `components/`, `consts/`,
`data/` and (where needed) `store/`.

## How the app is wired

- **Catalogue** — `GET /api/v1/products` and `/categories` feed the shop, search,
  home rails and PDP through one TanStack Query cache. There is no client-side
  catalogue to fall back to: a product that is not in MongoDB is not in the shop.
  Admin writes invalidate that cache, so a save is visible on the next navigation
  (and to every visitor) rather than living in the editor's browser.
- **Product page** — `/product/:id` fetches the product by slug; a draft or deleted
  product is a 404 from the API and renders the not-found state. The flagship paper
  page renders only what the product record holds: the gallery is assembled from
  its images, and highlights, specifications, offers and **bulk prices** are the
  same fields the order service charges from. There is no per-product presentation
  data in the frontend.
- **Website content** — `GET /api/v1/content` serves the alert bar, footer and
  Contact page copy. `SiteContentSync` hydrates the three synchronous stores once
  on load so the chrome paints immediately; the shipped strings are only the
  pre-fetch fallback. Admin edits go to `PATCH /api/v1/admin/content`, which stores
  whole sections in MongoDB and restores a section on Reset.
- **Search** — the header search submits to `/shop?q=…`; matching is case-insensitive
  across name, brand, description, category and highlights. The query lives in the
  URL, so results are shareable, survive refresh, and combine with category and sort.
- **Cart, coupon & wishlist** — `modules/products/store/store.ts` keeps real line
  items, the applied coupon and wishlist entries in `localStorage`
  (`useSyncExternalStore`), shared by the header badges, product cards, PDP, cart and
  wishlist. Coupons are applied at cart level — the same maths runs on the PDP and in
  the cart, so the two totals can never disagree. Refreshing keeps selections;
  multiple tabs stay in sync.
- **Wishlist tracking** — every account-gated heart also writes through to
  `PUT /api/v1/wishlist/:id` (removal goes to `DELETE`), one row per shopper per
  product. That is what lets the admin's **Wishlist** page report how many people
  saved a product and who they are. The local store stays what the UI reads, so a
  tap is instant; signing in pushes the whole local list again, which repairs any
  write that failed quietly.
- **Orders & order history** — the storefront's purchase action is **Add to Cart**;
  the **Buy Now** checkout button is intentionally absent while that flow is
  rebuilt. The order API behind it is live: `POST /api/v1/orders` takes
  quantities and the delivery address, and the API prices the basket from the product
  records, re-checks stock and the coupon, decrements inventory atomically and
  writes one order (`#WB-…`). `/history` reads `GET /api/v1/orders`, so an admin
  approving, shipping or cancelling an order changes what the shopper sees with no
  sync step. Return requests go to `POST /api/v1/orders/:id/returns` and appear in
  the admin's returns queue.
- **Filtering** — category and sort live in the URL (`/shop?category=…&sort=…`), so
  links are shareable and the header selector and listing stay in agreement.
- **Rendering** — secondary routes are code-split behind a page-shaped skeleton;
  every data-backed screen (home rail, shop, PDP, order history, addresses, the
  admin editor) paints a themed skeleton from `components/ui/skeletons.tsx`
  instead of a spinner or a flash of empty state. A top-level `ErrorBoundary`
  catches render crashes, and toast feedback covers every cart/wishlist action.
  A capture-phase image listener swaps dead or blocked image URLs for a local
  placeholder, so product cards never render a broken image.
- **Pricing limits** — `MAX_QTY` (500) keeps the advertised 500+ bulk tier reachable
  from both the PDP stepper and the cart.

## Accounts (phone + OTP)

The storefront has no passwords. Account-connected actions open one modal that
asks for a **name and WhatsApp number**, then verifies a **6-digit code**:

| Action                                 | Entry point                                  |
| -------------------------------------- | -------------------------------------------- |
| Add to wishlist                        | PDP gallery heart and buy column             |
| Notify me when back in stock           | Out-of-stock panel on the PDP                |
| My orders · order history              | Header clipboard icon, `/history`            |
| Wishlist page                          | Header heart, `/wishlist`                    |
| Return / exchange a delivered order    | Order card on `/history`                     |
| Profile · saved coupons · notifications| Header account menu (after signing in)       |

How it behaves:

- Any gated action calls `requireLogin(action, reason)`. A verified shopper runs the
  action straight away — everyone else gets the modal, and the exact reason they hit is
  the headline, so the interruption always explains itself.
- Finishing verification **continues the action** (the wishlist save, the checkout, the
  navigation), and dismissing the modal simply drops it.
- `/wishlist` and `/history` also gate themselves: the modal opens once, and a locked
  panel with a sign-in button stays behind it for bookmarks and shared links.
- OTP input is six single boxes with auto-advance, paste support, backspace/arrow
  handling, auto-submit on the last digit, a 30-second resend countdown and a shake +
  error on a wrong code. Phones get a bottom sheet, larger screens a centred card.
- Sign-in is real: the code is generated, sent and checked by the API. Only in
  development does the API echo it back (`OTP_DEBUG_RETURN_CODE`), and only then does
  the modal show it with "tap to fill" — a production response never carries it.
- The session is the API's: `wishbox.session.v1` holds the verified name, number and
  the token pair. **Sign out** drops it locally and revokes it on the server.
- Return/exchange requests are kept in `wishbox.returns.v1` and appear under
  Notifications in the account menu.

### The auth API

`modules/auth/api/authApi.ts` is the only place that knows the endpoints, and
`modules/auth/api/useAuth.ts` wraps them in the hooks the UI uses: `useRequestOtp`,
`useVerifyOtp`, `useCurrentUser`, `useUpdateProfile` and `useSignOut`.
`AuthSessionSync` mounts `useCurrentUser()` once at app level, so a stored session is
revalidated on load — a revoked one is dropped rather than left as a header that
looks signed in and fails on every action.

Worth knowing before touching it:

- Every endpoint answers with one envelope, so `lib/api/client.ts` unwraps it and
  throws an `ApiError` carrying the API's `error.code`. Screens branch on a code
  (`OTP_COOLDOWN`, `OTP_INVALID`) rather than matching on message text.
- Access tokens last 15 minutes, so a 401 triggers exactly one silent
  `POST /auth/refresh` and one replay. Parallel 401s share that single refresh — a
  second one would present an already-rotated token, which the API rejects as a
  replay and would sign the shopper out.
- A 403 (blocked account) never refreshes: a refresh cannot un-block it.
- The base URL is `VITE_API_URL`, defaulting to `http://localhost:5000/api/v1`
  (see `.env.example`). The API's CORS list is `localhost:5173`, so reach the dev
  server at `localhost`, not `127.0.0.1`.

## Admin panel

The storefront ships with an admin panel at **`/admin`** (lazy-loaded, rendered in
its own shell without the storefront header/footer). It has no password and no
login of its own: it runs on the same phone + OTP account as the storefront, and
`/admin` is opened by **`GET /api/v1/admin/session`** — the last word on access,
satisfied by a token whose account the server has promoted to `admin`. Sign in
with a number listed in the API's `ADMIN_PHONES` and an **Admin panel** entry
appears in the header's account menu; anyone else is told plainly that the
account is not an admin, and an unreachable API says so rather than drawing an
empty dashboard.

The sidebar is grouped by job —
Dashboard, Products, Orders, Customers, Wishlist, Shipping, Payments, Analytics,
Coupons & Offers, Reviews, Website, Settings — with live badge counts for open
orders, pending reviews and alerts.

**Orders, Shipping and Payments are switched off while they are rebuilt.** They
stay in the sidebar, greyed out with a **Soon** tag and unclickable, and every
path under them (`/admin/orders/…`, `/admin/shipping/…`, `/admin/payments/…`)
renders an under-development panel instead of the half-finished screen. The list
lives in `UNDER_DEVELOPMENT_SECTIONS` in `src/modules/admin/consts/adminConst.ts`;
removing a key there restores that section's routes and sidebar link. **Sales
analytics** is off with them, and the dashboard carries only catalogue and
customer figures until orders return.

The order lifecycle is deliberately short: **Approval → Approved → Shipped → Out for
delivery → Delivered**, or **Cancelled**. Approving a payment and handing the parcel
to a courier are separate moves, so every order view, chart and badge works from those
six stages. The only status actions offered are the moves an admin can actually make —
`Approval` is never a dropdown option, an approved order can only be shipped next, and
running shipments expose the courier and AWB instead.

| Section    | Routes                                                             | What it does                                                                                                                              |
| ---------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard  | `/admin`                                                           | Catalogue and customer health only: registered shoppers and product counts, plus the inventory alert list. Revenue, order, payment and delivery panels are off while those screens are rebuilt |
| Products   | `/admin/products`, `/new`, `/categories`                           | Create, edit, stock/publish toggles, delete; category performance (the Brands and Inventory pages still answer on their URLs but are no longer linked) |
| Orders     | `/admin/orders`, `/orders/:status`, `/orders/returns`              | The six stages as filters, search and status changes; **View** opens the full-screen order sheet at `/admin/orders/view/:id` — customer, address, every ordered line, totals, payment proof, then approve / cancel, mark shipped with a courier + AWB, and (once cancelled) the refund screenshot upload. `OrderDetailDialog` is gone. The returns queue stays reachable at `/orders/returns` |
| Customers  | `/admin/customers`                                                 | Customer name and phone number only, searchable by either. City, join date, order counts, lifetime value and top spenders are switched off while the customer screens are reworked |
| Wishlist   | `/admin/wishlist`                                                  | How many shoppers saved each product and who they are — total saves, distinct shoppers, products wanted, per-product save counts and the shoppers behind them. Written by the storefront's heart as it is tapped |
| Shipping   | `/admin/shipping`, `/tracking`, `/couriers`                        | Shipments in transit, tracking search by AWB, courier performance, dispatch defaults                                                      |
| Payments   | `/admin/payments`, `/refunds`, `/failed`                           | Method mix, settlement, refund ledger, failed payments with a pre-filled payment-link email                                               |
| Analytics  | `/admin/analytics/customers`, `/products`, `/reports`              | Customer and product deep dives plus CSV reports generated in the browser. Sales analytics is off while the order screens are rebuilt; `/analytics/sales` redirects to the customer view |
| Website    | `/admin/website`, `/footer`, `/contact`, `/alert`                  | Storefront copy the panel owns: the footer (brand and tagline, social links, both link columns, contact details, copyright), the Contact page (hero, WhatsApp/email cards, form heading, studio, support hours, enquiry topics) and the alert bar (support phone/email, scrolling offers, marquee speed). Each saves to `PATCH /admin/content`, so the edit is stored in MongoDB and every visitor sees it — not just the editor's browser |
| Operations | `/admin/coupons`, `/reviews`, `/notifications`, `/settings`        | Coupon performance, review feed, derived alerts, store profile and admin access. The **Website theme** picker on Settings is read-only for now (Papercraft stays live) while theme switching is built |

### Reporting periods

Every dashboard, analytics and returns view shares one period selector — Today,
7 days, 30 days, 3 months, 1 year or a custom range — and each headline number
carries its change against the immediately preceding window of equal length.

### Where the numbers come from

The panel is server-driven: **orders, customers, returns, reviews, coupons,
restocks and settings all come from the API.** `GET /api/v1/admin/dataset` hands
over the whole year in one response (≈5 MB raw, ≈230 KB gzipped) because every
chart derives from the full history rather than a page of it, and
`AdminDataProvider` loads it once for the whole panel. A mutation never refetches
that response — `api/useAdmin.ts` splices the row the API returned straight into
the cached dataset.

Nothing is merged in from the browser any more: an order a shopper places is the
same row the panel charts, and the product catalogue the editor writes is the one
the shop reads (`GET /api/v1/products`). Both come from MongoDB.

The admin dataset contains only registered customer accounts, orders linked to
those accounts, returns for those orders and customer-authored reviews. Legacy
demo rows have been removed and the demo seeder is retired.

### Settings that do something

`/admin/settings` is saved to the API (`PATCH /api/v1/admin/settings`) and mirrored
into `wishbox.admin.settings.v1`, because the storefront reads settings
*synchronously* — the **low-stock threshold** drives the dashboard's inventory
alerts, the inventory page and the catalogue's low-stock filter, and a price list
cannot await a query to decide how to render. A save writes the local copy first
and rolls it back if the server refuses, so the screen can never show a setting
that was not saved.

Everything the admin edits is shared: approving an order, deciding a return,
replying to a review, freeing the refund and **every product change** are written
to the API and seen by every visitor. **Unpublishing** removes a product from the
shop, search and home rails (its own URL is a 404), **out of stock** keeps it
listed with the Out-of-stock treatment, **restocking** writes the new stock, and
deletion keeps past orders intact because an order stores its own line snapshots.

Storage keys on the storefront are now only the shopper's own state:
`wishbox.cart.v1`, `wishbox.coupon.v1`, `wishbox.wishlist.v1`,
`wishbox.session.v1` (verified shopper + API tokens) and
`wishbox.admin.settings.v1` (a cached copy of the store settings). Clearing them
loses that browser's cart and session; it cannot restore or remove catalogue data.

## Adding a product

Add products in the admin panel: `/admin/products` → *Add product*. The API derives
the slug from the name and the editor generates the next `WB-…-###` SKU. Products
are stored in MongoDB, so a save is immediately visible to every shopper.

Seeding a new environment is a backend command, not a frontend change:
`npm run catalog:seed` in `WishBox-Backend` upserts the opening catalogue and its
coupons. Quantity breaks live on the product itself, so a bulk-priced product is
priced by the same numbers the checkout uses.

## Tests

`npm test` runs the Vitest suite: cart merging/clamping and bulk-tier repricing,
coupon maths (including the minimum basket), wishlist moves, catalogue
filtering/search and counts, the phone/OTP rules behind the login modal, the shared
formatters, the API client's envelope and error mapping, the silent refresh
(single-flight, replay, and a resigned session), the admin API client (paths,
escaped ids, the API's error codes) and the address API client. Checkout, order
history and returns are covered end-to-end against the API in the backend's
`tests/orders.test.ts`.
Tests run in Node, so no DOM or browser setup is required.

## Deployment

`npm run build` emits a static `dist/`. Serve it from any static host and rewrite
unknown paths to `index.html` (the app uses client-side routing). Set `VITE_API_URL`
at build time to the deployed API, and add that origin to the API's `CORS_ORIGIN`. The build fails on
type errors, so CI can run `npm ci && npm run lint && npm test && npm run build` as
the gate.
