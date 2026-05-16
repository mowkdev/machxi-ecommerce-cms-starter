#!/usr/bin/env node
// Thin wrapper: reads PAYLOAD_MCP_API_KEY (+ optional PAYLOAD_MCP_URL) from
// apps/storefront/.env.local and spawns mcp-remote against the Payload MCP
// endpoint with the Bearer header. Lets .env stay the single source of truth.

import { readFile } from "node:fs/promises"
import { spawn } from "node:child_process"

const ENV_PATH = "apps/storefront/.env.local"
const DEFAULT_URL = "http://localhost:8000/api/mcp"

const content = await readFile(ENV_PATH, "utf8").catch((e) => {
  process.stderr.write(
    `[mcp-payload] Cannot read ${ENV_PATH}: ${e.code ?? e.message}\n` +
      "  Copy apps/storefront/.env.template first (see docs/MCP.md).\n",
  )
  process.exit(1)
})

const read = (name) => {
  const m = content.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*?)\\s*$`, "m"))
  return m?.[1]?.replace(/^["']|["']$/g, "").trim() || ""
}

const url = read("PAYLOAD_MCP_URL") || DEFAULT_URL
const key = read("PAYLOAD_MCP_API_KEY")

if (!key) {
  process.stderr.write(
    "[mcp-payload] PAYLOAD_MCP_API_KEY is empty in apps/storefront/.env.local.\n" +
      "  1. Start the storefront: pnpm storefront:dev\n" +
      "  2. Open http://localhost:8000/admin -> MCP -> API Keys -> create\n" +
      "  3. Paste the key into .env.local and reconnect (/mcp in Claude Code)\n",
  )
  process.exit(1)
}

const child = spawn(
  "npx",
  ["-y", "mcp-remote", url, "--header", `Authorization: Bearer ${key}`],
  { stdio: "inherit", shell: process.platform === "win32" },
)

child.on("exit", (code) => process.exit(code ?? 0))
process.on("SIGINT", () => child.kill("SIGINT"))
process.on("SIGTERM", () => child.kill("SIGTERM"))
