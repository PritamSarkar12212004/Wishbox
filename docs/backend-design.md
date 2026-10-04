# WishBox — backend design

Derived from a full scan of `Wishbox-Frontend`. Every claim below points at real
code, because the backend has to match what the UI already renders rather than an
imagined ideal.

---

## 1. What exists today

A Vite + React 19 SPA. `vite.config.ts`, `vercel.json` and `package.json` confirm
it: **there are zero network calls** — no `fetch`, no `axios`, no `.env`. The
README says it plainly: *"there is no backend, API or database"*.

So the "backend" today is **12 localStorage keys**, read and written by small
stores built on one factory (`src/lib/createStore.ts`).

| Storage key | Owner | Holds |
| --- | --- | --- |
| `wishbox.catalog.v1` | `products/store/catalogStore.ts` | live, admin-editable catalogue + admin-added categories |
| `wishbox.cart.v1` | `products/store/store.ts` | cart lines |
| `wishbox.coupon.v1` | `products/store/store.ts` | applied cart coupon |
| `wishbox.wishlist.v1` | `products/store/store.ts` | saved products |
| `wishbox.identity.v1` | `auth/store/authStore.ts` | shopper name + phone |
| `wishbox.orders.v1` | `history/store/store.ts` | shopper order history (fixtures + real checkouts) |
| `wishbox.returns.v1` | `history/store/returnsStore.ts` | shopper return requests |
| `wishbox.admin.orders.v2` | `admin/store/adminOrdersStore.ts` | admin order overrides |
| `wishbox.admin.returns.v1` | `admin/store/adminReturnsStore.ts` | return status overrides |
| `wishbox.admin.reviews.v1` | `admin/store/adminReviewsStore.ts` | review replies + publish state |
| `wishbox.admin.settings.v1` | `admin/store/settingsStore.ts` | store profile, thresholds, QR, theme |
| `wishbox.admin.session.v1` | `admin/store/sessionStore.ts` | demo admin sign-in flag |

Two patterns are worth preserving when the data moves:

- **Seed + override.** Admin stores read a generated demo dataset
  (`admin/data/adminData.ts`, ~830 lines, seeded with `ADMIN_DATA_SEED`) and merge
  a patch map over it. That maps cleanly onto a real DB: the seed becomes migrations/
  fixtures, the patch map becomes the real row.
- **Live-order fan-out.** `adminOrdersStore` merges demo orders with orders actually
  placed in the browser, and writes status back to the storefront store so the
  customer's History page agrees. On a server this becomes one `orders` table read
  by both surfaces — the sync problem disappears.

---

## 2. What the backend must own

Derived by walking every store method. Anything that decides **money, stock, access
or trust** must move server-side; anything purely cosmetic can stay in the browser.

| Must move to the server | Can stay client-side |
| --- | --- |
| Catalogue + stock levels | Cart contents (until checkout) |
| Coupon validity, discount maths | Wishlist |
| Order totals, tax, shipping | Filter/sort/search UI state |
| Order status transitions | Theme choice (cosmetic) |
| Payment status + screenshot verification | Sidebar counts (derived) |
| Refunds | Form drafts |
| Admin auth + role | — |
| Review publish / reply | — |
| Low-stock threshold (drives alerts) | — |

The current build has four **client-authoritative** behaviours that are broken on a
real shop and must not be ported:

1. **Coupons are computed in the browser.** `detailData.ts` ships `PAPER10`,
   `SAVE5`, `PREPAID100` as constants and `discountForAmount()` runs client-side.
   Anyone can edit localStorage and pay ₹0.
2. **Order totals are computed in the browser.** `placeOrder()` trusts the cart
   lines it is handed.
3. **Stock is never decremented.** `catalogStore` edits `stock` by hand; a purchase
   does not reserve or reduce it, so overselling is guaranteed.
4. **Admin login is a flag.** `sessionStore` writes `wishbox.admin.session.v1`; the
   credentials are literals in `adminConst.ts`.

---

## 3. Recommended stack

