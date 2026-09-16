# Phase 4 — Catalogue Import, QA, Production Hardening, and Go-Live

This phase corresponds to the proposal’s product-data upload, QA, testing, and go-live stage.

It must not become “upload whatever we have and fix production later.” Catalogue quality, infrastructure, content, and transaction safety are part of launch readiness.

---

## Part 4.1 — Product data intake contract

### Obtain from client

- complete or launch-scope product spreadsheet;
- product images, ideally mapped deterministically to SKU/product;
- category/subcategory mapping;
- pack sizes;
- SKU/barcode where available;
- selling price/MRP;
- opening inventory or inventory policy;
- descriptions;
- ingredients;
- shelf life;
- storage;
- origin/source;
- brand;
- tax/GST classification if required by checkout/invoice design;
- flags for featured/popular/MINARA-owned collections if business wants them.

### Create canonical import template

Do not repeatedly translate arbitrary spreadsheet layouts by hand. Create one documented import schema and a mapping step for client files.

### Exit criteria

- required vs optional columns are explicit;
- client data can be validated before touching production;
- image mapping strategy is deterministic.

---

## Part 4.2 — Import tooling

### Tasks

Build a script/workflow that can:

1. parse input;
2. validate every row;
3. report errors without partially corrupting catalogue state;
4. map/create categories;
5. create/update products;
6. create/update variants;
7. upload/associate images;
8. set pricing;
9. set inventory;
10. produce import summary.

### Safety requirements

- dry-run mode;
- duplicate SKU detection;
- idempotent update behaviour or explicit “create-only/update” mode;
- deterministic handles/slugs;
- row-level error messages;
- no raw SQL shortcut into Medusa internal tables;
- backup/checkpoint before large production import.

### Exit criteria

- representative full import works in staging;
- rerun behaviour is understood and tested;
- errors identify the source row/SKU.

---

## Part 4.3 — Full content population

Populate and verify:

- categories/subcategories;
- products/variants;
- product images;
- descriptions/metadata;
- homepage banners;
- featured/popular rails;
- pooja content;
- wholesale content;
- export content;
- franchise content;
- company/about/contact content;
- policies/legal pages supplied by client.

### Content QA

Check:

- spelling/casing;
- pack sizes;
- product/variant price mismatch;
- missing images;
- duplicate handles/SKUs;
- broken aspect ratios;
- placeholder text;
- unsupported claims;
- inaccessible image alt text;
- broken internal links.

---

## Part 4.4 — Production integration configuration

### Vercel

- production domain;
- production backend URL;
- public keys only;
- environment separation;
- analytics only if approved;
- deployment protection/preview settings as appropriate.

### Render

- production server service;
- production worker service;
- health checks;
- explicit Node runtime version;
- production environment variables;
- production CORS origins;
- safe logs;
- deploy commands/migrations verified.

### Neon

- production database;
- backups/recovery expectations;
- direct connection configuration;
- migration performed before app cutover;
- monitoring baseline.

### Render Key Value

- production instance;
- same region as backend/worker;
- persistence/eviction configured for Medusa workloads;
- memory monitoring.

### Cloudinary

- production Cloudinary product environment;
- `CLOUDINARY_CLOUD_NAME`, API key, and API secret configured on Render;
- API secret backend-only;
- media folder convention confirmed;
- public `res.cloudinary.com` delivery verified;
- upload/delete smoke test completed.

### Resend

- production sending domain/subdomain;
- SPF;
- DKIM;
- DMARC policy appropriate to client domain posture;
- production sender/reply-to;
- bounce/delivery monitoring.

### Payments/shipping

- production gateway keys/webhooks;
- shipping production credentials/rules;
- sandbox/test credentials removed from production;
- webhook endpoints publicly reachable and verified.

---

## Part 4.5 — Functional QA matrix

### Retail

- homepage links;
- categories;
- search;
- every filter;
- sort;
- PDP variant switching;
- stock states;
- cart add/update/remove;
- promotion code;
- login/register/reset if enabled;
- addresses;
- checkout;
- payment success/failure/retry;
- order confirmation;
- order history/detail;
- wishlist.

