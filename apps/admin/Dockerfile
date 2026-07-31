FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/admin/package.json apps/admin/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
RUN pnpm install --filter @dentacollab/admin... --no-frozen-lockfile
COPY apps/admin apps/admin
COPY packages/ui packages/ui
COPY packages/config packages/config
WORKDIR /app/apps/admin
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