| Layer | Choice | Why |
| --- | --- | --- |
| Database | **Neon** (serverless Postgres) | Branching gives you a database per preview deploy, matching Vercel's preview flow; Neon ships a TS serverless driver |
| API | **Node 20 + Fastify + Zod** (`api/` folder, deployed as Vercel functions) | Same language as the frontend, so the TS types in `src/modules/**/data` become the contract; Zod mirrors the existing validation helpers (`auth/lib/otp.ts`) |
| ORM | **Drizzle** | SQL-shaped, so the hand-written analytics in `admin/lib/analytics.ts` can be pushed down as queries without fighting an abstraction |
| Object storage | **Supabase Storage** (S3-compatible) | One public bucket for product imagery, one private bucket for payment/refund screenshots behind signed URLs and RLS |
| Hosting | **Vercel** | `vercel.json` is already committed; Git previews per branch; serverless functions cover this API's shape |
| Auth | **Own phone-OTP + JWT** | The OTP UI already exists in `modules/auth`; keep it and swap the local `generateOtp()` for a real send. Clerk's catalog entry is Next.js-only and does not fit this Vite SPA |
| SMS (OTP) | **MSG91 / Gupshup / Kaleyra** | India requires DLT-registered sender IDs and templates. Twilio works but you still register DLT yourself. No catalog provider covers this — it is a deliberate manual pick |
| Payments (UPI/COD) | **Razorpay** (or Cashfree) | Nothing in the catalog does UPI. Razorpay covers UPI QR, UPI intent, cards, COD reconciliation and refunds, which is exactly the method list in `PaymentMethod` |
| Error/monitoring | Sentry | Optional but the admin actions deserve an audit trail |

A tracked Neon setup link is in the chat; storage and hosting links were returned
alongside it.

---

## 4. Data model

Postgres. Money is stored in **paise as integers** (`bigint`), never floats — the
frontend already does rupee maths with `inr()`/`inrCompact()` (`lib/format.ts`) and
should keep receiving whole rupees from the API.

### Catalogue

```sql
categories(id, slug unique, label, sort_order)
brands(id, slug unique, name)

products(
  id, sku unique, name, slug unique, brand_id fk, category_id fk,
  description, price_paise, mrp_paise, badge,          -- SALE | BESTSELLER | NEW
  status,                                              -- published | hidden
  rating_avg numeric(2,1), review_count int,
  stock int,                                           -- denormalised for fast low-stock
  specs jsonb,                                         -- height, width, gsm, packaging
  created_at, updated_at
)

product_media(id, product_id fk, url, kind, sort_order)
  -- kind: main | hover | gallery | before | after | video

product_highlights(id, product_id fk, text, sort_order)
product_offers(id, product_id fk, code, label)          -- CatalogProduct.offer

-- The flagship PDP carries variants the rest of the catalogue does not.
variant_groups(id, product_id fk, name, sort_order)      -- Color | Size | GSM | Pack
variant_options(id, group_id fk, label, value, metadata jsonb, available)
  -- metadata: hex for colour, widthInch/heightInch for size, sheets/perSheet for pack
product_variants(id, product_id fk, option_ids text[], price_paise, stock, sku)
bulk_tiers(id, product_id fk, min_qty, max_qty, unit_price_paise, discount_pct)
```

`product_variants` is deliberately sparse: only the flagship has rows, matching
`detailData.ts` where everything else has no colour/size/GSM axis.

### People and access

```sql
users(id, name, phone unique, created_at)               -- phone: 10 digits, no country code
addresses(id, user_id fk, line1, line2, city, state, pincode, phone, is_default)
otp_codes(phone, code_hash, expires_at, attempts, consumed_at, created_at)

admins(id, email unique, password_hash, name, role, created_at)
  -- role: owner | manager | support
admin_sessions(id, admin_id fk, token_hash, expires_at, created_at)
audit_log(id, actor_type, actor_id, action, entity, entity_id, before jsonb, after jsonb, at)
```

`Identity` today is `{ name, phone, verifiedAt }` — `users` plus a session is its
server-side form.

### Commerce

