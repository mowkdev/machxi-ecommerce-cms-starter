#!/usr/bin/env node
// MachXI Ecommerce Starter — MCP setup & verification.
//
// Run via `pnpm setup:mcp`. Reads .env files (single source of truth) and
// verifies that every MCP server registered in .mcp.json can actually launch
// and connect to its dependencies. Prints a branded, color-coded report.

import { readFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

// ────────────────────────────────────────────────────────────────────────────
// Pretty output
// ────────────────────────────────────────────────────────────────────────────

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const esc = (n) => (useColor ? `\x1b[${n}m` : "")
const c = {
  reset: esc(0),
  bold: (s) => `${esc(1)}${s}${esc(0)}`,
  dim: (s) => `${esc(2)}${s}${esc(0)}`,
  cyan: (s) => `${esc(36)}${s}${esc(0)}`,
  green: (s) => `${esc(32)}${s}${esc(0)}`,
  yellow: (s) => `${esc(33)}${s}${esc(0)}`,
  red: (s) => `${esc(31)}${s}${esc(0)}`,
  gray: (s) => `${esc(90)}${s}${esc(0)}`,
  magenta: (s) => `${esc(35)}${s}${esc(0)}`,
}

const symbols = { ok: c.green("✓"), warn: c.yellow("!"), err: c.red("✗"), info: c.gray("·") }

let stepNum = 0
let warnings = 0
let errors = 0

const banner = () => {
  // Interior is 58 chars wide; each row is `│  ` + content + padding + `│`,
  // so content+padding = 58 - 2 (leading spaces) = 56 visible chars.
  const line = "─".repeat(58)
  const row = (visible, styled) =>
    c.cyan("│  ") + styled + " ".repeat(Math.max(0, 56 - visible.length)) + c.cyan("│")
  const title = "MachXI · Ecommerce Starter"
  const subtitle = "MCP Setup & Verification"
  console.log("")
  console.log(c.cyan(`╭${line}╮`))
  console.log(row(title, c.bold(c.magenta("MachXI")) + c.bold(" · Ecommerce Starter")))
  console.log(row(subtitle, c.dim(subtitle)))
  console.log(c.cyan(`╰${line}╯`))
  console.log("")
}

const step = (title) => {
  stepNum += 1
  console.log(`\n${c.cyan(`[${stepNum}]`)} ${c.bold(title)}`)
}

const log = (sym, text, detail) => {
  const detailPart = detail ? `  ${c.dim(detail)}` : ""
  console.log(`   ${sym}  ${text}${detailPart}`)
}
const ok = (t, d) => log(symbols.ok, t, d)
const warn = (t, d) => {
  warnings += 1
  log(symbols.warn, t, d)
}
const fail = (t, d) => {
  errors += 1
  log(symbols.err, c.red(t), d)
}

// ────────────────────────────────────────────────────────────────────────────
// .env parsing
// ────────────────────────────────────────────────────────────────────────────

const parseEnv = (text) => {
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i)
    if (!m) continue
    out[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
  return out
}

const readEnvFile = async (rel) => {
  try {
    return parseEnv(await readFile(resolve(rel), "utf8"))
  } catch (e) {
    if (e.code === "ENOENT") return null
    throw e
  }
}

const redactPg = (url) =>
  url.replace(/(\/\/[^:]+:)([^@]+)(@)/, (_, a, _b, c) => `${a}***${c}`)

// ────────────────────────────────────────────────────────────────────────────
// MCP probes
// ────────────────────────────────────────────────────────────────────────────

const probeStdio = ({ command, args, label, timeoutMs = 60000, query }) =>
  new Promise((resolveProbe) => {
    let resolved = false
    const finish = (status, detail) => {
      if (resolved) return
      resolved = true
      try {
        child.kill()
      } catch {}
      resolveProbe({ status, detail })
    }

    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    })

    const timer = setTimeout(() => finish("timeout", "no response within timeout"), timeoutMs)

    let stdoutBuf = ""
    let stderrTail = ""
    let serverName = label

    child.stdout.on("data", (d) => {
      stdoutBuf += d.toString()
      const lines = stdoutBuf.split("\n")
      stdoutBuf = lines.pop() ?? ""
      for (const line of lines) {
        let msg
        try {
          msg = JSON.parse(line)
        } catch {
          continue
        }
        if (msg.id === 1 && msg.result) {
          serverName = msg.result.serverInfo?.name ?? label
          if (query) {
            child.stdin.write(
              JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n",
            )
            child.stdin.write(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                method: "tools/call",
                params: { name: query.tool, arguments: query.args },
              }) + "\n",
            )
          } else {
            clearTimeout(timer)
            finish("ok", serverName)
          }
        } else if (msg.id === 2) {
          clearTimeout(timer)
          if (msg.error) return finish("error", msg.error.message)
          if (msg.result?.isError) {
            return finish("error", msg.result.content?.[0]?.text?.slice(0, 200) ?? "tool error")
          }
          const txt = msg.result?.content?.[0]?.text ?? ""
          finish("ok", query.parse ? query.parse(txt) : txt.slice(0, 80))
        }
      }
    })

    child.stderr.on("data", (d) => {
      stderrTail = (stderrTail + d.toString()).slice(-1200)
    })

    child.on("error", (e) => {
      clearTimeout(timer)
      finish("error", e.message)
    })

    child.on("exit", (code) => {
      if (!resolved) {
        clearTimeout(timer)
        const lastLine = stderrTail.trim().split("\n").pop() || `exited with code ${code ?? "?"}`
        finish("error", lastLine)
      }
    })

    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "machxi-setup", version: "1.0.0" },
        },
      }) + "\n",
    )
  })

