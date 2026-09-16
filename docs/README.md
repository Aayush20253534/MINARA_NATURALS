# MINARA NATURALS Engineering Documentation

This folder is the implementation source of truth for the MINARA NATURALS website and commerce platform.

It converts the approved September 2026 proposal into an engineering plan that can be implemented incrementally without turning the project into a pile of disconnected pages, duplicated business logic, or a custom commerce backend that Medusa already knows how to provide.

## 1. Product definition

MINARA NATURALS is not being treated as a simple brochure website or a small catalogue store. The platform must support four connected business surfaces:

1. **Retail commerce** for fresh produce, groceries, spices, MINARA pickles, pooja samagri, household products, personal-care products, and future categories.
2. **B2B acquisition** for bulk and wholesale buyers such as retailers, hotels, distributors, and institutional buyers.
3. **Export lead generation** for overseas buyers, including destination, quantity, private-label interest, and buyer details.
4. **Franchise acquisition and brand credibility** for Retail, Mini Store, Distribution, Pickle Partner, future outlet models, investors, and business partners.

The same commerce backend must also be capable of serving a future MINARA mobile application. Product, inventory, customer, order, pricing, and account data must therefore live behind a stable API rather than inside the Next.js frontend.

## 2. Current repository baseline

At the time these documents were created, the repository is intentionally close to a blank starting point:

- `client/` is a fresh Next.js 16.3.5 application using React 19.2.8, TypeScript 5, and Tailwind CSS 4.
- `client/src/app/page.tsx` is still the default starter page.
- `client/public/` contains only default Next.js assets.
- `server/` is only a placeholder Node project with Express 5.2.1 and Nodemon. It does **not** implement the approved Medusa architecture yet.
- There is no production database schema, auth, catalogue, cart, checkout, order, admin extension, media pipeline, email workflow, testing setup, or deployment configuration yet.

This is useful. It means the platform can be structured correctly from the beginning instead of preserving accidental architecture.

## 3. Architecture decisions that override the original proposal

The original proposal recommended DigitalOcean for application/database hosting and mentioned Resend or SendGrid for transactional email. The following decisions are now fixed for implementation:

| Concern | Decision |
| --- | --- |
| Storefront hosting | **Vercel** |
| Commerce backend hosting | **Render** |
| Background worker hosting | **Render** |
| Primary database | **Neon PostgreSQL** |
| Transactional email | **Resend** |
| Commerce engine | **Medusa v2** |
| Frontend | **Next.js 16 App Router** |
| Product/media delivery | **Cloudinary**, replacing DigitalOcean Spaces for the initial implementation |
| Redis-compatible runtime dependency | **Render Key Value / Valkey**, required by production Medusa and kept in the same Render region as the backend |

The application should not connect directly from Vercel to Neon for normal commerce operations. The storefront talks to Medusa; Medusa owns commerce persistence.

## 4. Documents in this folder

- [`design.md`](./design.md) defines the visual system, UX principles, responsive behaviour, component rules, page composition, and design acceptance standards.
- [`tech-stack.md`](./tech-stack.md) defines the production architecture, package responsibilities, backend strategy, infrastructure, integrations, security rules, testing, observability, and environment configuration.
- [`phases/README.md`](./phases/README.md) is the implementation roadmap and dependency map.
- Individual files inside `phases/` break the project into implementation parts with deliverables and exit criteria.

## 5. Source-of-truth priority

When requirements conflict, use this order:

1. Latest explicit client instruction.
2. Latest explicit project decision in these docs.
3. Approved MINARA proposal scope.
4. Existing code behaviour, but only after the architecture is established.

Do not preserve starter-code behaviour simply because it already exists.

## 6. Scope assumptions that must not be silently invented

The proposal does not define all business policy. Until the client confirms them, treat these as unresolved rather than guessing:

- exact SKU count and initial category hierarchy;
- tax/GST and invoice requirements;
- shipping zones, pincodes, fees, free-shipping thresholds, delivery windows, and courier provider;
- COD availability and COD rules;
- final payment gateway/provider;
- cancellation, returns, replacements, and refund policy;
- whether ratings are internal, imported, or customer-generated;
- product-review moderation;
- warehouse/location count and inventory-allocation rules;
- exact admin roles and approval permissions;
- franchise approval/post-approval workflow;
- export compliance/document workflow and supported currencies;
- WhatsApp/SMS integration;
- whether customer login remains email/password or adds OTP/social login;
- loyalty, wallet, subscription, referral, or reward features;
- true third-party seller marketplace functionality.

The proposal uses the word “marketplace,” but the described scope currently behaves like a **single-merchant, multi-category MINARA commerce platform**. Do not implement seller onboarding, seller commissions, settlement ledgers, seller dashboards, or marketplace payouts unless they are explicitly added to scope.

## 7. Non-negotiable engineering rules

1. **Medusa owns commerce domain logic.** Do not recreate products, variants, carts, promotions, customers, orders, payments, or inventory in a parallel custom Express API.
2. **The current `server/` placeholder is disposable.** Phase 0 replaces/reinitializes it as the Medusa backend instead of layering Medusa beside unrelated Express code.
3. **Next.js remains the presentation/orchestration layer.** It can compose UI and server-render data, but core commerce state belongs to Medusa.
4. **Custom business verticals are first-class modules.** Bulk inquiries, export inquiries, and franchise applications should have explicit models/workflows instead of being shoved into generic contact-form tables.
5. **No fake content in production.** Ratings, reviews, stock, discount percentages, certifications, achievements, outlet counts, export claims, and testimonials must be real or omitted.
6. **Mobile is a primary target.** Grocery/FMCG shopping must remain fast and usable on average mobile hardware and mobile networks.
7. **Design quality is part of completion.** A route is not “done” merely because it renders and submits data.
8. **Every phase has an exit gate.** Do not stack unfinished later features on an unstable foundation.

## 8. Definition of platform completion

The initial agreed build is complete only when the platform can, at minimum:

- present a polished MINARA-branded storefront;
- browse/search/filter products and categories;
- select product pack-size variants;
- maintain a cart and perform secure checkout through the selected payment provider;
- create and manage customer accounts, addresses, orders, and wishlists;
- expose order tracking/history;
- run the Pooja Samagri vertical;
- capture and administer bulk/wholesale inquiries;
- capture and administer export inquiries;
- present and administer franchise applications;
- manage products, categories, variants, prices, inventory, orders, customers, coupons/promotions, and homepage content from admin tooling;
- store production data in Neon PostgreSQL;
- store product media in Cloudinary and deliver it through Cloudinary CDN URLs;
- send transactional emails through Resend;
- run the Next.js storefront on Vercel;
- run Medusa server and worker processes on Render with a Redis-compatible Render Key Value service;
- pass production QA for mobile, desktop, accessibility basics, SEO, security, and core commerce workflows.