### Business workflows

- bulk inquiry submit/admin/update;
- export inquiry submit/admin/update;
- franchise application submit/admin/update;
- acknowledgement/internal emails.

### Admin

- product/category CRUD;
- variant pricing;
- inventory update;
- order/customer access;
- promotion handling;
- homepage banner handling;
- custom inquiry/application permissions.

### Failure cases

- backend unavailable;
- image missing;
- email provider error;
- payment webhook duplicate;
- stale cart stock;
- invalid form payload;
- expired promotion;
- unauthorized resource access;
- empty catalogue/category.

---

## Part 4.6 — Responsive and browser QA

Test representative widths rather than only “desktop” and “mobile” labels:

- 320px;
- 360/375px;
- 390/430px;
- 768px;
- 1024px;
- 1280/1366px;
- 1440px+.

Test current major browsers supported by the project, at minimum Chromium-based desktop/mobile plus Safari/WebKit coverage through real device or Playwright where possible.

Check:

- nav/menu;
- search;
- product grids;
- image galleries;
- filter drawer;
- sticky CTAs;
- cart drawer/page;
- checkout forms;
- account navigation;
- B2B/export/franchise forms;
- admin custom views.

No horizontal scroll should survive unnoticed because one decorative image fancied a career outside its container.

---

## Part 4.7 — Accessibility, SEO, and performance QA

### Accessibility

- keyboard navigation;
- visible focus;
- labels/error associations;
- dialog/drawer focus management;
- contrast;
- image alt text;
- semantic page structure;
- reduced motion.

### SEO

- title/description;
- canonical;
- sitemap;
- robots;
- product/category indexing;
- private routes noindex;
- structured data correctness;
- Open Graph images;
- 404 behaviour;
- redirects for changed handles if needed.

### Performance

- homepage LCP;
- product/category image payload;
- CLS;
- INP/interactivity;
- server response time;
- cache behaviour;
- no massive client JS bundle introduced by decorative libraries.

---

## Part 4.8 — Security and privacy release check

- secrets not committed;
- production env values scoped correctly;
- CORS restricted;
- auth/authorization verified;
- payment webhook signatures checked;
- customer-resource isolation tested;
- admin custom routes protected;
- rate limiting/abuse protections on public forms;
- file upload validation;
- error responses do not leak internals;
- PII absent from routine logs;
- privacy/terms/refund/shipping policies published when supplied;
- backups/recovery plan known by the team.

---

## Part 4.9 — Go-live runbook

Suggested release sequence:

1. freeze production catalogue input for cutover window;
2. backup/check Neon state;
3. run final migrations;
4. run/import validated catalogue;
5. verify product/image counts;
6. deploy Render worker;
7. deploy Render server;
8. verify backend health/Admin;
9. deploy Vercel production storefront;
10. switch/verify domains and DNS;
11. run production smoke tests;
12. place one controlled real transaction if client/payment policy allows;
13. verify Resend delivery;
14. verify order in Admin/account;
15. monitor logs/errors/DB/Key Value for the launch window.

Have an explicit rollback plan before changing DNS or making payment production keys active.

---

## Part 4.10 — Handover and first-three-month support readiness

The proposal includes three months of bug fixes, security updates, minor content/text/image changes, and admin onboarding under the initial arrangement.

Handover should include:

- admin login/setup procedure;
- product/variant/inventory guide;
- order workflow guide;
- coupon/banner guide;
- bulk/export/franchise inquiry guide;
- deployment ownership/access list;
- environment-variable ownership without sharing secrets in docs;
- domain/DNS ownership;
- backup/recovery notes;
- support issue severity definitions;
- list of explicitly out-of-scope future features.

## Final launch gate

Production launch is approved only when:

- critical E2E tests pass;
- payment/shipping production configuration is verified;
- catalogue quality checks pass;
- all required policy/contact/company content exists;
- production email authentication is verified;
- no P0/P1 defect remains open;
- backend/worker/database/Key Value monitoring is healthy;
- mobile storefront is usable;
- client/admin team can operate core Admin workflows;
- rollback/recovery path is known.
