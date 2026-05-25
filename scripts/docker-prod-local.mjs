#!/usr/bin/env node
// Local prod-parity launcher.
//
// Builds machxi-backend:local + machxi-storefront:local from the current
// source, ensures docker/prod/.env exists with localhost-friendly defaults,
// brings up the prod compose stack with Caddy serving self-signed certs via
// its internal CA, runs migrations, and cross-wires the publishable key.
//
// Object Storage in prod is provided externally (Contabo / R2 / S3). For
// local testing, the docker-compose.local-minio.yml override adds a MinIO
// container speaking the same S3 API — no external account needed.
//
// Run via `pnpm docker:prod:local`.

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "..")
const COMPOSE = resolve(ROOT, "docker", "prod", "docker-compose.yml")
const COMPOSE_LOCAL_MINIO = resolve(
  ROOT,
  "docker",
  "prod",
  "docker-compose.local-minio.yml"
)
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

// On Windows, npm-bin shims resolve via PATHEXT — Node's spawn can't find
// them without shell:true. But shell:true joins args into a single cmd
// string which word-splits on whitespace, breaking any args that contain
// spaces (like SQL queries). So: resolve shims to their .cmd file on
// Windows up front, and never use shell:true.
function resolveBin(cmd) {
  if (process.platform !== "win32") return cmd
  if (cmd === "pnpm" || cmd === "npm" || cmd === "yarn" || cmd === "npx") {
    return `${cmd}.cmd`
  }
  return cmd
}

function run(cmd, args, { allowFail = false, capture = false, env, input } = {}) {
  const result = spawnSync(resolveBin(cmd), args, {
    stdio: input !== undefined
      ? ["pipe", capture ? "pipe" : "inherit", capture ? "pipe" : "inherit"]
      : capture ? ["ignore", "pipe", "pipe"] : "inherit",
    cwd: ROOT,
    encoding: "utf8",
    env: env ? { ...process.env, ...env } : process.env,
    input,
  })
  if (result.error) fail(`failed to spawn '${cmd}': ${result.error.message}`)
  if (result.status !== 0 && !allowFail) process.exit(result.status ?? 1)
  return result
}

// Always layer the local-MinIO override on top so we don't need external
// Object Storage credentials for the local test.
const compose = [
  "compose",
  "-f",
  COMPOSE,
  "-f",
  COMPOSE_LOCAL_MINIO,
  "--env-file",
  ENV_FILE,
]

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
    // Local MinIO doesn't have a public CDN URL; serve uploads through MinIO's
    // own port. The override sets S3_ENDPOINT=http://minio:9000 internally;
    // for browser-visible URLs we point at localhost MinIO via Caddy-bypass.
    .replace(
      /^S3_ENDPOINT=.*$/m,
      "S3_ENDPOINT=http://minio:9000  # overridden by docker-compose.local-minio.yml"
    )
    .replace(
      /^S3_FILE_URL=.*$/m,
      "S3_FILE_URL=http://localhost:9110/medusa-uploads  # local MinIO only"
    )
    .replace(
      /^S3_ACCESS_KEY_ID=.*$/m,
      "S3_ACCESS_KEY_ID=local-access-key"
    )
    .replace(
      /^S3_SECRET_ACCESS_KEY=.*$/m,
      "S3_SECRET_ACCESS_KEY=local-secret-key"
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

// ─── 3. Bring up data plane (postgres + redis + minio + createbuckets) ────
step("starting postgres + redis + minio...")
run("docker", [...compose, "up", "-d", "postgres", "redis", "minio", "createbuckets"])

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
// Desktop after module init. The host-side migrate works in seconds because
// it uses ts-node and has the full devDeps tree. The prod compose exposes
// postgres on host port 5433 so we can reach it from outside the docker net.
const pgPort = envContents.match(/^POSTGRES_HOST_PORT=(.+)$/m)?.[1].trim() ?? "5433"
const pgPass = envContents.match(/^POSTGRES_PASSWORD=(.+)$/m)?.[1].trim() ?? ""
const medusaDb = envContents.match(/^POSTGRES_MEDUSA_DB=(.+)$/m)?.[1].trim() ?? "medusa"
const payloadDb = envContents.match(/^POSTGRES_PAYLOAD_DB=(.+)$/m)?.[1].trim() ?? "payload"
const medusaDbUrl = `postgres://${pgUser}:${pgPass}@localhost:${pgPort}/${medusaDb}`

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
  const psqlResult = run(
    "docker",
    ["exec", "-i", "machxi-prod-postgres-1", "psql", "-U", pgUser, "-d", payloadDb],
    { input: dumpResult.stdout, allowFail: true, capture: true }
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
step("starting backend (server), backend-worker, storefront, caddy...")
run("docker", [
  ...compose,
  "up",
  "-d",
  "backend",
  "backend-worker",
  "storefront",
  "caddy",
])

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
  run(
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
    { allowFail: true, capture: true }
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
console.log(c.dim("  Storefront      → ") + "https://localhost")
console.log(c.dim("  Payload admin   → ") + "https://localhost/admin")
console.log(c.dim("  Medusa admin    → ") + "https://api.localhost/app")
console.log(c.dim("  MinIO console   → ") + "http://localhost:9111  " + c.dim("(creds in docker/prod/.env)"))
console.log()
console.log(c.yellow("Browser will show a cert warning (self-signed)."))
console.log(c.dim("To trust Caddy's CA on this machine:"))
console.log(
  c.dim(
    "  docker compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.local-minio.yml --env-file docker/prod/.env exec caddy caddy trust"
  )
)
console.log()
console.log(c.bold("Next: create admin users (one-time)"))
console.log(
  "  Medusa admin: " +
    c.dim(
      "docker compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.local-minio.yml --env-file docker/prod/.env exec backend node_modules/.bin/medusa user -e admin@x.com -p supersecret"
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
    "docker compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.local-minio.yml --env-file docker/prod/.env down -v"
)
