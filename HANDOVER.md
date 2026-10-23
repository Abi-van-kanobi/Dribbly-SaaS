# Ettuno: technical handover

A workspace for talent managers, agencies and individual creators to run campaigns, creators, payments and
the scattered work around them in one place. This document describes what is built, how the parts fit, what
the client's accounts must hold, and what is still open. It is a working document: update it as things change.

Status when written: 12 October 2026. Phase 1 (multi-tenant foundation) and the Work Aligner foundation are built and
tested on a local database. Production setup (Postgres, Google keys, R2 bucket, hosting) is **not done yet**: see
"Open items".

---

## 1. What the product does

| Area | What a user can do |
|---|---|
| Sign in | Google sign-in (one click, no password). A shared demo workspace is available for showing the product. |
| Onboarding | One screen: pick "I manage other creators" or "I manage my own brand deals", tick the Terms and Privacy box. Nothing is stored before the box is ticked. |
| Navigation | A left rail instead of a top bar. At the top a "+ New" menu (campaign, creator, invoice, note) and "Jump to" search (Ctrl+K or Cmd+K). Below, Home, then every active campaign with a status dot (red late, orange needs attention, green on track, from the same rules as the Work Aligner board; the tooltip gives the reason), then Creators, Payments, and a More group (Calendar, Notes, Contacts). Settings, the person's name and Sign out sit at the bottom. The rail collapses to icons. On phones it becomes a bottom bar (Home, Campaigns, +, Payments, More). |
| Important today | A bar under the greeting with up to 5 things the person pinned: a task, a deliverable deadline or an invoice due date. Pin from the dashboard, a campaign page or Payments. Each card has Done, Tomorrow and Open. Late items say how late in words. Unfinished pins carry over ("From yesterday"); finished ones stay struck through until midnight in the workspace's time zone. |
| Dashboard (Home) | Greeting, key numbers, tasks due today, active campaigns, earnings, deadlines, pending payments, and the **Work Aligner**. |
| Work Aligner | Drop files, screenshots and PDFs, paste links (Notion, Google Docs/Sheets, any web address) or type notes. Items land in an Inbox and are filed to a campaign. A bird's-eye board shows every active campaign as Late, Needs attention or On track, with the reasons in plain words. Click a row to see the deliverables, payments and filed items behind it. |
| Campaigns | Only a name and a brand are needed to start one. The creator is optional: pick one, type a new name (it is created for you), or leave it and assign one later from the campaign. Value and deadline are optional too (deadline defaults to 30 days out). In a solo creator's workspace the owner is attached automatically. Then deliverables with stages and dates, timeline, payments, notes, and an Aligner tab. |
| Creators, Payments, Calendar, Notes, Contacts | Records the manager keeps. Payments are **tracked, never moved**. |
| Settings | Download my data (everything in the workspace, including uploaded files, as one file) and Delete my account (permanent, including files). |
| Public website | Home (told as a story), Solutions, Resources (Blog, Case studies, Product insights), Pricing (three tiers, prices intentionally blank), Privacy Policy and Terms (drafts). |

## 2. How it is built

Next.js 16 (App Router, server actions) with React 19, TypeScript and Tailwind 4. Data in PostgreSQL through Prisma 6
(SQLite is used only for local development). Files in Cloudflare R2. Sign-in with Google OAuth. Hosting planned on Vercel.

```
Browser
  |  pages and server actions (signed session cookie)
  v
proxy.ts            first gate: reads the signed cookie, routes people to login / onboarding / app
  v
requireWorkspace()  the one door into the app: who is this, which workspace, and a database client
  |                 that can ONLY see that workspace (lib/tenant.ts)
  v
PostgreSQL (Neon)   all business records, every row carries a workspaceId
Cloudflare R2       uploaded files, under <workspaceId>/ ; private bucket
Google              sign-in only (name and email); no Gmail, contacts or Drive access
```

### Why some choices were made

- **Own sign-in plumbing instead of Auth.js.** Auth.js v5 is still in beta. Sign-in uses the `arctic` OAuth library plus a
  signed cookie (`lib/auth.ts`, `lib/session.ts`, `app/api/auth/*`). Only the login layer is affected; swapping it later
  does not touch the data or tenancy code.
