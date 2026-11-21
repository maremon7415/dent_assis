"use server";

/**
 * Admin console actions. Every function starts with requireAdmin(); the role comes from the database,
 * never from the client or a page-level email check.
 */
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { siteConfig } from "@/config/site";
import type { ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth";
import { slotKeyFor, summariseSchedule } from "@/lib/availability";
import {
  ACTIVE_STATUSES,
  appointmentInterval,
  cancelBooking,
} from "@/lib/booking";
import { defer } from "@/lib/defer";
import {
  type AdminAppointmentDTO,
  adminAppointmentInclude,
  fullName,
  toAdminAppointmentDTO,
} from "@/lib/dto";
import { sendCancellationEmail } from "@/lib/email";
import { AppError, NotFoundError, runAction } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
  addDaysToLocalDate,
  clinicTimeZone,
  localDayRange,
  localToUtc,
  timeToMinutes,
  todayInClinic,
  weekdayOfLocalDate,
} from "@/lib/time";
import { generateAvatar } from "@/lib/utils";
import {
  type AdminAppointmentsQuery,
  type AdminPatientsQuery,
  type AdminUpdateStatusInput,
  type AdminUpsertVisitNoteInput,
  adminAppointmentsQuerySchema,
  adminPatientsQuerySchema,
  adminUpdateStatusSchema,
  adminUpsertVisitNoteSchema,
  type DoctorInput,
  type DoctorUpdateInput,
  doctorSchema,
  doctorUpdateSchema,
  idSchema,
  type ScheduleInput,
  type ServiceInput,
  type ServiceUpdateInput,
  scheduleSchema,
  serviceSchema,
  serviceUpdateSchema,
  type TimeOffInput,
  timeOffSchema,
} from "@/lib/validation";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ============================== appointments ==============================

export async function adminGetAppointments(
  query: AdminAppointmentsQuery = {},
): Promise<ActionResult<Page<AdminAppointmentDTO>>> {
  return runAction(async () => {
    await requireAdmin();
    const q = adminAppointmentsQuerySchema.parse(query);
    const now = new Date();
    const and: Prisma.AppointmentWhereInput[] = [];
    if (q.status) and.push({ status: q.status });
    if (q.doctorId) and.push({ doctorId: q.doctorId });
    if (q.from) and.push({ startsAt: { gte: localDayRange(q.from).start } });
    if (q.to) and.push({ startsAt: { lt: localDayRange(q.to).end } });
    if (q.needsOutcome) and.push({ status: "CONFIRMED", endsAt: { lt: now } });
    if (q.search) {
      const contains = { contains: q.search, mode: "insensitive" as const };
      and.push({
        OR: [
          { user: { email: contains } },
          { user: { firstName: contains } },
          { user: { lastName: contains } },
          { doctor: { name: contains } },
          { service: { name: contains } },
          { reason: contains },
        ],
      });
    }
    const where: Prisma.AppointmentWhereInput = { AND: and };
    const [total, rows] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: adminAppointmentInclude,
        orderBy: [
          { startsAt: q.from && !q.to ? "asc" : "desc" },
          { createdAt: "desc" },
        ],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return {
      items: rows.map((a) => toAdminAppointmentDTO(a, now)),
      total,
      page: q.page,
      pageSize: q.pageSize,
      pageCount: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  });
}

/** Allowed admin transitions. COMPLETED and NO_SHOW are outcomes and only make sense once the visit started. */
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  EXPIRED: [],
};

/**
 * Change an appointment's status.
 * - COMPLETED requires a visit note (pass `visitNote`, or write one first with adminUpsertVisitNote).
 * - NO_SHOW and CANCELLED release the slot. CANCELLED emails the patient.
 */
