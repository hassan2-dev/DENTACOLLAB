# DentaCollab API — Coolify
# Build Pack: Dockerfile | Dockerfile: /Dockerfile | Base: / | Port: 3000
#
# Coolify injects NODE_ENV=production into the build — we force install of
# devDependencies so `nest build` / typescript work.

FROM node:22-bookworm-slim AS base
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@9.15.9
WORKDIR /app

FROM base AS deps
# Force full install even if Coolify sets NODE_ENV=production
ENV NODE_ENV=development
ENV CI=1
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --filter @dentacollab/api... --frozen-lockfile --prod=false

FROM deps AS build
ENV NODE_ENV=development
ENV CI=1
COPY apps/api apps/api
COPY packages/shared packages/shared
WORKDIR /app/apps/api
RUN pnpm exec prisma generate \
  && pnpm exec nest build \
  && ls -la dist \
  && test -f dist/main.js \
  && test -f dist/assets/fonts/DejaVuSans.ttf \
  && echo "Build OK: dist/main.js + fonts"

FROM node:22-bookworm-slim AS runner
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
# Invoice PDF Arabic/Latin fonts (also copied via nest assets; keep explicit fallback)
COPY --from=build /app/apps/api/src/assets/fonts ./assets/fonts

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
