# Phase 1.6–1.8 verification record

Verified locally on 19 September 2026, on top of the parts 1.4–1.5 patch.

| Check | Result | Scope |
| --- | --- | --- |
| Storefront + backend lint | Passed, no warnings | Application source and tests |
| Storefront + backend TypeScript | Passed | Including the payment provider, wishlist module/migration and native integration tests |
| Next.js production build | Passed | Account, checkout, catalogue and product routes |
| Medusa backend compilation | Passed | Admin bundle disabled for this build; no admin UI was changed |
| Backend unit tests | 59 passed | Payment verification, HMAC, idempotent refunds, native totals semantics, ownership, shared rate limits and existing catalogue/media tests |
| Storefront unit tests | 9 passed | Cart/variant behavior, address validation and safe return targets |
| Playwright browser regression | 36 passed | Isolated Store API and gateway-widget fixtures; existing catalogue/PDP/cart tests plus 11 account/checkout scenarios |
| Axe WCAG 2 A/AA + 2.1 AA | 0 violations across 12 audited views | Login, profile, address form, checkout, order empty state, homepage, shop and PDP |
| Browser JavaScript errors during the audit | 0 | Same audited views |
| Responsive layout | No horizontal overflow in audited widths | Checkout at 320/390/768px; existing product/cart/catalogue regression also covers 1024/1440px |
| Native database integration | Not executed in this environment | Requires runnable isolated PostgreSQL; checked-in CI provides it |
| Real Cashfree/Resend staging transaction | Not executed | Merchant credentials are intentionally optional while `CHECKOUT_ENABLED=false`; delivery/tax configuration and a controlled inbox are still required before enabling checkout |

## Regression fixes made during review

- Kept the account and bag controls in one desktop header row and preserved the compact mobile header. Mobile account navigation is available in the menu.
- Gave the mobile catalogue sort control a persistent accessible name.
- Rendered auth forms on the server rather than expanding a small client-only loading placeholder. The measured mobile login layout shift fell from approximately 0.694 to 0.
- Corrected summary projections: Medusa’s `subtotal` includes shipping, and `shipping_total` can include tax. The UI now uses `item_subtotal`, `shipping_subtotal`, `discount_subtotal`, `tax_total` and any credits alongside the authoritative total. Native unit coverage includes taxed shipping and discounts.
- Supported reset links arriving through a same-page fragment change and made expired/used link errors specific.
- Reused payment sessions under a shared lease instead of replacing them. Bag mutations cannot change the amount after payment initiation.
- Reconciled an existing full refund after a lost response and ignored duplicate payment-success callbacks followed by modal-dismiss callbacks.

## Performance review

Production-build, local Chromium observations on a fixture backend were collected with `PerformanceObserver`. Representative observed LCP values were 92ms for home, 56ms for shop, 52ms for PDP, 48ms for mobile login and 104ms for checkout. Observed CLS was zero except a negligible checkout shift of approximately 0.0000024.

These are warm/local diagnostic observations without mobile CPU or network throttling. They are **not Lighthouse scores or field Core Web Vitals evidence**. Real Cloudinary images, the deployed backend, Cashfree loading and field INP still need the deployed performance review. Cashfree’s SDK loads only when the shopper starts payment.

The local Next.js server logged aborted-stream messages during rapid navigation and hard session transitions. The broken-image regression also intentionally logs an invalid-image response. Browser assertions passed and the separate visual audit recorded no page JavaScript errors.

## Phase 1 gate

Implementation and local regression work are delivered; the production gate remains open. Run the native PostgreSQL suites and the real-provider staging checklist in `docs/phase-1-account-checkout.md`. Cashfree credentials are not required while `CHECKOUT_ENABLED=false`; only add them when preparing the sandbox checkout gate. Before customer activation, verify migration application, actual email receipt, serviceability/tax configuration, stock conflicts after payment, duplicate signed Cashfree webhooks and refund reconciliation.
