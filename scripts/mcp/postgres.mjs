#!/usr/bin/env node
// Thin wrapper: reads a Postgres connection string from a .env file and spawns
// @henkey/postgres-mcp-server with it. Used from .mcp.json so .env stays the
// single source of truth — no exported env vars required.
//
// Usage: node scripts/mcp/postgres.mjs <env-file> <var-name>

import { readFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

const [envFile, varName] = process.argv.slice(2)

if (!envFile || !varName) {
  process.stderr.write(
    "[mcp-postgres] Usage: postgres.mjs <env-file> <var-name>\n",
  )
  process.exit(1)
}

const absEnv = resolve(envFile)
const content = await readFile(absEnv, "utf8").catch((e) => {
  process.stderr.write(
    `[mcp-postgres] Cannot read ${absEnv}: ${e.code ?? e.message}\n` +
      "  Copy the .env.template if you haven't yet (see docs/MCP.md).\n",
  )
  process.exit(1)
})

const match = content.match(new RegExp(`^\\s*${varName}\\s*=\\s*(.*?)\\s*$`, "m"))
const url = match?.[1]?.replace(/^["']|["']$/g, "").trim()

if (!url) {
  process.stderr.write(
    `[mcp-postgres] ${varName} is not set in ${envFile}.\n` +
      "  Fill it in and reconnect this MCP server (Claude Code: /mcp).\n",
  )
  process.exit(1)
}

const child = spawn(
  "npx",
  ["-y", "@henkey/postgres-mcp-server", "--connection-string", url],
  { stdio: "inherit", shell: process.platform === "win32" },
)

child.on("exit", (code) => process.exit(code ?? 0))
process.on("SIGINT", () => child.kill("SIGINT"))
process.on("SIGTERM", () => child.kill("SIGTERM"))
