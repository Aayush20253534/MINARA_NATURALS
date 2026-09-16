# MINARA NATURALS Technical Architecture and Stack

## 1. Architecture goal

The platform must support a large and growing FMCG catalogue, product variants/pack sizes, customer accounts, cart/checkout/orders, administrative operations, B2B inquiries, export inquiries, franchise applications, and a future mobile application without rebuilding the commerce backend.

The architecture is therefore split into an independently deployable storefront and commerce application.

```text
Customer browser
      |
      v
Vercel
Next.js 16 Storefront
      |
      | HTTPS / Medusa Store APIs
      v
Render Web Service
Medusa v2 Server + Admin
      |            |            \
      |            |             \--> Resend
      |            |                  transactional email
      |            |
      |            +--> Render Key Value / Valkey
      |                 cache, event/job infrastructure
      |
      +--> Neon PostgreSQL
      |    commerce + custom module data
      |
      +--> Cloudinary
           product/brand media

Render Background Worker
Medusa v2 Worker
      |--> Neon PostgreSQL
      |--> Render Key Value / Valkey
      |--> Resend / other providers as workflows require
```

The future mobile app should call the same Medusa APIs used by the web storefront.

---

## 2. Repository strategy

Keep the existing top-level separation:

```text
/
├── client/     # Next.js storefront
├── server/     # Medusa application, admin customizations, modules, workflows
└── docs/       # implementation source of truth
```

### Current `server/` warning

The existing `server/package.json` only contains Express and Nodemon. Do not build commerce on top of it.

During Phase 0:

1. back up any future non-starter work if needed;
2. reinitialize `server/` as a Medusa v2 application;
3. retain the folder name so deployment paths remain simple;
4. move MINARA-specific backend logic into Medusa modules/workflows/API routes/admin extensions;
5. remove the standalone Express placeholder unless a later requirement genuinely needs an independent service.

Medusa itself provides the HTTP application layer. A parallel Express commerce API would create two competing sources of truth.

---

## 3. Frontend stack

### Core

- **Next.js 16.3.5**
- **React 19.2.8**
- **TypeScript 5**
- **Tailwind CSS 4**
- **App Router**

These are already initialized in `client/` and should remain pinned/controlled rather than casually upgraded during active feature work.

### Next.js implementation rules

The repository includes an `AGENTS.md` warning that Next.js 16 contains breaking changes. Before implementing framework-sensitive behaviour, consult the installed Next.js documentation under `node_modules/next/dist/docs/` rather than assuming older Next.js APIs.

Use:

- Server Components by default;
- Client Components only for interaction/state that actually requires the browser;
- route-level `loading.tsx`, `error.tsx`, and `not-found.tsx` where appropriate;
- Metadata API for page SEO;
- `sitemap`/`robots` support;
- `next/image` for responsive product/brand media;
- `next/font` for approved font loading;
- URL search params for shareable catalogue filters where practical;
- server-side fetching/caching strategies that match commerce freshness requirements.

Do not put business secrets or private backend credentials in `NEXT_PUBLIC_*` variables.

### Suggested frontend packages

Add only when the corresponding feature is implemented:

- Medusa JS SDK or typed API client generated around Medusa endpoints;
- `lucide-react` for consistent SVG icons;
- accessible primitive library such as Radix/shadcn components where they save time, but style them to MINARA rather than shipping stock component-library appearance;
- React Hook Form + Zod for large client-side forms if the form complexity justifies them;
- Playwright for end-to-end commerce journeys;
- frontend unit/component test tooling selected during Phase 0, preferably Vitest + React Testing Library for isolated UI logic.

Avoid adding a global state library by reflex. Cart/customer state should primarily follow Medusa’s commerce model and server data. Add Zustand or equivalent only when a concrete cross-route client-state problem exists.

---

## 4. Commerce backend: Medusa v2

Medusa is the commerce engine and primary backend.

Use Medusa for:

- products;
- product variants / pack sizes;
- product categories and collections;
- prices and currencies;
- inventory;
- regions/sales channels as needed;
- customers;
- addresses;
- carts;
- promotions/coupons;
- payment sessions/providers;
- orders;
- fulfillment/shipping integration points;
- returns/refunds if added to confirmed policy;
- admin base;
- workflows, events, and background jobs.