```sql
carts(id, user_id fk null, anon_id, updated_at)
cart_items(id, cart_id fk, product_id fk, variant_id null, qty, unit_price_paise)
wishlist_items(id, user_id fk, product_id fk, created_at)

coupons(
  code pk, label, kind,        -- percent | flat
  value, min_order_paise, status,   -- Active | Scheduled | Expired
  starts_at, expires_at, usage_limit, per_user_limit
)
coupon_redemptions(id, coupon_code fk, order_id fk, user_id fk, discount_paise, at)

orders(
  id, number unique,                  -- '#WB-1042'; fixtures start at #WB-1000
  user_id fk null, is_guest bool, guest_name, guest_phone,
  status,                             -- Approval|Approved|Shipped|Out for Delivery|Delivered|Cancelled
  payment_method, payment_status,     -- UPI|Credit Card|Debit Card|COD|Wallet / Paid|Pending|Failed|Refunded
  subtotal_paise, shipping_paise, discount_paise, total_paise,
  coupon_code null,
  shipping_address jsonb,             -- snapshot, never a live FK
  courier, tracking_id, delayed bool,
  placed_at, approved_at, approved_by, cancelled_at, cancellation_reason,
  refund_status, refunded_at
)

order_items(
  id, order_id fk, product_id fk, variant_id null,
  name, brand, image, category,       -- snapshots: a product rename must not rewrite history
  qty, price_paise, mrp_paise
)

order_events(id, order_id fk, from_status, to_status, actor_type, actor_id, note, at)

payments(id, order_id fk, method, status, amount_paise, provider_ref,
         screenshot_url, verified_by, verified_at, created_at)

returns(id, order_id fk, user_id fk, reason, note, status,
        refund_amount_paise, requested_at, decided_at, decided_by)
return_items(id, return_id fk, order_item_id fk, qty)

refunds(id, order_id fk, return_id null, amount_paise,
        status,                       -- Pending | Completed
        proof_url, processed_by, processed_at)

stock_movements(id, product_id fk, variant_id null, delta int, reason, ref, at)
  -- reason: purchase | restock | return | admin_adjust | cancel
  -- "Recently restocked" is this table filtered to reason='restock'. Today that
  -- list reads the seeded dataset, so an admin pressing "Restock +25" bumps the
  -- product's stock without logging a movement (ProductsPages.tsx:276). The API
  -- must write the movement in the same transaction as the stock update.

reviews(id, product_id fk, user_id fk, order_id fk, rating, title, comment,
        status,                       -- Published | Pending
        helpful_count, created_at)
review_replies(id, review_id fk unique, admin_id fk, message, at, edited_at)
review_votes(review_id fk, user_id fk, primary key (review_id, user_id))

settings(id bool primary key default true,   -- a one-row table
  store_name, support_email, support_phone,
  low_stock_threshold, free_shipping_threshold, cod_enabled,
  default_courier, website_theme,
  payment_qr_url, payment_qr_updated_at, updated_at)
```

`settings` is a singleton because `AdminSettings` is: one store profile, one QR,
one theme.

---

## 5. API surface

REST under `/api/v1`, JSON, cookie session for shoppers and a bearer session for
admins. Each row maps to a store method that exists today.

### Storefront

