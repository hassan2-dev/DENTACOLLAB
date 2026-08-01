# DentaCollab

منصة أكاديمية متكاملة لـ **Digital Dentistry** تتضمن موقعاً عاماً، لوحة تحكم، وREST API.

## Tech Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, TanStack Query, React Hook Form, Zod, Framer Motion, React Router
- Backend: NestJS, Prisma, PostgreSQL, JWT + RBAC, Swagger
- Storage: Cloudflare R2
- Deploy: Docker, Nginx, Ubuntu VPS

## Monorepo

```
apps/web      الموقع العام (RTL)
apps/admin   لوحة التحكم
apps/api     NestJS REST API
packages/ui  Design System
packages/shared  Zod schemas مشتركة
```

## Quick Start

### 1) المتطلبات

- Node.js 22+
- pnpm 9+
- Docker (لـ PostgreSQL)

### 2) التثبيت

```bash
pnpm install
cp .env.example apps/api/.env
docker compose -f docker/docker-compose.yml up -d
pnpm --filter @dentacollab/api prisma:generate
pnpm --filter @dentacollab/api exec prisma migrate dev --name init
pnpm db:seed
```

### 3) التشغيل

```bash
pnpm dev:api     # http://localhost:3000  | Swagger: /api/docs
pnpm dev:web     # http://localhost:5173
pnpm dev:admin   # http://localhost:5174
```

### بيانات الدخول الافتراضية

- Email: `admin@dentacollab.com`
- Password: `Admin123!`

## Environment Variables

انظر [`.env.example`](.env.example)

أهم المتغيرات:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Access token secret |
| `R2_*` | Cloudflare R2 credentials (مطلوب) |
| `OPENAI_API_KEY` | للـ RAG chatbot (اختياري — يوجد fallback محلي) |
| `VITE_API_URL` | عنوان الـ API للفرونت |

## API

- Prefix: `/api/v1`
- Docs: `/api/docs`
- Roles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`

## Production

راجع [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## License

Private — DentaCollab