const probePayloadHttp = async (url, key) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "machxi-setup", version: "1.0.0" },
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.status === 200) return { status: "ok", detail: "authenticated, MCP ready" }
    if (res.status === 401)
      return {
        status: key ? "error" : "needs-key",
        detail: key ? "API key rejected — regenerate in admin" : "endpoint live, awaiting API key",
      }
    return { status: "error", detail: `HTTP ${res.status}` }
  } catch (e) {
    if (e.name === "AbortError" || e.code === "ECONNREFUSED" || /fetch failed/i.test(e.message))
      return { status: "down", detail: "storefront not running on :8000" }
    return { status: "error", detail: e.message }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

banner()

step("Environment files")
const rootEnv = await readEnvFile(".env")
const backendEnv = await readEnvFile("apps/backend/.env")
const storefrontEnv = await readEnvFile("apps/storefront/.env.local")
if (rootEnv) ok(".env")
else warn(".env missing", "cp .env.template .env (optional — only needed for github MCP)")
if (backendEnv) ok("apps/backend/.env")
else fail("apps/backend/.env missing", "cp apps/backend/.env.template apps/backend/.env")
if (storefrontEnv) ok("apps/storefront/.env.local")
else
  fail(
    "apps/storefront/.env.local missing",
    "cp apps/storefront/.env.template apps/storefront/.env.local",
  )
if (errors > 0) {
  console.log(c.red("\nMissing env files — aborting.\n"))
  process.exit(1)
}

step("Required variables")
const medusaUrl = backendEnv.DATABASE_URL
const payloadUrl = storefrontEnv.PAYLOAD_DATABASE_URL
const payloadKey = storefrontEnv.PAYLOAD_MCP_API_KEY
if (medusaUrl) ok("DATABASE_URL (Medusa)", redactPg(medusaUrl))
else fail("DATABASE_URL (Medusa) not set in apps/backend/.env")
if (payloadUrl) ok("PAYLOAD_DATABASE_URL", redactPg(payloadUrl))
else fail("PAYLOAD_DATABASE_URL not set in apps/storefront/.env.local")
if (payloadKey) ok("PAYLOAD_MCP_API_KEY", `${payloadKey.slice(0, 8)}…`)
else warn("PAYLOAD_MCP_API_KEY empty", "create one in Payload admin (see step 5)")
const githubToken = rootEnv?.GITHUB_PERSONAL_ACCESS_TOKEN
if (githubToken) ok("GITHUB_PERSONAL_ACCESS_TOKEN", `${githubToken.slice(0, 8)}…`)
else warn("GITHUB_PERSONAL_ACCESS_TOKEN empty", "optional — set in root .env to enable github MCP")

if (errors > 0) {
  console.log(c.red("\nMissing required variables — aborting.\n"))
  process.exit(1)
}

step("Postgres connectivity (via wrapper)")
const pgQuery = (label) => ({
  tool: "pg_execute_query",
  args: {
    operation: "select",
    query:
      "SELECT current_database() AS db, count(*)::int AS tables FROM information_schema.tables WHERE table_schema='public'",
  },
  parse: (txt) => {
    const m = txt.match(/"db":\s*"([^"]+)"[\s\S]*?"tables":\s*"?(\d+)"?/)
    return m ? `${label} → ${m[1]} (${m[2]} public tables)` : txt.slice(0, 80)
  },
})

