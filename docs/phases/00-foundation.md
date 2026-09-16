# Phase 0 — Foundation and Architecture

## Goal

Turn the starter repository into a stable foundation for the approved architecture before feature development begins.

Phase 0 produces no fake “finished store.” Its output is the system that later phases can build on without changing fundamental assumptions.

---

## Part 0.1 — Repository and runtime baseline

### Tasks

- inspect the installed Next.js 16 documentation required by `client/AGENTS.md`;
- pin/record supported Node version for local, Vercel, and Render environments;
- add root development documentation/commands if needed;
- standardize package-manager usage (`npm`, because lockfiles are already npm-based);
- add `typecheck` scripts;
- add sanitized `.env.example` files to client/server after backend initialization;
- verify root `.gitignore` covers environment files and generated artifacts;
- decide whether root workspace scripts are useful or whether client/server remain independent.

### Exit criteria

- clean install works for both projects;
- `client` lint/typecheck/build passes;
- runtime version is explicit rather than provider-default drift;
- no secret is committed.

---

## Part 0.2 — Reinitialize `server/` as Medusa v2

### Tasks

- remove the placeholder Express-only backend;
- initialize a Medusa v2 application in `server/`;
- configure TypeScript and Medusa config;
- connect local/dev PostgreSQL;
- configure Redis-compatible development dependency/service;
- confirm Medusa Admin loads;
- confirm Store API health/basic catalogue call;
- install/configure Medusa testing utilities and Jest;
- add seed script with a tiny deterministic dev catalogue.

### Important rule

Do not create a parallel custom Express API for commerce. Any custom MINARA API should be a Medusa API route/workflow/module unless there is a documented architectural reason otherwise.

### Exit criteria

- `npm run dev`/Medusa development command works;
- Admin can authenticate locally;
- health endpoint returns healthy;
- local database migrations run cleanly;
- basic seed succeeds;
- backend build passes;
- one example backend integration test passes.

---

## Part 0.3 — Neon database setup

### Tasks

- create non-production Neon database/branch;
- define production database provisioning procedure;
- configure direct `DATABASE_URL` for Medusa;
- keep optional pooled URL separate if later required;
- run Medusa migrations;
- document migration/rollback procedure;
- test seed/import in non-production;
- confirm no client-side code receives database credentials.

### Exit criteria

- Medusa connects to Neon reliably;
- migrations work using the selected connection mode;
- a fresh environment can be recreated from migrations + seed;
- production and development credentials are separated.

---

## Part 0.4 — Render backend, worker, and Key Value skeleton

### Tasks

- create Render Web Service for Medusa server;
- create Render worker deployment from the same backend codebase;
- provision Render Key Value/Valkey in the same region;
- configure `REDIS_URL` using internal connectivity;
- configure server/worker Medusa mode separately;
- configure health-check path on the web service;
- configure environment variables and CORS placeholders;
- verify deployment from Git branch.

### Exit criteria

- backend deploys on Render;
- `/health` is healthy;
- worker starts without serving public traffic;
- both services connect to Neon and Key Value;
- Admin is reachable only through intended backend URL and CORS config.

---

## Part 0.5 — Vercel storefront skeleton

### Tasks

- connect `client/` as the Vercel project root;
- set production/preview environment variable structure;
- configure Medusa backend URL;
- replace starter metadata/title/favicon placeholders with MINARA placeholders until final brand assets arrive;
- prove storefront can fetch from the deployed non-production Medusa API;
- configure preview -> non-production backend mapping.

### Exit criteria

- Vercel preview deploy passes;
- deployed storefront can read a sample product/category from backend;
- no production database secret exists in Vercel;
- preview does not mutate production data.

---

## Part 0.6 — DigitalOcean Spaces media provider

### Tasks

- create/configure object storage bucket and CDN;
- wire an S3-compatible Medusa file provider;
- implement environment variable contract;
- test upload/delete from Admin;
- confirm public CDN delivery;
- add file size/type validation;
- confirm frontend image host configuration for approved CDN domain.

### Exit criteria

- product image uploaded through backend/admin is delivered from CDN;
- private write credentials remain backend-only;
- deleting/replacing an image behaves predictably.

---

## Part 0.7 — Resend email foundation

### Tasks

- create email service wrapper/provider inside backend;
- add Resend env variables;
- create a base email layout/template system;
- implement non-production recipient safeguards if necessary;
- send a development/test email;
- document production SPF/DKIM/DMARC setup and sending-domain requirement.

### Exit criteria

- backend can send a test transactional email;
- API key is backend-only;
- email errors are logged without leaking secrets/customer data;
- templates are centralized rather than embedded randomly in routes.

---

## Part 0.8 — Frontend design foundation

### Tasks

- replace starter page/styles;
- define CSS design tokens from `docs/design.md`;
- configure typography;
- create container/section primitives;
- create button/input/badge/card/skeleton/dialog/drawer primitives;
- implement responsive site header/navigation/search shell;
- implement footer shell;
- create global error/loading/not-found visual patterns;
- add icon strategy.

### Do not yet

- fill the homepage with fake products;
- create hardcoded duplicate product-card implementations;
- add unapproved stats/certifications/testimonials.

### Exit criteria

- desktop/mobile shell is polished;
- primitives have focus/disabled/loading states;
- no default Next/Vercel visuals remain;
- design tokens are centralized;
- base accessibility checks pass.

---

## Phase 0 gate

Do not begin full Phase 1 until:

- Next.js frontend is deployed to Vercel preview;
- Medusa server + Admin are deployed on Render;
- worker is running on Render;
- Neon is connected;
- Render Key Value is connected;
- Spaces media upload works;
- Resend test email works;
- storefront can fetch from backend;
- shared design primitives exist;
- lint/typecheck/build pass.
