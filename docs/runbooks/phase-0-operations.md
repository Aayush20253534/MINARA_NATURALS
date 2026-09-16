# Phase 0 Operations Runbook

This is the operational companion to `docs/phases/00-foundation.md`. Cloud account creation is intentionally left to the project owner; the codebase contains the contracts and deployment configuration.

## 1. Local verification order

1. Use Node 22.12+.
2. `cd server && npm install` (first run regenerates the lockfile that replaced the old Express lock).
3. Create a local PostgreSQL database and copy `.env.example` to `.env`.
4. `npm run db:migrate`.
5. `npm run admin:create -- --email <email> --password '<password>'`.
6. `npm run seed` and copy the emitted publishable key.
7. `cd ../client && npm ci`.
8. Copy `client/.env.example` to `.env.local` and paste the publishable key.
9. Run backend on `:9000` and storefront on `:3000`.
10. Verify `/health`, `/minara/health`, `/minara/readiness`, `/app`, and the storefront connection indicator in development.

## 2. Neon

Create one project per environment. Put the direct PostgreSQL URL in `DATABASE_URL` for Medusa migrations/runtime. Do not expose it to the Next.js client. Before deploying a schema-changing release, run `npm run db:migrate` exactly once through the Render API service pre-deploy command.

Keep a tested restore path. A database backup is not useful merely because a dashboard says the word “backup.”

## 3. Render

The root `render.yaml` declares two services from `server/`:

- `minara-commerce-api`: HTTP + Admin, `MEDUSA_WORKER_MODE=server`.
- `minara-commerce-worker`: background jobs, `MEDUSA_WORKER_MODE=worker`, Admin disabled.

Create a Render Key Value/Valkey instance in the same region and give both services the same `REDIS_URL`. Give both processes the same database/provider secrets. The API service alone runs `db:migrate` before deploy.

After first deployment set `MEDUSA_BACKEND_URL` to the final HTTPS API origin, and update `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS` to the exact Vercel/Admin origins. Never use `*` for production auth CORS.

## 4. Cloudinary

Create a Cloudinary account/product environment and copy the **Cloud name**, **API Key**, and **API Secret** from Cloudinary into both Render Medusa services. Set:

```text
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=minara
```

The code registers a custom Medusa File Module provider when all three required Cloudinary credentials are present. Production intentionally refuses to boot with a partial Cloudinary configuration. The provider uploads through Cloudinary's authenticated Upload API and stores the returned `secure_url` in Medusa. The API secret never belongs in Vercel or browser code.

`POST /admin/minara/uploads` remains the authenticated, MIME/size-limited upload surface for MINARA-specific admin tooling. Allowed Phase 0 image types are JPEG, PNG, WebP, and AVIF. The default maximum is 10 MiB per file, configurable with `MEDIA_MAX_FILE_SIZE_MB`.

No `NEXT_PUBLIC_MEDIA_URL` is required: Medusa returns complete Cloudinary CDN URLs and Next.js is configured to accept `https://res.cloudinary.com/**`.

## 5. Resend

Verify the sending domain in Resend and configure SPF/DKIM there. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` on both Render processes. Set `RESEND_REPLY_TO` if replies should go to a monitored inbox.

For local/staging tests, set `RESEND_DEV_RECIPIENT` and keep `RESEND_ENFORCE_DEV_RECIPIENT=true`; this prevents accidental messages to real customers while developers enthusiastically click buttons.

Run `TEST_EMAIL_TO=<safe-address> npm run email:test` after provider setup. The authenticated Admin endpoint `POST /admin/minara/email/test` is also available for later admin tooling.

## 6. Vercel

Set the Vercel project Root Directory to `client` and configure:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

Use separate values for Preview and Production. Preview deployments must not point at production commerce data unless explicitly intended.

## 7. Production smoke gate

Do not mark Phase 0 operationally complete until all of the following are true:

- API `/health` returns 200 and `/minara/health` returns the MINARA diagnostic contract.
- API `/minara/readiness` reports database ready and provider configuration flags expected for production.
- Admin login works.
- Storefront can read a product through the Store API using the publishable key.
- Worker is running with shared Redis/Valkey.
- An authenticated test upload reaches the Cloudinary CDN.
- A Resend test reaches the controlled test inbox.
- Vercel has no secrets other than intentionally public `NEXT_PUBLIC_*` values.
