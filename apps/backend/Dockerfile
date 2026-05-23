# syntax=docker/dockerfile:1.7
#
# Medusa v2 backend image. Multi-stage build:
#   deps    → install workspace dependencies once (pnpm) for the builder
#   builder → run `medusa build`, producing .medusa/server with its own package.json
#   runner  → install ONLY production deps for the compiled server (slim final image)
#
# Build context is the MONOREPO ROOT.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH

# ──────────────────────────────────────────────────────────────────────────
# deps stage — installs the FULL workspace so the builder can run medusa build
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
# builder stage — produces apps/backend/.medusa/server (a self-contained app)
# ──────────────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules                    ./node_modules
COPY --from=deps /app/apps/backend/node_modules       ./apps/backend/node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm --filter @machxi/backend build

# ──────────────────────────────────────────────────────────────────────────
# runner stage — minimal production image: just the compiled server + prod deps
# ──────────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=9000
RUN addgroup --system --gid 1001 medusa && \
    adduser  --system --uid 1001 medusa

# medusa build emits .medusa/server with its own package.json — treat it as
# a self-contained package and install ONLY its production deps. This drops
# the image from ~2 GB (workspace node_modules) to a few hundred MB.
COPY --from=builder --chown=medusa:medusa /app/apps/backend/.medusa/server ./
RUN --mount=type=cache,id=pnpm-store-runner,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --prod --ignore-scripts

USER medusa
EXPOSE 9000

CMD ["node_modules/.bin/medusa", "start"]