### Product variants

Pack sizes such as `250g`, `500g`, `1kg`, `5kg`, and `Bulk` should be modeled as real product variants/options, not as arbitrary frontend labels.

Each sellable variant can have its own:

- SKU;
- price;
- inventory;
- barcode if supplied;
- weight/measure metadata;
- availability;
- media/metadata if necessary.

### Product metadata

Fields like ingredients, shelf life, storage instructions, and origin may initially be represented using structured metadata or a custom product-extension model. Prefer structured fields for anything that must later be filtered, validated, translated, or displayed consistently.

Do not store every PDP section as an uncontrolled HTML blob.

---

## 5. Custom MINARA backend modules

Not every requirement belongs in Medusa core commerce tables. Create explicit custom modules for business-specific workflows.

### 5.1 Bulk/Wholesale Inquiry module

Suggested entity:

```text
BulkInquiry
- id
- status
- company_name
- contact_name
- email
- phone
- city
- state
- buyer_type
- requirements
- estimated_quantity / volume (when confirmed)
- source_page
- created_at
- updated_at
```

Add relations/structured line items only if the final form allows users to select products/variants.

Suggested statuses:

```text
new -> reviewing -> contacted -> qualified -> won / closed / rejected
```

Final statuses are business policy and can be simplified after client review.

### 5.2 Export Inquiry module

Required concepts from the proposal:

```text
ExportInquiry
- id
- status
- buyer/company details
- contact details
- destination_country
- quantity / expected volume
- private_label_interest
- product/category interest
- notes/requirements
- created_at
- updated_at
```

Do not model export inquiries as ordinary retail orders unless the client later defines a direct international checkout flow.

### 5.3 Franchise module

Suggested models:

```text
FranchiseApplication
- id
- application_reference
- status
- applicant/contact details
- franchise_model
- preferred_state
- preferred_city
- preferred_district
- business/experience fields
- investment/readiness fields only if client confirms them
- notes
- created_at
- updated_at

FranchiseLocation (later/approved)
- id
- franchise_model
- state
- city
- district
- address
- coordinates if needed
- status
- public_visibility
```

The data model must be able to grow to the proposal’s State > City > District franchise hierarchy without a redesign.

### 5.4 Homepage/content configuration

Avoid hardcoding every campaign banner and homepage rail forever.

Use one of these strategies:

1. Medusa/admin-managed custom content records for banners, section ordering, and featured product references; or
2. a deliberately small code/config layer for Phase 1, upgraded to admin-managed content in Phase 2.

Do not introduce a full CMS unless content requirements genuinely need one.

---

## 6. Database: Neon PostgreSQL

### Role

Neon is the production PostgreSQL provider for both Medusa core data and custom modules.

### Connection strategy

The Medusa backend and worker are long-running Render services, not serverless functions. Start with a **direct Neon PostgreSQL connection** for Medusa runtime and migrations unless testing proves a pooled URL is beneficial and fully compatible with the selected Medusa/MikroORM version.

Neon supports pooled connections through PgBouncer, but schema migrations and tools may require or behave more predictably with direct connections. Keep the architecture explicit:

```text
DATABASE_URL=<direct Neon connection used by Medusa/migrations>
DATABASE_POOL_URL=<optional pooled URL reserved for workloads verified to support it>
```

The Vercel storefront should not receive either database URL.

### Database rules

- migrations are source-controlled;
- no manual production schema changes without a migration or documented emergency procedure;
- use separate production and non-production database branches/projects as appropriate;
- seed scripts contain non-sensitive development/demo data only;
- production data imports are idempotent or checkpointed;
- catalogue import must validate SKU/variant uniqueness;
- use database indexes for known lookup/filter fields after query patterns are established;
- never store raw payment-card data.

---

## 7. Redis-compatible service: Render Key Value / Valkey

Production Medusa expects a Redis-compatible service for its runtime architecture, including session/event/job/background concerns.

Provision a Render Key Value instance in the **same Render region** as the Medusa server and worker.

Use the internal connection URL where possible:

```text
REDIS_URL=<Render Key Value internal URL>
```

For job/event reliability, use a persistence/eviction configuration appropriate to non-disposable queue data. Do not configure an aggressive cache-eviction policy for a queue and then act surprised when work vanishes. Computers remain annoyingly literal.

