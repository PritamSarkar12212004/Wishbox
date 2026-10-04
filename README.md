# WishBox — storefront frontend

A production-shaped storefront for handmade paper, gift wrap and home décor, built
as a single-page React app. Everything runs against a typed in-repo catalogue —
there is no backend, API or database, and no network calls beyond product imagery.

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
  global/header/          alert marquee, header, footer and their fixtures
  layout/                 page shell: alert + header + main + footer
  lib/                    shared helpers (cn, currency, colour, image fallback,
                          persistent store factory)
  modules/
    products/             catalogue data, PDP, listing, cart/wishlist/coupon stores
      data/catalogData.ts seed products (the shipped catalogue)
      data/detailData.ts  rich detail config for the flagship paper product
      hooks/              catalogue filters, purchase state
      store/catalogStore.ts live, admin-editable catalogue
      store/store.ts      persisted cart, coupon and wishlist stores
    auth/                 phone + OTP account gate: identity store, login gate,
                          modal, header account menu and account dialog
    history/              order history page + persisted orders store and
                          return/exchange requests
    admin/                admin panel: dashboard, catalogue, orders, customers,
                          shipping, payments, analytics, settings
      data/adminData.ts   seeded demo dataset (orders, customers, returns, …)
      lib/analytics.ts    every dashboard number, range and breakdown
      store/              order/return overrides, settings, demo session
    home/ cart/ wishlist/ contact/ about/ error/
```

Each feature folder follows the same shape: `page/`, `components/`, `consts/`,
`data/` and (where needed) `store/`.

## How the app is wired

- **Catalogue** — `modules/products/data/catalogData.ts` seeds the catalogue and
  `modules/products/store/catalogStore.ts` owns it at runtime. The shop listing,
  search, home rails and PDP all read that store, so admin edits go live instantly;
  cards, the PDP, order history and the cart share the same product records, so ids
  are unique and prices cannot drift between pages.
- **Product page** — `/product/:id` looks the product up in the catalogue and renders
  the shared PDP. The flagship paper product additionally uses `detailData.ts` for
  colour/size/GSM variants, bulk pricing tiers and the size/GSM guides.
- **Search** — the header search submits to `/shop?q=…`; matching is case-insensitive
  across name, brand, description, category and highlights. The query lives in the
  URL, so results are shareable, survive refresh, and combine with category and sort.
- **Cart, coupon & wishlist** — `modules/products/store/store.ts` keeps real line
  items, the applied coupon and wishlist entries in `localStorage`
  (`useSyncExternalStore`), shared by the header badges, product cards, PDP, cart and
  wishlist. Coupons are applied at cart level — the same maths runs on the PDP and in
  the cart, so the two totals can never disagree. Refreshing keeps selections;
  multiple tabs stay in sync.
- **Order history** — `modules/history/store/store.ts` seeds the demo fixtures and is
  persisted. Checkout (cart or PDP) writes a real order with a sequential `#WB-####`
  id, then the History page shows it with tracking, payment and totals, coupon
  discount included. Admin status changes (shipped, delivered, cancelled) write to
  the same store, so the shopper's history and tracking update immediately.
- **Filtering** — category and sort live in the URL (`/shop?category=…&sort=…`), so
  links are shareable and the header selector and listing stay in agreement.
- **Rendering** — secondary routes are code-split; a top-level `ErrorBoundary`
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
| Checkout / place an order              | Cart **Buy Now** and the PDP buy bar         |
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
- There is no SMS gateway, so the demo shows the generated code inside the modal
  ("tap to fill"). The header account menu stores the verified name and number under
  `wishbox.identity.v1`; **Sign out** clears it.
- Return/exchange requests are kept in `wishbox.returns.v1` and appear under
  Notifications in the account menu.

## Admin panel

The storefront ships with an admin panel at **`/admin`** (lazy-loaded, rendered in
its own shell without the storefront header/footer). The sidebar is grouped by job —
Dashboard, Products, Orders, Customers, Shipping, Payments, Analytics, Coupons &
Offers, Reviews, Notifications, Settings — with live badge counts for open orders,
pending reviews and alerts.

The order lifecycle is deliberately short: **Approval → Approved → Shipped → Out for
delivery → Delivered**, or **Cancelled**. Approving a payment and handing the parcel
to a courier are separate moves, so every order view, chart and badge works from those
six stages. The only status actions offered are the moves an admin can actually make —
`Approval` is never a dropdown option, an approved order can only be shipped next, and
running shipments expose the courier and AWB instead.

