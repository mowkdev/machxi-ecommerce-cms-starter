#!/usr/bin/env node
// Thin wrapper: reads GITHUB_PERSONAL_ACCESS_TOKEN from the root .env and
// spawns @modelcontextprotocol/server-github with the token in the child's
// env. Lets the root .env stay the single source of truth — no shell exports
// required.

import { readFile } from "node:fs/promises"
import { spawn } from "node:child_process"
import { resolve } from "node:path"

const ENV_PATH = ".env"
const VAR_NAME = "GITHUB_PERSONAL_ACCESS_TOKEN"

const content = await readFile(resolve(ENV_PATH), "utf8").catch((e) => {
  process.stderr.write(
    `[mcp-github] Cannot read ${ENV_PATH}: ${e.code ?? e.message}\n` +
      "  Copy .env.template to .env first (see docs/MCP.md).\n",
  )
  process.exit(1)
})

const match = content.match(new RegExp(`^\\s*${VAR_NAME}\\s*=\\s*(.*?)\\s*$`, "m"))
const token = match?.[1]?.replace(/^["']|["']$/g, "").trim()

if (!token) {
  process.stderr.write(
    `[mcp-github] ${VAR_NAME} is empty in ${ENV_PATH}.\n` +
      "  1. Create a token at https://github.com/settings/tokens\n" +
      "  2. Paste it into .env and reconnect (/mcp in Claude Code)\n" +
      "  Don't need the GitHub MCP? Remove the 'github' entry from .mcp.json.\n",
  )
  process.exit(1)
}

// `shell: true` is required on Windows so npx.cmd can be resolved
// (Node 20.12+ rejects direct spawn of .cmd files per CVE-2024-27980).
const child = spawn(
  "npx",
  ["-y", "@modelcontextprotocol/server-github"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, [VAR_NAME]: token },
  },
)

child.on("exit", (code) => process.exit(code ?? 0))
process.on("SIGINT", () => child.kill("SIGINT"))
process.on("SIGTERM", () => child.kill("SIGTERM"))
