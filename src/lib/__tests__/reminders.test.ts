import { describe, expect, it, vi } from "vitest";

vi.mock("../prisma", () => ({ prisma: {} }));
vi.mock("../email", () => ({ sendReminderEmail: vi.fn() }));

import { processReminders } from "../reminders";

const HOUR = 36e5;
const now = new Date("2026-03-16T12:00:00Z");

type Row = {
  id: string;
  startsAt: Date;
  createdAt: Date;
  status: string;
  reminderSent24h: boolean;
  reminderSent1Hour: boolean;
};

/** Tiny in-memory stand-in for the Prisma calls processReminders makes. */
function fakeDb(rows: Row[]) {
  const inRange = (d: Date, r: { gt: Date; lte: Date }) =>
    d > r.gt && d <= r.lte;
  return {
    rows,
    appointment: {
      findMany: async ({
        where,
      }: {
        where: Record<string, never> & { startsAt: { gt: Date; lte: Date } };
      }) =>
        rows.filter(
          (r) =>
            r.status === "CONFIRMED" &&
            inRange(r.startsAt, where.startsAt) &&
            ("reminderSent24h" in where
              ? !r.reminderSent24h
              : !r.reminderSent1Hour),
        ),
      updateMany: async ({
        where,
        data,
      }: {
        where: Partial<Row> & { id: string };
        data: Partial<Row>;
      }) => {
        const r = rows.find((x) => x.id === where.id);
        const flag =
          "reminderSent24h" in where ? "reminderSent24h" : "reminderSent1Hour";
        if (!r || r[flag] !== false) return { count: 0 };
        Object.assign(r, data);
        return { count: 1 };
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Row>;
      }) => Object.assign(rows.find((x) => x.id === where.id) as Row, data),
      count: async () => 0,
    },
  };
}

const row = (
  id: string,
  startsInHours: number,
  bookedHoursBefore = 72,
): Row => ({
  id,
  startsAt: new Date(now.getTime() + startsInHours * HOUR),
  createdAt: new Date(
    now.getTime() + (startsInHours - bookedHoursBefore) * HOUR,
  ),
  status: "CONFIRMED",
  reminderSent24h: false,
  reminderSent1Hour: false,
});

describe("processReminders", () => {
  it("sends 24h reminders inside (2h, 24h] and 1h reminders inside (30m, 90m], once", async () => {
    const db = fakeDb([
      row("tomorrow", 23),
      row("too-far", 25),
      row("in-an-hour", 1),
      row("too-soon", 0.25),
      row("booked-late", 20, 3),
    ]);
    const send = vi.fn().mockResolvedValue("sent");
    const first = await processReminders(now, { db: db as never, send });
    expect(first).toMatchObject({
      remindersSent24h: 1,
      remindersSent1h: 1,
      failed: 0,
    });
    expect(send.mock.calls).toEqual([
      ["tomorrow", "24h"],
      ["in-an-hour", "1h"],
    ]);
    // second run in the same hour: nothing is sent twice
    const second = await processReminders(now, { db: db as never, send });
    expect(second).toMatchObject({ remindersSent24h: 0, remindersSent1h: 0 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("releases the claim when sending fails so the next run retries", async () => {
    const db = fakeDb([row("tomorrow", 23)]);
    const send = vi
      .fn()
      .mockResolvedValueOnce("failed")
      .mockResolvedValueOnce("sent");
    expect(
      await processReminders(now, { db: db as never, send }),
    ).toMatchObject({ failed: 1, remindersSent24h: 0 });
    expect(db.rows[0].reminderSent24h).toBe(false);
    expect(
      await processReminders(now, { db: db as never, send }),
    ).toMatchObject({ remindersSent24h: 1 });
  });
});