- **Tenant isolation enforced in one place.** Instead of remembering `where: { workspaceId }` in every query, app code gets
  a database client from `requireWorkspace()` that filters reads, stamps creates and pins updates and deletes to the
  workspace, and refuses operations it has not reasoned about (`lib/tenant.ts`). Raw SQL bypasses it and must not be used
  on tenant tables.
- **Prisma pinned to 6.** Prisma 7 changed how the database is configured; upgrading is a planned task, not an accident.
- **Payments are tracked, not moved.** No card or bank details are collected. This keeps licensing and liability out of scope.
- **The Aligner board is rule-based, not AI.** Every flag traces to a record (a date, a stage, an invoice status). Reading
  the contents of screenshots is a separate, later stage because it adds a vendor that handles customers' data.

## 3. Components

### Pages and routes (`app/`)

| Path | Purpose |
|---|---|
| `(marketing)/` page, `solutions`, `resources`, `resources/[slug]`, `pricing`, `privacy`, `terms` | Public website. `insights/*` redirects to `resources/*`. |
| `login`, `onboarding` | Sign-in and first-run setup. |
| `api/auth/google`, `api/auth/callback/google` | Google OAuth start and return (state + PKCE). |
| `api/auth/dev` | Local-only fake Google user. Returns 404 in production or unless `ALLOW_DEV_LOGIN=true`. |
| `api/session/clear` | Drops a stale cookie so it can never cause a redirect loop. |
| `app/` (dashboard), `app/campaigns`, `app/campaigns/[id]`, `app/creators`, `app/payments`, `app/calendar`, `app/notes`, `app/contacts` | The signed-in workspace. |
| `app/settings`, `app/settings/export` | Privacy tools: delete account, download data. |
| `app/aligner/upload`, `upload/init`, `upload/complete`, `file/[id]` | Aligner file handling (see section 5). |

### Libraries (`lib/`)

| File | Purpose |
|---|---|
| `tenant.ts` | The workspace-scoped database client. Central to security. |
| `session.ts`, `auth.ts` | Signed cookies (HMAC-SHA256), `requireWorkspace()`, session lifetimes. |
| `signin.ts`, `google.ts` | What happens after Google returns: known user, new user to onboarding, or refuse (email already used). Never links accounts by email alone. |
| `gdpr.ts` | Hard-delete of an account (database and files) and the data export. |
| `legal.ts` | One place for the Terms version, last-updated date, draft status and the placeholders for company details. |
| `storage.ts` | File storage: Cloudflare R2 driver and a local-disk driver for development. |
| `aligner.ts`, `aligner-service.ts`, `aligner-board.ts`, `aligner-guard.ts` | Aligner rules: file type checks from the bytes, link classification, storage limit, the board logic, and the checks every upload route shares. |
| `actions/*` | Server actions for every change a user makes. Each starts with `requireWorkspace()` and validates any ID that came from a form. |
| `jump.ts`, `components/AppShell.tsx`, `components/nav/*`, `components/useOpenFromNew.ts` | The navigation: how "Jump to" ranks matches, which campaigns the rail lists, the rail and phone bar, and how the "+ New" menu opens a page's form (`?new=campaign` and so on). The rail's dot colours come from `aligner-board.ts`. |
| `campaign-service.ts` | Creating a campaign and assigning its creator: validates everything first, reuses an existing brand or creator when a typed name matches, and refuses another workspace's IDs. |
| `today.ts`, `pin-service.ts`, `actions/pins.ts` | The Important today bar: workspace-time-zone day maths, and the rules for pinning, the 5-pin limit, swapping, carry-over, Done and Tomorrow. |
| `pricing.ts` | The three pricing tiers. Prices are blank on purpose; fill them here. |
| `content/insights.ts` | Blog, case-study and product-insight articles (static). Case studies are labelled as example scenarios. |
| `locale.ts`, `format.ts`, `labels.ts`, `chart.ts` | Currency/time-zone helpers, display formatting, status labels. |

### Data model (`prisma/schema.prisma`)

