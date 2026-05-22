---
name: pr-summary
description: Generate a structured pull request description from the current git diff against main
---

## Current branch
!`git branch --show-current`

## Diff statistics
!`git diff main --stat 2>/dev/null || git diff origin/main --stat 2>/dev/null`

## Changed files
!`git diff main --name-only 2>/dev/null || git diff origin/main --name-only 2>/dev/null`

## Full diff (truncated to relevant sections)
!`git diff main 2>/dev/null | head -500 || git diff origin/main 2>/dev/null | head -500`

---

Write a pull request description with these sections:

**## Summary**
One paragraph — what this PR does and why.

**## Changes**
Bullet list grouped by area (backend, storefront, config, etc.).
Be specific: file names and what changed in each.

**## Migration required**
Yes/No. If yes, describe what the migration does.

**## Testing**
How to verify this change works locally. Include any seed data or env vars needed.

**## Breaking changes**
List any breaking changes, or write "None".