export async function adminUpdateAppointmentStatus(
  input: AdminUpdateStatusInput,
): Promise<ActionResult<AdminAppointmentDTO>> {
  return runAction(async () => {
    const admin = await requireAdmin();
    const data = adminUpdateStatusSchema.parse(input);
    const now = new Date();
    const current = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: { visitNote: { select: { id: true } } },
    });
    if (!current) throw new NotFoundError("Appointment not found.");
    if (current.status === data.status)
      throw new AppError("CONFLICT", `Already ${data.status.toLowerCase()}.`);
    if (!TRANSITIONS[current.status].includes(data.status)) {
      throw new AppError(
        "CONFLICT",
        `Cannot change a ${current.status.toLowerCase()} appointment to ${data.status.toLowerCase()}.`,
      );
    }

    if (data.status === "CANCELLED") {
      await cancelBooking(
        { appointmentId: current.id, by: "ADMIN", reason: data.reason },
        now,
      );
      defer("cancellation email", () => sendCancellationEmail(current.id));
    } else {
      const interval = appointmentInterval(current);
      if (
        (data.status === "COMPLETED" || data.status === "NO_SHOW") &&
        interval &&
        interval.startsAt > now
      ) {
        throw new AppError(
          "VALIDATION",
          "You can record the outcome once the appointment has started.",
        );
      }
      if (
        data.status === "COMPLETED" &&
        !data.visitNote &&
        !current.visitNote
      ) {
        throw new AppError(
          "VALIDATION",
          "Add a visit note to complete the appointment.",
          {
            visitNote: ["Required to complete"],
          },
        );
      }
      await prisma.$transaction(async (tx) => {
        const updated = await tx.appointment.updateMany({
          where: { id: current.id, status: current.status },
          data: {
            status: data.status,
            // keep holding the slot while CONFIRMED/COMPLETED; release it for NO_SHOW
            slotKey:
              data.status === "NO_SHOW"
                ? null
                : (current.slotKey ??
                  (interval
                    ? slotKeyFor(current.doctorId, interval.startsAt)
                    : null)),
          },
        });
        if (updated.count === 0)
          throw new AppError(
            "CONFLICT",
            "This appointment was just changed. Please refresh.",
          );
        if (data.status === "COMPLETED" && data.visitNote) {
          await tx.visitNote.upsert({
            where: { appointmentId: current.id },
            create: {
              appointmentId: current.id,
              createdBy: admin.id,
              ...data.visitNote,
            },
            update: { ...data.visitNote },
          });
        }
      });
    }
    const row = await prisma.appointment.findUniqueOrThrow({
      where: { id: current.id },
      include: adminAppointmentInclude,
    });
    return toAdminAppointmentDTO(row, now);
  });
}

/** Write or edit the visit note of a completed appointment (visible to the patient). */
export async function adminUpsertVisitNote(
  input: AdminUpsertVisitNoteInput,
): Promise<ActionResult<AdminAppointmentDTO>> {
  return runAction(async () => {
    const admin = await requireAdmin();
    const { appointmentId, ...note } = adminUpsertVisitNoteSchema.parse(input);
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, status: true },
    });
    if (!appointment) throw new NotFoundError("Appointment not found.");
    if (
      appointment.status !== "COMPLETED" &&
      appointment.status !== "CONFIRMED"
    ) {
      throw new AppError(
        "CONFLICT",
        "Visit notes belong to confirmed or completed appointments.",
      );
    }
    await prisma.visitNote.upsert({
      where: { appointmentId },
      create: { appointmentId, createdBy: admin.id, ...note },
      update: note,
    });
    const row = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
      include: adminAppointmentInclude,
    });
    return toAdminAppointmentDTO(row);
  });
}

// ============================== dashboard ==============================