| Section    | Routes                                                             | What it does                                                                                                                              |
| ---------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard  | `/admin`                                                           | Revenue, orders, customers, products, needs-action, in-transit and cancelled cards with period-over-period change; revenue trend; order-status pipeline; recent orders; top sellers; inventory alerts; customer, payment and delivery panels |
| Products   | `/admin/products`, `/new`, `/categories`                           | Create, edit, stock/publish toggles, delete; category performance (the Brands and Inventory pages still answer on their URLs but are no longer linked) |
| Orders     | `/admin/orders`, `/orders/:status`, `/orders/returns`              | The six stages as filters, search and status changes; **View** opens the full-screen order sheet at `/admin/orders/view/:id` — customer, address, every ordered line, totals, payment proof, then approve / cancel, mark shipped with a courier + AWB, and (once cancelled) the refund screenshot upload. `OrderDetailDialog` is gone. The returns queue stays reachable at `/orders/returns` |
| Customers  | `/admin/customers`                                                 | Lifetime value, new vs returning, guest share, top spenders, contact links                                                                |
| Shipping   | `/admin/shipping`, `/tracking`, `/couriers`                        | Shipments in transit, tracking search by AWB, courier performance, dispatch defaults                                                      |
| Payments   | `/admin/payments`, `/refunds`, `/failed`                           | Method mix, settlement, refund ledger, failed payments with a pre-filled payment-link email                                               |
| Analytics  | `/admin/analytics/sales`, `/customers`, `/products`, `/reports`    | Deep dives plus six CSV reports generated in the browser                                                                                  |
| Operations | `/admin/coupons`, `/reviews`, `/notifications`, `/settings`        | Coupon performance, review feed, derived alerts, and settings that actually change behaviour                                              |

### Reporting periods

Every dashboard, analytics and returns view shares one period selector — Today,
7 days, 30 days, 3 months, 1 year or a custom range — and each headline number
carries its change against the immediately preceding window of equal length.

### Where the numbers come from

Two order feeds are merged:

1. **A seeded demo year** generated in the browser (`modules/admin/data/adminData.ts`,
fixed seed) — around 1,400 orders, 520 customers, returns, reviews, coupons and a
restock log, so the dashboards have realistic volume to chart. It is generated in
memory and never persisted, so demo volume can never leak into the shopper's Order
History.
2. **Orders actually placed on this storefront**, mapped into the same shape.

Product references resolve from the live catalogue, so names, prices and images can
never drift from it. Status changes route to the right place: demo orders keep an
override in `wishbox.admin.orders.v1`, while storefront orders (`#WB-…`) are written
back to the customer-facing order store so the shopper sees them too.

### Settings that do something

`/admin/settings` persists to `wishbox.admin.settings.v1`. The **low-stock threshold**
drives the dashboard's inventory alerts, the inventory page and the catalogue's
low-stock filter, so changing it visibly changes the operational views.

Sign in with the demo credentials below. **There is no real authentication** — the
flag is a localStorage value, so this gate is illustrative only; real access control
would be server-side.

```
admin@wishbox.in / wishbox123
```

Everything the admin edits is persisted per browser and immediately visible on the
storefront: **unpublishing** removes a product from the shop, search and home rails
(its own URL then reports as not found), **out of stock** keeps it listed with the
Out-of-stock treatment, **restocking** updates storefront stock immediately, deleting
keeps past orders intact, and order status changes flow straight into the shopper's
Order History page.

Storage keys: `wishbox.catalog.v1` (products), `wishbox.orders.v1` (orders),
`wishbox.identity.v1` (verified shopper), `wishbox.returns.v1` (return requests),
`wishbox.admin.session.v1` (session), `wishbox.admin.orders.v1` (demo order status
overrides), `wishbox.admin.returns.v1` (return decisions),
`wishbox.admin.settings.v1` (settings). Clearing them restores the shipped demo data
— or use **Reset demo catalogue**, **Reset demo statuses** and **Reset queue** on the
relevant pages.

## Adding a product

Products can be added two ways:

1. **In the admin panel** (recommended) — `/admin/products` → *Add product*. A slug
   id and the next `WB-…-###` SKU are generated automatically.
2. **In code** — add an entry to `CATALOG` in
   `src/modules/products/data/catalogData.ts`, then bump `SEED_VERSION` in
   `catalogStore.ts` so browsers holding admin edits pick the new seed up.

Give a product a `detailData.ts` entry only if it needs variants or bulk tiers. The
flagship product's price is driven by `BULK_TIERS` in `detailData.ts`, so the admin
editor locks its price fields and manages the rest (stock, imagery, visibility).

## Tests

`npm test` runs the Vitest suite: cart merging/clamping and bulk-tier repricing,
coupon maths, wishlist moves, catalogue filtering/search and counts, catalogue CRUD
(id/SKU generation, updates, reset), order placement, status changes, the phone/OTP
rules behind the login modal and the shared formatters. Tests run in Node, so no DOM or browser setup is required.

## Deployment

`npm run build` emits a static `dist/`. Serve it from any static host and rewrite
unknown paths to `index.html` (the app uses client-side routing). The build fails on
type errors, so CI can run `npm ci && npm run lint && npm test && npm run build` as
the gate.
