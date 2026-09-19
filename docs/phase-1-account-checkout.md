# Parts 1.6–1.8: account, checkout and regression

This patch follows the parts 1.4–1.5 patch. It adds the implementation and local regression coverage. **The Phase 1 production gate is still open** until the native database and real-provider staging checks below pass. No live configuration or deployment is changed by applying this patch.

## Delivered behavior

- Native Medusa email/password registration, sign-in and password reset; secure HTTP-only authentication cookie; server-side customer verification; logout clears the browser’s bag and authentication cookies.
- Profile editing, India address creation/editing/removal, paginated real order history, private order details and fulfillment tracking.
- Persisted customer wishlist with a migration, unique customer/product index, sales-channel filtering and a 100-product limit. Product pages have a save action.
- Signed-in checkout: guest browsing bags are associated on login, email comes from the verified account, billing uses the delivery address, delivery options and all totals come from Medusa.
- Cashfree hosted checkout through a custom Medusa payment provider. Only the Cashfree payment-session ID, merchant order ID and sandbox/production mode reach the browser. The provider verifies actual Cashfree order/payment state; browser callbacks never mark orders paid.
- Order confirmation uses an actual Medusa order and requires ownership. Pending/declined/dismissed payments, unavailable delivery, disabled checkout and ambiguous completion responses have recovery states.
- Password-reset and order-confirmation subscribers use the existing Resend provider. Reset tokens travel in URL fragments, are removed from the address bar, expire after 15 minutes and use Medusa’s single-use reset-token validation. Notification and Resend idempotency keys prevent duplicate sends on retries.
- Native order/cart ownership guards, shared auth rate limits, password bounds, same-origin JSON mutation checks, payment-provider restrictions and security headers. `CHECKOUT_ENABLED=false` also blocks direct native payment initialization/completion.

## Apply and prepare

Apply this after the previously supplied parts 1.4–1.5 changes:

```sh
git apply --check MINARA_NATURALS_phase_1_6_1_8.patch
git apply MINARA_NATURALS_phase_1_6_1_8.patch
npm --prefix client ci
npm --prefix server ci --legacy-peer-deps
npm --prefix server run db:migrate
```

The new migration creates only the wishlist table. Run migrations once through the normal Render pre-deploy process; API and worker must run the same code. Do not reseed a production catalogue to configure checkout.

## Staging configuration

1. Keep `CHECKOUT_ENABLED=false` initially. Set `STOREFRONT_URL` to the canonical storefront and `NEXT_PUBLIC_SITE_URL` to the same origin. Production customer email links require HTTPS.
2. Keep `CHECKOUT_ENABLED=false` while the Cashfree merchant account is not ready. Cashfree credentials are intentionally not required while checkout is disabled. When enabling checkout, set `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET` on both API and worker, set `CASHFREE_ENV=sandbox` for staging (`production` only at go-live), and keep `CASHFREE_API_VERSION=2025-01-01`. No secret belongs in a `NEXT_PUBLIC_*` variable.
3. Configure Cashfree webhooks to `https://<backend>/hooks/payment/cashfree_cashfree`. The endpoint verifies Cashfree’s `x-webhook-timestamp` + raw-body HMAC signature before Medusa processes the event. Browser completion is never trusted as payment proof; the provider re-fetches the order and its payments from Cashfree.
4. After redeploying with checkout enabled and credentials present, in Medusa Admin add `pp_cashfree_cashfree` to the existing INR/India region. Remove the old Razorpay provider from the region if it is still listed from an earlier build. The seed’s manual payment provider is intentionally not usable by storefront checkout.
5. In Medusa Admin, configure the fulfillment set, India service zones, shipping options, rates, shipping profiles, inventory location and sales-channel links. A rate is offered only when Medusa returns it for the cart’s address. No flat rate, free-shipping promise or delivery timeline is invented by this patch. Calculated shipping-provider prices are supported; provider-specific pickup-point forms are not.
6. Configure and review tax regions/rates and product tax categories with MINARA’s actual GST requirements. Tax/GST invoice generation is not added here. The checkout shows Medusa-calculated tax; an unconfigured zero is not a verified tax exemption.
7. Configure Resend’s verified sending domain, key/from/reply-to and a controlled staging recipient. Set `REQUIRE_RESEND_IN_PRODUCTION=true`. Production checkout also refuses to boot without Resend credentials. Confirm reset and order emails arrive in the intended inbox before allowing customers to order.
8. Keep the existing shared Redis/Render infrastructure active. Rate limits, cart mutation leases, payment workflows and notification deduplication must share state across API and worker instances.
9. Set `CHECKOUT_ENABLED=true` in staging only when the above configuration is ready, then complete the acceptance checks. Production activation remains a separate deployment decision.