export interface AdminDashboardStatsDTO {
  generatedAt: string;
  timezone: string;
  today: { date: string; count: number; appointments: AdminAppointmentDTO[] };
  upcoming7Days: number;
  needsOutcome: number;
  /** Over appointments whose outcome was recorded in the last `windowDays` days. */
  outcomes: {
    windowDays: number;
    completed: number;
    noShow: number;
    completionRate: number | null;
    noShowRate: number | null;
  };
  revenue: { last30DaysCents: number; allTimeCents: number; currency: string };
  /** Bookings created per clinic-local day, last 30 days (zero-filled). */
  bookingsPerDay: { date: string; count: number }[];
  topServices: {
    serviceId: string;
    name: string;
    bookings: number;
    revenueCents: number;
  }[];
  doctorLoad: {
    doctorId: string;
    name: string;
    upcoming7Days: number;
    bookedMinutes7Days: number;
    scheduledMinutes7Days: number;
    utilisation: number | null;
  }[];
  totals: {
    patients: number;
    activeDoctors: number;
    doctors: number;
    appointments: number;
    completedAppointments: number;
  };
}

export async function adminGetDashboardStats(): Promise<
  ActionResult<AdminDashboardStatsDTO>
> {
  return runAction(async () => {
    await requireAdmin();
    const now = new Date();
    const tz = clinicTimeZone();
    const today = todayInClinic(now, tz);
    const todayRange = localDayRange(today, tz);
    const in7 = new Date(now.getTime() + 7 * 864e5);
    const d30 = new Date(now.getTime() - 30 * 864e5);
    const d90 = new Date(now.getTime() - 90 * 864e5);
    const firstDay = addDaysToLocalDate(today, -29);
    const since = localDayRange(firstDay, tz).start;

    const [
      todayRows,
      upcoming7Days,
      needsOutcome,
      outcomeGroups,
      revenue30,
      revenueAll,
      perDay,
      serviceGroups,
      doctors,
      patients,
      appointmentsTotal,
      completedTotal,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          startsAt: { gte: todayRange.start, lt: todayRange.end },
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
        },
        include: adminAppointmentInclude,
        orderBy: { startsAt: "asc" },
        take: 100,
      }),
      prisma.appointment.count({
        where: {
          status: { in: ACTIVE_STATUSES },
          startsAt: { gte: now, lt: in7 },
        },
      }),
      prisma.appointment.count({
        where: { status: "CONFIRMED", endsAt: { lt: now } },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        where: {
          status: { in: ["COMPLETED", "NO_SHOW"] },
          startsAt: { gte: d90, lt: now },
        },
        _count: { _all: true },
      }),
      prisma.appointment.aggregate({
        where: { status: "COMPLETED", startsAt: { gte: d30 } },
        _sum: { priceCents: true },
      }),
      prisma.appointment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { priceCents: true },
      }),
      prisma.$queryRaw<{ day: string; count: bigint }[]>`
        SELECT to_char((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date, 'YYYY-MM-DD') AS day, count(*) AS count
        FROM appointments
        WHERE "createdAt" >= (${since.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        GROUP BY 1`,
      prisma.appointment.groupBy({
        by: ["serviceId"],
        where: {
          serviceId: { not: null },
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
          startsAt: { gte: d90 },
        },
        _count: { _all: true },
        _sum: { priceCents: true },
        orderBy: { _count: { serviceId: "desc" } },
        take: 5,
      }),
      prisma.doctor.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          schedules: {
            select: { weekday: true, startTime: true, endTime: true },
          },
          appointments: {
            where: {
              status: { in: ACTIVE_STATUSES },
              startsAt: { gte: now, lt: in7 },
            },
            select: { startsAt: true, endsAt: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where: { role: "PATIENT", deletedAt: null } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
    ]);

    const completed =
      outcomeGroups.find((g) => g.status === "COMPLETED")?._count._all ?? 0;
    const noShow =
      outcomeGroups.find((g) => g.status === "NO_SHOW")?._count._all ?? 0;
    const decided = completed + noShow;

    const perDayMap = new Map(perDay.map((r) => [r.day, Number(r.count)]));
    const bookingsPerDay = Array.from({ length: 30 }, (_, i) => {
      const date = addDaysToLocalDate(firstDay, i);
      return { date, count: perDayMap.get(date) ?? 0 };
    });

    const serviceNames = new Map(
      (
        await prisma.service.findMany({
          where: {
            id: {
              in: serviceGroups
                .map((g) => g.serviceId)
                .filter((id): id is string => !!id),
            },
          },
          select: { id: true, name: true },
        })
      ).map((s) => [s.id, s.name]),
    );

    const next7 = Array.from({ length: 7 }, (_, i) =>
      weekdayOfLocalDate(addDaysToLocalDate(today, i)),
    );
    const doctorLoad = doctors.map((d) => {
      const scheduled = next7.reduce(
        (sum, wd) =>
          sum +
          d.schedules
            .filter((s) => s.weekday === wd)
            .reduce(
              (m, s) =>
                m + timeToMinutes(s.endTime) - timeToMinutes(s.startTime),
              0,
            ),
        0,
      );
      const booked = d.appointments.reduce(
        (m, a) =>
          m +
          (a.startsAt && a.endsAt
            ? (a.endsAt.getTime() - a.startsAt.getTime()) / 60_000
            : 0),
        0,
      );
      return {
        doctorId: d.id,
        name: d.name,
        upcoming7Days: d.appointments.length,
        bookedMinutes7Days: Math.round(booked),
        scheduledMinutes7Days: scheduled,
        utilisation:
          scheduled > 0 ? Math.round((booked / scheduled) * 1000) / 1000 : null,
      };
    });

    return {
      generatedAt: now.toISOString(),
      timezone: tz,
      today: {
        date: today,
        count: todayRows.length,
        appointments: todayRows.map((a) => toAdminAppointmentDTO(a, now)),
      },
      upcoming7Days,
      needsOutcome,
      outcomes: {
        windowDays: 90,
        completed,
        noShow,
        completionRate: decided ? completed / decided : null,
        noShowRate: decided ? noShow / decided : null,
      },
      revenue: {
        last30DaysCents: revenue30._sum.priceCents ?? 0,
        allTimeCents: revenueAll._sum.priceCents ?? 0,
        currency: siteConfig.clinic.currency,
      },
      bookingsPerDay,
      topServices: serviceGroups.map((g) => ({
        serviceId: g.serviceId as string,
        name: serviceNames.get(g.serviceId as string) ?? "Unknown",
        bookings: g._count._all,
        revenueCents: g._sum.priceCents ?? 0,
      })),
      doctorLoad,
      totals: {
        patients,
        activeDoctors: doctors.length,
        doctors: await prisma.doctor.count(),
        appointments: appointmentsTotal,
        completedAppointments: completedTotal,
      },
    };
  });
}

