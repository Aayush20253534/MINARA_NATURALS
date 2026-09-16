# Phase 1 — Core Retail Storefront and Commerce

This maps to the proposal’s Phase 1: design system, homepage, category/product pages, search/filters, cart/checkout, and customer accounts.

The phase should result in a complete retail shopping loop using real backend data and test payment/shipping configuration.

---

## Part 1.1 — Commerce data model and seed catalogue

### Tasks

- define initial category/subcategory hierarchy from client data;
- define product fields and structured metadata;
- model pack sizes as Medusa variants/options;
- define SKU conventions;
- define pricing fields and currency/region assumptions;
- define brand representation;
- configure inventory tracking;
- create 10–20 representative development products across multiple categories;
- include products with multiple pack sizes and stock states;
- attach sample media through real media storage in shared environments.

### Required test cases

- one product with one variant;
- one product with 250g/500g/1kg variants;
- one out-of-stock variant;
- one category with subcategories;
- one product with complete ingredients/shelf-life/storage/origin details;
- one product without optional metadata to verify empty-section behaviour.

### Exit criteria

- sample catalogue is managed through Medusa Admin;
- variants have independent price/inventory;
- storefront API returns the expected structured data;
- no frontend mock product array is required.

---

## Part 1.2 — Homepage

### Tasks

Implement the homepage composition from `design.md` with backend-driven product references wherever possible:

- hero with Shop Now / Explore Categories;
- shop-by-category section;
- featured MINARA products/pickles rail;
- popular products section;
- “From Local Sources to Your Home” story section;
- trust/quality section using only verified content;
- bridges to Bulk/Wholesale, Export, and Franchise;
- optional brand achievements area only when assets/content are supplied.

### Content architecture

Campaign banner content can begin as strongly typed configuration if admin editing is not yet ready, but product/category references should come from commerce data.

### Exit criteria

- homepage has intentional laptop/mobile composition;
- product rails use shared product cards;
- image loading does not cause major layout shift;
- no fake metrics/ratings/certifications;
- links route into live catalogue/product pages.

---

## Part 1.3 — Catalogue, category, search, and filters

### Routes

Suggested patterns:

```text
/shop
/category/[handle]
/search?q=
```

Exact URL design may evolve, but avoid duplicate canonical paths for the same category/product.

### Tasks

- category/subcategory listing;
- category banner/header;
- product grid;
- pagination/load-more strategy;
- filters:
  - price;
  - brand;
  - pack size;
  - rating only when real rating data exists;
  - availability;
- sort options;
- text search;
- URL-synchronized filter state;
- mobile filter drawer;
- loading/error/empty states;
- breadcrumbs;
- metadata/canonical handling.

### Performance requirements

- no client-side fetch of the entire catalogue just to filter it;
- server-side/backend filtering;
- indexes/query strategy reviewed after representative data exists;
- only necessary product media loaded in grids.

### Exit criteria

- filters combine correctly;
- back/forward navigation preserves expected state;
- mobile filter UX is usable;
- empty results are graceful;
- category/search pages are crawlable where appropriate.

---

## Part 1.4 — Product detail page

### Tasks

- product image gallery;
- product title/category/brand;
- variant/pack selector;
- variant-aware price/MRP/stock display;
- quantity selection;
- add-to-cart;
- description;
- ingredients;
- shelf life;
- storage;
- origin;
- related products;
- breadcrumbs;
- Product structured data using only valid fields;
- responsive/mobile purchase experience.

### Behaviour rules

- switching pack size changes price/inventory immediately and accurately;
- unavailable variants cannot be purchased;
- URL/selection behaviour should be stable enough for refresh/share;
- adding to cart must add the selected variant, not simply the first variant.

### Exit criteria

- all representative product-data cases render correctly;
- variant selection is tested;
- out-of-stock behaviour is explicit;
- mobile CTA is practical;
- no empty information accordion appears.

---

## Part 1.5 — Cart

### Tasks

- cart creation/persistence through Medusa;
- cart drawer/mini-cart if used;
- full cart page;
- line item image/name/pack;
- quantity update;
- remove item;
- stock revalidation;
- totals;
- promotion/coupon entry if promotion configuration is ready;
- empty cart state;
- error recovery;
- optimistic UI only where correctness is preserved.

### Exit criteria

- cart survives expected navigation/session behaviour;
- pack size is unambiguous;
- quantity cannot exceed allowed stock without feedback;
- totals are backend-authoritative;
- mobile cart controls remain usable.

---

## Part 1.6 — Customer authentication and account

### Tasks

- registration;
- login/logout;
- forgot/reset password if supported by selected auth flow;
- account profile;
- address CRUD;
- orders list;
- order detail;
- order tracking display based on available fulfillment data;
- wishlist model/API/UI;
- account navigation responsive behaviour;
- Resend templates for auth/order messages as applicable.

### Security

- protected routes must verify auth server-side/API-side;
- no customer can access another customer’s order/address/wishlist;
- avoid logging passwords/tokens/PII.

### Exit criteria

- account lifecycle works in deployed non-production environment;
- authorization tests cover customer-owned resources;
- wishlist works across sessions for signed-in customers;
- order history uses real Medusa order data.

---

## Part 1.7 — Checkout foundation

### Blockers

Before production completion, client must confirm:

- payment provider;
- shipping/serviceability rules;
- COD policy if any;
- tax/GST/invoice expectations.

### Tasks

- contact/customer association;
- delivery address;
- shipping method/provider integration;
- payment provider integration through Medusa;
- order review;
- place order;
- success/confirmation route;
- failure/retry states;
- payment webhook verification;
- idempotency;
- order confirmation email through Resend.

### Test cases

- successful prepaid checkout;
- declined/failed payment;
- retry payment;
- duplicate webhook;
- cart with out-of-stock item during checkout;
- invalid address/serviceability;
- signed-in and guest behaviour if guest checkout is approved.

### Exit criteria

- no fake payment buttons;
- payment state matches backend/provider state;
- duplicate callbacks do not create duplicate paid orders;
- order confirmation email is sent;
- success page reflects actual created order.

---

## Part 1.8 — Phase 1 polish and regression pass

### Tasks

- Playwright critical retail journey;
- accessibility pass;
- mobile layout pass across common widths;
- Core Web Vitals/Lighthouse review;
- metadata/sitemap/robots review;
- empty/error/loading state audit;
- security review of public mutations;
- remove temporary seed-only labels or dev controls;
- verify no starter assets/text remain.

## Phase 1 gate

Phase 1 is complete only when a customer can browse, search/filter, select a pack variant, add it to cart, authenticate as required, complete a test checkout through the selected real provider integration, receive confirmation, and later view the order in their account.