The implementation chooses Cashfree prepaid payments, signed-in checkout and no COD as configurable defaults. Delivery coverage, COD policy and tax/invoice requirements still require business sign-off before production launch.

## Payment invariants and operations

A payment session is reused under a shared mutation lease. Repeated requests do not invoke Medusa’s default replace-session behavior. Once a Cashfree order exists, this bag is immutable; the shopper must resume that payment. Address and item changes are available before payment starts. This avoids charging an old amount after a cart edit. Closing the Cashfree window does not cancel the merchant order.

Cashfree hosted checkout is treated as captured only after Cashfree reports a `SUCCESS` payment. The provider never marks an order paid from a browser callback. Refunds use deterministic merchant refund IDs and Cashfree idempotency keys so ambiguous network retries do not create duplicate refunds. Cancellation of a successful payment requires a refund; it is never silently treated as unpaid.

The bag ID remains in its HTTP-only cookie after completion until a new bag starts, allowing a lost browser response to recover the existing order. The completed bag is shown as empty in the bag UI. Payment references, JWTs, customer data and secrets are not stored in localStorage.

If Cashfree reports a successful payment but Medusa cannot complete the order (for example, a stock conflict), do not ask the shopper to pay again. Reconcile the payment collection in Admin against the Cashfree order/payment, retry completion only after resolving the cause, or refund the payment. This exception requires an operational process; payment success alone is never shown as a completed storefront order.

## Acceptance checks before the Phase 1 gate closes

Run the checked-in native Medusa HTTP suites with an isolated PostgreSQL database. CI already supplies PostgreSQL and runs them. These tests are distinct from the browser fixture and include customer-owned orders, carts, addresses and wishlist persistence.

With real Cashfree sandbox, Medusa and Resend, verify:

- Register → reset password → sign in; expired and reused reset tokens fail; emails arrive.
- Browse/search/filter → choose a pack → add/update bag → sign in → saved/new address → delivery → accurate tax/total → test payment → one order → one email → account order/tracking.
- Declined payment, dismissed window, delayed authorization, network loss after payment, concurrent tabs, repeated completion and duplicate signed webhooks. Exactly one paid order must result.
- Another customer and an anonymous request cannot retrieve an assigned cart/order, edit an address or read a wishlist.
- An unavailable address has no payable delivery option. An out-of-stock cart cannot become a successfully completed order. Reconcile/refund any captured-payment exception.
- Refund and retry the same refund, including a lost full-refund response. Confirm the gateway and Medusa agree.
- Confirm rate limits share state on API/worker instances and reset/order emails do not contain a staging hostname.

The local browser suite substitutes a clearly isolated Store API and Cashfree SDK fixture. It verifies storefront behavior, not real gateway acceptance, database migrations or inbox delivery. The fixture lives only in `client/scripts/qa-*.mjs` and is never imported into production code.

## Verification commands

```sh
npm run lint
npm run typecheck
npm --prefix client test
npm --prefix server run test:unit
npm --prefix server run test:integration:http
npm --prefix client run test:e2e
```

Install Chromium for Playwright with `npx playwright install --with-deps chromium` in `client/`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects a local browser. CI now runs the browser journey and uploads failed traces.

See `docs/phase-1-verification.md` for the local results and remaining gates.

## Provider references

- [Cashfree Web Checkout](https://www.cashfree.com/docs/payments/online/web/redirect)
- [Cashfree webhook verification](https://www.cashfree.com/docs/payments/online/webhooks/webhook-signature)
- [Cashfree payment and refund API reference](https://www.cashfree.com/docs/api-reference/payments/latest/overview)

The native Medusa contracts were also checked against the installed 2.21.0 source, including single-use password reset, cart completion, payment sessions and order authorization.
