/**
 * Query-key factory. Every key that depends on parameters includes them, so a doctor/date change never
 * reuses another doctor's cached slots. Invalidate by prefix (e.g. queryKeys.appointments.all).
 */
import type {
  AdminAppointmentsQuery,
  AdminPatientsQuery,
} from "@/lib/validation";

export const queryKeys = {
  appointments: {
    all: ["appointments"] as const,
    mine: () => ["appointments", "mine"] as const,
    myStats: () => ["appointments", "mine", "stats"] as const,
    slots: (
      doctorId: string | null | undefined,
      date: string | null | undefined,
      serviceId?: string | null,
      excludeAppointmentId?: string,
    ) =>
      [
        "appointments",
        "slots",
        doctorId ?? null,
        date ?? null,
        serviceId ?? null,
        excludeAppointmentId ?? null,
      ] as const,
    days: (
      doctorId: string | null | undefined,
      serviceId?: string | null,
      from?: string,
      days?: number,
    ) =>
      [
        "appointments",
        "days",
        doctorId ?? null,
        serviceId ?? null,
        from ?? null,
        days ?? null,
      ] as const,
    booked: (
      doctorId: string | null | undefined,
      date: string | null | undefined,
    ) => ["appointments", "booked", doctorId ?? null, date ?? null] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    active: (serviceId?: string) =>
      ["doctors", "active", serviceId ?? null] as const,
    bySlug: (slug: string) => ["doctors", "slug", slug] as const,
    reviews: (doctorId: string) => ["doctors", "reviews", doctorId] as const,
  },
  services: {
    all: ["services"] as const,
    active: () => ["services", "active"] as const,
  },
  profile: {
    all: ["profile"] as const,
    mine: () => ["profile", "mine"] as const,
  },
  admin: {
    all: ["admin"] as const,
    appointments: (q: AdminAppointmentsQuery = {}) =>
      ["admin", "appointments", q] as const,
    dashboard: () => ["admin", "dashboard"] as const,
    doctors: () => ["admin", "doctors"] as const,
    doctor: (id: string) => ["admin", "doctors", id] as const,
    services: () => ["admin", "services"] as const,
    patients: (q: AdminPatientsQuery = {}) => ["admin", "patients", q] as const,
    patient: (id: string) => ["admin", "patients", "detail", id] as const,
  },
} as const;
