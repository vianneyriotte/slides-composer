<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Slide Composer

SaaS app for hosting and creating HTML presentations (frontend-slides style).

## Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui (base-ui)
- **State**: TanStack Query (client), Server Actions (mutations)
- **Theme**: next-themes (dark/light/system)
- **ORM**: Drizzle ORM
- **DB**: SQLite via libsql (file:local.db in dev, Turso in prod)
- **Auth**: Better Auth (email/password)

## Directory Structure

```
app/
  (auth)/sign-in/       # Sign in page
  (auth)/sign-up/       # Sign up page
  (app)/dashboard/      # Dashboard (protected, server component + client)
  api/auth/[...all]/    # Better Auth API route
  p/[slug]/             # Public presentation viewer (iframe)
src/
  components/ui/        # shadcn/ui primitives (base-ui based, no asChild)
  components/           # Shared components (providers, theme-toggle)
  features/landing/     # Landing page components
  lib/db/               # Drizzle schema + client
  lib/auth/             # Better Auth server + client
public/                 # Static assets
```

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm ts           # TypeScript check
pnpm db:push      # Push schema to DB
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Drizzle Studio
```

## Conventions

- shadcn/ui Button uses `@base-ui/react` — no `asChild` prop. Use `buttonVariants()` with `<Link>`.
- Feature-based file organization under `src/features/`
- Server Components by default, `"use client"` only when needed
- Server Actions in `actions.ts` colocated with route
- HTML presentations stored as `text` column in SQLite
- Auth session helpers in `src/lib/auth/session.ts` (getSession, requireSession)
- Slugs are auto-generated from title + UUID prefix for uniqueness