// ============================== doctors ==============================

export interface AdminDoctorDTO {
  id: string;
  slug: string | null;
  name: string;
  email: string;
  phone: string;
  speciality: string;
  bio: string | null;
  imageUrl: string;
  gender: "MALE" | "FEMALE";
  yearsExperience: number | null;
  languages: string[];
  education: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services: { id: string; name: string }[];
  schedules: {
    id: string;
    weekday: number;
    startTime: string;
    endTime: string;
  }[];
  scheduleSummary: { weekday: number; ranges: string[] }[];
  upcomingTimeOff: {
    id: string;
    startsAt: string;
    endsAt: string;
    reason: string | null;
  }[];
  appointmentCount: number;
}

const adminDoctorInclude = {
  services: { select: { id: true, name: true }, orderBy: { sortOrder: "asc" } },
  schedules: { orderBy: [{ weekday: "asc" }, { startTime: "asc" }] },
  timeOff: { orderBy: { startsAt: "asc" } },
  _count: { select: { appointments: true } },
} satisfies Prisma.DoctorInclude;

type AdminDoctorRow = Prisma.DoctorGetPayload<{
  include: typeof adminDoctorInclude;
}>;

function toAdminDoctor(d: AdminDoctorRow, now = new Date()): AdminDoctorDTO {
  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    email: d.email,
    phone: d.phone,
    speciality: d.speciality,
    bio: d.bio,
    imageUrl: d.imageUrl,
    gender: d.gender,
    yearsExperience: d.yearsExperience,
    languages: d.languages,
    education: d.education,
    isActive: d.isActive,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    services: d.services,
    schedules: d.schedules.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
    scheduleSummary: summariseSchedule(d.schedules),
    upcomingTimeOff: d.timeOff
      .filter((t) => t.endsAt > now)
      .map((t) => ({
        id: t.id,
        startsAt: t.startsAt.toISOString(),
        endsAt: t.endsAt.toISOString(),
        reason: t.reason,
      })),
    appointmentCount: d._count.appointments,
  };
}

