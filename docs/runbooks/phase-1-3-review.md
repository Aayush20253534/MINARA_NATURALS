# Phase 1.2 redesign and Phase 1.3 catalogue

Patch baseline: `b0cefe1` on `main` (19 September 2026).

## Included

- Redesigned homepage, header, footer, category tiles and shared product cards.
- Persistent mobile search; native modal menu and filter drawer with focus trapping,
  Escape, scroll locking and focus restoration.
- `/shop`, `/category/[handle]`, and `/search?q=` with category descendants,
  breadcrumbs, subcategory navigation, count, 12-item pages, and five sort orders.
- Price, brand, pack and availability filters. Multiple selections are OR within
  a facet; facets combine with AND. Pack, price and stock must match the **same
  variant**. Cards show only matching variants when those filters are active.
- URL state, individual removable chips, reset, back/forward navigation, input
  validation, empty results, missing-category and service-error handling.
- Crawlable unfiltered category pages; noindex on search/filter/sort combinations;
  canonical page URLs and category sitemap entries. No invented review ratings.
- Removal of the old frontend seed-only restriction and first-100-products search.
- Product handle lookup now queries Medusa directly with the India region,
  independent of the first catalogue page and the store's default-region setting.
- Prices retain decimal precision. Unmanaged inventory and backorders are handled;
  unknown inventory is not advertised as in stock. Bad/missing card media gets a
  stable fallback instead of crashing the grid.

Product detail remains the existing read-only preview. Interactive PDP, cart,
account and checkout remain parts 1.4–1.7. Business bridges are informational and
explicitly say that enquiries open later; no dead application/payment buttons.
Phase 0 service configuration, versions, providers and infrastructure are retained.

## Deploy in this order

1. Apply the patch at the repository root. It includes a Git binary image block.
2. Run `npm --prefix client ci` (adds the browser test runner only).
3. Verify the existing server dependencies with `npm --prefix server ci --legacy-peer-deps`.
4. Build and deploy **the backend first**, then the storefront. The new storefront
   requires `GET /store/minara/catalogue`. No database migration is introduced.
5. Use the existing storefront publishable key assigned to **one sales channel**.
   The backend must have an INR region containing India, as established by the seed.
6. Check `/shop`, `/category/minara-pickles`, `/search?q=mango`, and a product link
   against the deployed backend, then run the native HTTP integration suite against
   an isolated test PostgreSQL database.

Do not apply with `--reject` or hard-reset a working branch. If `git apply --check`
fails, the local code differs from the baseline and the changes need merging.

## Backend query and cache contract

`GET /store/minara/catalogue` is covered by Medusa's Store publishable-key middleware.
The route rejects missing/ambiguous sales-channel context, uses the authorized
product-channel link and published status, excludes inactive/internal categories,
and projects an explicit allowlist of merchandising metadata.

The public browsing projection uses Medusa `QueryContext` for guest INR prices and
`getVariantAvailability` for inventory at the sales channel's locations, including
reservations and inventory kits. No direct SQL against private Medusa tables and
no client-side fetch of the whole catalogue are used. These are browsing prices;
future cart/checkout must recalculate authoritative customer/tax/shipping totals.

A narrow snapshot is built in batches of 100 products, cached for 30 seconds in the
existing Medusa Caching module (Redis in production), tagged for invalidation, and
reused across filter combinations. A process-level single-flight promise coalesces
concurrent cold requests. The cache key includes the sales channel and pricing
context. Only a page of products, category navigation and facet labels is returned;
full galleries and private metadata are excluded. Error responses are not cached.

The cold build still reads the channel's catalogue in batches; warm filtering and
sorting run on that projection in the backend. This is intentionally not a claim
of a dedicated search index or a completed load test. Before a very large import,
measure cold-build latency, cache hit rate, Redis payload size and memory under
representative traffic. If that exceeds the latency budget, move this projection
into an indexed search service while retaining this API and variant semantics.
The current query uses channel/product/category identities; there are no new
unverified database indexes or migrations. Stock can lag by up to the cache TTL;
checkout must always revalidate stock. Ratings remain omitted until real reviews
exist. Customer-specific pricing is outside this guest catalogue contract.

## Verification

Commands:

```sh
npm run lint
npm run typecheck
npm --prefix client test
npm --prefix server run test:unit
npm --prefix client run build
# With server dependencies installed:
(cd server && npx medusa build)
# Once per machine:
cd client
npx playwright install chromium
npm run test:e2e
```

The browser suite builds and starts the production storefront with an isolated,
seed-backed test API on ports 3101/9101. It does **not** point at a live database.
The fixture is kept in `client/scripts/qa-catalogue.mjs`, is not imported by the
application, and is only started by the test configuration. Node 22.12+ uses its
experimental TypeScript stripping for the fixture and small URL-state tests.

Checks executed for this patch:

- Frontend/backend ESLint and TypeScript: passed.
- Frontend production build: passed.
- Medusa backend compilation after generated schema types: passed; admin build
  was disabled for this compile check because no admin code changed.
- 3 URL-state tests and 34 backend unit/route-contract tests: passed.
- 10 browser tests: passed, including widths 320/390/768/1024/1440, combined filters,
  search, pagination, nested categories, empty results, back navigation, drawer
  keyboard interaction and no horizontal page overflow.
- Desktop and mobile screenshots inspected with the repository's seed fixture.
- Axe WCAG 2 A/AA and 2.1 AA scans: zero violations on homepage, shop, search,
  category and mobile filter drawer; no browser page errors in that pass. This is
  automated coverage, not a claim of a complete manual accessibility certification.
- Native Medusa/PostgreSQL HTTP integration test added. Execution was attempted but
  blocked at database startup because no test PostgreSQL server was available.
  Live Neon, Render, Redis and Cloudinary verification therefore remains a deployment
  check; the unit/browser results must not be represented as live-service validation.

## Media

`client/public/images/minara-market.webp` is a 1400×933 decorative editorial hero,
approximately 204 KiB, generated with the built-in image-generation tool. It is
included in the patch, served locally and optimized by Next Image. It is not used
as a SKU/product photograph. Actual cards/categories use Medusa Cloudinary media;
missing product media is clearly labelled rather than replaced by invented stock.

Generation brief: a premium Indian grocery editorial still life on ivory limestone,
sage wall, a woven basket of tomatoes, aubergines, carrots, coriander, limes and
chillies beside an unbranded mango-pickle jar, bowls of lentils/turmeric and linen;
soft morning side light, landscape composition, no people, logos, text or labels.
