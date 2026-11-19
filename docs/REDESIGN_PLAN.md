# Lumadent — the "next level" rebuild plan

Owner brief (2026-11-19): turn Dent-Assist into a product we can sell. New identity (name, logo, brand),
next-level UI on every page, fix incomplete flows and broken logic, add the missing features a real
dental clinic product needs, harden the backend, and test it (Playwright, Lighthouse, a11y).

## Identity
- **Name:** Lumadent (tagline: "Dental care that answers back."). Every product string comes from
  `src/config/site.ts` so a clinic buying this can white-label it by editing one file.
- **Positioning:** a calm, premium, clinical-but-warm product. Not orange startup-SaaS, not stock "AI glow".
- **Palette direction:** enamel (warm off-white) surfaces, deep ink-teal text and dark surfaces, a clear
  teal primary, a fresh mint accent, a soft coral reserved for warnings/destructive. Light AND dark themes.
- **Type direction:** an expressive display serif for headings, a clean geometric sans for UI; numerals tabular in tables.
- **Logo:** an original SVG mark (tooth silhouette built from a light/crescent form) + wordmark; React `<Logo />`,
  favicon/app icons, OG image. No copied art.

## Non-negotiables
- Every figure shown comes from the database or is clearly marked example copy on marketing pages. No fake stats in the app.
- Authorization on the server for every action: patients only see/change their own data; admin actions require
  the ADMIN role (bootstrap: `ADMIN_EMAILS` env, comma separated, promotes on sync). Hiding a link is not auth.
- No public endpoint may send arbitrary email. Email is sent from server code only.
- Cron endpoints require `Authorization: Bearer $CRON_SECRET`.
- Dates/times are interpreted in the clinic timezone (`CLINIC_TIMEZONE`, default `UTC`).
- No double booking: enforced by the database, not only the UI.
- Money in integer cents.
- Accessibility: keyboard, visible focus, WCAG AA contrast, reduced-motion respected.
- Every mutation shows pending; destructive actions confirm; every list has an empty state with a next action.

## Workstreams
1. Brand + design system (tokens, fonts, logo, site config, app shell/nav, marketing header/footer).
2. Backend: schema (roles, services, doctor schedules, appointment slot integrity, visit notes, reviews),
   secure server actions, email service, cron, seed data, unit tests.
3. Marketing site: home, services, dentists, pricing, about, FAQ, contact; SEO metadata, sitemap, robots.
4. Patient portal: dashboard, booking (service → dentist → real availability → confirm), reschedule/cancel,
   appointment history + visit notes, profile & health info, AI voice assistant page.
5. Admin console: overview analytics, appointments board (filter, status, complete with notes, no-show),
   dentists + weekly schedules, services, patients.
6. QA: Playwright e2e + screenshots (1440 and 375, light and dark), Lighthouse, a11y pass, review.

## Local dev
`service postgresql start`; `.env` has `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dent_assis_dev`.
Clerk runs in keyless mode in `next dev` (keys auto-created in `.clerk/`, gitignored); create test users with the
Clerk Backend API using that secret key. `npm run db:seed` loads demo dentists/services/schedules.
