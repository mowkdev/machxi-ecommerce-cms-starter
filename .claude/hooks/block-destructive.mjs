#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — blocks destructive shell commands.
 * Exit code 2 = block the action and show the error message.
 * Exit code 0 = allow the action.
 */

import { readFileSync } from 'fs';

let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf8');
} catch {
  // stdin not available (e.g. Windows without WSL) — allow by default
  process.exit(0);
}

let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const command = event?.tool_input?.command || '';

const BLOCKED_PATTERNS = [
  /git\s+push\s+.*--force/,
  /git\s+push\s+-f\b/,
  /git\s+reset\s+--hard/,
  /git\s+clean\s+.*-f/,
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+\./,
  /rm\s+-rf\s+~\//,
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /TRUNCATE\s+TABLE/i,
  /DELETE\s+FROM\s+\w+\s*;?\s*$/i,  // DELETE without WHERE
];

const matched = BLOCKED_PATTERNS.find(p => p.test(command));
if (matched) {
  console.error(`[hook] BLOCKED: destructive command detected.`);
  console.error(`[hook] Command: ${command.slice(0, 200)}`);
  console.error(`[hook] Pattern: ${matched}`);
  console.error(`[hook] If this is intentional, run the command directly in your terminal.`);
  process.exit(2);
}

process.exit(0);