---

## 8. Product/media delivery: Cloudinary

The original proposal expects a large image catalogue with roughly 7–8 images per SKU. For the initial implementation, Cloudinary replaces DigitalOcean Spaces so MINARA can use managed image storage, CDN delivery, and image transformations without maintaining an S3-compatible bucket.

Medusa's File Module is configured with a **custom Cloudinary provider** implemented inside `server/src/modules/cloudinary`. The provider uses Cloudinary's server-side authenticated Upload API; no Cloudinary secret is exposed to the storefront. Medusa stores the provider key and the complete Cloudinary `secure_url` returned after upload.

Store:

- product media;
- category/banner assets;
- franchise/outlet media;
- brand/story images where admin upload is required.

Rules:

- never commit production product photography into the application repository;
- use generated Cloudinary public IDs under `CLOUDINARY_FOLDER`, not raw user filenames as durable identifiers;
- validate upload MIME/type/size before invoking the File Module;
- keep `CLOUDINARY_API_SECRET` strictly backend-only;
- use Cloudinary's returned HTTPS CDN URLs for public delivery;
- delete Cloudinary assets when admin removes/replaces managed media;
- preserve accessible alt text separately from the file itself;
- use Cloudinary/Next.js image optimization deliberately rather than stacking unnecessary transformations;
- the Phase 0 provider intentionally handles authenticated server-side uploads rather than browser-direct presigned uploads.

Environment variables:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=minara
MEDIA_MAX_FILE_SIZE_MB=10
```

The storefront does not need a Cloudinary secret or a `NEXT_PUBLIC_MEDIA_URL`; product/image records carry complete Cloudinary URLs. `client/next.config.ts` allowlists `res.cloudinary.com`.

## 9. Transactional email: Resend

Resend is the only planned transactional email provider for the initial build.

Potential transactional messages:

- account verification/reset if auth flow needs them;
- order confirmation;
- order status/fulfillment notifications;
- inquiry acknowledgements;
- franchise application acknowledgement;
- internal lead notifications where approved.

### Email architecture

Create a backend email service/provider wrapper. Business workflows call an internal function/event, not `resend.emails.send()` scattered across controllers.

Benefits:

- centralized templates;
- consistent from/reply-to addresses;
- retry/logging strategy;
- easier provider change if needed;
- test stubs in non-production environments.

### Domain setup

Before production send:

- verify a MINARA-owned sending domain/subdomain;
- configure SPF and DKIM records supplied by Resend;
- add DMARC after SPF/DKIM are correct;
- use a dedicated sending subdomain if suitable for reputation isolation;
- never use a personal developer address as the production sender.

Environment variable:

```text
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=minara
```

Do not expose `RESEND_API_KEY` to Next.js client code.

---

## 10. Payments

The proposal requires multiple payment options but does not name a gateway.

Therefore:

- provider is **TBD** until client confirmation;
- integrate through Medusa’s payment provider/module abstraction;
- do not build provider-specific UI deep into generic components;
- do not store raw card details;
- payment webhooks must be verified and idempotent;
- order/payment state transitions must be server-controlled;
- COD should only appear if client confirms it;
- UPI/cards/net-banking/wallet labels should reflect the capabilities of the final gateway rather than being fake UI.

A payment provider decision is a Phase 1 checkout blocker and should be resolved before checkout is called production-ready.

---

## 11. Shipping and fulfillment

Shipping policy/provider is currently unspecified.

Build an abstraction boundary, not fabricated policy.

Phase 1 may support a simple configured fulfillment option for integration testing, but production requires confirmation of:

- serviceable pincodes/regions;
- shipping fee rules;
- free-delivery thresholds;
- weight/quantity constraints;
- delivery estimates;
- courier/aggregator integration;
- tracking source;
- COD eligibility if relevant.

Do not hardcode “Free delivery across India” unless the client explicitly provides that policy.

---

## 12. Authentication and authorization

### Customers

Use Medusa customer/auth capabilities as the base.

Minimum approved scope:

- registration/login;
- customer profile;
- saved addresses;
- order history;
- wishlist implementation.

Email/password is the safest baseline unless the client confirms OTP/social authentication. The proposal references transactional email including OTP, but it does not fully define an OTP login requirement.

### Administrators

Use Medusa Admin authentication and permissions/capabilities. Custom inquiry/franchise admin routes must never rely solely on frontend hiding for authorization.

Exact department/admin-role policy is not currently defined for MINARA. Add granular roles only after requirements exist.

---

## 13. Wishlist

Wishlist is required by the proposal but is not a reason to create another commerce backend.

Recommended model:

```text
Wishlist
- id
- customer_id
- created_at

