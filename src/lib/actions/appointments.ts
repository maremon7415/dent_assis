"use server";

/**
 * Patient appointment actions. Every function authenticates with requireUser() and only ever reads or
 * changes the signed-in patient's own rows. Admin actions live in ./admin.ts.
 */
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import {
  BLOCKING_STATUSES,
  cancelBooking,
  createBooking,
  getSlotsForDay,
  getAvailableDays as loadAvailableDays,
  rescheduleBooking,
} from "@/lib/booking";
import { defer } from "@/lib/defer";
import {
  type AppointmentDTO,
  appointmentInclude,
  toAppointmentDTO,
} from "@/lib/dto";
import {
  sendBookingEmails,
  sendCancellationEmail,
  sendRescheduleEmails,
} from "@/lib/email";
import { AppError, NotFoundError, runAction } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  formatClinicTime,
  legacyStartsAt,
  localDayRange,
  toLocalTime,
} from "@/lib/time";
import {
  availabilityQuerySchema,
  availableDaysQuerySchema,
  type BookAppointmentInput,
  bookAppointmentSchema,
  type CancelInput,
  cancelSchema,
  type RescheduleInput,
  type ReviewInput,
  rescheduleSchema,
  reviewSchema,
} from "@/lib/validation";

export interface SlotDTO {
  /** clinic-local "HH:mm" */
  time: string;
  label: string;
  startsAt: string;
  endsAt: string;
}

export interface MyAppointmentsDTO {
  upcoming: AppointmentDTO[];
  past: AppointmentDTO[];
}

export interface MyStatsDTO {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  noShow: number;
  nextAppointment: AppointmentDTO | null;
  lastVisit: AppointmentDTO | null;
  /** Legacy names read by the current dashboard. */
  totalAppointments: number;
  completedAppointments: number;
}

export type BookedAppointmentDTO = AppointmentDTO & { patientEmail: string };

async function myAppointments(userId: string): Promise<MyAppointmentsDTO> {
  const now = new Date();
  const rows = await prisma.appointment.findMany({
    where: { userId },
    include: appointmentInclude,
    orderBy: [{ startsAt: "asc" }, { date: "asc" }, { time: "asc" }],
  });
  const all = rows.map((a) => toAppointmentDTO(a, now));
  const upcoming = all.filter(
    (a) =>
      (a.status === "CONFIRMED" || a.status === "PENDING") &&
      new Date(a.endsAt).getTime() > now.getTime(),
  );
  const upcomingIds = new Set(upcoming.map((a) => a.id));
  const past = all.filter((a) => !upcomingIds.has(a.id)).reverse();
  return { upcoming, past };
}

/** The signed-in patient's appointments, split into upcoming (soonest first) and past (latest first). */
export async function getMyAppointments(): Promise<
  ActionResult<MyAppointmentsDTO>
> {
  return runAction(async () => myAppointments((await requireUser()).id));
}

async function myStats(userId: string): Promise<MyStatsDTO> {
  const { upcoming, past } = await myAppointments(userId);
  const count = (s: AppointmentDTO["status"]) =>
    past.filter((a) => a.status === s).length;
  const completed = count("COMPLETED");
  const total = upcoming.length + past.length;
  return {
    total,
    upcoming: upcoming.length,
    completed,
    cancelled: count("CANCELLED"),
    noShow: count("NO_SHOW"),
    nextAppointment: upcoming[0] ?? null,
    lastVisit: past.find((a) => a.status === "COMPLETED") ?? null,
    totalAppointments: total,
    completedAppointments: completed,
  };
}

/** Real counts for the patient dashboard. */
export async function getMyStats(): Promise<ActionResult<MyStatsDTO>> {
  return runAction(async () => myStats((await requireUser()).id));
}

/**
 * Start times a dentist can take on a clinic-local date for a service. Public: it reveals only free times.
 * Pass `excludeAppointmentId` (own appointment) when rescheduling so its current slot doesn't block.
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string,
  serviceId?: string | null,
  excludeAppointmentId?: string,
): Promise<ActionResult<SlotDTO[]>> {
  return runAction(async () => {
    const q = availabilityQuerySchema.parse({ doctorId, date, serviceId });
    let exclude: string | undefined;
    if (excludeAppointmentId) {
      const user = await requireUser();
      const own = await prisma.appointment.findFirst({
        where: { id: excludeAppointmentId, userId: user.id },
        select: { id: true },
      });
      exclude = own?.id;
    }
    const slots = await getSlotsForDay(prisma, {
      ...q,
      excludeAppointmentId: exclude,
    });
    return slots.map((s) => ({
      time: s.time,
      label: formatClinicTime(s.startsAt),
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
    }));
  });
}

/** Bookable days (with free-slot counts) for a date picker. */
export async function getAvailableDays(input: {
  doctorId: string;
  serviceId?: string | null;
  from?: string;
  days?: number;
}): Promise<ActionResult<{ date: string; slots: number }[]>> {
  return runAction(async () =>
    loadAvailableDays(prisma, availableDaysQuerySchema.parse(input)),
  );
}

