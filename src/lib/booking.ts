/**
 * Booking service: the only code that creates, moves or releases appointment slots.
 * Server actions call it after authorization; scripts/tests may call it directly.
 *
 * Double booking is prevented twice over:
 *  1. Inside the transaction, a per-doctor (and per-patient) advisory lock serialises bookings and the
 *     overlap check runs against fresh data, so overlapping appointments of different lengths can't race.
 *  2. `Appointment.slotKey` is UNIQUE while an appointment holds its slot, so even a code path that
 *     skipped the lock could not store two bookings with the same doctor and start (P2002 -> SLOT_TAKEN).
 */
import type { AppointmentStatus, Prisma, PrismaClient } from "@prisma/client";
import { siteConfig } from "@/config/site";
import {
  type AvailabilityRules,
  checkBookableDate,
  computeAvailableSlots,
  hasMinNotice,
  type Interval,
  overlaps,
  type Slot,
  slotKeyFor,
} from "./availability";
import { AppError, NotFoundError } from "./errors";
import { prisma } from "./prisma";
import {
  addDaysToLocalDate,
  clinicTimeZone,
  legacyDateColumn,
  legacyStartsAt,
  localDayRange,
  localToUtc,
  todayInClinic,
} from "./time";

type Db = PrismaClient | Prisma.TransactionClient;

/** Statuses that occupy the doctor's time. */
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
];
/** Statuses a patient or admin can still cancel / reschedule. */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED"];

export function clinicRules(): AvailabilityRules {
  return {
    timeZone: clinicTimeZone(),
    slotMinutes: siteConfig.clinic.slotMinutes,
    minNoticeHours: siteConfig.clinic.minNoticeHours,
    bookingWindowDays: siteConfig.clinic.bookingWindowDays,
  };
}

/** Appointment interval, deriving it for legacy rows that predate startsAt/endsAt. */
export function appointmentInterval(a: {
  startsAt: Date | null;
  endsAt: Date | null;
  date: Date;
  time: string;
  duration: number;
}): Interval | null {
  const startsAt = a.startsAt ?? legacyStartsAt(a.date, a.time);
  if (!startsAt) return null;
  const endsAt = a.endsAt ?? new Date(startsAt.getTime() + a.duration * 60_000);
  return { startsAt, endsAt };
}

async function lockKeys(tx: Prisma.TransactionClient, keys: string[]) {
  // Always acquire in sorted order so two transactions can never deadlock on each other.
  for (const key of [...new Set(keys)].sort()) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
  }
}

export interface AvailabilityContext {
  schedules: { weekday: number; startTime: string; endTime: string }[];
  timeOff: Interval[];
  busy: Interval[];
}

/** Load everything that limits a doctor's availability within [start, end). */
export async function loadAvailabilityContext(
  db: Db,
  doctorId: string,
  range: { start: Date; end: Date },
  excludeAppointmentId?: string,
): Promise<AvailabilityContext> {
  const legacyFrom = new Date(range.start.getTime() - 2 * 864e5);
  const legacyTo = new Date(range.end.getTime() + 2 * 864e5);
  const [schedules, timeOff, appts] = await Promise.all([
    db.doctorSchedule.findMany({
      where: { doctorId },
      select: { weekday: true, startTime: true, endTime: true },
    }),
    db.doctorTimeOff.findMany({
      where: {
        doctorId,
        startsAt: { lt: range.end },
        endsAt: { gt: range.start },
      },
      select: { startsAt: true, endsAt: true },
    }),
    db.appointment.findMany({
      where: {
        doctorId,
        status: { in: BLOCKING_STATUSES },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        OR: [
          { startsAt: { lt: range.end }, endsAt: { gt: range.start } },
          { startsAt: null, date: { gte: legacyFrom, lte: legacyTo } },
        ],
      },
      select: {
        startsAt: true,
        endsAt: true,
        date: true,
        time: true,
        duration: true,
      },
    }),
  ]);
  const busy = appts
    .map(appointmentInterval)
    .filter((i): i is Interval => i !== null);
  return { schedules, timeOff, busy };
}

export interface ResolvedService {
  id: string | null;
  name: string | null;
  durationMinutes: number;
  priceCents: number | null;
}

