# MINARA NATURALS Platform

Production foundation for the MINARA NATURALS commerce platform.

## Architecture

- `client/` — Next.js 16 storefront deployed on Vercel.
- `server/` — Medusa v2 commerce API and Admin deployed on Render.
- Neon PostgreSQL — source of truth for commerce and customer data.
- Render Key Value / Valkey — production events, workflows, cache, locks and sessions.
- DigitalOcean Spaces + CDN — production product/media storage.
- Resend — transactional email.

The application is intentionally configured so local development can boot without Spaces, Redis, or Resend. Production configuration fails closed for required secrets and swaps in the external providers when their environment variables are present.

## Runtime

Use Node `22.12.0` or a newer compatible Node 22/24 release. The repository ships `.nvmrc` and `.node-version`.

## First local setup

1. Install the frontend dependencies:
   `cd client && npm ci`
2. Install the Medusa dependencies:
   `cd ../server && npm install`
3. Copy `server/.env.example` to `server/.env` and set a local PostgreSQL `DATABASE_URL`.
4. Run `npm run db:migrate` from `server/`.
5. Create an administrator with `npm run admin:create -- --email you@example.com --password '<strong-password>'`.
6. Run `npm run seed` to create the deterministic development catalogue and a publishable API key.
7. Copy `client/.env.example` to `client/.env.local` and put the generated publishable key in `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.
8. Start the backend with `npm run dev` in `server/` and the storefront with `npm run dev` in `client/`.

Medusa Admin is served from `http://localhost:9000/app`; Medusa health is `http://localhost:9000/health`; the storefront defaults to `http://localhost:3000`.

## External services

No API key or cloud resource belongs in Git. Create the services yourself and add secrets directly to Render/Vercel:

- Neon: `DATABASE_URL`
- Render Key Value: `REDIS_URL`
- DigitalOcean Spaces: all `SPACES_*` values in `server/.env.example`
- Resend: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Vercel: all `NEXT_PUBLIC_*` values in `client/.env.example`

See `docs/runbooks/phase-0-operations.md` for deployment order, migrations, smoke checks and provider validation.

## Quality commands

From the repository root:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run check`

The server lockfile from the original Express placeholder is intentionally removed. Run `npm install` in `server/` once after applying the Phase 0 patch to generate the Medusa lockfile, then commit that lockfile before deployment.
