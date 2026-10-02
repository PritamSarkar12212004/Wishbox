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

## Scripts

```bash
npm install
npm run dev        # start the dev server
npm run build      # typecheck (tsc -b) then bundle for production
npm run preview    # serve the production build locally
npm run lint       # eslint
npm run typecheck  # tsc -b only
```

## Project structure

```
src/
  assets/Theme/           design tokens (colors, shadows, radii, typography)
  components/ui/          shadcn/ui primitives (skeleton, select-menu, …)
  components/ErrorBoundary.tsx
  global/header/          alert marquee, header, footer and their fixtures
  layout/                 page shell: alert + header + main + footer
  lib/                    shared helpers (cn, currency, colour)
  modules/
    products/             catalogue data, PDP, listing, cart/wishlist store
      data/catalogData.ts all products (single source of truth)
      data/detailData.ts  rich detail config for the flagship paper product
      hooks/              catalog filters, purchase state
      store/store.ts      persisted cart + wishlist stores
    home/ cart/ wishlist/ history/ contact/ about/ error/
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
- **Cart & wishlist** — `modules/products/store/store.ts` keeps real line items in
  `localStorage` (`useSyncExternalStore`), shared by the header badges, product
  cards, PDP, cart and wishlist. Refreshing the page keeps selections; multiple
  tabs stay in sync.
- **Filtering** — category and sort live in the URL (`/shop?category=…&sort=…`), so
  links are shareable and the header selector and listing stay in agreement.
- **Rendering** — secondary routes are code-split; a top-level `ErrorBoundary`
  catches render crashes, and toast feedback covers every cart/wishlist action.

## Adding a product

1. Add an entry to `CATALOG` in `src/modules/products/data/catalogData.ts`
   (id, price, MRP, imagery, description, highlights).
2. Give it a `detailData.ts` entry only if it needs variants or bulk tiers.
3. That's it — listing, filters, PDP, wishlist and cart pick it up automatically.

## Deployment

`npm run build` emits a static `dist/`. Serve it from any static host and rewrite
unknown paths to `index.html` (the app uses client-side routing). The build fails on
type errors, so CI can run `npm ci && npm run lint && npm run build` as the gate.