| Method + path | Replaces |
| --- | --- |
| `GET /products` (filter, sort, page, category, in-stock) | `useCatalog()` + `useCatalogFilters` |
| `GET /products/:slug` | PDP data incl. variants, bulk tiers, gallery |
| `GET /products/:id/reviews` | review list (currently static `reviewCount`) |
| `POST /products/:id/reviews/:reviewId/helpful` | `review_votes` |
| `POST /auth/otp` `{ phone }` | `generateOtp()` — now a real SMS send |
| `POST /auth/verify` `{ phone, code, name? }` | `authStore.signIn()` → sets session |
| `POST /auth/sign-out`, `GET /me`, `PATCH /me` | `authStore.signOut/updateName` |
| `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `DELETE /cart` | `cartStore.add/setQty/remove/clear` |
| `POST /cart/coupon` `{ code }`, `DELETE /cart/coupon` | `cartCouponStore.apply/clear` — **server validates** |
| `GET /wishlist`, `PUT /wishlist/:productId`, `DELETE /wishlist/:productId`, `POST /wishlist/move-to-cart` | `wishlistStore.*` |
| `POST /orders` `{ addressId, paymentMethod }` | `placeOrder()` — server prices from its own cart |
| `GET /orders`, `GET /orders/:id` | `useOrders()` / History page |
| `POST /orders/:id/returns` | `returnsStore.request()` |
| `GET /returns`, `GET /returns/:id` | shopper return list |
| `POST /orders/:id/payment-screenshot` | the screenshot the admin review flow expects |

### Admin (role-gated)

| Method + path | Replaces |
| --- | --- |
| `POST /admin/auth/sign-in` | `sessionStore` demo flag → real admin session |
| `GET /admin/metrics?range=&from=&to=` | `admin/lib/analytics.ts` (`computeMetrics`, `buildSeries`, …) |
| `GET/POST/PATCH/DELETE /admin/products` | `catalogStore` CRUD, publish/hide |
| `POST /admin/products/:id/restock` `{ units }` | `AdminRestock` → `stock_movements` |
| `GET /admin/categories`, `POST /admin/categories` | admin-added categories |
| `GET /admin/orders` (status, range, search, page) | `useAdminOrders()` |
| `PATCH /admin/orders/:id` `{ status?, courier?, trackingId? }` | `adminOrdersStore` patch |
| `POST /admin/orders/:id/approve` | `approvedAt` / `approvedBy` |
| `POST /admin/orders/:id/cancel` `{ reason }` | `cancellationReason` + reason list from `CANCELLATION_REASONS` |
| `POST /admin/orders/:id/refund` `{ amount, proof }` | `refundStatus`, `refundScreenshot` |
| `GET /admin/returns`, `PATCH /admin/returns/:id` `{ status }` | `adminReturnsStore.setStatus` |
| `GET /admin/customers`, `GET /admin/customers/:id` | `AdminCustomer` + `customerAnalytics` |
| `GET /admin/coupons`, `POST/PATCH/DELETE /admin/coupons` | `AdminCoupon` CRUD (currently behind `COUPONS_TOOLS_READY = false`) |
| `POST /admin/reviews/:id/reply`, `DELETE /admin/reviews/:id/reply`, `PATCH /admin/reviews/:id` `{ status }` | `adminReviewsStore.reply/clearReply/setStatus` |
| `GET /admin/settings`, `PATCH /admin/settings` | `settingsStore` |
| `POST /admin/settings/payment-qr` | QR upload → `paymentQr` + `paymentQrUpdatedAt` |
| `POST /uploads/signed` `{ bucket, contentType }` | direct-to-storage upload from `DropZone` |

Two endpoints the current demo fakes and the real thing needs:

- `POST /payments/webhook` — Razorpay webhook; flips `payment_status` and writes
  `payments`. Everything about `PaymentStatus` should be webhook-driven, not a UI
  toggle.
- `GET /admin/alerts` — the alert feed that used to power the bell. It was derived
  data (`buildAlerts`), so on a server it is a query, not a table.

---

## 6. Order lifecycle

One state machine, enforced server-side. The frontend currently has *two* status
vocabularies (`AdminOrderStatus` with 6 states, customer `OrderStatus` with 4) plus
a mapping table in `adminOrdersStore`. Collapse that to the admin pipeline and
project it for shoppers.

```
Approval ──approve──▶ Approved ──ship──▶ Shipped ──▶ Out for Delivery ──▶ Delivered
   │                      │                  │
   └──────cancel──────────┴──────────────────┘──▶ Cancelled ──refund──▶ (refund_status)