`User`, `Workspace` (type, currency, time zone, `isDemo`), `Membership` (role) form the account layer. Business records, all with
a required `workspaceId` and cascade-delete from the workspace: `Creator`, `Brand`, `Campaign`, `Deliverable`, `Invoice`, `Task`,
`Note`, `Contact`, `AlignerItem`, `Pin`. A campaign's and an invoice's creator are optional (a campaign can exist before a creator is chosen). A `Pin` points at exactly one task, deliverable or invoice and records the workspace-local day it is for and the day it was finished. `User` stores consent (`termsAcceptedAt`, `termsVersion`).

## 4. Security model

- Sessions are signed cookies, `HttpOnly`, `SameSite=Lax`, `Secure` in production; the app refuses to start in production
  without `SESSION_SECRET`.
- A cookie only says who someone claims to be; the database decides whether they still belong to the workspace.
- Every form-supplied ID (campaign, brand, creator, item) is looked up through the scoped client, so another customer's ID is
  rejected rather than linked.
- Uploads: the real file type is decided from the first bytes, not the name or what the browser claims. Only PNG, JPEG, GIF, WebP
  and PDF are accepted (no SVG or HTML). 10 MB per file; a per-workspace limit (default 1 GB). Files are served only through
  an authenticated route, with `nosniff` and a locked-down policy for images. Uploads are switched off in the shared demo.
- Browser-to-bucket uploads use signed URLs that expire in 5 minutes and are tied to the exact type and length declared.
  Nothing becomes a file until the server has inspected it; failures are deleted.
- The R2 bucket is private. The API token is limited to that bucket.

## 5. Work Aligner: how an upload flows

1. Browser sends the file names, sizes and types to `upload/init`. The server checks them and returns one signed URL per file.
2. Browser uploads each file straight to the bucket under `pending/<workspaceId>/`.
3. Browser calls `upload/complete`. The server checks that the object belongs to this workspace, its size, and its real type; then
   copies it to `<workspaceId>/` and records it. Anything that fails is deleted.
4. In local development (no signed URLs) the browser posts the file to `upload` instead.

## 6. Accounts and services the client must own

| Service | Used for | Notes |
|---|---|---|
| Neon (Postgres) | Database | Choose an EU region for EU customers. Use the pooled connection string for the app and a direct one for migrations. |
| Google Cloud | Sign-in (OAuth client) | Register `<APP_URL>/api/auth/callback/google`. Only name, email and profile are requested. |
| Cloudflare | R2 file storage | Create the bucket in the chosen jurisdiction first; it cannot be changed afterwards. |
| Vercel | Hosting | Set the environment variables below. |
| Domain and email | Website, privacy contact | A privacy contact address is needed for the policy. |

Each service has its own Data Processing Agreement; see section 8.

## 7. Environment variables

