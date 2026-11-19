/**
 * The one place a clinic edits to white-label the product.
 * Product strings, contact details and clinic rules come from here, never hard-coded in components.
 */
export const siteConfig = {
  name: "Lumadent",
  tagline: "Dental care that answers back.",
  description:
    "Lumadent is a modern dental clinic platform: book the right dentist in under a minute, get answers from an AI voice assistant any time, and keep your care history in one place.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** Sender used for transactional email; the domain must be verified in Resend. */
  emailFrom: process.env.EMAIL_FROM ?? "Lumadent <no-reply@lumadent.app>",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "care@lumadent.app",
  /**
   * Clerk Billing (AI assistant plans). Off until billing is enabled and plans are published in the
   * Clerk dashboard; while off, the pricing pages show a plain next step instead of mounting Clerk's
   * PricingTable (which errors when billing is disabled).
   */
  billingEnabled: process.env.NEXT_PUBLIC_CLERK_BILLING_ENABLED === "true",
  phone: process.env.NEXT_PUBLIC_CLINIC_PHONE ?? "+1 (555) 010-2040",
  address:
    process.env.NEXT_PUBLIC_CLINIC_ADDRESS ??
    "128 Harbor Street, Suite 4, Springfield",
  clinic: {
    /** IANA zone every appointment date/time is interpreted in. */
    timezone: process.env.CLINIC_TIMEZONE ?? "UTC",
    currency: process.env.NEXT_PUBLIC_CURRENCY ?? "USD",
    locale: "en-US",
    /** Slot grid in minutes; a service's duration is rounded up to whole slots. */
    slotMinutes: 30,
    /** How far ahead patients may book. */
    bookingWindowDays: 30,
    /** Minimum notice before an appointment can be booked, moved or cancelled online. */
    minNoticeHours: 2,
    /** Upcoming (pending or confirmed) visits one patient may hold at once. */
    maxActiveBookingsPerPatient: 3,
    /** Abuse guard: at most this many online bookings/cancellations per patient per window. */
    maxPatientChangesPerWindow: 10,
    changeWindowMinutes: 10,
  },
} as const;

export type SiteConfig = typeof siteConfig;