async function loadAdminDoctor(id: string) {
  const d = await prisma.doctor.findUnique({
    where: { id },
    include: adminDoctorInclude,
  });
  if (!d) throw new NotFoundError("Dentist not found.");
  return toAdminDoctor(d);
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/^dr\.?\s+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "dentist"
  );
}

async function uniqueDoctorSlug(
  base: string,
  exceptId?: string,
): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const clash = await prisma.doctor.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === exceptId) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function adminListDoctors(): Promise<
  ActionResult<AdminDoctorDTO[]>
> {
  return runAction(async () => {
    await requireAdmin();
    const doctors = await prisma.doctor.findMany({
      include: adminDoctorInclude,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
    const now = new Date();
    return doctors.map((d) => toAdminDoctor(d, now));
  });
}

export async function adminGetDoctor(
  id: string,
): Promise<ActionResult<AdminDoctorDTO>> {
  return runAction(async () => {
    await requireAdmin();
    return loadAdminDoctor(idSchema.parse(id));
  });
}

export async function adminCreateDoctor(
  input: DoctorInput,
): Promise<ActionResult<AdminDoctorDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const { serviceIds, slug, ...data } = doctorSchema.parse(input);
    const doctor = await prisma.doctor.create({
      data: {
        ...data,
        languages: data.languages ?? [],
        slug: await uniqueDoctorSlug(slug ?? slugify(data.name)),
        imageUrl: data.imageUrl ?? generateAvatar(data.name, data.gender),
        ...(serviceIds
          ? { services: { connect: serviceIds.map((id) => ({ id })) } }
          : {}),
      },
    });
    return loadAdminDoctor(doctor.id);
  });
}

export async function adminUpdateDoctor(
  input: DoctorUpdateInput,
): Promise<ActionResult<AdminDoctorDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const { id, serviceIds, slug, ...data } = doctorUpdateSchema.parse(input);
    const existing = await prisma.doctor.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundError("Dentist not found.");
    await prisma.doctor.update({
      where: { id },
      data: {
        ...data,
        ...(slug ? { slug: await uniqueDoctorSlug(slug, id) } : {}),
        ...(serviceIds
          ? { services: { set: serviceIds.map((sid) => ({ id: sid })) } }
          : {}),
      },
    });
    return loadAdminDoctor(id);
  });
}

/**
 * Hide a dentist from booking. Existing appointments are kept (doctor rows are never deleted; the
 * appointment FK is RESTRICT). Upcoming appointments are returned so staff can move or cancel them.
 */
export async function adminDeactivateDoctor(
  id: string,
): Promise<
  ActionResult<{ doctor: AdminDoctorDTO; upcomingAppointments: number }>
> {
  return runAction(async () => {
    await requireAdmin();
    const doctorId = idSchema.parse(id);
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { isActive: false },
    });
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        doctorId,
        status: { in: ACTIVE_STATUSES },
        startsAt: { gte: new Date() },
      },
    });
    return { doctor: await loadAdminDoctor(doctorId), upcomingAppointments };
  });
}

