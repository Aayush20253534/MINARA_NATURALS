# Parts 1.4 and 1.5 — Product details and cart

## Patch baseline and application

This is an **incremental patch** on top of `MINARA_NATURALS_phase_1_3.patch`,
which was produced against repository commit `b0cefe19af91526378a373778044584cf1571924`.
The complete 1.3 file tree has Git tree ID `803447476424bc38855d26c95f23a6c091d9ddab`.
Apply 1.3 first if those changes are not already in your checkout. Do not reapply it
if they are already present.

From the repository root:

```sh
git apply --check MINARA_NATURALS_phase_1_4_1_5.patch
git apply MINARA_NATURALS_phase_1_4_1_5.patch
```

There are no new dependencies, database migrations, service configuration changes
or production backend extensions in this patch. Keep the backend from 1.3 deployed;
this storefront continues using its catalogue endpoint and Medusa's native Store
product/cart routes. Build and deploy the storefront with the existing public
backend URL, publishable key and canonical site URL. Production uses HTTPS.

## Implemented

### 1.4 Product detail

- Responsive product layout, breadcrumb trail, brand/category, description and
  populated ingredients/shelf life/storage/origin sections. Empty sections are omitted.
- Real product gallery, thumbnails, enlarged native dialog, Escape support and
  missing/broken-image fallbacks. No new product photography is invented.
- Pack selection updates price, SKU and stock immediately. `?variant=<id>` preserves
  the selected pack across refresh/share. Invalid IDs fall back to an available,
  priced variant, or the first variant if none is purchasable.
- Quantity selection, explicit sold-out state, unknown-stock/price safeguards,
  and add-to-bag for the selected variant. Already-added quantities are accounted
  for in the visible quantity cap; Medusa still validates the mutation.
- Canonical product metadata and safely escaped Product/Offer JSON-LD with supplied
  brand, product images, prices and availability. No fabricated reviews or ratings.
- Related products from the category's parent collection. They stream separately
  so an unavailable recommendation request does not block the purchase interface.

MRP is optional and SKU-specific: put a numeric INR amount in product metadata
`mrp_by_sku`, for example `{"MNR-PKL-MANGO-250G":165}`. It is displayed only for the
matching SKU and only when at least the calculated selling price. This does not
alter Medusa prices. If no MRP exists, a genuine Medusa `sale` price list may supply
an original amount labelled **Regular price**, not MRP. No guessed comparison price.

### 1.5 Cart

- Header bag count, right-side drawer and `/cart` with image, product, unambiguous
  pack, quantity, removal, stock warning, backend line totals and summary.
- Medusa creates the guest cart on first addition in the INR region containing
  India. The publishable key must retain its one-sales-channel assignment.
- The random cart ID lives in a 30-day HTTP-only, SameSite=Lax cookie, Secure in
  production. Neither cart IDs nor prices are accepted in the mutation body.
- A same-origin Next route validates JSON actions, identifiers and integer
  quantities before forwarding only native add/update/remove payloads to Medusa.
  Cart responses are private/no-store and contain a narrow presentation projection,
  excluding customer/address/payment information and arbitrary metadata.
- Every native add/update checks inventory through Medusa's workflow. Cart reads
  additionally request channel-aware inventory through the native product API,
  flagging unavailable packs and quantities that exceed current stock.
- Totals are copied from Medusa; the browser never computes the displayed cart
  summary. Delivery is labelled unselected instead of falsely promising free
  shipping. Current tax/total amounts can change once an address is supplied.
- Same-tab requests are serialized. Web Locks coordinate tabs in supporting secure
  browsers; BroadcastChannel and window focus refresh shared state. The first-add
  race is covered by a two-tab browser test. Browsers without Web Locks still have
  per-tab serialization; simultaneous first additions in such older browsers
  require a server-side session/lock strategy if they enter the support matrix.
- No optimistic amount changes or automatic mutation retries. On failed/ambiguous
  responses, the client reads the cart again before exposing a retry, retaining
  the last confirmed state if that read fails. Expired/completed carts recover.
- Native drawer behaviour now includes explicit Tab wrapping and focus restoration
  without scrolling the underlying page.

Limits: 99 of each pack and 100 distinct lines through this storefront. Inventory
is not reserved by adding to a cart. Native checkout must revalidate prices, stock,
taxes and delivery in part 1.7. Authentication/cart transfer belongs to 1.6.

No active promotion/coupon configuration was found in the repository seed, so coupon
entry remains omitted under the plan's conditional requirement. Existing automatic
Medusa discounts are displayed when present. Checkout is visibly marked as not yet
available; there is no fake payment or checkout button.

## Verification

Executed:

- Frontend and backend lint and TypeScript checks: passed.
- Next production build: passed (also built by the browser suite).
- 7 frontend tests and 34 existing backend unit tests: passed.
- 25 browser tests covering the previous catalogue flows plus pack selection,
  share/refresh, selected pack/quantity, merging, distinct packs, cart persistence,
  removal, backend failures, a response lost after commit, changed inventory,
  expired carts, cross-origin rejection, injected prices, two-tab updates and
  simultaneous first additions, gallery/MRP, missing content, and 320/390/768/1024/1440px.
- Desktop/mobile screenshots inspected; no horizontal overflow at tested widths.
- Axe WCAG 2 A/AA and 2.1 AA: zero reported violations on two product pages,
  empty cart, populated mobile cart and bag drawer. This is automated coverage,
  not a complete manual accessibility certification.

The Playwright suite uses the isolated seed-backed API in `client/scripts/qa-catalogue.mjs`.
It exercises the production Next build and real storefront proxy/cookie/client code,
not a live Medusa database. Its control route is test-only and never imported by the
application. The gallery test temporarily uses the existing decorative image and
an intentionally missing image solely to exercise image controls/error handling;
production product media still comes from the backend.

Native integration coverage was added in `server/integration-tests/http/minara-cart.spec.ts`.
It checks native cart creation, selected packs, merging, prices/totals, quantity
updates, removal, inventory rejection, and the exact Store field projections.
Execution of this and the 1.3 native suite was attempted, but database startup
remained blocked: no PostgreSQL service was present, and the environment forbade
the user/group switch needed to initialize a temporary PostgreSQL instance. The
suites failed at connection/bootstrap, before contract assertions could run.
**Live Medusa/PostgreSQL, production Redis locking, and Cloudinary integration are
not validated by the fixture tests.**

Run before production release against an isolated test database with privileges to
create/drop test databases (never point this runner at a production database):

```sh
npm run lint
npm run typecheck
npm --prefix client test
npm --prefix server run test:unit
npm --prefix client run test:e2e
# Configure local test PostgreSQL via DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD:
# POSIX example:
cd server
TEST_TYPE=integration:http NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand --forceExit minara-cart.spec.ts minara-catalogue.spec.ts
```

Use the existing `server/.env.test` with an isolated database. The runner snapshots
seeded data, restores it between tests, and cleans up its temporary databases.

On staging, check a Cloudinary gallery, 250g/500g/1kg selection, a sold-out pack,
add/update/remove, browser refresh, two tabs, and a stock change in Admin. Confirm
that cart taxes and price lists match the store's configuration before checkout work.

References used to confirm contracts: installed Medusa 2.21 route/workflow sources,
installed Next 16.3 documentation, and the official
[Medusa cart documentation](https://docs.medusajs.com/resources/commerce-modules/cart)
and [sale-price documentation](https://docs.medusajs.com/resources/storefront-development/products/price/examples/sale-price).
