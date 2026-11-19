# Dent-Assist

Dent-Assist is an AI-powered Dental Assistant web application designed to streamline appointment booking, notifications, and dental health management.

## Features

- **User Authentication**: Secure signup and login powered by [Clerk](https://clerk.com/).
- **AI Voice Assistant**: Integrated voice capabilities using [Vapi AI](https://vapi.ai/).
- **Appointment Management**: Patients can book, view, and cancel appointments.
- **Automated Email Notifications**: Beautifully designed emails for welcome, appointment confirmations, reminders (24h/1h), and admin notifications, powered by [Resend](https://resend.com/) and [React Email](https://react.email/).
- **Admin Dashboard**: Comprehensive overview of appointments and platform statistics.
- **Modern UI**: Built with [Tailwind CSS v4](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/) components for a responsive, accessible, and stunning user interface.
- **Database**: PostgreSQL database hosted on [Neon](https://neon.tech/) and managed with [Prisma ORM](https://www.prisma.io/).

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix UI)
- **Database ORM**: Prisma
- **Authentication**: Clerk
- **Emails**: Resend + React Email
- **AI Integration**: Vapi AI
- **Form validation**: React Hook Form + Zod
- **Code Quality**: Biome (Linter & Formatter)

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL Database
- API keys for Clerk, Resend, and Vapi AI.

### Environment Variables

Copy `.env.example` to `.env` and fill it in. Every variable is documented there. The backend ones:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | prod | Clerk keys (dev can run keyless) |
| `CLERK_WEBHOOK_SECRET` | prod | Verifies `/api/webhooks/clerk` (svix) |
| `ADMIN_EMAILS` | yes | Comma-separated emails promoted to `ADMIN` on sign-in when verified. Legacy `ADMIN_EMAIL` still works |
| `RESEND_API_KEY` | prod | Email delivery; without it emails are logged and skipped |
| `EMAIL_FROM`, `NEXT_PUBLIC_SUPPORT_EMAIL` | prod | Sender (verified domain) and reply-to |
| `NEXT_PUBLIC_APP_URL` | prod | Base URL for links in emails |
| `CLINIC_TIMEZONE` | yes | IANA zone all dates/times are interpreted in (default `UTC`) |
| `NEXT_PUBLIC_CURRENCY` | no | Display currency for `priceCents` (default `USD`) |
| `CRON_SECRET` | prod | Bearer secret for the reminder job (min 16 chars) |

### Installation

```bash
npm install
service postgresql start          # local Postgres
npm run db:push                   # prisma db push + CHECK constraints (prisma/sql/constraints.sql)
npm run db:seed                   # services, 5 dentists, weekly schedules (idempotent)
npm run db:seed:demo              # optional: demo patients + appointments for screenshots
```

`db push` is non-destructive for this schema: every new column is nullable or defaulted. If Prisma warns about
adding unique indexes (`slotKey`, `slug`) on an existing database, those columns are new and empty, so there is
nothing to lose; review with `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`
and apply with `npx prisma db execute --file <diff.sql>` if you prefer not to pass `--accept-data-loss`.

### Running the Development Server

Start the development server using Turbopack for faster builds:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

- `src/app`: Next.js App Router pages and API route handlers.
- `src/components`: UI components, including shadcn/ui components (`src/components/ui`) and specific sections (landing, dashboard, emails).
- `src/lib`: Utility functions, Prisma client, and Resend instance.
- `prisma`: Prisma schema (`schema.prisma`).

## Scripts

- `npm run dev` / `build` / `start`: Next.js.
- `npm run lint` / `format`: Biome.
- `npm run typecheck`: `tsc --noEmit`.
- `npm test`: unit tests (Vitest): availability, time zones and DST, authorization guards, reminders, error mapping.
- `npm run db:push`: sync the schema and apply CHECK constraints. `npm run db:constraints` re-applies just the constraints.
- `npm run db:seed` / `db:seed:demo`: seed data (see above).
- `npx tsx prisma/scripts/verify-booking-concurrency.ts`: behaviour check against the local DB; proves concurrent
  bookings of one slot give exactly one success, overlapping slots can't both be booked, and reschedule/cancel release slots.

## Backend

### Authorization
- Identity: Clerk. `src/lib/auth.ts` exposes `getCurrentUser()`, `requireUser()`, `requireAdmin()`. The local `User`
  row is created on first sign-in (and by the Clerk webhook), whichever comes first.
- Roles live in the database (`User.role`: `PATIENT` | `ADMIN`). `ADMIN_EMAILS` only bootstraps: a listed, verified email
  is promoted on sync. Promotion is one-way; demote by updating the row.
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
