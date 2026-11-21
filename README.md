# Lumadent

**Dental care that answers back.** Lumadent is a dental clinic platform: patients book the right dentist in under a
minute from the clinic's real diary, manage and review their visits, and ask an AI voice assistant about their teeth
at any hour. Staff run the day from a clinic console. Every product string, contact detail and booking rule comes from
one file, so a clinic can ship it under its own name (see [White-labelling](#white-labelling)).

## Features

**Patients**
- Guided booking in four steps (service, dentist or "any available", day and time from real availability, review),
  with the whole state in the URL so refresh, back and shared links work. Deep links such as
  `/appointments?service=checkup-and-clean&doctor=amara-okafor` start part-way through.
- My visits: upcoming and past visits, reschedule (same dentist and service), cancel with a reason, add to calendar
  (.ics), read the dentist's visit note, and leave a star review after a completed visit.
- Dashboard with the next visit, health profile (allergies, medications, emergency contact) and Clerk account settings.
- AI voice assistant (Vapi) and AI plans through Clerk Billing (optional, see `NEXT_PUBLIC_CLERK_BILLING_ENABLED`).
- Email: welcome, confirmation, reschedule, cancellation, and 24 h / 1 h reminders (Resend + React Email).

**Clinic console (`/admin`, role `ADMIN`)**
- Overview: today's schedule, the week ahead, visits that need an outcome, and figures computed from the database.
- Appointments board: filter by status, dentist, dates and text; confirm, complete with a visit note, mark no-show, cancel.
- Dentists: profiles, services offered, weekly schedules (several windows a day, up to midnight) and time off.
- Services (name, duration, price in integer cents) and patients (history and health profile).

**Platform**
- No double booking, enforced by the database; per-patient booking caps and change rate limits.
- Server-side authorization on every action; roles live in the database.
- Light and dark themes, keyboard and screen-reader friendly (axe-checked), reduced motion respected.
- Public pages with SEO metadata, sitemap, robots and Open Graph image.

## Screenshots

Screenshots of every page at 1440 px and 375 px, light and dark, belong in [`docs/screenshots/`](docs/). Regenerate
them from a running app with Playwright (the e2e helpers in `e2e/` show how to sign in a test user) and link the ones
you want to show here.

## Tech stack

Next.js 16 (App Router, React 19, Turbopack) · TypeScript · Tailwind CSS v4 + shadcn/ui (Radix) · Clerk (`@clerk/nextjs` 7)
· Prisma 6 on PostgreSQL · TanStack Query · React Hook Form + Zod · Resend + React Email · Vapi · Vitest · Playwright +
axe · Biome.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+ (local or hosted, e.g. Neon)
- A Clerk application (a development instance is enough locally). Resend and Vapi keys are optional in development.

### 1. Install

```bash
npm install
```

### 2. Database

```bash
service postgresql start            # or point DATABASE_URL at a hosted database
createdb dent_assis_dev             # once
```

### 3. Environment

Copy `.env.example` to `.env` (shared settings) and put secrets in `.env.local` (also gitignored; Next and the e2e
tests load both, `.env.local` wins). Every variable is documented in `.env.example`; the main ones:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | yes | Clerk keys. Required in development too since `@clerk/nextjs` 7 (its middleware no longer runs keyless); `npx clerk@latest init` writes temporary development keys |
| `CLERK_WEBHOOK_SECRET` | prod | Verifies `/api/webhooks/clerk` (svix) |
| `NEXT_PUBLIC_CLERK_BILLING_ENABLED` | no | `true` once Clerk Billing is on and plans are published; otherwise plan tables show a fallback |
| `ADMIN_EMAILS` | yes | Comma-separated emails promoted to `ADMIN` on sign-in when verified. Legacy `ADMIN_EMAIL` still works |
| `RESEND_API_KEY` | prod | Email delivery; without it emails are logged and skipped |
| `EMAIL_FROM`, `NEXT_PUBLIC_SUPPORT_EMAIL` | prod | Sender (verified domain) and reply-to |
| `NEXT_PUBLIC_APP_URL` | prod | Base URL for links in emails and metadata |
| `CLINIC_TIMEZONE` | yes | IANA zone all dates/times are interpreted in (default `UTC`) |
| `NEXT_PUBLIC_CURRENCY`, `NEXT_PUBLIC_CLINIC_PHONE`, `NEXT_PUBLIC_CLINIC_ADDRESS` | no | Display currency and contact details |
| `CRON_SECRET` | prod | Bearer secret for the reminder job (min 16 chars) |
| `NEXT_PUBLIC_VAPI_API_KEY`, `NEXT_PUBLIC_VAPI_ASSISTANT_ID` | no | AI voice assistant |

### 4. Schema and seed data

```bash
npm run db:push                     # prisma db push + CHECK constraints (prisma/sql/constraints.sql)
npm run db:seed                     # services, 5 dentists, weekly schedules (idempotent)
npm run db:seed:demo                # optional: demo patients + appointments for screenshots
```

`db push` is non-destructive for this schema: every new column is nullable or defaulted. If Prisma warns about
adding unique indexes (`slotKey`, `slug`) on an existing database, those columns are new and empty, so there is
nothing to lose; review with `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`
and apply with `npx prisma db execute --file <diff.sql>` if you prefer not to pass `--accept-data-loss`.

### 5. Run

```bash
npm run dev                         # http://localhost:3000
```

Sign up, then make yourself an admin by adding your email to `ADMIN_EMAILS` (promotion happens on the next sign-in) or
with `UPDATE users SET role = 'ADMIN' WHERE email = '…';`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js (build runs `prisma generate` first) |
| `npm run lint` / `format` | Biome check / format |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (Vitest): availability, time zones and DST, booking rules, authorization guards, reminders, email, DTOs |
| `npm run test:e2e` | End-to-end and accessibility tests (Playwright + axe) against a production build, see below |
| `npm run db:push` / `db:constraints` | Sync the schema and CHECK constraints / re-apply just the constraints |
| `npm run db:seed` / `db:seed:demo` | Seed data |
| `npm run admin:revoke -- email` | Demote an admin (see [Authorization](#authorization)) |
| `npx tsx prisma/scripts/verify-booking-concurrency.ts` | Proves against the local DB that concurrent bookings of one slot give exactly one success |

### End-to-end tests

`npm run test:e2e` builds the app, starts it on port 3200 (`next build && next start -p 3200`, or reuses a server
already on that port outside CI) and runs `e2e/`:

- public pages render with no console errors (home, services, dentists, a dentist profile, pricing, about, FAQ, 404);
- a signed-out visit to `/dashboard` goes to sign-in, and deep links keep all their query parameters;
- a patient signs in through the real Clerk UI, books from `/services` "Book this", sees the visit, reschedules and
  cancels it; a second patient can't see it; a non-admin is sent away from `/admin`;
- an admin completes a past visit with a visit note; the patient reads it and leaves a review;
- axe (WCAG 2.2 A/AA) on public, portal and console pages in light and dark; serious or critical violations fail.

It needs Postgres with the seed loaded and **Clerk development keys** (`sk_test_…`) in `.env.local`. Each run creates
its own users through the Clerk Backend API (`…+clerk_test@example.com`, verification code 424242) and its own rows;
it never changes data it didn't create, and removes its Clerk users at the end. Playwright's Chromium must be
installed (`npx playwright install chromium` where it isn't preinstalled).

## Deploying on Netlify

1. Create the site from the repository. Build command `npm run build`, publish directory `.next`; Netlify's Next.js
   runtime is picked up automatically.
2. Environment variables (Site configuration → Environment variables): everything marked *prod* or *yes* above, with
   **production** Clerk keys, `NEXT_PUBLIC_APP_URL` set to the site URL, and `CRON_SECRET` (a random string of 16+
   characters, e.g. `openssl rand -hex 24`). Mark secrets as secret and scope them to builds and functions.
3. Database: apply the schema **before** deploying a version that needs it, from your machine or a CI step with the
   production `DATABASE_URL`: `npm run db:push`, then `npm run db:seed` the first time.
4. Clerk: add the production domain, create a webhook to `https://<site>/api/webhooks/clerk` for `user.created`,
   `user.updated` and `user.deleted`, and put its signing secret in `CLERK_WEBHOOK_SECRET`.
5. Reminders: `netlify/functions/process-appointments.mts` is a Scheduled Function (`@hourly`) that calls
   `/api/cron/process-appointments` on the site's `URL` with `Authorization: Bearer $CRON_SECRET`. It runs only on
   published deploys; check its log under Functions after the first hour.

## White-labelling

Edit [`src/config/site.ts`](src/config/site.ts): product name and tagline, description, sender and support email,
phone and address (or their `NEXT_PUBLIC_…` variables), clinic timezone, currency and locale, and the booking rules
(slot grid, booking window, minimum notice, per-patient caps). Components read these values, never hard-coded copy.
Colours and type are tokens in `src/app/globals.css` (light and dark), and the logo is the `<Logo />` component in
`src/components/brand`; brand guidance is in [`docs/BRAND.md`](docs/BRAND.md).

## Project structure

- `src/app`: App Router pages (public site, `(portal)` patient portal, `admin` console) and API routes (Clerk webhook, cron).
- `src/components`: UI by area (`marketing`, `appointments`, `portal`, `admin`, `layout`, `brand`, `emails`) and shadcn/ui in `ui`.
- `src/lib`: auth, booking and availability, time zones, DTOs, email, validation, server actions (`actions/`).
- `src/hooks`: TanStack Query hooks over the server actions.
- `prisma`: schema, CHECK constraints, seed and scripts. `e2e`: Playwright tests. `netlify/functions`: scheduled job.

## Backend

### Authorization
- Identity: Clerk. `src/lib/auth.ts` exposes `getCurrentUser()`, `requireUser()`, `requireAdmin()`. The local `User`
  row is created on first sign-in (and by the Clerk webhook), whichever comes first, and only for a verified primary
  email. If a new Clerk account arrives with an email already on a row, the row is re-linked only when Clerk confirms
  the old account is deleted; the role is then reset to `PATIENT` (and re-checked against `ADMIN_EMAILS`).
- Roles live in the database (`User.role`: `PATIENT` | `ADMIN`). `ADMIN_EMAILS` only bootstraps: a listed, verified email
  is promoted on sync. Promotion is one-way: **removing an email from `ADMIN_EMAILS` does not demote anyone.**
- Revoking an admin (takes effect on their next request):
  1. Remove the email from `ADMIN_EMAILS` / `ADMIN_EMAIL` locally and in the deployed environment (otherwise their next
     sign-in promotes them again).
  2. Run `npm run admin:revoke -- someone@clinic.example` against that environment's `DATABASE_URL`. It sets the role
     to `PATIENT`, and refuses while the email is still listed in the environment it sees. The equivalent SQL is
     `UPDATE users SET role = 'PATIENT' WHERE email = 'someone@clinic.example' AND role = 'ADMIN';`
- Every server action checks the caller itself. Patient actions only read/change the caller's rows; admin actions
  (`admin*` in `src/lib/actions/admin.ts`) require `ADMIN`. `src/proxy.ts` only redirects signed-out visitors.
- Server actions return `ActionResult<T>` (`{ ok: true, data } | { ok: false, code, error, fieldErrors? }`) instead of
  throwing (Next hides thrown messages in production). Hooks in `src/hooks` call `unwrap()` and throw `ActionFailedError`
  with the `code` (e.g. `SLOT_TAKEN`, `TOO_LATE`).

### Booking rules
- Times: `Appointment.startsAt`/`endsAt` are UTC instants computed from the clinic timezone. `date` + `time` are kept
  for legacy readers. Availability = doctor's weekly schedule - time off - blocking appointments (overlap-aware),
  on a `slotMinutes` grid, honouring `minNoticeHours` and `bookingWindowDays` from `src/config/site.ts`.
- No double booking, enforced by the database: `slotKey` (`doctorId|startsAt`) is UNIQUE while an appointment holds its
  slot and cleared on cancel/no-show; booking runs in a transaction under a per-doctor advisory lock so overlapping
  slots of different lengths can't race either.
- Prices are snapshotted to `Appointment.priceCents` (integer cents) at booking time.
- Dentists are never deleted (appointments reference them with `ON DELETE RESTRICT`); deactivate instead.
- Deleting a Clerk account soft-deletes the user: personal and health data are erased, future appointments cancelled,
  history (appointments, visit notes, ratings) kept.

### Email
`src/lib/email.ts` renders the React Email templates in `src/components/emails` and sends through Resend from server code
only: welcome, booking confirmation, reschedule, cancellation, admin new-booking notice (to `ADMIN_EMAILS`), 24h and 1h
reminders. There is no public send-email endpoint. Sends run after the response and never fail a booking.

### Reminder job
`GET|POST /api/cron/process-appointments` with `Authorization: Bearer $CRON_SECRET` (401 without it; 503 if the secret
is not configured). Idempotent: each reminder is claimed before sending and released if the send fails.
- **Netlify** (deployed): `netlify/functions/process-appointments.mts` is a Scheduled Function (`@hourly`) that calls
  the route on `$URL` with the secret. Set `CRON_SECRET` in the site's environment variables.
- **Any other scheduler**: call the route hourly, e.g.
  `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-site/api/cron/process-appointments`.

Past appointments are not auto-expired: a `CONFIRMED` appointment whose end has passed stays `CONFIRMED` until staff
record `COMPLETED` (with a visit note) or `NO_SHOW`. The job reports how many need an outcome, and admins list them with
`adminGetAppointments({ needsOutcome: true })`.