/** Replace a dentist's weekly schedule. Existing appointments are not touched. */
export async function adminSetDoctorSchedule(
  input: ScheduleInput,
): Promise<ActionResult<AdminDoctorDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const { doctorId, windows } = scheduleSchema.parse(input);
    await prisma.$transaction(async (tx) => {
      const doctor = await tx.doctor.findUnique({
        where: { id: doctorId },
        select: { id: true },
      });
      if (!doctor) throw new NotFoundError("Dentist not found.");
      await tx.doctorSchedule.deleteMany({ where: { doctorId } });
      if (windows.length)
        await tx.doctorSchedule.createMany({
          data: windows.map((w) => ({ doctorId, ...w })),
        });
    });
    return loadAdminDoctor(doctorId);
  });
}

function localBoundary(date: string, time: string): Date {
  const instant =
    time === "24:00"
      ? localToUtc(addDaysToLocalDate(date, 1), "00:00")
      : localToUtc(date, time);
  if (!instant)
    throw new AppError(
      "VALIDATION",
      `${date} ${time} does not exist in ${clinicTimeZone()} (clock change).`,
    );
  return instant;
}

/**
 * Block time for a dentist (clinic-local dates/times; whole days by default). Returns how many active
 * appointments fall inside it so staff can contact those patients.
 */
export async function adminAddTimeOff(
  input: TimeOffInput,
): Promise<
  ActionResult<{ doctor: AdminDoctorDTO; clashingAppointmentIds: string[] }>
> {
  return runAction(async () => {
    await requireAdmin();
    const t = timeOffSchema.parse(input);
    const startsAt = localBoundary(t.startDate, t.startTime);
    const endsAt = localBoundary(t.endDate, t.endTime);
    if (endsAt <= startsAt)
      throw new AppError("VALIDATION", "End must be after start.");
    const doctor = await prisma.doctor.findUnique({
      where: { id: t.doctorId },
      select: { id: true },
    });
    if (!doctor) throw new NotFoundError("Dentist not found.");
    await prisma.doctorTimeOff.create({
      data: { doctorId: t.doctorId, startsAt, endsAt, reason: t.reason },
    });
    const clashes = await prisma.appointment.findMany({
      where: {
        doctorId: t.doctorId,
        status: { in: ACTIVE_STATUSES },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
      select: { id: true },
    });
    return {
      doctor: await loadAdminDoctor(t.doctorId),
      clashingAppointmentIds: clashes.map((c) => c.id),
    };
  });
}

export async function adminRemoveTimeOff(
  timeOffId: string,
): Promise<ActionResult<AdminDoctorDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const id = idSchema.parse(timeOffId);
    const row = await prisma.doctorTimeOff.findUnique({
      where: { id },
      select: { doctorId: true },
    });
    if (!row) throw new NotFoundError("Time off not found.");
    await prisma.doctorTimeOff.delete({ where: { id } });
    return loadAdminDoctor(row.doctorId);
  });
}

// ============================== services ==============================

export interface AdminServiceDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
  doctorIds: string[];
  appointmentCount: number;
}

const adminServiceInclude = {
  doctors: { select: { id: true } },
  _count: { select: { appointments: true } },
} satisfies Prisma.ServiceInclude;

function toAdminService(
  s: Prisma.ServiceGetPayload<{ include: typeof adminServiceInclude }>,
): AdminServiceDTO {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
    category: s.category,
    isActive: s.isActive,
    sortOrder: s.sortOrder,
    doctorIds: s.doctors.map((d) => d.id),
    appointmentCount: s._count.appointments,
  };
}

/** All services including inactive ones. */
export async function adminListServices(): Promise<
  ActionResult<AdminServiceDTO[]>
> {
  return runAction(async () => {
    await requireAdmin();
    const rows = await prisma.service.findMany({
      include: adminServiceInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(toAdminService);
  });
}

export async function adminCreateService(
  input: ServiceInput,
): Promise<ActionResult<AdminServiceDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const data = serviceSchema.parse(input);
    const s = await prisma.service.create({
      data,
      include: adminServiceInclude,
    });
    return toAdminService(s);
  });
}

