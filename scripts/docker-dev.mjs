#!/usr/bin/env node
// MachXI Ecommerce Starter — local-dev infrastructure bootstrap.
//
// Run via `pnpm docker:dev`. Brings up the docker-compose stack defined at
// the repo root (postgres + minio), waits for the one-shot bucket-init
// sidecar to finish, then removes that sidecar so it doesn't linger in
// `docker ps -a`.

import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const SIDECAR = "minio-createbuckets"
const ROOT = resolve(import.meta.dirname, "..")
const ENV_FILE = resolve(ROOT, ".env")
const ENV_TEMPLATE = resolve(ROOT, ".env.template")

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

function step(msg) {
  console.log(`${c.cyan("›")} ${msg}`)
}

function ok(msg) {
  console.log(`${c.green("✓")} ${msg}`)
}

function warn(msg) {
  console.log(`${c.yellow("!")} ${msg}`)
}

function fail(msg, code = 1) {
  console.error(`${c.red("✗")} ${msg}`)
  process.exit(code)
}

// Run a command, inherit stdio, exit on failure unless allowFail.
function run(cmd, args, { allowFail = false, capture = false } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    cwd: ROOT,
    encoding: "utf8",
  })
  if (result.error) {
    fail(`failed to spawn '${cmd}': ${result.error.message}`)
  }
  if (result.status !== 0 && !allowFail) {
    process.exit(result.status ?? 1)
  }
  return result
}

// ─── 1. Ensure root .env exists ────────────────────────────────────────────
if (!existsSync(ENV_FILE)) {
  if (!existsSync(ENV_TEMPLATE)) {
    fail("neither .env nor .env.template exists at the repo root")
  }
  copyFileSync(ENV_TEMPLATE, ENV_FILE)
  ok("created .env from .env.template")
}

// ─── 2. Bring the stack up ─────────────────────────────────────────────────
step("starting docker compose services...")
run("docker", ["compose", "up", "-d"])

// ─── 3. Wait for the bucket-init sidecar to finish ─────────────────────────
// `docker wait` blocks until the container stops. If it already exited it
// returns immediately with the recorded exit code. If the container was
// never created (rare), we skip cleanup with a warning.
const inspect = run("docker", ["inspect", "--format", "{{.State.Status}}", SIDECAR], {
  capture: true,
  allowFail: true,
})

if (inspect.status !== 0) {
  warn(`sidecar container '${SIDECAR}' not found — skipping cleanup`)
} else {
  step(`waiting for bucket initialization ('${SIDECAR}' to exit)...`)
  const waited = run("docker", ["wait", SIDECAR], { capture: true, allowFail: true })
  const exitCode = waited.stdout.trim()
  if (waited.status !== 0 || exitCode !== "0") {
    warn(`sidecar exited with code ${exitCode || "?"} — leaving container in place for inspection`)
    process.exit(1)
  }
  step(`removing sidecar container '${SIDECAR}'...`)
  run("docker", ["rm", "-fv", SIDECAR], { allowFail: true, capture: true })
  ok("buckets created, sidecar removed")
}

console.log()
ok(c.bold("local dev infra is up"))
console.log(c.dim("  postgres → localhost:5432  (databases: medusa, payload)"))
console.log(c.dim("  minio    → localhost:9100  (console: http://localhost:9101)"))
