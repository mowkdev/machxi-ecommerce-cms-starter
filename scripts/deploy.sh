#!/usr/bin/env bash
# VPS-side deploy script. Lives at /opt/machxi/scripts/deploy.sh and is
# invoked by .github/workflows/deploy.yml.
#
# Single source of truth — running this locally on the VPS (`bash deploy.sh`)
# produces the same result as a CI-triggered deploy.

set -euo pipefail

cd "$(dirname "$0")/.."

# Pull the freshest images (tags are already pinned in .env).
docker compose pull

# Bring up the data plane first so migrations have something to migrate to.
docker compose up -d postgres redis minio

# Wait for postgres to accept connections (healthcheck does this, but the
# `up -d` call returns immediately; one-shot run-once steps below need it).
echo "› waiting for postgres..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

# Apply pending migrations + run idempotent seed (first deploy only meaningfully
# seeds; subsequent runs no-op because the data already exists).
echo "› running migrations..."
docker compose run --rm backend node_modules/.bin/medusa db:migrate

echo "› running seed (idempotent)..."
docker compose run --rm backend node_modules/.bin/medusa exec ./src/migration-scripts/initial-data-seed.js || true

# Finally bring the app tier up. backend (HTTP) and backend-worker (BullMQ
# jobs + subscribers) run from the same image with different MEDUSA_WORKER_MODE.
# Caddy comes last so users hit a fully-ready stack on first request.
docker compose up -d backend backend-worker storefront caddy

docker compose ps
echo "› deploy complete"