/** Price changes affect new bookings only; existing appointments keep their priceCents snapshot. */
export async function adminUpdateService(
  input: ServiceUpdateInput,
): Promise<ActionResult<AdminServiceDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const { id, ...data } = serviceUpdateSchema.parse(input);
    const s = await prisma.service.update({
      where: { id },
      data,
      include: adminServiceInclude,
    });
    return toAdminService(s);
  });
}

// ============================== patients ==============================

export interface AdminPatientRowDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  memberSince: string;
  appointmentCount: number;
  completedVisits: number;
  lastVisit: string | null;
  nextAppointment: string | null;
}

export async function adminGetPatients(
  query: AdminPatientsQuery = {},
): Promise<ActionResult<Page<AdminPatientRowDTO>>> {
  return runAction(async () => {
    await requireAdmin();
    const q = adminPatientsQuerySchema.parse(query);
    const contains = q.search
      ? { contains: q.search, mode: "insensitive" as const }
      : undefined;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: "PATIENT",
      ...(contains
        ? {
            OR: [
              { email: contains },
              { firstName: contains },
              { lastName: contains },
              { phone: contains },
            ],
          }
        : {}),
    };
    const now = new Date();
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: {
          _count: { select: { appointments: true } },
        },
      }),
    ]);
    const ids = users.map((u) => u.id);
    const [completed, last, next] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, status: "COMPLETED" },
        _count: { _all: true },
      }),
      prisma.appointment.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, status: "COMPLETED" },
        _max: { startsAt: true },
      }),
      prisma.appointment.groupBy({
        by: ["userId"],
        where: {
          userId: { in: ids },
          status: { in: ACTIVE_STATUSES },
          startsAt: { gte: now },
        },
        _min: { startsAt: true },
      }),
    ]);
    const completedMap = new Map(
      completed.map((r) => [r.userId, r._count._all]),
    );
    const lastMap = new Map(last.map((r) => [r.userId, r._max.startsAt]));
    const nextMap = new Map(next.map((r) => [r.userId, r._min.startsAt]));
    return {
      items: users.map((u) => ({
        id: u.id,
        name: fullName(u) || u.email,
        email: u.email,
        phone: u.phone,
        memberSince: u.createdAt.toISOString(),
        appointmentCount: u._count.appointments,
        completedVisits: completedMap.get(u.id) ?? 0,
        lastVisit: lastMap.get(u.id)?.toISOString() ?? null,
        nextAppointment: nextMap.get(u.id)?.toISOString() ?? null,
      })),
      total,
      page: q.page,
      pageSize: q.pageSize,
      pageCount: Math.max(1, Math.ceil(total / q.pageSize)),
    };
  });
}

export interface AdminPatientDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "PATIENT" | "ADMIN";
  deleted: boolean;
  memberSince: string;
  dateOfBirth: string | null;
  allergies: string | null;
  medications: string | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  appointments: AdminAppointmentDTO[];
  reviews: {
    id: string;
    appointmentId: string;
    doctorName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }[];
}

export async function adminGetPatient(
  id: string,
): Promise<ActionResult<AdminPatientDTO>> {
  return runAction(async () => {
    await requireAdmin();
    const userId = idSchema.parse(id);
    const u = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        appointments: {
          include: adminAppointmentInclude,
          orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
        },
        reviews: {
          include: { doctor: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!u) throw new NotFoundError("Patient not found.");
    const now = new Date();
    return {
      id: u.id,
      name: fullName(u) || u.email,
      email: u.email,
      phone: u.phone,
      role: u.role,
      deleted: !!u.deletedAt,
      memberSince: u.createdAt.toISOString(),
      dateOfBirth: u.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      allergies: u.allergies,
      medications: u.medications,
      medicalNotes: u.medicalNotes,
      emergencyContactName: u.emergencyContactName,
      emergencyContactPhone: u.emergencyContactPhone,
      appointments: u.appointments.map((a) => toAdminAppointmentDTO(a, now)),
      reviews: u.reviews.map((r) => ({
        id: r.id,
        appointmentId: r.appointmentId,
        doctorName: r.doctor.name,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });
}