const medusaProbe = await probeStdio({
  command: "node",
  args: ["scripts/mcp/postgres.mjs", "apps/backend/.env", "DATABASE_URL"],
  label: "postgres-medusa",
  query: pgQuery("postgres-medusa"),
})
if (medusaProbe.status === "ok") ok(medusaProbe.detail)
else fail(`postgres-medusa: ${medusaProbe.status}`, medusaProbe.detail)

const payloadDbProbe = await probeStdio({
  command: "node",
  args: ["scripts/mcp/postgres.mjs", "apps/storefront/.env.local", "PAYLOAD_DATABASE_URL"],
  label: "postgres-payload",
  query: pgQuery("postgres-payload"),
})
if (payloadDbProbe.status === "ok") ok(payloadDbProbe.detail)
else fail(`postgres-payload: ${payloadDbProbe.status}`, payloadDbProbe.detail)

step("Documentation & browser MCP servers")
const context7Probe = await probeStdio({
  command: "npx",
  args: ["-y", "@upstash/context7-mcp"],
  label: "context7",
})
if (context7Probe.status === "ok") ok("context7", context7Probe.detail)
else fail("context7", context7Probe.detail)

const chromeProbe = await probeStdio({
  command: "npx",
  args: ["-y", "chrome-devtools-mcp@latest"],
  label: "chrome-devtools",
  timeoutMs: 120000,
})
if (chromeProbe.status === "ok") ok("chrome-devtools", chromeProbe.detail)
else fail("chrome-devtools", chromeProbe.detail)

step("Payload MCP endpoint")
const url = storefrontEnv.PAYLOAD_MCP_URL || "http://localhost:8000/api/mcp"
const payloadProbe = await probePayloadHttp(url, payloadKey)
if (payloadProbe.status === "ok") ok(`payload @ ${url}`, payloadProbe.detail)
else if (payloadProbe.status === "needs-key")
  warn(`payload @ ${url}`, payloadProbe.detail)
else if (payloadProbe.status === "down")
  warn(`payload @ ${url}`, `${payloadProbe.detail} — run 'pnpm storefront:dev'`)
else fail(`payload @ ${url}`, payloadProbe.detail)

step("GitHub MCP (via wrapper)")
if (!githubToken) {
  warn("github skipped", "no token in root .env (optional)")
} else {
  const githubProbe = await probeStdio({
    command: "node",
    args: ["scripts/mcp/github.mjs"],
    label: "github",
  })
  if (githubProbe.status === "ok") ok("github", githubProbe.detail)
  else fail("github", githubProbe.detail)
}

// ────────────────────────────────────────────────────────────────────────────
// Summary
// ────────────────────────────────────────────────────────────────────────────

console.log("")
console.log(c.cyan("─".repeat(60)))
if (errors === 0 && warnings === 0) {
  console.log(c.bold(c.green(" All six MCP servers ready.")))
  console.log(c.dim(" Restart Claude Code, approve servers, then run /mcp to confirm."))
} else if (errors === 0) {
  console.log(c.bold(c.yellow(` ${warnings} item(s) need attention:`)))
  if (!payloadKey) {
    console.log(c.dim(" Payload MCP:"))
    console.log(c.dim("   1. pnpm storefront:dev"))
    console.log(c.dim("   2. http://localhost:8000/admin → MCP → API Keys → create"))
    console.log(c.dim("   3. Paste key into apps/storefront/.env.local → PAYLOAD_MCP_API_KEY="))
  }
  if (!githubToken) {
    console.log(c.dim(" GitHub MCP (optional):"))
    console.log(c.dim("   1. https://github.com/settings/tokens → create PAT"))
    console.log(c.dim("   2. Paste into root .env → GITHUB_PERSONAL_ACCESS_TOKEN="))
  }
  if (!payloadKey || !githubToken) {
    console.log(c.dim(" Then re-run pnpm setup:mcp"))
  }
} else {
  console.log(c.bold(c.red(` ${errors} error(s), ${warnings} warning(s) — fix above and re-run.`)))
}
console.log(c.cyan("─".repeat(60)))
console.log("")

process.exit(errors > 0 ? 1 : 0)
