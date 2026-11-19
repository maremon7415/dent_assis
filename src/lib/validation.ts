/** Zod schemas for every server-action input. Actions parse with these before touching the database. */
import { z } from "zod";
import { DATE_RE, parseLocalDate, TIME_RE } from "./time";

export const idSchema = z.string().trim().min(1, "Required").max(64);
export const localDateSchema = z
  .string()
  .regex(DATE_RE, "Use YYYY-MM-DD")
  .refine((d) => parseLocalDate(d) !== null, "Not a real date");
export const localTimeSchema = z.string().regex(TIME_RE, "Use HH:mm");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const availabilityQuerySchema = z.object({
  doctorId: idSchema,
  date: localDateSchema,
  serviceId: idSchema.optional().nullable(),
});

export const availableDaysQuerySchema = z.object({
  doctorId: idSchema,
  serviceId: idSchema.optional().nullable(),
  from: localDateSchema.optional(),
  days: z.number().int().min(1).max(62).optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: idSchema,
  serviceId: idSchema.optional().nullable(),
  date: localDateSchema,
  time: localTimeSchema,
  /** Free-text reason; defaults to the service name. */
  reason: optionalText(200),
  notes: optionalText(1000),
});
export type BookAppointmentInput = z.input<typeof bookAppointmentSchema>;

export const rescheduleSchema = z.object({
  appointmentId: idSchema,
  date: localDateSchema,
  time: localTimeSchema,
  /** Optional: move to another dentist who offers the same service. */
  doctorId: idSchema.optional(),
});
export type RescheduleInput = z.input<typeof rescheduleSchema>;

export const cancelSchema = z.object({
  appointmentId: idSchema,
  reason: optionalText(500),
});
export type CancelInput = z.input<typeof cancelSchema>;

export const reviewSchema = z.object({
  appointmentId: idSchema,
  rating: z.number().int().min(1).max(5),
  comment: optionalText(2000),
});
export type ReviewInput = z.input<typeof reviewSchema>;

const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .regex(/^[+()\d\s.-]*$/, "Digits, spaces and + ( ) - . only")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const profileSchema = z.object({
  firstName: optionalText(80),
  lastName: optionalText(80),
  phone: phoneSchema,
  dateOfBirth: localDateSchema
    .refine(
      (d) => d >= "1900-01-01" && d <= new Date().toISOString().slice(0, 10),
      "Enter a real date of birth",
    )
    .optional()
    .nullable(),
  allergies: optionalText(2000),
  medications: optionalText(2000),
  medicalNotes: optionalText(4000),
  emergencyContactName: optionalText(120),
  emergencyContactPhone: phoneSchema,
  marketingOptIn: z.boolean().optional(),
});
export type ProfileInput = z.input<typeof profileSchema>;

// ---------- admin ----------

export const statusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "EXPIRED",
]);

export const visitNoteSchema = z.object({
  summary: z.string().trim().min(1, "Write a short summary").max(4000),
  treatment: optionalText(4000),
  followUpInDays: z.number().int().min(1).max(730).optional().nullable(),
});

export const adminUpdateStatusSchema = z.object({
  appointmentId: idSchema,
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  visitNote: visitNoteSchema.optional(),
  reason: optionalText(500),
});
export type AdminUpdateStatusInput = z.input<typeof adminUpdateStatusSchema>;

export const adminUpsertVisitNoteSchema = visitNoteSchema.extend({
  appointmentId: idSchema,
});
export type AdminUpsertVisitNoteInput = z.input<
  typeof adminUpsertVisitNoteSchema
>;

export const adminAppointmentsQuerySchema = z.object({
  status: statusSchema.optional(),
  doctorId: idSchema.optional(),
  /** clinic-local inclusive range */
  from: localDateSchema.optional(),
  to: localDateSchema.optional(),
  search: z.string().trim().max(100).optional(),
  /** CONFIRMED appointments whose end has passed and still need an outcome. */
  needsOutcome: z.boolean().optional(),
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type AdminAppointmentsQuery = z.input<
  typeof adminAppointmentsQuerySchema
>;

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes");

export const doctorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(200)
    .transform((e) => e.toLowerCase()),
  phone: z.string().trim().min(5).max(32),
  speciality: z.string().trim().min(2).max(120),
  gender: z.enum(["MALE", "FEMALE"]),
  isActive: z.boolean().default(true),
  slug: slugSchema.optional(),
  bio: optionalText(4000),
  yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
  languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  education: optionalText(1000),
  imageUrl: z
    .url({ protocol: /^https$/ })
    .max(500)
    .optional(),
  serviceIds: z.array(idSchema).max(100).optional(),
});
export type DoctorInput = z.input<typeof doctorSchema>;
export const doctorUpdateSchema = doctorSchema
  .partial()
  .extend({ id: idSchema });
export type DoctorUpdateInput = z.input<typeof doctorUpdateSchema>;

export const scheduleSchema = z.object({
  doctorId: idSchema,
  windows: z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          startTime: localTimeSchema,
          endTime: z.union([localTimeSchema, z.literal("24:00")]),
        })
        .refine((w) => w.startTime < w.endTime, "End must be after start"),
    )
    .max(50)
    .refine((ws) => {
      for (const a of ws)
        for (const b of ws)
          if (
            a !== b &&
            a.weekday === b.weekday &&
            a.startTime < b.endTime &&
            b.startTime < a.endTime
          )
            return false;
      return true;
    }, "Windows on the same day must not overlap"),
});
export type ScheduleInput = z.input<typeof scheduleSchema>;

export const timeOffSchema = z
  .object({
    doctorId: idSchema,
    startDate: localDateSchema,
    startTime: localTimeSchema.default("00:00"),
    endDate: localDateSchema,
    endTime: z.union([localTimeSchema, z.literal("24:00")]).default("24:00"),
    reason: optionalText(200),
  })
  .refine(
    (t) => `${t.startDate}T${t.startTime}` < `${t.endDate}T${t.endTime}`,
    "End must be after start",
  );
export type TimeOffInput = z.input<typeof timeOffSchema>;

export const serviceSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(1).max(2000),
  durationMinutes: z.number().int().min(5).max(480),
  priceCents: z.number().int().min(0).max(10_000_000),
  category: z.string().trim().min(2).max(60),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});
export type ServiceInput = z.input<typeof serviceSchema>;
export const serviceUpdateSchema = serviceSchema
  .partial()
  .extend({ id: idSchema });
export type ServiceUpdateInput = z.input<typeof serviceUpdateSchema>;

export const adminPatientsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type AdminPatientsQuery = z.input<typeof adminPatientsQuerySchema>;
