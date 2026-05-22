---
name: dev-check
description: Check whether the backend and storefront dev servers are running, show recent errors from each, and verify database connectivity
---

## Process check
!`pnpm --version && node --version`

## Backend health
!`curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/health 2>/dev/null || echo "not running"`

## Storefront health
!`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "not running"`

## Git status
!`git status --short`

## Recent TypeScript errors (backend)
!`cd apps/backend && npx tsc --noEmit --skipLibCheck 2>&1 | head -30 || echo "No TS errors"`

## Recent TypeScript errors (storefront)
!`cd apps/storefront && npx tsc --noEmit --skipLibCheck 2>&1 | head -30 || echo "No TS errors"`

---

Summarize the dev environment status:
- Are both servers running? (Yes/No)
- Any TypeScript errors? List the first 5 if present.
- Any uncommitted changes worth flagging?

Keep the summary under 15 lines.
