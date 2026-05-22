#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook — runs tsc --noEmit after .ts/.tsx edits.
 * Only fires when the edited file is TypeScript.
 * Non-blocking (exit 0 even on type errors) — errors are shown as warnings.
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';

let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf8');
} catch {
  process.exit(0);
}

let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = event?.tool_input?.file_path || event?.tool_input?.path || '';

// Only run on TypeScript files
if (!/\.(ts|tsx)$/.test(filePath)) {
  process.exit(0);
}

// Determine which app the file belongs to
const isBackend = filePath.includes('apps/backend') || filePath.includes('apps\\backend');
const isStorefront = filePath.includes('apps/storefront') || filePath.includes('apps\\storefront');

if (!isBackend && !isStorefront) {
  process.exit(0);
}

const cwd = isBackend
  ? resolve(process.cwd(), 'apps/backend')
  : resolve(process.cwd(), 'apps/storefront');

try {
  const result = execSync('npx tsc --noEmit --skipLibCheck 2>&1', {
    cwd,
    timeout: 20000,
    encoding: 'utf8',
  });
  if (result.trim()) {
    console.log('[ts-check] Type warnings:\n' + result.slice(0, 1500));
  }
} catch (err) {
  // tsc exits non-zero on type errors — show first 20 lines, don't block
  const output = (err.stdout || err.message || '').split('\n').slice(0, 20).join('\n');
  console.log('[ts-check] Type errors found:\n' + output);
}

process.exit(0);
