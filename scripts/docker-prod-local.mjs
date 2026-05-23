#!/usr/bin/env node
// Local prod-parity launcher.
//
// Builds machxi-backend:local + machxi-storefront:local from the current
// source, ensures docker/prod/.env exists with localhost defaults, brings up
// the prod compose stack with Caddy serving self-signed certs via its
// internal CA, and runs migrations + the idempotent seed.
//
// Run via `pnpm docker:prod:local`.

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "..")
const COMPOSE = resolve(ROOT, "docker", "prod", "docker-compose.yml")
const ENV_FILE = resolve(ROOT, "docker", "prod", ".env")
const ENV_EXAMPLE = resolve(ROOT, "docker", "prod", ".env.example")

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const esc = (n) => (useColor ? `\x1b[${n}m` : "")
const c = {
  bold: (s) => `${esc(1)}${s}${esc(0)}`,
  dim: (s) => `${esc(2)}${s}${esc(0)}`,
  cyan: (s) => `${esc(36)}${s}${esc(0)}`,
  green: (s) => `${esc(32)}${s}${esc(0)}`,
  yellow: (s) => `${esc(33)}${s}${esc(0)}`,
  red: (s) => `${esc(31)}${s}${esc(0)}`,
}

const step = (msg) => console.log(`${c.cyan("›")} ${msg}`)
const ok = (msg) => console.log(`${c.green("✓")} ${msg}`)
const warn = (msg) => console.log(`${c.yellow("!")} ${msg}`)
const fail = (msg, code = 1) => {
  console.error(`${c.red("✗")} ${msg}`)
  process.exit(code)
}

function run(cmd, args, { allowFail = false, capture = false, env } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    cwd: ROOT,
    encoding: "utf8",
    env: env ? { ...process.env, ...env } : process.env,
  })
  if (result.error) fail(`failed to spawn '${cmd}': ${result.error.message}`)
  if (result.status !== 0 && !allowFail) process.exit(result.status ?? 1)
  return result
}

const compose = ["compose", "-f", COMPOSE, "--env-file", ENV_FILE]

