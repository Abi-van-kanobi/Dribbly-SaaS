# Ettuno — creator-economy workspace (MVP)

A working prototype of a creator-collaboration workspace for talent managers, agencies and individual
creators: campaigns, creators, payments, calendar, notes, contacts, backed by a real database.

See [PRODUCT-PLAN.md](./PRODUCT-PLAN.md) for MVP scope rationale, production architecture
recommendation, timeline, and cost estimate.

## Running it locally

```bash
npm install
cp .env.example .env      # then set SESSION_SECRET (and Google keys when you have them)
npx prisma db push        # creates the local SQLite database
npm run db:seed           # demo workspace only
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Sign-in options**

- **Google** (real accounts): set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, and register
  `<APP_URL>/api/auth/callback/google` as an authorised redirect URI in Google Cloud Console.
- **Demo workspace**: one click on the login page, shared sample data. On by default in dev, off in
  production unless `DEMO_ENABLED=true`.
- **Dev-only fake Google user**: set `ALLOW_DEV_LOGIN=true` locally to test sign-up and onboarding
  without Google keys. It returns 404 when `NODE_ENV=production`.

## How tenancy works

Every record belongs to a workspace. App code never uses `prisma` directly for app data; it calls
`requireWorkspace()` (`lib/session.ts`), which returns a client scoped to the signed-in user's
workspace (`lib/tenant.ts`): reads are filtered, creates are stamped, updates and deletes are pinned
to the workspace. IDs that arrive from forms (creator, brand, campaign) must be looked up through
that scoped client. Raw SQL bypasses the scope, so do not use it for app data.

Prove it still holds after any change:

```bash
npm run verify:tenancy
```

It uses a throwaway database, covers isolation, account deletion, data export and session tokens,
and exits non-zero on any failure.

## Privacy (GDPR)

- Sign-up requires a ticked, timestamped consent to the Terms and Privacy Policy. Nothing is stored before it.
- Settings has **Download my data** (JSON) and **Delete my account** (hard delete of the account and workspace).
- `/privacy` and `/terms` are **drafts pending legal review**. Fill the bracketed placeholders in
  `lib/legal.ts`, and set `LEGAL_STATUS` to `reviewed` only after a lawyer signs off.
- The only cookie is the strictly necessary sign-in cookie, so there is no cookie banner yet. Add one
  before adding analytics or marketing cookies.

## Resetting demo data

`npm run db:seed` resets the demo workspace only. It never touches real users' workspaces.

## File storage (Work Aligner uploads)

Uploaded images and PDFs live outside the database. In development they go to a local `.storage` folder.
In production they go to **Cloudflare R2** (S3-compatible), and uploads stay switched off until it is configured.

How an upload works with R2: the browser asks the app for a short-lived signed URL, uploads straight to the bucket
(so the host's request-size limit never applies), then asks the app to accept the file. The app checks the owner,
size and real file type before the object becomes a file; anything that fails is deleted.

One-time R2 setup (done in the Cloudflare dashboard, by the account owner):

1. Create a bucket. **Choose the jurisdiction now (for example EU); it cannot be changed later.** Keep the bucket
   private: do not enable the public r2.dev address or a public custom domain.
2. Create an **R2 API token** with *Object Read & Write*, limited to that one bucket (not an account-wide token).
3. Put these in the host's environment variables (and `.env` locally): `STORAGE_DRIVER=r2`, `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_JURISDICTION=eu` if the bucket is in the EU.
4. Add a **CORS policy** on the bucket so browsers may upload to it (replace the origin with the real app address):

   ```json
   [{ "AllowedOrigins": ["https://YOUR-APP-DOMAIN"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```

5. Add an **object lifecycle rule**: delete objects under the prefix `pending/` after 1 day. This cleans up uploads that
   a browser started but never finished.

`npm run verify:tenancy` tests the R2 driver against a built-in fake S3 server. It cannot prove that real credentials,
the CORS policy or the lifecycle rule are right; only a real bucket can. After setup, upload one image in the app and
open it again to confirm.

## Moving to Postgres for production

1. In `prisma/schema.prisma`, change the datasource provider from `sqlite` to `postgresql`.
2. Delete `prisma/migrations` (it is a SQLite baseline) and create a fresh one with
   `npx prisma migrate dev --name init`.
3. Set `DATABASE_URL` to the pooled Neon URL and, for migrations, a direct URL. Pick an EU region for
   EU customers.

## Project structure

- `app/app/*` — the authenticated workspace (dashboard, campaigns, creators, payments, calendar, notes, contacts, settings)
- `app/login`, `app/onboarding`, `app/api/auth/*` — sign-in, first-run setup, Google OAuth
- `app/(marketing)/*` — public site, including `/privacy` and `/terms`
- `lib/actions/*` — Server Actions for all mutations
- `lib/tenant.ts`, `lib/gdpr.ts`, `lib/session.ts`, `lib/auth.ts` — tenant isolation, export and erasure, sessions
- `lib/labels.ts`, `lib/format.ts` — shared display formatting for statuses, currency, dates
- `prisma/schema.prisma` — data model; `prisma/seed.ts` — demo data
- `app/globals.css` — design tokens and component classes

## What's not real yet

This is a functional prototype, not a production SaaS. Money display is still rupee-formatted
regardless of workspace currency (Phase 2). Google sign-in has not been exercised against Google
itself until real keys are added. The payout rails on the Payments page are informational; no money
moves through Razorpay, Stripe or Wise.
