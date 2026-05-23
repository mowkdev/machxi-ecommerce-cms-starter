# syntax=docker/dockerfile:1.7
#
# Next.js 15 + PayloadCMS v3 storefront image. Multi-stage build:
#   deps    → install workspace dependencies (pnpm)
#   builder → run `payload generate:importmap && next build` with output: standalone
#   runner  → minimal runtime, runs server.js directly
#
# Build context is the MONOREPO ROOT.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1

# ──────────────────────────────────────────────────────────────────────────
# deps stage
# ──────────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY patches ./patches
COPY apps/backend/package.json    ./apps/backend/
COPY apps/storefront/package.json ./apps/storefront/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ──────────────────────────────────────────────────────────────────────────
# builder stage
# ──────────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules                    ./node_modules
COPY --from=deps /app/apps/storefront/node_modules    ./apps/storefront/node_modules
COPY . .
ENV NODE_ENV=production
# Build needs database/secret env to import payload.config.ts at next build
# time. We pass throwaway values — the build doesn't open a real DB
# connection (Payload's bundler only reads the config shape).
ENV PAYLOAD_SECRET=build-time-secret \
    PAYLOAD_DATABASE_URL=postgres://build:build@localhost:5432/build \
    MEDUSA_BACKEND_URL=http://placeholder:9000
RUN pnpm --filter @machxi/storefront build

# ──────────────────────────────────────────────────────────────────────────
# runner stage
# ──────────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Required COPY set for Next.js standalone + Turborepo monorepo:
#  - public assets for /public routes
#  - standalone bundle (contains a hoisted node_modules + server.js per app)
#  - static assets that Next serves from /_next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/public                 ./apps/storefront/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/standalone       ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/static           ./apps/storefront/.next/static

USER nextjs
EXPOSE 3000

# server.js is emitted under apps/storefront/ in a monorepo standalone build.
CMD ["node", "apps/storefront/server.js"]
