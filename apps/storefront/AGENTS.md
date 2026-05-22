<!-- BEGIN:nextjs-agent-rules -->

# Storefront — Next.js 15 + PayloadCMS v3

## ALWAYS do before any Next.js work

Before writing any Next.js code, find and read the relevant doc in
`node_modules/next/dist/docs/`. Training data is outdated — the installed
docs are the source of truth.

## Next.js 15 App Router rules

- Use Server Components by default. Add `"use client"` only when you need
  browser APIs, event handlers, or React hooks.
- Data fetching: `fetch()` in Server Components with `next: { revalidate }`.
  Never use `getServerSideProps` or `getStaticProps` (Pages Router, not used here).
- Route handlers live in `src/app/api/**/route.ts`.
- Dynamic segments: `[slug]`, catch-all: `[...slug]`, optional: `[[...slug]]`.

## PayloadCMS v3 rules

- Collections are defined in `src/collections/`. Register them in `src/payload.config.ts`.
- Access control: every collection needs explicit `read`, `create`, `update`, `delete` access.
- Hooks run server-side only — no browser APIs.
- Use `payload.find()`, `payload.create()`, etc. from the Local API in Server Components.
  Never call the REST API from within the same process.
- Rich text fields use Lexical. Do not use Slate config.

## Styling rules

- Tailwind CSS utility classes only — no inline styles, no CSS modules.
- Component variants: use `class-variance-authority` (CVA).
- UI primitives: Radix UI — always build on Radix, never roll custom dialogs/selects.
- Animations: Framer Motion for complex, Tailwind transitions for simple.

## Medusa SDK usage

- Import from `@medusajs/js-sdk` only.
- SDK client is initialized in `src/lib/` — import from there, never instantiate inline.
- Cart and customer state: use Medusa's built-in session handling.

<!-- END:nextjs-agent-rules -->