WishlistItem
- wishlist_id
- product_id or variant_id (choose based on UX)
- created_at
```

If the UI wishes a product independent of pack size, reference product. If the user wishes a specific pack/variant, reference variant. Decide once the product UX is final.

Guest wishlist persistence is optional unless explicitly requested.

---

## 14. Search and filtering

Initial implementation should use Medusa/PostgreSQL capabilities and indexed server-side filtering.

Required filters:

- price;
- brand;
- pack size;
- rating if real reviews exist;
- availability;
- category/subcategory;
- text search.

Do not introduce Elasticsearch/Algolia/Meilisearch on day one merely to look architectural. Add a dedicated search engine only when catalogue size, typo tolerance, ranking, facets, or measured query performance justify it.

Search/filter state should be reflected in URLs where practical for shareability and SEO-safe navigation.

---

## 15. SEO stack

Next.js handles SEO presentation.

Implement:

- page-specific metadata;
- product/category canonical URLs;
- Open Graph/Twitter metadata;
- sitemap generation for public catalogue routes;
- robots configuration;
- breadcrumb structured data;
- Product structured data where data is valid;
- Organization/WebSite structured data after official company details exist;
- noindex for cart, checkout, account, admin, and other private/utility routes;
- server-rendered product/category content.

Do not emit fake review aggregate schema without genuine review data.

---

## 16. Analytics and consent

Analytics vendor is not specified in the proposal.

Create an instrumentation boundary so an approved analytics tool can later record:

- product view;
- category view;
- search;
- add/remove cart;
- begin checkout;
- purchase;
- bulk inquiry submit;
- export inquiry submit;
- franchise application start/submit.

Do not add invasive third-party tracking before the client chooses tooling and privacy policy/consent requirements are clear.

---

## 17. Testing strategy

### Frontend

Minimum layers:

- typecheck;
- ESLint;
- unit tests for pricing/formatting/filter utilities;
- component tests for complex forms and variant selectors;
- Playwright E2E for critical customer journeys.

Critical Playwright flows:

1. browse category -> product -> select pack -> add cart;
2. update/remove cart item;
3. registration/login;
4. checkout happy path using payment sandbox/test provider;
5. view order history/order details;
6. wishlist add/remove;
7. bulk inquiry submit;
8. export inquiry submit;
9. franchise application submit;
10. mobile navigation/search/filter interactions.

### Backend

Use Medusa’s official testing utilities and Jest for:

- custom modules;
- API routes;
- workflows;
- inquiry state transitions;
- franchise application persistence;
- payment/shipping integration adapters;
- authorization on custom admin endpoints;
- webhook idempotency.

### Production smoke tests

After every production deploy, validate:

- storefront homepage;
- category/product fetch;
- backend `/health`;
- admin login;
- database connectivity;
- Redis/Key Value connectivity through actual workflow behaviour;
- media URL delivery;
- Resend test/transactional path;
- cart creation;
- payment provider health when configured.

---

## 18. Deployment architecture

### 18.1 Vercel: `client/`

Configure Vercel project root as `client/`.

Responsibilities:

- Next.js builds;
- edge/CDN delivery;
- SSR/RSC execution;
- preview deployments;
- production custom domain.

Typical public environment values:

```text
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.<domain>
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<if required by selected Medusa setup>
NEXT_PUBLIC_SITE_URL=https://www.<domain>
```

Only values safe for browsers use `NEXT_PUBLIC_`.

### 18.2 Render: Medusa server

Deploy `server/` as a Render Web Service.

Production responsibilities:

- Medusa Store API;
- Medusa Admin/API;
- auth;
- commerce workflows;
- custom MINARA APIs;
- webhooks.

Set a Render HTTP health check against Medusa’s health endpoint.

Representative environment variables:

```text
NODE_ENV=production
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
COOKIE_SECRET=
STORE_CORS=
ADMIN_CORS=
AUTH_CORS=
MEDUSA_BACKEND_URL=
MEDUSA_WORKER_MODE=server
DISABLE_MEDUSA_ADMIN=false
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=minara
```

Keep `server/.env.example` authoritative for Cloudinary provider configuration.

### 18.3 Render: Medusa worker

Deploy a second Render service from the same `server/` codebase in worker mode.

Representative differences:

```text
MEDUSA_WORKER_MODE=worker
DISABLE_MEDUSA_ADMIN=true
```

The worker shares Neon and Render Key Value with the server.

Do not route public traffic to the worker.

### 18.4 Render Key Value

Provision in the same region as the server/worker and provide its internal URL as `REDIS_URL`.

### 18.5 Neon

Keep database credentials only in Render/server-side developer environments. Vercel does not need a direct database credential for the normal storefront architecture.

---

## 19. Environment separation

At minimum maintain:

- local development;
- preview/staging where practical;
- production.

Do not allow preview deployments to mutate production orders or use production payment credentials.

Suggested principle:

```text
Vercel Preview -> non-production Medusa environment
Vercel Production -> production Medusa environment
```

Use different secrets and ideally a different Neon branch/database for non-production testing.

---

## 20. Security baseline

- secrets only in environment management, never committed;
- `.env*` ignored except sanitized `.env.example`;
- CORS locked to known storefront/admin origins;
- validate all custom API inputs server-side;
- rate-limit sensitive public mutation endpoints where appropriate;
- never trust price, discount, stock, order total, or status from the browser;
- sanitize/validate uploaded files;
- verify payment webhooks;
- make inquiry/admin endpoints permission-aware;
- use secure random `JWT_SECRET` and `COOKIE_SECRET`;
- secure cookies in production;
- no customer PII in console logs;
- structured error responses without leaking stack traces/secrets;
- dependencies scanned/updated intentionally;
- backups/recovery for production database and important uploaded media;
- security headers configured at frontend/backend deployment layers.

---

## 21. Observability

Initial observability should remain simple but useful:

- Render service logs for backend/worker;
- Vercel deployment/function logs for storefront;
- structured backend logs with request/correlation identifiers where practical;
- error logging for workflow failures;
- health endpoint monitoring;
- Resend delivery/bounce monitoring;
- Neon query/connection monitoring;
- Render Key Value memory/connection monitoring.

An external error tracker such as Sentry can be added once approved; it is not assumed by the proposal.

---

## 22. Data import strategy

Product data upload is the major schedule variable identified in the proposal.

Do not make Phase 4 a manual copy-paste marathon.

Create an import format for products with explicit validation for:

- product title;
- handle/slug;
- category/subcategory;
- brand;
- description;
- ingredients;
- shelf life;
- storage;
- origin;
- variant/pack name;
- SKU;
- price/MRP;
- inventory;
- image URLs/files;
- optional tags/featured flags.

Importer requirements:

- dry-run validation;
- row-level error report;
- idempotent update strategy where possible;
- duplicate SKU detection;
- deterministic category mapping;
- image upload/relinking;
- clear success/failure totals.

Do not directly manipulate Medusa tables with ad-hoc SQL for normal catalogue imports.

---

## 23. CI and quality gates

Before merge/deploy, run the equivalent of:

```text
client:
- npm ci
- npm run lint
- npm run typecheck   # add script
- npm run test        # once configured
- npm run build

server:
- npm ci
- npm run build
- npm run test:unit
- npm run test:integration:modules
- npm run test:integration:http
```

Not every integration suite must run on every tiny local edit, but production releases must not bypass core backend tests.

---

## 24. Technical decisions intentionally deferred

Do not decide these invisibly inside implementation commits:

- payment gateway;
- shipping/courier provider;
- exact review/rating system;
- OTP/social login;
- analytics vendor;
- SMS/WhatsApp provider;
- CMS beyond lightweight homepage management;
- dedicated search engine;
- multi-warehouse strategy;
- true seller marketplace functionality;
- loyalty/referral/wallet/subscription features;
- ERP/accounting integration.

When one becomes required, document the ADR/decision before coupling multiple modules to it.