/** Book a slot for the signed-in patient. Fails with SLOT_TAKEN when someone else got it first. */
export async function bookAppointment(
  input: BookAppointmentInput,
): Promise<ActionResult<BookedAppointmentDTO>> {
  return runAction(async () => {
    const user = await requireUser();
    const data = bookAppointmentSchema.parse(input);
    const created = await createBooking({ ...data, userId: user.id });
    defer("booking emails", () => sendBookingEmails(created.id));
    const row = await prisma.appointment.findUniqueOrThrow({
      where: { id: created.id },
      include: appointmentInclude,
    });
    return { ...toAppointmentDTO(row), patientEmail: user.email };
  });
}

/** Move one of the patient's upcoming appointments (min notice applies). The old slot is released. */
export async function rescheduleMyAppointment(
  input: RescheduleInput,
): Promise<ActionResult<AppointmentDTO>> {
  return runAction(async () => {
    const user = await requireUser();
    const data = rescheduleSchema.parse(input);
    const { previous, next } = await rescheduleBooking({
      ...data,
      userId: user.id,
    });
    defer("reschedule emails", () =>
      sendRescheduleEmails(previous.id, next.id),
    );
    const row = await prisma.appointment.findUniqueOrThrow({
      where: { id: next.id },
      include: appointmentInclude,
    });
    return toAppointmentDTO(row);
  });
}

/** Cancel one of the patient's upcoming appointments (min notice applies). */
export async function cancelMyAppointment(
  input: CancelInput,
): Promise<ActionResult<AppointmentDTO>> {
  return runAction(async () => {
    const user = await requireUser();
    const data = cancelSchema.parse(input);
    const cancelled = await cancelBooking({
      ...data,
      by: "PATIENT",
      userId: user.id,
    });
    defer("cancellation email", () => sendCancellationEmail(cancelled.id));
    const row = await prisma.appointment.findUniqueOrThrow({
      where: { id: cancelled.id },
      include: appointmentInclude,
    });
    return toAppointmentDTO(row);
  });
}

/** Review a COMPLETED appointment of your own, once. */
export async function submitReview(
  input: ReviewInput,
): Promise<
  ActionResult<{ id: string; rating: number; comment: string | null }>
> {
  return runAction(async () => {
    const user = await requireUser();
    const data = reviewSchema.parse(input);
    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, userId: user.id },
      select: {
        id: true,
        status: true,
        doctorId: true,
        review: { select: { id: true } },
      },
    });
    if (!appointment) throw new NotFoundError("Appointment not found.");
    if (appointment.status !== "COMPLETED")
      throw new AppError(
        "CONFLICT",
        "You can review a visit once it is completed.",
      );
    if (appointment.review)
      throw new AppError("CONFLICT", "You have already reviewed this visit.");
    // appointmentId is UNIQUE on reviews, so a double submit fails with CONFLICT rather than duplicating.
    const review = await prisma.review.create({
      data: {
        appointmentId: appointment.id,
        userId: user.id,
        doctorId: appointment.doctorId,
        rating: data.rating,
        comment: data.comment,
      },
    });
    return { id: review.id, rating: review.rating, comment: review.comment };
  });
}

// ---------------- legacy names (kept so current pages compile; remove with the page rewrite) ----------------

/** @deprecated use getMyAppointments. Server-component helper: the patient's own appointments, oldest first. */
export async function getUserAppointments(): Promise<AppointmentDTO[]> {
  const user = await requireUser();
  const { upcoming, past } = await myAppointments(user.id);
  return [...[...past].reverse(), ...upcoming];
}

/** @deprecated use getMyStats */
export async function getUserAppointmentStats(): Promise<{
  totalAppointments: number;
  completedAppointments: number;
}> {
  try {
    const stats = await myStats((await requireUser()).id);
    return {
      totalAppointments: stats.total,
      completedAppointments: stats.completed,
    };
  } catch {
    return { totalAppointments: 0, completedAppointments: 0 };
  }
}

/**
 * @deprecated use getAvailableSlots. Start times ("HH:mm", clinic-local) already taken for a doctor on a
 * day; holds no patient data.
 */
export async function getBookedTimeSlots(
  doctorId: string,
  date: string,
): Promise<ActionResult<string[]>> {
  return runAction(async () => {
    const q = availabilityQuerySchema.parse({ doctorId, date });
    const range = localDayRange(q.date);
    const rows = await prisma.appointment.findMany({
      where: {
        doctorId: q.doctorId,
        status: { in: BLOCKING_STATUSES },
        OR: [
          { startsAt: { gte: range.start, lt: range.end } },
          { startsAt: null, date: new Date(`${q.date}T00:00:00.000Z`) },
        ],
      },
      select: { startsAt: true, date: true, time: true },
    });
    return rows
      .map((r) => r.startsAt ?? legacyStartsAt(r.date, r.time))
      .filter((d): d is Date => d !== null)
      .map((d) => toLocalTime(d));
  });
}
