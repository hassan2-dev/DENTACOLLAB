# DentaCollab API — Coolify
# Build Pack: Dockerfile | Dockerfile: /Dockerfile | Base: / | Port: 3000
#
# Uses pnpm deploy for a slim production image (avoids copying full monorepo node_modules).

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

# Portable production package (prod deps only — much smaller COPY for Coolify)
WORKDIR /app
RUN pnpm --filter @dentacollab/api deploy --prod --legacy /prod \
  && rm -rf /prod/dist /prod/src /prod/test \
  && mkdir -p /prod/dist /prod/prisma /prod/assets/fonts \
  && cp -a /app/apps/api/dist/. /prod/dist/ \
  && cp -a /app/apps/api/prisma/. /prod/prisma/ \
  && cp -a /app/apps/api/src/assets/fonts/. /prod/assets/fonts/ \
  && cd /prod \
  && pnpm exec prisma generate \
  && test -f dist/main.js \
  && echo "Deploy bundle OK"

FROM node:22-bookworm-slim AS runner
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /prod/ ./

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
