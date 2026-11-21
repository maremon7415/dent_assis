/**
 * Hourly reminder job. Idempotent and safe to run concurrently: each reminder is *claimed* by flipping
 * its flag with a conditional update before sending, and the flag is released again if the send fails
 * so the next run retries.
 *
 * Windows are sized for an hourly schedule, so every appointment falls into exactly one run:
 *  - 24h reminder: starts in (now + 2h, now + 24h], and was booked at least 24h before its start
 *    (someone booking for tomorrow afternoon already has the confirmation).
 *  - 1h reminder:  starts in (now + 30min, now + 90min].
 *
 * Past appointments are NOT auto-expired: a CONFIRMED appointment whose end has passed stays CONFIRMED
 * until staff record COMPLETED or NO_SHOW (the visit may well have happened). They are counted here and
 * listed in admin with `adminGetAppointments({ needsOutcome: true })`.
 */
import type { PrismaClient } from "@prisma/client";
import { sendReminderEmail } from "./email";
import { prisma as defaultPrisma } from "./prisma";

const HOUR = 36e5;

export interface ReminderRunResult {
  remindersSent24h: number;
  remindersSent1h: number;
  failed: number;
  needsOutcome: number;
}

type Sender = (
  appointmentId: string,
  window: "24h" | "1h",
) => Promise<"sent" | "skipped" | "failed">;

export async function processReminders(
  now: Date = new Date(),
  deps: { db?: PrismaClient; send?: Sender } = {},
): Promise<ReminderRunResult> {
  const db = deps.db ?? defaultPrisma;
  const send = deps.send ?? sendReminderEmail;
  const result: ReminderRunResult = {
    remindersSent24h: 0,
    remindersSent1h: 0,
    failed: 0,
    needsOutcome: 0,
  };

  const [due24h, due1h] = await Promise.all([
    db.appointment.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent24h: false,
        startsAt: {
          gt: new Date(now.getTime() + 2 * HOUR),
          lte: new Date(now.getTime() + 24 * HOUR),
        },
        user: { deletedAt: null },
      },
      select: { id: true, startsAt: true, createdAt: true },
    }),
    db.appointment.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent1Hour: false,
        startsAt: {
          gt: new Date(now.getTime() + 0.5 * HOUR),
          lte: new Date(now.getTime() + 1.5 * HOUR),
        },
        user: { deletedAt: null },
      },
      select: { id: true },
    }),
  ]);

  for (const a of due24h) {
    if (!a.startsAt || a.startsAt.getTime() - a.createdAt.getTime() < 24 * HOUR)
      continue;
    const claimed = await db.appointment.updateMany({
      where: { id: a.id, reminderSent24h: false, status: "CONFIRMED" },
      data: { reminderSent24h: true },
    });
    if (claimed.count === 0) continue;
    const status = await send(a.id, "24h");
    if (status === "failed") {
      result.failed++;
      await db.appointment.update({
        where: { id: a.id },
        data: { reminderSent24h: false },
      });
    } else if (status === "sent") result.remindersSent24h++;
  }

  for (const a of due1h) {
    const claimed = await db.appointment.updateMany({
      where: { id: a.id, reminderSent1Hour: false, status: "CONFIRMED" },
      data: { reminderSent1Hour: true },
    });
    if (claimed.count === 0) continue;
    const status = await send(a.id, "1h");
    if (status === "failed") {
      result.failed++;
      await db.appointment.update({
        where: { id: a.id },
        data: { reminderSent1Hour: false },
      });
    } else if (status === "sent") result.remindersSent1h++;
  }

  result.needsOutcome = await db.appointment.count({
    where: { status: "CONFIRMED", endsAt: { lt: now } },
  });
  return result;
}
