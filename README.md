# Drribly — talent-manager workspace (MVP)

A working prototype of a creator-collaboration workspace for talent managers and agencies:
campaigns, creators, payments, calendar, notes, contacts — all backed by a real local database.
Visual design ("Nocturne") ported from the Drribly Claude Design project.

See [PRODUCT-PLAN.md](./PRODUCT-PLAN.md) for MVP scope rationale, production architecture
recommendation, timeline, and cost estimate.

## Running it locally

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/login`.

**Demo login** (pre-filled on the login form):
- Email: `priya@drribly.app`
- Password: `drribly-demo`

## Resetting demo data

The seed script wipes and re-populates every table, so it's safe to re-run any time you want to
clear out data you added while clicking around:

```bash
npm run db:seed
```

## Moving to Postgres for production

Everything here runs on a local SQLite file (`prisma/dev.db`) for zero-setup development. To point
at a real Postgres database (e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com)):

1. In `prisma/schema.prisma`, change the datasource provider from `sqlite` to `postgresql`.
2. Set `DATABASE_URL` in `.env` to your Postgres connection string.
3. Run `npx prisma migrate dev` again to create the schema on the new database.

## Project structure

- `app/app/*` — the authenticated workspace (dashboard, campaigns, creators, payments, calendar, notes, contacts)
- `app/login` — the demo login page and its server action
- `lib/actions/*` — Server Actions for all mutations (create campaign, advance deliverable stage, mark invoice paid, etc.)
- `lib/labels.ts`, `lib/format.ts` — shared display formatting for statuses, currency, dates
- `prisma/schema.prisma` — data model; `prisma/seed.ts` — demo data matching the original mockups
- `app/globals.css` — the Nocturne design tokens and component classes (colors, spacing, `.btn`/`.tag`/`.card`/`.table`/`.dialog`)

## What's not real yet

This is a functional prototype, not a production SaaS. In particular: there's a single demo
account (no real signup), and the "connected payout rails" on the Payments page are informational —
no money actually moves through Razorpay/Stripe/Wise. See PRODUCT-PLAN.md for what Phase 2 looks like.
