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
    history/              order history page + persisted orders store
    admin/                admin panel: dashboard, products, orders, demo session
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

## Admin panel

The storefront ships with an admin panel at **`/admin`** (lazy-loaded, rendered in
its own shell without the storefront header/footer).

| Route              | What it does                                                            |
| ------------------ | ----------------------------------------------------------------------- |
| `/admin`           | Dashboard: revenue, orders, units, top sellers, low stock, catalogue health |
| `/admin/products`  | Create, edit, hide/show, delete products and reset the demo catalogue    |
| `/admin/orders`    | Filter/search orders, advance status, cancel — updates the Storefront history |

Sign in with the demo credentials below. **There is no real authentication** — the
flag is a localStorage value, so this gate is illustrative only; real access control
would be server-side.

```
admin@wishbox.in / wishbox123
```

Everything the admin edits is persisted per browser and immediately visible on the
storefront: **unpublishing** removes a product from the shop, search and home rails
(its own URL then reports as not found), **out of stock** keeps it listed with the
Out-of-stock treatment, deleting keeps past orders intact, and order status changes
flow straight into the shopper's Order History page.

Storage keys: `wishbox.catalog.v1` (products), `wishbox.orders.v1` (orders),
`wishbox.admin.session.v1` (admin session). Clearing them restores the shipped demo
data — or use **Reset demo catalogue** on the products page.

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
(id/SKU generation, updates, reset), order placement, status changes and the shared
formatters. Tests run in Node, so no DOM or browser setup is required.

## Deployment

`npm run build` emits a static `dist/`. Serve it from any static host and rewrite
unknown paths to `index.html` (the app uses client-side routing). The build fails on
type errors, so CI can run `npm ci && npm run lint && npm test && npm run build` as
the gate.