/** The service being booked (must be offered by the doctor), or the default one-slot consultation. */
export async function resolveService(
  db: Db,
  doctorId: string,
  serviceId?: string | null,
): Promise<ResolvedService> {
  if (!serviceId) {
    return {
      id: null,
      name: null,
      durationMinutes: siteConfig.clinic.slotMinutes,
      priceCents: null,
    };
  }
  const service = await db.service.findFirst({
    where: {
      id: serviceId,
      isActive: true,
      doctors: { some: { id: doctorId } },
    },
    select: { id: true, name: true, durationMinutes: true, priceCents: true },
  });
  if (!service)
    throw new AppError(
      "VALIDATION",
      "This dentist does not offer that treatment.",
    );
  return service;
}

export async function getSlotsForDay(
  db: Db,
  params: {
    doctorId: string;
    date: string;
    serviceId?: string | null;
    excludeAppointmentId?: string;
  },
  now: Date = new Date(),
): Promise<Slot[]> {
  const rules = clinicRules();
  if (!checkBookableDate(params.date, now, rules).ok) return [];
  const doctor = await db.doctor.findFirst({
    where: { id: params.doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) throw new NotFoundError("Dentist not found.");
  const service = await resolveService(db, params.doctorId, params.serviceId);
  const range = localDayRange(params.date, rules.timeZone);
  const ctx = await loadAvailabilityContext(
    db,
    params.doctorId,
    range,
    params.excludeAppointmentId,
  );
  return computeAvailableSlots({
    ...rules,
    ...ctx,
    date: params.date,
    durationMinutes: service.durationMinutes,
    now,
  });
}

/** For a date picker: each bookable day in a range and how many starts it offers. */
export async function getAvailableDays(
  db: Db,
  params: {
    doctorId: string;
    serviceId?: string | null;
    from?: string;
    days?: number;
  },
  now: Date = new Date(),
): Promise<{ date: string; slots: number }[]> {
  const rules = clinicRules();
  const today = todayInClinic(now, rules.timeZone);
  const from = params.from && params.from > today ? params.from : today;
  const last = addDaysToLocalDate(today, rules.bookingWindowDays);
  const dates: string[] = [];
  for (
    let d = from, i = 0;
    d <= last && i < (params.days ?? rules.bookingWindowDays + 1);
    d = addDaysToLocalDate(d, 1), i++
  ) {
    dates.push(d);
  }
  if (dates.length === 0) return [];
  const doctor = await db.doctor.findFirst({
    where: { id: params.doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) throw new NotFoundError("Dentist not found.");
  const service = await resolveService(db, params.doctorId, params.serviceId);
  const range = {
    start: localDayRange(dates[0], rules.timeZone).start,
    end: localDayRange(dates[dates.length - 1], rules.timeZone).end,
  };
  const ctx = await loadAvailabilityContext(db, params.doctorId, range);
  return dates.map((date) => ({
    date,
    slots: computeAvailableSlots({
      ...rules,
      ...ctx,
      date,
      durationMinutes: service.durationMinutes,
      now,
    }).length,
  }));
}

export interface CreateBookingParams {
  userId: string;
  doctorId: string;
  serviceId?: string | null;
  date: string;
  time: string;
  reason?: string | null;
  notes?: string | null;
}

/**
 * Abuse guard for patient self-service: at most N bookings/cancellations per patient per window,
 * counted from the appointments table (no in-memory state, so it holds across serverless instances).
 */
export async function assertPatientChangeRate(
  db: Db,
  userId: string,
  now: Date,
) {
  const { maxPatientChangesPerWindow, changeWindowMinutes } = siteConfig.clinic;
  const since = new Date(now.getTime() - changeWindowMinutes * 60_000);
  const recent = await db.appointment.count({
    where: {
      userId,
      OR: [
        { createdAt: { gte: since } },
        { cancelledAt: { gte: since }, cancelledBy: "PATIENT" },
      ],
    },
  });
  if (recent >= maxPatientChangesPerWindow) {
    throw new AppError(
      "RATE_LIMITED",
      `You've made a lot of changes in the last ${changeWindowMinutes} minutes. Please wait a few minutes and try again, or call ${siteConfig.phone}.`,
    );
  }
}

/** Cap on upcoming visits one patient may hold. Run under the patient lock. */
async function assertUnderActiveCap(db: Db, userId: string, now: Date) {
  const cap = siteConfig.clinic.maxActiveBookingsPerPatient;
  const active = await db.appointment.count({
    where: {
      userId,
      status: { in: ACTIVE_STATUSES },
      OR: [
        { startsAt: { gt: now } },
        // legacy rows without startsAt: anything from yesterday (clinic-local) on
        { startsAt: null, date: { gte: new Date(now.getTime() - 864e5) } },
      ],
    },
  });
  if (active >= cap) {
    throw new AppError(
      "LIMIT_REACHED",
      `You already have ${cap} upcoming visits. Cancel or reschedule one of them, or call ${siteConfig.phone}, to book another.`,
    );
  }
}

/** Validate the slot under lock and insert. Must run inside a transaction. */
async function insertBooking(
  tx: Prisma.TransactionClient,
  p: CreateBookingParams & {
    rescheduledFromId?: string;
    /** Reschedule: keep the original booking's price snapshot and status. */
    keep?: { priceCents: number | null; status: AppointmentStatus };
  },
  now: Date,
) {
  const rules = clinicRules();
  const dateCheck = checkBookableDate(p.date, now, rules);
  if (!dateCheck.ok) {
    throw new AppError(
      "VALIDATION",
      dateCheck.reason === "OUTSIDE_WINDOW"
        ? `You can book up to ${rules.bookingWindowDays} days ahead.`
        : "Please choose a future date.",
    );
  }
  const doctor = await tx.doctor.findFirst({
    where: { id: p.doctorId, isActive: true },
    select: { id: true },
  });
  if (!doctor) throw new NotFoundError("Dentist not found.");
  const service = await resolveService(tx, p.doctorId, p.serviceId);

  const range = localDayRange(p.date, rules.timeZone);
  const ctx = await loadAvailabilityContext(tx, p.doctorId, range);
  const input = {
    ...rules,
    ...ctx,
    date: p.date,
    durationMinutes: service.durationMinutes,
    now,
  };
  const slot = computeAvailableSlots(input).find((s) => s.time === p.time);
  if (!slot) {
    // Distinguish "someone else holds it" from "never offered" for a better message.
    const free = computeAvailableSlots({ ...input, busy: [] }).some(
      (s) => s.time === p.time,
    );
    throw free
      ? new AppError(
          "SLOT_TAKEN",
          "That time was just taken. Please pick another slot.",
        )
      : new AppError(
          "VALIDATION",
          "That time is not available. Please pick one of the offered slots.",
        );
  }

  // The patient's own overlapping visits, including legacy rows without startsAt (as the doctor check).
  const mine = await tx.appointment.findMany({
    where: {
      userId: p.userId,
      status: { in: ACTIVE_STATUSES },
      OR: [
        { startsAt: { lt: slot.endsAt }, endsAt: { gt: slot.startsAt } },
        {
          startsAt: null,
          date: {
            gte: new Date(range.start.getTime() - 2 * 864e5),
            lte: new Date(range.end.getTime() + 2 * 864e5),
          },
        },
      ],
    },
    select: {
      startsAt: true,
      endsAt: true,
      date: true,
      time: true,
      duration: true,
    },
  });
  const clash = mine
    .map(appointmentInterval)
    .some((i) => i !== null && overlaps(i, slot));
  if (clash)
    throw new AppError(
      "CONFLICT",
      "You already have an appointment at that time.",
    );

  return tx.appointment.create({
    data: {
      userId: p.userId,
      doctorId: p.doctorId,
      serviceId: service.id,
      date: legacyDateColumn(p.date),
      time: slot.time,
      duration: Math.round(
        (slot.endsAt.getTime() - slot.startsAt.getTime()) / 60_000,
      ),
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      status: p.keep?.status ?? "CONFIRMED",
      priceCents: p.keep ? p.keep.priceCents : service.priceCents,
      reason: p.reason ?? service.name ?? "Consultation",
      notes: p.notes ?? null,
      slotKey: slotKeyFor(p.doctorId, slot.startsAt),
      rescheduledFromId: p.rescheduledFromId ?? null,
    },
  });
}

const TX_OPTIONS = { maxWait: 5_000, timeout: 15_000 } as const;

export async function createBooking(
  p: CreateBookingParams,
  now: Date = new Date(),
  db: PrismaClient = prisma,
) {
  return db.$transaction(async (tx) => {
    await lockKeys(tx, [`doctor:${p.doctorId}`, `patient:${p.userId}`]);
    // Under the patient lock, so parallel requests cannot all pass the checks.
    await assertPatientChangeRate(tx, p.userId, now);
    await assertUnderActiveCap(tx, p.userId, now);
    return insertBooking(tx, p, now);
  }, TX_OPTIONS);
}

/** Owner-checked: returns the appointment only if `userId` owns it. */
async function findOwned(tx: Db, appointmentId: string, userId: string) {
  const a = await tx.appointment.findFirst({
    where: { id: appointmentId, userId },
  });
  // Same message whether it doesn't exist or belongs to someone else (no id probing).
  if (!a) throw new NotFoundError("Appointment not found.");
  return a;
}

export async function rescheduleBooking(
  p: {
    userId: string;
    appointmentId: string;
    date: string;
    time: string;
    doctorId?: string;
  },
  now: Date = new Date(),
  db: PrismaClient = prisma,
) {
  return db.$transaction(async (tx) => {
    const current = await findOwned(tx, p.appointmentId, p.userId);
    const doctorId = p.doctorId ?? current.doctorId;
    await lockKeys(tx, [
      `doctor:${doctorId}`,
      `doctor:${current.doctorId}`,
      `patient:${p.userId}`,
    ]);
    // A reschedule replaces a visit, so the active cap does not apply; the rate limit does.
    await assertPatientChangeRate(tx, p.userId, now);

    // Re-read under lock: the status may have changed while we waited.
    const locked = await findOwned(tx, p.appointmentId, p.userId);
    if (!ACTIVE_STATUSES.includes(locked.status)) {
      throw new AppError(
        "CONFLICT",
        "Only upcoming appointments can be rescheduled.",
      );
    }
    const interval = appointmentInterval(locked);
    if (
      !interval ||
      !hasMinNotice(interval.startsAt, now, siteConfig.clinic.minNoticeHours)
    ) {
      throw new AppError(
        "TOO_LATE",
        `Appointments can be moved online up to ${siteConfig.clinic.minNoticeHours} hours before. Please call the clinic.`,
      );
    }

    const requested = localToUtc(p.date, p.time, clinicTimeZone());
    if (
      doctorId === locked.doctorId &&
      requested?.getTime() === interval.startsAt.getTime()
    ) {
      throw new AppError(
        "VALIDATION",
        "That is already your appointment time.",
      );
    }

    // Release the old slot first so the new booking may reuse overlapping time on the same doctor.
    const previous = await tx.appointment.update({
      where: { id: locked.id },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelledBy: "PATIENT",
        cancelReason: "Rescheduled",
        slotKey: null,
      },
    });
    const next = await insertBooking(
      tx,
      {
        userId: p.userId,
        doctorId,
        serviceId: locked.serviceId,
        date: p.date,
        time: p.time,
        reason: locked.reason,
        notes: locked.notes,
        rescheduledFromId: locked.id,
        keep: { priceCents: locked.priceCents, status: locked.status },
      },
      now,
    );
    return { previous, next };
  }, TX_OPTIONS);
}

export async function cancelBooking(
  p: {
    appointmentId: string;
    reason?: string | null;
    by: "PATIENT" | "ADMIN" | "SYSTEM";
    userId?: string;
  },
  now: Date = new Date(),
  db: PrismaClient = prisma,
) {
  const where = p.userId
    ? { id: p.appointmentId, userId: p.userId }
    : { id: p.appointmentId };
  const appointment = await db.appointment.findFirst({ where });
  if (!appointment) throw new NotFoundError("Appointment not found.");
  if (!ACTIVE_STATUSES.includes(appointment.status)) {
    throw new AppError(
      "CONFLICT",
      "This appointment can no longer be cancelled.",
    );
  }
  if (p.by === "PATIENT") {
    if (p.userId) await assertPatientChangeRate(db, p.userId, now);
    const interval = appointmentInterval(appointment);
    if (
      !interval ||
      !hasMinNotice(interval.startsAt, now, siteConfig.clinic.minNoticeHours)
    ) {
      throw new AppError(
        "TOO_LATE",
        `Appointments can be cancelled online up to ${siteConfig.clinic.minNoticeHours} hours before. Please call the clinic.`,
      );
    }
  }
  // Conditional update: a concurrent status change makes count 0 instead of overwriting it.
  const updated = await db.appointment.updateMany({
    where: { ...where, status: { in: ACTIVE_STATUSES } },
    data: {
      status: "CANCELLED",
      cancelledAt: now,
      cancelledBy: p.by,
      cancelReason: p.reason ?? null,
      slotKey: null,
    },
  });
  if (updated.count === 0)
    throw new AppError(
      "CONFLICT",
      "This appointment was just changed. Please refresh.",
    );
  return db.appointment.findUniqueOrThrow({ where: { id: p.appointmentId } });
}
