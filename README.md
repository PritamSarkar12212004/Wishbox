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
  lib/                    shared helpers (cn, currency, colour, image fallback)
  modules/
    products/             catalogue data, PDP, listing, cart/wishlist/coupon stores
      data/catalogData.ts all products (single source of truth)
      data/detailData.ts  rich detail config for the flagship paper product
      hooks/              catalogue filters, purchase state
      store/store.ts      persisted cart, coupon and wishlist stores
    history/              order history page + persisted orders store
    home/ cart/ wishlist/ contact/ about/ error/
```

Each feature folder follows the same shape: `page/`, `components/`, `consts/`,
`data/` and (where needed) `store/`.

## How the app is wired

- **Catalogue** — `modules/products/data/catalogData.ts` is the only place products
  are defined. Cards, the PDP, order history and the cart all resolve from it, so
  ids are unique and prices can never drift between pages.
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
  discount included.
- **Filtering** — category and sort live in the URL (`/shop?category=…&sort=…`), so
  links are shareable and the header selector and listing stay in agreement.
- **Rendering** — secondary routes are code-split; a top-level `ErrorBoundary`
  catches render crashes, and toast feedback covers every cart/wishlist action.
  A capture-phase image listener swaps dead or blocked image URLs for a local
  placeholder, so product cards never render a broken image.
- **Pricing limits** — `MAX_QTY` (500) keeps the advertised 500+ bulk tier reachable
  from both the PDP stepper and the cart.

## Adding a product

1. Add an entry to `CATALOG` in `src/modules/products/data/catalogData.ts`
   (id, price, MRP, imagery, description, highlights).
2. Give it a `detailData.ts` entry only if it needs variants or bulk tiers.
3. That's it — listing, filters, search, PDP, wishlist and cart pick it up automatically.

## Tests

`npm test` runs the Vitest suite: cart merging/clamping and bulk-tier repricing,
coupon maths, wishlist moves, catalogue filtering/search, order placement and the
shared formatters. Tests run in Node, so no DOM or browser setup is required.

## Deployment

`npm run build` emits a static `dist/`. Serve it from any static host and rewrite
unknown paths to `index.html` (the app uses client-side routing). The build fails on
type errors, so CI can run `npm ci && npm run lint && npm test && npm run build` as
the gate.