See `.env.example` for the full list with comments. Required in production: `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `STORAGE_DRIVER=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET` (and `R2_JURISDICTION=eu` for an EU bucket). Optional: `DEMO_ENABLED`, `ALIGNER_WORKSPACE_LIMIT_MB`. Never set
`ALLOW_DEV_LOGIN` anywhere real. Secrets belong in the host's settings, never in the repository.

## 8. Privacy and compliance register

Not legal advice. These are the points to be confirmed with the client's counsel before launch.

**Roles.** For account data (name, email, consent record) Ettuno is the controller. For the content an agency puts in its
workspace (creators, brands, contacts, files), the agency is likely the controller and Ettuno a processor, which means a
customer-facing Data Processing Agreement and a published sub-processor list are needed. The current draft Privacy Policy
and Terms describe a single controller role and need this reviewed.

**Sub-processors.** Neon (database), Cloudflare (file storage), Vercel (hosting), Google (sign-in). For each: accept or
file its standard DPA, record the date, and subscribe to its sub-processor change notices.

**Cloudflare R2 specifically.**
- Cloudflare's Data Processing Addendum forms part of its Self-Serve and Enterprise agreements automatically. It includes EU
  Standard Contractual Clauses, a UK Addendum and Swiss terms, and Cloudflare participates in the EU-US Data Privacy Framework.
  Keep a dated copy. Cloudflare commits to 30 days' notice of new sub-processors (customers have 10 days to object).
- An EU jurisdiction bucket guarantees the stored objects stay in the EU. Location hints are only best-effort. Cloudflare's
  documentation does not say where control-plane metadata is handled, so say "files are stored in the EU" and not "all data
  stays in the EU".
- Cloudflare, Inc. is a US company, so the US CLOUD Act can in theory reach data it holds even in EU data centres. Contractual
  safeguards reduce but do not remove this. Record a transfer impact assessment. Customers who require strict EU sovereignty
  may object; the storage layer is S3-compatible and can be pointed at an EU-only provider.
- Users may upload screenshots containing other people's personal data, or unlawful content. The Terms need an acceptable-use
  and takedown process, and a way to delete a file by key. Cloudflare can suspend an account for content that breaches its terms.
- Deleting a file or account removes the R2 object immediately (versioning is off). Database backups at Neon have their own
  retention; the retention sentence in the Privacy Policy must reflect the longest of them. Do not enable R2 versioning without
  updating the policy.
- The policy says files are not read or analysed. That must be revised before any text-recognition or AI step is added.

**India.** The first market is India. The Digital Personal Data Protection Act applies; cross-border transfer rules and their
current commencement status should be confirmed by counsel.

**Built-in GDPR tools.** Timestamped, required consent at sign-up; "Download my data" (includes files); "Delete my account"
(database and files); only a strictly necessary session cookie (no cookie banner needed until analytics or marketing cookies are added).

**Before launch.** Fill every bracketed placeholder in `lib/legal.ts` and the policy pages, have counsel review, then set
`LEGAL_STATUS` to `reviewed`. Replace the example case studies with real, approved ones when they exist.

## 9. How it is verified

`npm run verify:tenancy` runs 221 checks against a throwaway database and a built-in fake S3 server: workspace isolation for every
record type, upload safety, account deletion (rows and files), data export, session-token tampering and expiry, the board
rules, the Today bar (time zones, midnight carry-over, the 5-pin limit, swapping), the navigation (search ranking, which campaigns the rail shows), creating campaigns without a creator and assigning one later, and the R2 driver (paging, signed URLs, accepting and refusing uploads, storage limit). `npm run lint` and
`npx tsc --noEmit` must be clean. A production build (`npm run build`) passes.

**Not verified until real accounts exist:** Google sign-in against Google, PostgreSQL, and real R2 (credentials, CORS, lifecycle
rule). The fake S3 server does not check signatures.

## 10. Open items

1. Provide Neon, Google OAuth and Cloudflare R2 credentials (the client's accounts). Then: switch the database to Postgres, create
   a fresh baseline migration, test a real Google login, create the R2 bucket (jurisdiction, token, CORS, lifecycle rule) and
   upload one real image.
2. Counsel review of the Privacy Policy and Terms; company details for the placeholders; customer DPA.
3. Pricing: fill the three tiers' prices; confirm what each tier contains and whether there is a free plan ("Start free" appears on the site).
4. The product name is now Ettuno (decided 13 Oct 2026; trademark pending). The app, website, legal pages, code and repository still say Drribly or Drrible and need one rename sweep.
5. Money now displays in the workspace's currency (the demo workspace is USD), but amounts are still stored as whole units with no per-record currency, and dates ignore the workspace time zone (planned Phase 2).
6. Planned: Today bar, Google Drive/Sheets/Docs connection, reading text from screenshots (needs a vendor decision), warm earth-tone redesign.
7. Today bar rules assumed from the product spec, to be confirmed: pins only (no automatic suggestions), a limit of 5, unfinished pins carry over, and the old task list became "Due today". Ticking Done on a pinned deliverable or invoice only ticks it off the bar; the real status is changed by opening it.
8. Placeholder buttons ("Ask Ettuno", notifications, search) do nothing yet.

## 11. Running it

```bash
npm install
cp .env.example .env     # set SESSION_SECRET
npx prisma db push
npm run db:seed
npm run dev              # http://localhost:3000
```

In development the dev server can serve stale builds after new routes or styles are added; restart `npm run dev` if something new
404s or looks unstyled. See README.md for the file storage setup and the Postgres move.
