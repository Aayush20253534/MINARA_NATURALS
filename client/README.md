# MINARA Storefront

Next.js 16 storefront foundation for MINARA NATURALS.

## Local setup

```bash
cp .env.example .env.local
npm ci
npm run dev
```

The Medusa API defaults to `http://localhost:9000`. After running the backend seed, copy its publishable API key into `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

## Vercel

Set the project root directory to `client` and configure the variables from `.env.example` separately for Preview and Production. Only `NEXT_PUBLIC_*` values belong in the storefront environment; database, Resend and Cloudinary credentials belong exclusively on Render.

## Quality

```bash
npm run lint
npm run typecheck
npm run build
```
