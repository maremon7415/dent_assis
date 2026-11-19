/**
 * Booking service rules that run inside the transaction: the per-patient cap on upcoming visits, the
 * per-patient change rate limit, the per-patient overlap check (including legacy rows), and what a
 * reschedule keeps from the original appointment. Prisma is faked; the slot maths is real.
 */
import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../prisma", () => ({ prisma: {} }));

import { siteConfig } from "@/config/site";
import { cancelBooking, createBooking, rescheduleBooking } from "../booking";
import { AppError, toFailure } from "../errors";

// "now" is the Friday before; the clinic works 09:00-17:00 every day (UTC clinic).
const NOW = new Date("2026-03-13T12:00:00Z");
const MONDAY = "2026-03-16";

interface Counts {
  active: number;
  recentChanges: number;
}

function fakeDb(
  opts: {
    counts?: Partial<Counts>;
    patientRows?: unknown[];
    current?: Record<string, unknown>;
  } = {},
) {
  const counts: Counts = { active: 0, recentChanges: 0, ...opts.counts };
  const current = {
    id: "old",
    userId: "p1",
    doctorId: "d1",
    serviceId: "s1",
    status: "PENDING",
    priceCents: 4000,
    startsAt: new Date("2026-03-16T09:00:00Z"),
    endsAt: new Date("2026-03-16T09:30:00Z"),
    date: new Date("2026-03-16T00:00:00Z"),
    time: "09:00",
    duration: 30,
    reason: "Tooth hurts",
    notes: null,
    ...opts.current,
  };
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    doctor: { findFirst: vi.fn().mockResolvedValue({ id: "d1" }) },
    service: {
      findFirst: vi.fn().mockResolvedValue({
        id: "s1",
        name: "Cleaning",
        durationMinutes: 30,
        priceCents: 5000,
      }),
    },
    doctorSchedule: {
      findMany: vi.fn().mockResolvedValue(
        [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          weekday,
          startTime: "09:00",
          endTime: "17:00",
        })),
      ),
    },
    doctorTimeOff: { findMany: vi.fn().mockResolvedValue([]) },
    appointment: {
      // doctor's busy times vs the patient's own appointments
      findMany: vi.fn(async ({ where }: { where: { userId?: string } }) =>
        where.userId ? (opts.patientRows ?? []) : [],
      ),
      // by id (owner checks); the old per-patient clash query (no id) finds nothing
      findFirst: vi.fn(async ({ where }: { where: { id?: string } }) =>
        where.id ? current : null,
      ),
      count: vi.fn(async ({ where }: { where: { status?: unknown } }) =>
        where.status ? counts.active : counts.recentChanges,
      ),
      create: vi.fn(async ({ data }) => ({ id: "new", ...data })),
      update: vi.fn(async ({ data }) => ({ ...current, ...data })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: vi.fn(async () => ({
        ...current,
        status: "CANCELLED",
      })),
    },
  };
  const db = {
    ...tx,
    $transaction: vi.fn(async (fn: (t: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaClient;
  return { db, tx };
}

const book = (db: PrismaClient, time = "10:00") =>
  createBooking(
    {
      userId: "p1",
      doctorId: "d1",
      serviceId: "s1",
      date: MONDAY,
      time,
      reason: "Tooth hurts",
    },
    NOW,
    db,
  );

const codeOf = async (p: Promise<unknown>) =>
  p.then(
    () => "OK",
    (e) => toFailure(e).code,
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("cap on upcoming visits per patient", () => {
  it("is configured at 3", () => {
    expect(siteConfig.clinic.maxActiveBookingsPerPatient).toBe(3);
  });

  it("refuses a 4th upcoming visit with a clear message", async () => {
    const { db, tx } = fakeDb({ counts: { active: 3 } });
    await expect(book(db)).rejects.toMatchObject({
      code: "LIMIT_REACHED",
      message: expect.stringContaining("You already have 3 upcoming visits"),
    });
    expect(tx.appointment.create).not.toHaveBeenCalled();
    // counted only active, future appointments of this patient
    expect(tx.appointment.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "p1",
        status: { in: ["PENDING", "CONFIRMED"] },
      }),
    });
  });

  it("allows booking below the cap", async () => {
    const { db } = fakeDb({ counts: { active: 2 } });
    await expect(codeOf(book(db))).resolves.toBe("OK");
  });

  it("does not apply to a reschedule, which replaces a visit", async () => {
    const { db } = fakeDb({ counts: { active: 3 } });
    await expect(
      codeOf(
        rescheduleBooking(
          { userId: "p1", appointmentId: "old", date: MONDAY, time: "11:00" },
          NOW,
          db,
        ),
      ),
    ).resolves.toBe("OK");
  });
});

describe("per-patient change rate limit", () => {
  it("blocks booking after 10 changes in 10 minutes", async () => {
    const { db, tx } = fakeDb({ counts: { recentChanges: 10 } });
    await expect(codeOf(book(db))).resolves.toBe("RATE_LIMITED");
    expect(tx.appointment.create).not.toHaveBeenCalled();
    expect(tx.appointment.count).toHaveBeenCalledWith({
      where: {
        userId: "p1",
        OR: [
          { createdAt: { gte: new Date(NOW.getTime() - 10 * 60_000) } },
          {
            cancelledAt: { gte: new Date(NOW.getTime() - 10 * 60_000) },
            cancelledBy: "PATIENT",
          },
        ],
      },
    });
  });

  it("allows booking under the limit", async () => {
    const { db } = fakeDb({ counts: { recentChanges: 9 } });
    await expect(codeOf(book(db))).resolves.toBe("OK");
  });

  it("blocks a patient reschedule", async () => {
    const { db, tx } = fakeDb({ counts: { recentChanges: 10 } });
    await expect(
      codeOf(
        rescheduleBooking(
          { userId: "p1", appointmentId: "old", date: MONDAY, time: "11:00" },
          NOW,
          db,
        ),
      ),
    ).resolves.toBe("RATE_LIMITED");
    expect(tx.appointment.update).not.toHaveBeenCalled();
  });

  it("blocks a patient cancellation but never the clinic's", async () => {
    const patient = fakeDb({ counts: { recentChanges: 10 } });
    await expect(
      codeOf(
        cancelBooking(
          { appointmentId: "old", by: "PATIENT", userId: "p1" },
          NOW,
          patient.db,
        ),
      ),
    ).resolves.toBe("RATE_LIMITED");
    expect(patient.tx.appointment.updateMany).not.toHaveBeenCalled();

    const admin = fakeDb({ counts: { recentChanges: 10 } });
    await expect(
      codeOf(
        cancelBooking({ appointmentId: "old", by: "ADMIN" }, NOW, admin.db),
      ),
    ).resolves.toBe("OK");
  });

  it("is a distinct, typed error", () => {
    expect(toFailure(new AppError("RATE_LIMITED", "Slow down"))).toMatchObject({
      code: "RATE_LIMITED",
      error: "Slow down",
    });
  });
});

describe("per-patient overlap check", () => {
  it("sees legacy appointments that have no startsAt", async () => {
    const { db, tx } = fakeDb({
      patientRows: [
        {
          startsAt: null,
          endsAt: null,
          date: new Date(`${MONDAY}T00:00:00Z`),
          time: "10:00",
          duration: 30,
        },
      ],
    });
    await expect(codeOf(book(db, "10:00"))).resolves.toBe("CONFLICT");
    expect(tx.appointment.create).not.toHaveBeenCalled();
  });

  it("does not flag a legacy appointment at another time", async () => {
    const { db } = fakeDb({
      patientRows: [
        {
          startsAt: null,
          endsAt: null,
          date: new Date(`${MONDAY}T00:00:00Z`),
          time: "14:00",
          duration: 30,
        },
      ],
    });
    await expect(codeOf(book(db, "10:00"))).resolves.toBe("OK");
  });
});

describe("reschedule keeps the original booking's terms", () => {
  it("keeps the price snapshot and PENDING status", async () => {
    const { db, tx } = fakeDb();
    const { next } = await rescheduleBooking(
      { userId: "p1", appointmentId: "old", date: MONDAY, time: "11:00" },
      NOW,
      db,
    );
    expect(tx.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priceCents: 4000,
        status: "PENDING",
        rescheduledFromId: "old",
      }),
    });
    expect(next).toMatchObject({ priceCents: 4000, status: "PENDING" });
  });

  it("keeps CONFIRMED as CONFIRMED and a null price as null", async () => {
    const { db, tx } = fakeDb({
      current: { status: "CONFIRMED", priceCents: null },
    });
    await rescheduleBooking(
      { userId: "p1", appointmentId: "old", date: MONDAY, time: "11:00" },
      NOW,
      db,
    );
    expect(tx.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ priceCents: null, status: "CONFIRMED" }),
    });
  });

  it("a new booking still snapshots the current service price", async () => {
    const { db, tx } = fakeDb();
    await book(db);
    expect(tx.appointment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ priceCents: 5000, status: "CONFIRMED" }),
    });
  });
});