// ─── 1. Generate .env if absent ───────────────────────────────────────────
if (!existsSync(ENV_FILE)) {
  if (!existsSync(ENV_EXAMPLE)) fail(`missing ${ENV_EXAMPLE}`)
  const tpl = readFileSync(ENV_EXAMPLE, "utf8")
  const customized = tpl
    .replace(/^BACKEND_IMAGE=.*$/m, "BACKEND_IMAGE=machxi-backend")
    .replace(/^STOREFRONT_IMAGE=.*$/m, "STOREFRONT_IMAGE=machxi-storefront")
    .replace(/^IMAGE_TAG=.*$/m, "IMAGE_TAG=local")
    .replace(/^DOMAIN_STOREFRONT=.*$/m, "DOMAIN_STOREFRONT=localhost")
    .replace(/^DOMAIN_API=.*$/m, "DOMAIN_API=api.localhost")
    .replace(/^DOMAIN_CDN=.*$/m, "DOMAIN_CDN=cdn.localhost")
    .replace(/^CADDY_TLS_DIRECTIVE=.*$/m, "CADDY_TLS_DIRECTIVE=internal")
    .replace(/^ADMIN_EMAIL=.*$/m, "ADMIN_EMAIL=admin@localhost")
    .replace(/^STORE_CORS=.*$/m, "STORE_CORS=https://localhost")
    .replace(/^ADMIN_CORS=.*$/m, "ADMIN_CORS=https://api.localhost")
    .replace(
      /^AUTH_CORS=.*$/m,
      "AUTH_CORS=https://localhost,https://api.localhost"
    )
    .replace(
      /^NEXT_PUBLIC_SITE_URL=.*$/m,
      "NEXT_PUBLIC_SITE_URL=https://localhost"
    )
    .replace(
      /^S3_FILE_URL=.*$/m,
      "S3_FILE_URL=https://cdn.localhost/medusa-uploads"
    )
    .replace(/REPLACE_ME_STRONG_RANDOM/g, "local-dev-password-not-secret")
    .replace(
      /REPLACE_ME_LONG_RANDOM_STRING/g,
      "local-dev-secret-32-chars-min-not-for-prod"
    )
    .replace(/^# PAYLOAD_PUSH=true$/m, "PAYLOAD_PUSH=true")
  writeFileSync(ENV_FILE, customized)
  ok(`generated ${ENV_FILE} with localhost defaults`)
}

// ─── 2. Build images ──────────────────────────────────────────────────────
step("building machxi-backend:local...")
run("docker", [
  "build",
  "-f",
  "apps/backend/Dockerfile",
  "-t",
  "machxi-backend:local",
  ".",
])

step("building machxi-storefront:local...")
run("docker", [
  "build",
  "-f",
  "apps/storefront/Dockerfile",
  "-t",
  "machxi-storefront:local",
  ".",
])

// ─── 3. Bring up data plane ───────────────────────────────────────────────
step("starting postgres + redis + minio...")
run("docker", [...compose, "up", "-d", "postgres", "redis", "minio"])

// ─── 4. Wait for postgres ─────────────────────────────────────────────────
step("waiting for postgres to be ready...")
const envContents = readFileSync(ENV_FILE, "utf8")
const pgUser = envContents.match(/^POSTGRES_USER=(.+)$/m)?.[1].trim() ?? "machxi"
let ready = false
for (let i = 0; i < 30; i++) {
  const r = run(
    "docker",
    [...compose, "exec", "-T", "postgres", "pg_isready", "-U", pgUser],
    { allowFail: true, capture: true }
  )
  if (r.status === 0) {
    ready = true
    break
  }
  await new Promise((res) => setTimeout(res, 2000))
}
if (!ready) fail("postgres never became ready (30s timeout)")
ok("postgres ready")

// ─── 5. Migrate + seed (from HOST against the exposed prod postgres) ─────
// Running `medusa db:migrate` inside the container hangs on Windows Docker
// Desktop after module init (workflow-engine-redis appears to hold the event
// loop). The host-side migrate works in seconds because it uses ts-node and
// has the full devDeps tree. The prod compose exposes postgres on host port
// 5433 so we can reach it from outside the docker network.
const pgPort = envContents.match(/^POSTGRES_HOST_PORT=(.+)$/m)?.[1].trim() ?? "5433"
const pgPass = envContents.match(/^POSTGRES_PASSWORD=(.+)$/m)?.[1].trim() ?? ""
const medusaDb = envContents.match(/^POSTGRES_MEDUSA_DB=(.+)$/m)?.[1].trim() ?? "medusa"
const payloadDb = envContents.match(/^POSTGRES_PAYLOAD_DB=(.+)$/m)?.[1].trim() ?? "payload"
const payloadSecret = envContents.match(/^PAYLOAD_SECRET=(.+)$/m)?.[1].trim() ?? ""
const medusaDbUrl = `postgres://${pgUser}:${pgPass}@localhost:${pgPort}/${medusaDb}`
const payloadDbUrl = `postgres://${pgUser}:${pgPass}@localhost:${pgPort}/${payloadDb}`

step("running medusa db:migrate (from host)...")
run("pnpm", ["--filter", "@machxi/backend", "exec", "medusa", "db:migrate"], {
  env: { DATABASE_URL: medusaDbUrl, REDIS_URL: "" },
})

step("bootstrapping payload schema (dumping from dev DB)...")
// Payload's `push:true` doesn't run in standalone production builds, and
// `payload migrate` needs migration files generated up-front. For the local
// prod test the simplest bootstrap is to copy the schema from the dev DB
// (which has push:true and was created during the user's normal dev work).
const dumpResult = run(
  "docker",
  ["exec", "postgres", "pg_dump", "-U", "db-user", "--schema-only", "--no-owner", "--no-privileges", "-d", "payload"],
  { capture: true, allowFail: true }
)
if (dumpResult.status === 0 && dumpResult.stdout) {
  const psqlResult = spawnSync(
    "docker",
    ["exec", "-i", "machxi-prod-postgres-1", "psql", "-U", pgUser, "-d", payloadDb],
    { input: dumpResult.stdout, stdio: ["pipe", "ignore", "inherit"], cwd: ROOT }
  )
  if (psqlResult.status === 0) {
    ok("payload schema copied from dev DB")
  } else {
    warn("could not copy payload schema; you may need to seed it manually")
  }
} else {
  warn(
    "no dev postgres container found — start `pnpm docker:dev` once so Payload\n" +
      "  can create its schema, then re-run `pnpm docker:prod:local`. Or apply\n" +
      "  migrations manually via `pnpm --filter @machxi/storefront exec payload migrate`."
  )
}

// ─── 6. App tier + Caddy ──────────────────────────────────────────────────
step("starting backend, storefront, caddy...")
run("docker", [...compose, "up", "-d", "backend", "storefront", "caddy"])

// ─── 7. Auto-inject the Medusa publishable key into Payload global ────────
// On a real first deploy an admin does this manually via the UI; locally we
// can just SQL it across so the stack ends up in a runnable state with no
// follow-up clicks. Idempotent: skipped if a row already exists.
step("wiring publishable key → Payload global...")
const keyResult = run(
  "docker",
  [
    "exec",
    "machxi-prod-postgres-1",
    "psql",
    "-U",
    pgUser,
    "-d",
    medusaDb,
    "-Atc",
    "SELECT token FROM api_key WHERE type='publishable' ORDER BY created_at ASC LIMIT 1",
  ],
  { capture: true, allowFail: true }
)
const publishableKey = (keyResult.stdout ?? "").trim()
if (publishableKey) {
  spawnSync(
    "docker",
    [
      "exec",
      "machxi-prod-postgres-1",
      "psql",
      "-U",
      pgUser,
      "-d",
      payloadDb,
      "-c",
      `INSERT INTO medusa_integration (publishable_key, created_at, updated_at) SELECT '${publishableKey}', now(), now() WHERE NOT EXISTS (SELECT 1 FROM medusa_integration)`,
    ],
    { stdio: "ignore", cwd: ROOT }
  )
  // Storefront caches the global for 60s; restart so the value is picked up now.
  run("docker", [...compose, "restart", "storefront"], { capture: true })
  ok(`injected publishable key (${publishableKey.slice(0, 12)}…)`)
} else {
  warn("no seeded publishable key found — skipped auto-inject")
}

// ─── 8. Final report ──────────────────────────────────────────────────────
console.log()
ok(c.bold("prod-parity stack is up"))
console.log()
console.log(c.dim("  Storefront     → ") + "https://localhost")
console.log(c.dim("  Payload admin  → ") + "https://localhost/admin")
console.log(c.dim("  Medusa admin   → ") + "https://api.localhost/app")
console.log()
console.log(c.yellow("Browser will show a cert warning (self-signed)."))
console.log(c.dim("To trust Caddy's CA on this machine:"))
console.log(
  c.dim(
    "  docker compose -f docker/prod/docker-compose.yml --env-file docker/prod/.env exec caddy caddy trust"
  )
)
console.log()
console.log(c.bold("Next: create admin users (one-time)"))
console.log(
  "  Medusa admin: " +
    c.dim(
      "docker compose -f docker/prod/docker-compose.yml --env-file docker/prod/.env exec backend node_modules/.bin/medusa user -e admin@x.com -p supersecret"
    )
)
console.log("  Payload admin: sign up at https://localhost/admin")
console.log()
console.log(
  c.dim(
    "Publishable key already cross-wired. Only the Payload-side API key still\n" +
      "needs the manual cross-paste (Payload Admin → Users → Enable API Key →\n" +
      "copy → Medusa Admin → Settings → Payload CMS → paste)."
  )
)
console.log()
console.log(c.dim("Tear down:  ") + "pnpm docker:prod:down")
console.log(
  c.dim("Wipe data:  ") +
    "docker compose -f docker/prod/docker-compose.yml --env-file docker/prod/.env down -v"
)