```

Rules the API must enforce (each is currently unenforced):

- Only `Approval` → `Approved` may set `approved_at/by`.
- Shipping requires `courier` + `tracking_id`, matching the ShipmentForm rules.
- Cancel before `Delivered`; after `Delivered` the path is a **return**, not a cancel.
- `Cancelled` + online payment ⇒ a `refunds` row with `status='Pending'`.
- A `Delivered` order unlocks the review form, which is where `reviews.order_id` comes from.
- Every transition writes `order_events` and `audit_log` — the UI already promises
  "who cancelled this and when".

---

## 7. Money rules that must leave the browser

Port these as server functions with their own tests, mirroring the existing pure
helpers (`admin/lib/upi.ts`, `auth/lib/otp.ts`):

1. **Price from the DB.** Ignore any client-sent price. The cart's `unit_price` is a
   cache; checkout re-prices from `products`/`product_variants`/`bulk_tiers`.
2. **Bulk tiers** — `findBulkTier(qty)` (`hooks/usePurchase.ts`) becomes a SQL/TS
   function shared with the flagship PDP, so the cart and PDP can never disagree
   (the current client code already worries about exactly this).
3. **Coupons** — validate status, window, `min_order`, usage and per-user limits in
   one transaction with the insert into `coupon_redemptions`.
4. **Free shipping** above `free_shipping_threshold`, COD only when `cod_enabled`.
   Both are settings reads, not client assumptions.
5. **Stock** — `SELECT … FOR UPDATE` on the variant/product row, decrement, and write
   `stock_movements`. Reserve at order creation for COD-free flows; expire unpaid
   online orders after N minutes.

---

## 8. Auth

- **Shoppers** — phone + OTP, exactly the flow in `modules/auth`: 10-digit validation
  (`isValidPhone`), 6-digit code, 30-second resend window (`RESEND_SECONDS`), hashed
  codes with a short TTL and an attempt cap. Fastify sets an httpOnly cookie session;
  `useIdentity()` then reads `GET /me`.
- **Admins** — email + password (Argon2id) → short-lived access token + rotating
  refresh token. Roles `owner | manager | support` gate the destructive endpoints:
  `support` reads, `manager` fulfils, `owner` refunds and edits settings. The demo
  credentials in `adminConst.ts` must be deleted, not migrated.
- Rate-limit `/auth/otp` per phone and per IP; the current build sends unlimited codes.

---

## 9. Media and uploads

Four kinds of file already flow through `DropZone` / `ScreenshotViewer`:

| Kind | Bucket | Access |
| --- | --- | --- |
| Product photos, gallery, hover, before/after | public | immutable, CDN-cached |
| Product video | public | URL only, as today (`videoUrl`) |
| Payment screenshots | private | signed URL, admin-only |
| Refund proofs | private | signed URL, owner-only |
| Payment QR | public (or private + signed) | served to shoppers at checkout |

Pattern: the API issues a short-lived signed upload for a given key; the browser
uploads straight to storage; the API records the key. Never proxy bytes through the
API. This also removes today's 300 KB data-URL ceiling — large files currently
cannot be persisted at all.

---

## 10. Migration plan

The frontend's store boundary is the whole advantage: **every screen talks to
`useSyncExternalStore` stores, not to storage.** Swap the store internals for a
fetch layer and the UI does not change.

**Phase 0 — contract.** Move the types in `modules/**/data` into a shared package
(`packages/contracts`) consumed by both the SPA and the API. The shapes above are
already written; this is a file move plus Zod schemas generated from them.

**Phase 1 — read-only API.** Catalogue, settings, reviews, orders (GET). Keep
localStorage as a cache; add a `useQuery`-style hook inside each store. Ship it
behind a flag so the demo still works with no backend.

**Phase 2 — write paths.** Cart, wishlist, coupon, address, `POST /orders`. Turn on
server pricing and stock decrement. Cart moves from localStorage to `carts`/
`cart_items`, keyed by `anon_id` until sign-in, then merged on login.

**Phase 3 — admin + auth.** Real OTP, real admin sessions, roles, audit log. Delete
`adminConst.demo`, `sessionStore` and the demo dataset.

**Phase 4 — payments.** Razorpay UPI/COD, webhooks, refunds, screenshot verification.

**Phase 5 — cut over.** Remove `createStore` persistence from the commerce stores,
keep it for genuinely local UI (theme preview, drafts). Retire
`admin/data/adminData.ts` — the generated demo year becomes a seed script.

Per store the change is small. Today:

```ts
const cart = createStore<CartLine[]>(readStoredJSON(CART_KEY, []), CART_KEY);
```

After:

```ts
// Same subscribe/getSnapshot surface, so every component keeps working.
const cart = createRemoteStore<CartLine[]>('/api/v1/cart', { initial: [] });
```

---

## 11. Deployment and environment

```
vercel.json (exists) ──▶ Vite SPA static build + /api/* functions
Neon Postgres          ──▶ DATABASE_URL
Supabase Storage       ──▶ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Razorpay               ──▶ RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
SMS provider           ──▶ SMS_API_KEY, DLT_SENDER_ID, DLT_TEMPLATE_ID
Sessions               ──▶ JWT_SECRET (or SESSION_SECRET)
```

`vercel.json` already rewrites everything to `index.html`, so `/api/*` must be
excluded from that rewrite (or the API moves to its own subdomain). Preview deploys
should point at a Neon branch — that is the reason to pick a database with branching.

---

## 12. Gaps and risks

- **No UPI provider in the catalog.** Razorpay/Cashfree handle UPI; they are a manual
  choice. Do not let a generic global processor stand in — UPI intent and QR are the
  primary payment rail in this dataset (`PaymentMethod` = UPI | Credit Card | Debit
  Card | COD | Wallet).
- **No DLT-compliant SMS in the catalog.** Indian OTP requires registered sender IDs
  and templates. This is a compliance step, not just an API key.
- **Analytics move server-side.** `admin/lib/analytics.ts` is ~700 lines of client
  computation over the full order list. At real volume that must become SQL
  (`group by date_trunc(...)`) with the same output shape.
- **Two status vocabularies** must be collapsed, or the admin/customer views will
  drift exactly as they do in the seeded dataset.
- **`isGuest` orders** (a documented `AdminOrder` field) need a guest checkout path
  that does not require an account, even though *placing* an order currently
  requires sign-in.
- **Price history.** Nothing today records what a product cost when an order was
  placed other than `order_items` snapshots — keep those snapshots forever.
