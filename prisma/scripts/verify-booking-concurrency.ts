/**
 * Behaviour check against the local database (not a unit test):
 *  1. N patients book the SAME doctor + start at the same moment -> exactly one succeeds.
 *  2. Two patients race for OVERLAPPING slots with different starts/durations -> exactly one succeeds.
 *  3. A direct insert that skips the service layer still cannot reuse an active slotKey (P2002).
 *  4. Reschedule releases the old slot (someone else can then book it); cancel releases the new one.
 * Creates its own throwaway patients (clerkId verify_*) and removes everything it created.
 *
 *   npx tsx prisma/scripts/verify-booking-concurrency.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  cancelBooking,
  createBooking,
  getSlotsForDay,
  rescheduleBooking,
} from "@/lib/booking";
import { toFailure } from "@/lib/errors";
import { addDaysToLocalDate, todayInClinic } from "@/lib/time";

const prisma = new PrismaClient();
const RUN = `verify_${Date.now().toString(36)}`;

async function main() {
  const doctor = await prisma.doctor.findFirst({
    where: {
      isActive: true,
      schedules: { some: {} },
      services: { some: { durationMinutes: { gte: 45 } } },
    },
    include: { services: { orderBy: { durationMinutes: "desc" } } },
  });
  if (!doctor) throw new Error("Run `npm run db:seed` first");
  const long = doctor.services[0]; // >= 45 min
  const short = await prisma.service.findFirst({
    where: {
      doctors: { some: { id: doctor.id } },
      durationMinutes: { lte: 30 },
    },
  });

  const patients = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      prisma.user.create({
        data: {
          clerkId: `${RUN}_${i}`,
          email: `${RUN}_${i}@verify.invalid`,
          firstName: `Verify${i}`,
        },
      }),
    ),
  );

  // first day with at least 4 free starts for the long service
  let date = "";
  let slots: Awaited<ReturnType<typeof getSlotsForDay>> = [];
  for (let d = 3; d < 30 && slots.length < 4; d++) {
    date = addDaysToLocalDate(todayInClinic(), d);
    slots = await getSlotsForDay(prisma, {
      doctorId: doctor.id,
      date,
      serviceId: long.id,
    });
  }
  const target = slots[0];
  console.log(
    `doctor=${doctor.slug} service=${long.slug} (${long.durationMinutes}m) date=${date} time=${target.time}`,
  );

  // 1. same slot, 8 concurrent patients
  const results = await Promise.allSettled(
    patients.map((p) =>
      createBooking({
        userId: p.id,
        doctorId: doctor.id,
        serviceId: long.id,
        date,
        time: target.time,
      }),
    ),
  );
  const ok1 = results.filter((r) => r.status === "fulfilled").length;
  const codes1 = results
    .filter((r) => r.status === "rejected")
    .map((r) => toFailure((r as PromiseRejectedResult).reason).code);
  console.log(
    `[same slot]     ${ok1} succeeded, ${codes1.length} failed with ${[...new Set(codes1)].join(",")}`,
  );

  // 2. overlapping different starts: long service at slots[2] vs short service 30 minutes later
  const overlapStart = slots[2];
  const laterTime = slots.find(
    (s) =>
      s.startsAt.getTime() === overlapStart.startsAt.getTime() + 30 * 60_000,
  )?.time;
  let ok2 = -1;
  let codes2: string[] = [];
  if (short && laterTime) {
    const r2 = await Promise.allSettled([
      createBooking({
        userId: patients[1].id,
        doctorId: doctor.id,
        serviceId: long.id,
        date,
        time: overlapStart.time,
      }),
      createBooking({
        userId: patients[2].id,
        doctorId: doctor.id,
        serviceId: short.id,
        date,
        time: laterTime,
      }),
    ]);
    ok2 = r2.filter((r) => r.status === "fulfilled").length;
    codes2 = r2
      .filter((r) => r.status === "rejected")
      .map((r) => toFailure((r as PromiseRejectedResult).reason).code);
    console.log(
      `[overlapping]   ${overlapStart.time} (${long.durationMinutes}m) vs ${laterTime} (${short.durationMinutes}m): ${ok2} succeeded, failed with ${codes2.join(",")}`,
    );
  } else {
    console.log(
      "[overlapping]   skipped (no short service or adjacent slot for this doctor)",
    );
  }

  // 3. bypass the service layer: duplicate slotKey must be rejected by the database
  const held = await prisma.appointment.findFirstOrThrow({
    where: { doctorId: doctor.id, user: { clerkId: { startsWith: RUN } } },
  });
  let dbRejected = false;
  try {
    await prisma.appointment.create({
      data: {
        userId: patients[7].id,
        doctorId: doctor.id,
        date: held.date,
        time: held.time,
        startsAt: held.startsAt,
        endsAt: held.endsAt,
        slotKey: held.slotKey,
      },
    });
  } catch (error) {
    dbRejected = toFailure(error).code === "SLOT_TAKEN";
  }
  console.log(
    `[db constraint] direct duplicate insert rejected as SLOT_TAKEN: ${dbRejected}`,
  );

  // 4. reschedule + cancel release slots
  const winner = await prisma.appointment.findFirstOrThrow({
    where: {
      doctorId: doctor.id,
      startsAt: target.startsAt,
      status: "CONFIRMED",
      user: { clerkId: { startsWith: RUN } },
    },
  });
  const freeLater = (
    await getSlotsForDay(prisma, {
      doctorId: doctor.id,
      date,
      serviceId: long.id,
    })
  ).at(-1);
  let releaseOk = false;
  if (freeLater) {
    const { previous, next } = await rescheduleBooking({
      userId: winner.userId,
      appointmentId: winner.id,
      date,
      time: freeLater.time,
    });
    const other =
      patients.find(
        (p) =>
          p.id !== winner.userId &&
          p.id !== patients[1].id &&
          p.id !== patients[2].id,
      ) ?? patients[6];
    const rebooked = await createBooking({
      userId: other.id,
      doctorId: doctor.id,
      serviceId: long.id,
      date,
      time: target.time,
    });
    const cancelled = await cancelBooking({
      appointmentId: next.id,
      by: "PATIENT",
      userId: winner.userId,
    });
    const cancelOthers = await cancelBooking({
      appointmentId: next.id,
      by: "PATIENT",
      userId: other.id,
    }).catch((e) => toFailure(e).code);
    releaseOk =
      previous.status === "CANCELLED" &&
      previous.slotKey === null &&
      next.rescheduledFromId === winner.id &&
      rebooked.startsAt?.getTime() === target.startsAt.getTime() &&
      cancelled.slotKey === null &&
      cancelOthers === "NOT_FOUND";
    console.log(
      `[reschedule]    old slot released and rebooked by another patient; cancel frees slot; other patient cannot cancel it: ${releaseOk}`,
    );
  }

  const pass =
    releaseOk &&
    ok1 === 1 &&
    codes1.every((c) => c === "SLOT_TAKEN") &&
    (ok2 === -1 || ok2 === 1) &&
    dbRejected;
  console.log(pass ? "PASS" : "FAIL");
  if (!pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // remove only what this run created
    const users = await prisma.user.findMany({
      where: { clerkId: { startsWith: RUN } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    await prisma.appointment.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  });
