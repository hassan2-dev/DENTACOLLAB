# DentaCollab Deployment Guide (Ubuntu VPS)

## Prerequisites

- Ubuntu 22.04+
- Docker + Docker Compose plugin
- Domain pointing to the VPS (optional but recommended)
- Open ports 80/443

## 1. Clone and configure

```bash
git clone <repo-url> dentacollab
cd dentacollab
cp .env.example .env
# Edit .env with production secrets
```

Required production values:

- Strong `JWT_ACCESS_SECRET`
- Production `DATABASE_URL` / Postgres credentials
- `CORS_ORIGINS` with your public domains, e.g. `https://dentacollab.org,https://www.dentacollab.org,https://admin.dentacollab.org`
- `WEB_PUBLIC_URL` with the public website origin (e.g. `https://dentacollab.org`) — used for Stripe redirects and invoice QR codes. Do **not** leave this as `http://localhost:5173` in production.
- `R2_*` for media storage
- WhatsApp number in settings (`general.whatsapp`) for chatbot handoff

## 2. Build frontends

```bash
corepack enable
pnpm install
pnpm --filter @dentacollab/web build
pnpm --filter @dentacollab/admin build
```

Copy build outputs into volumes or image layers used by Nginx:

- `apps/web/dist` → Nginx web root
- `apps/admin/dist` → Nginx `/admin/`

## 3. Run with Docker Compose

```bash
cd docker
docker compose -f docker-compose.prod.yml up -d --build
```

API runs migrations on startup (`prisma migrate deploy`).

Seed once:

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

## 4. Nginx routes

Configured in `docker/nginx/nginx.conf`:

| Path | Target |
|------|--------|
| `/` | Public website |
| `/admin/` | Admin dashboard |
| `/api/` | NestJS API |
| `/api/docs` | Swagger |

## 5. TLS (Let's Encrypt)

Install certbot on the host or terminate TLS with a reverse proxy in front of the compose stack.

Example with host Nginx + Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dentacollab.com -d www.dentacollab.com
```

## 6. Backups

- PostgreSQL: daily `pg_dump`
- R2/S3: enable versioning/lifecycle
- Keep encrypted copies of `.env` offline

## 7. Health checks

- API: `GET /api/v1/health`
- Swagger: `/api/docs`
- Admin login with super admin account

## 8. Security checklist

- Rotate JWT secrets
- Disable default seed password after first login
- Restrict Postgres port to internal network only
- Set file upload size limits (already 25–32MB)
- Keep dependencies updated (`pnpm outdated`)
