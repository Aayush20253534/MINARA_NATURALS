# MINARA Commerce Backend

Medusa v2.21 backend for MINARA NATURALS. Core commerce remains inside Medusa; MINARA-specific workflows are added through custom routes/modules without reimplementing products, variants, carts, customers, inventory or orders.

## Local start

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run admin:create -- --email admin@example.com --password '<strong-password>'
npm run seed
npm run dev
```

Admin: `http://localhost:9000/app`
Health: `http://localhost:9000/health`
MINARA diagnostic: `http://localhost:9000/minara/health`
Readiness: `http://localhost:9000/minara/readiness`

## Production process split

Render runs the same build twice:

- API/Admin service: `MEDUSA_WORKER_MODE=server`, `DISABLE_MEDUSA_ADMIN=false`
- background worker: `MEDUSA_WORKER_MODE=worker`, `DISABLE_MEDUSA_ADMIN=true`

Both must receive the same `DATABASE_URL`, `REDIS_URL`, JWT/cookie secrets and provider credentials. Database migrations run only as the web service pre-deploy command.
