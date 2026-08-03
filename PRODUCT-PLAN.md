# Drribly — Product Plan & Technology Recommendation

This document answers the scope-of-work questions from the original brief: MVP prioritization,
technical architecture, development timeline, and estimated cost. It's written as reference
documentation for you, not as a formal quote.

## What's built in this pass

A working **talent-manager workspace** — the manager-first MVP scope you defined, matching the
Nocturne visual design pulled from the Drribly Claude Design project. Real data, real CRUD, no
mock JSON:

- **Dashboard** — today's tasks, active campaigns, earnings trend, upcoming deadlines, payments pending
- **Campaigns** — list with status filters, detail side panel, full timeline view (deliverable stages, payment milestones), deliverable CRUD
- **Creators** — roster with live/idle status, pending payments, profile panel, rate cards
- **Payments** — connected-rail display, stats (received/pending/overdue), invoice CRUD, mark-paid flow
- **Calendar** — month view combining deliverable due dates and invoice due dates
- **Notes** — brief/internal notes, linkable to a campaign or brand
- **Contacts** — brand/agency/creator directory

**Stack:** Next.js 15 (App Router, Server Actions) + TypeScript + Tailwind, Prisma + SQLite locally,
a minimal signed-cookie demo login. See `README.md` for how to run it and how to swap SQLite for
Postgres when you're ready to deploy.

## MVP scope decisions (and what's deferred)

Your own feature list narrowed the MVP to talent managers/agencies — the wireframes were explicitly
"manager-first" too, so that's exactly what got built. Deferred to a Phase 2, in rough priority order:

1. **Individual creator workspace** — a second, lighter-weight view for solo creators managing their
   own collaborations. Shares most of the data model already in place (campaigns, payments,
   deliverables, notes, calendar) — the creator just becomes the account owner instead of a managed
   roster entry.
2. **Real payment-rail integrations** — the payments page currently shows connected rails and tracks
   invoices/status, but doesn't move money. Wiring Razorpay/Stripe/Wise for real payouts is real
   integration work (webhooks, reconciliation, split payments for agency fee vs. creator payout).
3. **Multi-tenant auth & billing** — today there's one demo account. Real signup, per-agency data
   isolation, and a subscription/billing layer (Stripe Billing) are needed before this can have more
   than one paying customer.
4. **Reports & analytics** — the brief mentions this; it's straightforward to add once there's more
   than one seed dataset's worth of real usage to report on.
5. **Notifications** — email/WhatsApp reminders for approaching deadlines and overdue payments (the
   dashboard already surfaces this in-app; push/email delivery is the next step).
6. **Contracts & document storage** — rate cards exist as text notes today; PDF upload/e-sign is
   deferred.
7. **Mobile** — the web app is responsive but a managers-on-the-go use case may eventually want a
   native or PWA experience.

## Recommended production architecture

The current stack (Next.js + Prisma) carries forward unchanged — only the infrastructure around it
needs to grow up:

| Concern | This MVP | Production recommendation |
|---|---|---|
| Hosting | Local dev server | Vercel (matches Next.js's own deployment model) |
| Database | SQLite file | Managed Postgres — Neon or Supabase (both have a generous free tier to start) |
| File storage | none | S3 or Cloudflare R2, for contracts/rate cards/creative assets |
| Auth | Single demo account, signed cookie | NextAuth.js (or Clerk/WorkOS if you want managed auth) with real signup, per-agency tenancy |
| Payments | Static display only | Razorpay Route / Stripe Connect for split payouts (agency fee vs. creator share) |
| Notifications | None | Resend or Postmark for email; a queue (e.g. Inngest or a Vercel Cron job) for scheduled deadline reminders |
| Background jobs | None | Inngest or a simple cron for overdue-invoice detection, idle-creator nudges |

This is a conventional, well-trodden stack for a B2B SaaS at this stage — nothing exotic, which
keeps hiring and maintenance easy.

## Timeline estimate (Phase 2 — production hardening)

Assuming a small team (1–2 full-stack engineers + you steering product), roughly **6–10 weeks**
after this MVP to a real multi-tenant production launch:

- **Weeks 1–2** — multi-tenant auth, per-agency data isolation, subscription billing shell
- **Weeks 3–5** — payment rail integrations (start with Razorpay, since your seed data and target
  market are India-first; add Stripe/Wise once the split-payout logic is proven)
- **Weeks 5–6** — solo-creator workspace (reusing the existing data model)
- **Weeks 6–8** — notifications, reports/analytics, contract storage
- **Weeks 8–10** — QA hardening, security review (this matters a lot once real payment data flows
  through the system), soft launch

This is a planning estimate, not a commitment — the payment-integration phase in particular tends to
expand once you're in the weeds of a specific rail's KYC/compliance requirements.

## Cost estimate (ballpark, not a quote)

Framed as ranges because it depends heavily on who builds it and where they're based:

- **Solo experienced full-stack freelancer, India-based:** roughly ₹4–8L (~$5k–10k) for the Phase 2
  scope above, over 2–3 months part-time-to-full-time
- **Small dev shop / agency (2–3 people):** roughly $15k–35k for the same scope, faster (6–10 weeks
  as above)
- **Running costs once live, at early-stage scale (tens of agencies, not thousands):** roughly
  $50–150/month — Vercel + managed Postgres + object storage + email, before payment-processing fees
  (which are transaction-based, not fixed)

Get an actual quote once the Phase 2 scope is fixed — this range exists so you have a sense of order
of magnitude when talking to vendors, not to lock in a number now.

## Worth flagging early, not late

- **Payment compliance** — routing brand payments through Drribly and splitting out a creator payout
  touches RBI payment-aggregator rules in India (and PCI scope if card details ever pass through
  your servers instead of the rail's own hosted checkout). Loop in someone who's done this before —
  it changes the payments architecture, not just the UI.
- **Creator payout tax (TDS)** — Indian influencer payouts typically require TDS deduction; worth a
  conversation with a CA before the payments feature goes from "tracks status" to "moves money," so
  the data model captures what's needed for compliance from day one rather than retrofitted later.
