/**
 * Idempotent seed: services, dentists (fictional people, generated initials avatars, no hotlinked photos),
 * weekly schedules and the services each dentist offers. Safe to run repeatedly; it never touches
 * schedules or services an admin has already set up for a dentist.
 *
 *   npm run db:seed            # catalogue only
 *   npm run db:seed -- --demo  # plus demo patients and appointments for local screenshots
 *
 * Also backfills startsAt/endsAt/slotKey on appointments created before those columns existed.
 */
import { type Gender, PrismaClient } from "@prisma/client";
import { computeAvailableSlots, slotKeyFor } from "../src/lib/availability";
import { clinicRules } from "../src/lib/booking";
import {
  addDaysToLocalDate,
  legacyDateColumn,
  legacyStartsAt,
  localDayRange,
  localToUtc,
  todayInClinic,
} from "../src/lib/time";
import { generateAvatar } from "../src/lib/utils";

const prisma = new PrismaClient();

const SERVICES = [
  {
    slug: "checkup-and-clean",
    name: "Check-up & clean",
    category: "Preventive",
    durationMinutes: 45,
    priceCents: 9500,
    description:
      "Full oral exam, gum health check, scale and polish, and a plan for anything that needs attention.",
  },
  {
    slug: "new-patient-exam",
    name: "New patient exam & X-rays",
    category: "Preventive",
    durationMinutes: 60,
    priceCents: 14500,
    description:
      "A thorough first visit: medical history, digital X-rays, oral cancer screening and a written treatment plan.",
  },
  {
    slug: "hygienist-deep-clean",
    name: "Hygienist deep clean",
    category: "Preventive",
    durationMinutes: 60,
    priceCents: 12000,
    description:
      "Below-the-gumline cleaning for bleeding gums or heavy build-up, with home-care coaching.",
  },
  {
    slug: "childrens-check-up",
    name: "Children's check-up",
    category: "Paediatric",
    durationMinutes: 30,
    priceCents: 6000,
    description:
      "A gentle, unhurried check-up for under-16s, with fluoride varnish and fissure-sealant advice.",
  },
  {
    slug: "tooth-coloured-filling",
    name: "Tooth-coloured filling",
    category: "Restorative",
    durationMinutes: 60,
    priceCents: 18000,
    description:
      "Composite filling matched to your tooth shade, placed under local anaesthetic.",
  },
  {
    slug: "root-canal-treatment",
    name: "Root canal treatment",
    category: "Endodontics",
    durationMinutes: 90,
    priceCents: 65000,
    description:
      "Microscope-assisted root canal therapy on one tooth to remove infection and save the tooth.",
  },
  {
    slug: "professional-whitening",
    name: "Professional whitening",
    category: "Cosmetic",
    durationMinutes: 90,
    priceCents: 39000,
    description:
      "In-chair whitening with shade assessment and sensitivity protection; take-home top-up trays included.",
  },
  {
    slug: "clear-aligner-consultation",
    name: "Clear aligner consultation",
    category: "Orthodontics",
    durationMinutes: 30,
    priceCents: 0,
    description:
      "Find out whether clear aligners suit you: bite assessment, 3D scan and a no-obligation quote.",
  },
  {
    slug: "emergency-visit",
    name: "Emergency visit",
    category: "Urgent care",
    durationMinutes: 30,
    priceCents: 9000,
    description:
      "Same-day help for toothache, swelling, a broken tooth or a lost filling. Pain relief first.",
  },
] as const;

type Week = Array<[weekday: number, start: string, end: string]>;
const weekdays = (
  ranges: Array<[string, string]>,
  days = [1, 2, 3, 4, 5],
): Week =>
  days.flatMap((d) =>
    ranges.map(([s, e]) => [d, s, e] as [number, string, string]),
  );

const DOCTORS: Array<{
  slug: string;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  speciality: string;
  yearsExperience: number;
  languages: string[];
  education: string;
  bio: string;
  services: string[];
  schedule: Week;
}> = [
  {
    slug: "amara-okafor",
    name: "Dr. Amara Okafor",
    email: "amara.okafor@lumadent.example",
    phone: "+1 555 010 2101",
    gender: "FEMALE",
    speciality: "General & Family Dentistry",
    yearsExperience: 12,
    languages: ["English", "Igbo"],
    education: "DDS, University of Michigan School of Dentistry",
    bio: "Amara looks after whole families, from first teeth to dentures. She is known for explaining every option plainly and never rushing a nervous patient.",
    services: [
      "checkup-and-clean",
      "new-patient-exam",
      "tooth-coloured-filling",
      "emergency-visit",
      "childrens-check-up",
    ],
    schedule: weekdays([
      ["08:30", "12:30"],
      ["13:30", "17:00"],
    ]),
  },
  {
    slug: "daniel-reyes",
    name: "Dr. Daniel Reyes",
    email: "daniel.reyes@lumadent.example",
    phone: "+1 555 010 2102",
    gender: "MALE",
    speciality: "Orthodontics",
    yearsExperience: 9,
    languages: ["English", "Spanish"],
    education:
      "DMD, MS in Orthodontics, University of Texas Health San Antonio",
    bio: "Daniel straightens smiles with clear aligners and fixed braces for teens and adults, planning every case from a 3D scan.",
    services: [
      "clear-aligner-consultation",
      "new-patient-exam",
      "checkup-and-clean",
    ],
    schedule: [
      ...weekdays(
        [
          ["10:00", "13:00"],
          ["14:00", "18:00"],
        ],
        [1, 3, 4],
      ),
      [6, "09:00", "13:00"],
    ],
  },
  {
    slug: "mei-lin-chen",
    name: "Dr. Mei Lin Chen",
    email: "meilin.chen@lumadent.example",
    phone: "+1 555 010 2103",
    gender: "FEMALE",
    speciality: "Cosmetic & Restorative Dentistry",
    yearsExperience: 14,
    languages: ["English", "Mandarin"],
    education:
      "DDS, UCLA School of Dentistry; Fellowship in Aesthetic Dentistry",
    bio: "Mei Lin focuses on natural-looking results: whitening, bonding and tooth-coloured restorations that match your smile.",
    services: [
      "professional-whitening",
      "tooth-coloured-filling",
      "checkup-and-clean",
      "new-patient-exam",
    ],
    schedule: weekdays(
      [
        ["09:00", "13:00"],
        ["14:00", "17:30"],
      ],
      [2, 3, 4, 5],
    ),
  },
  {
    slug: "samuel-haddad",
    name: "Dr. Samuel Haddad",
    email: "samuel.haddad@lumadent.example",
    phone: "+1 555 010 2104",
    gender: "MALE",
    speciality: "Endodontics",
    yearsExperience: 17,
    languages: ["English", "Arabic", "French"],
    education: "DDS, Certificate in Endodontics, University of Pennsylvania",
    bio: "Samuel saves teeth. He handles toothache, infections and root canal treatment with a calm, step-by-step approach.",
    services: [
      "root-canal-treatment",
      "emergency-visit",
      "tooth-coloured-filling",
    ],
    schedule: weekdays(
      [
        ["08:00", "12:00"],
        ["13:00", "16:00"],
      ],
      [1, 2, 4, 5],
    ),
  },
  {
    slug: "priya-raman",
    name: "Dr. Priya Raman",
    email: "priya.raman@lumadent.example",
    phone: "+1 555 010 2105",
    gender: "FEMALE",
    speciality: "Paediatric Dentistry",
    yearsExperience: 8,
    languages: ["English", "Tamil", "Hindi"],
    education: "BDS, MDS in Paediatric Dentistry; AAPD member",
    bio: "Priya makes the dentist a good place to be for children, with short visits, clear explanations and plenty of patience.",
    services: [
      "childrens-check-up",
      "checkup-and-clean",
      "hygienist-deep-clean",
      "emergency-visit",
    ],
    schedule: [
      ...weekdays([["09:00", "15:00"]], [1, 2, 3, 5]),
      [6, "09:00", "12:00"],
    ],
  },
];

async function seedServices() {
  for (const [i, s] of SERVICES.entries()) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      create: { ...s, sortOrder: i * 10 },
      // only refresh descriptive fields; never overwrite an admin's price or duration
      update: {
        name: s.name,
        description: s.description,
        category: s.category,
      },
    });
  }
  console.log(`services: ${SERVICES.length} upserted`);
}

async function seedDoctors() {
  const services = new Map(
    (await prisma.service.findMany({ select: { id: true, slug: true } })).map(
      (s) => [s.slug, s.id],
    ),
  );
  for (const d of DOCTORS) {
    const base = {
      name: d.name,
      speciality: d.speciality,
      bio: d.bio,
      yearsExperience: d.yearsExperience,
      languages: d.languages,
      education: d.education,
      gender: d.gender,
    };
    const doctor = await prisma.doctor.upsert({
      where: { slug: d.slug },
      create: {
        ...base,
        slug: d.slug,
        email: d.email,
        phone: d.phone,
        imageUrl: generateAvatar(d.name, d.gender),
        isActive: true,
      },
      update: base,
      include: { _count: { select: { schedules: true, services: true } } },
    });
    if (doctor._count.schedules === 0) {
      await prisma.doctorSchedule.createMany({
        data: d.schedule.map(([weekday, startTime, endTime]) => ({
          doctorId: doctor.id,
          weekday,
          startTime,
          endTime,
        })),
      });
    }
    if (doctor._count.services === 0) {
      await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          services: {
            connect: d.services.map((slug) => ({
              id: services.get(slug) as string,
            })),
          },
        },
      });
    }
  }
  console.log(`dentists: ${DOCTORS.length} upserted`);
}

/** Appointments created before startsAt existed: derive startsAt/endsAt (clinic tz) and the slot key. */
async function backfillLegacyAppointments() {
  const legacy = await prisma.appointment.findMany({
    where: { startsAt: null },
  });
  let fixed = 0;
  for (const a of legacy) {
    const startsAt = legacyStartsAt(a.date, a.time);
    if (!startsAt) continue;
    const endsAt = new Date(startsAt.getTime() + a.duration * 60_000);
    const holds =
      a.status === "CONFIRMED" ||
      a.status === "PENDING" ||
      a.status === "COMPLETED";
    try {
      await prisma.appointment.update({
        where: { id: a.id },
        data: {
          startsAt,
          endsAt,
          slotKey: holds ? slotKeyFor(a.doctorId, startsAt) : null,
        },
      });
    } catch {
      // two legacy rows double-booked the same slot: keep the times, leave the key off the later one
      await prisma.appointment.update({
        where: { id: a.id },
        data: { startsAt, endsAt },
      });
    }
    fixed++;
  }
  if (legacy.length)
    console.log(`legacy appointments backfilled: ${fixed}/${legacy.length}`);
}

const DEMO_PATIENTS = [
  {
    clerkId: "demo_patient_1",
    email: "jordan.demo@patients.example",
    firstName: "Jordan",
    lastName: "Avery",
    phone: "+1 555 010 3001",
    allergies: "Penicillin",
  },
  {
    clerkId: "demo_patient_2",
    email: "sam.demo@patients.example",
    firstName: "Sam",
    lastName: "Okoro",
    phone: "+1 555 010 3002",
    allergies: null,
  },
  {
    clerkId: "demo_patient_3",
    email: "riley.demo@patients.example",
    firstName: "Riley",
    lastName: "Nguyen",
    phone: "+1 555 010 3003",
    allergies: "Latex",
  },
];

async function seedDemo() {
  const rules = clinicRules();
  const now = new Date();
  const today = todayInClinic(now, rules.timeZone);
  const doctors = await prisma.doctor.findMany({
    where: { slug: { in: DOCTORS.map((d) => d.slug) } },
    include: { schedules: true, services: true },
    orderBy: { name: "asc" },
  });

  for (const [pi, p] of DEMO_PATIENTS.entries()) {
    const user = await prisma.user.upsert({
      where: { clerkId: p.clerkId },
      create: { ...p, welcomeEmailSentAt: now },
      update: {},
    });
    if ((await prisma.appointment.count({ where: { userId: user.id } })) > 0)
      continue;

    // Past visits: placed directly on the dentist's schedule, outcomes recorded.
    const past: Array<["COMPLETED" | "NO_SHOW" | "CANCELLED", number]> = [
      ["COMPLETED", -40 - pi * 3],
      ["COMPLETED", -12 - pi],
      ["NO_SHOW", -5 - pi],
    ];
    for (const [i, [status, dayOffset]] of past.entries()) {
      const doctor = doctors[(pi + i) % doctors.length];
      const service = doctor.services[i % doctor.services.length];
      // first scheduled weekday at or before the offset
      let date = addDaysToLocalDate(today, dayOffset);
      for (
        let k = 0;
        k < 7 &&
        !doctor.schedules.some(
          (s) => s.weekday === new Date(`${date}T00:00:00Z`).getUTCDay(),
        );
        k++
      ) {
        date = addDaysToLocalDate(date, -1);
      }
      const window = doctor.schedules.find(
        (s) => s.weekday === new Date(`${date}T00:00:00Z`).getUTCDay(),
      );
      if (!window) continue;
      const startsAt = localToUtc(date, window.startTime, rules.timeZone);
      if (!startsAt) continue;
      const endsAt = new Date(
        startsAt.getTime() + service.durationMinutes * 60_000,
      );
      const appt = await prisma.appointment.create({
        data: {
          userId: user.id,
          doctorId: doctor.id,
          serviceId: service.id,
          date: legacyDateColumn(date),
          time: window.startTime,
          duration: service.durationMinutes,
          startsAt,
          endsAt,
          status,
          priceCents: service.priceCents,
          reason: service.name,
          slotKey:
            status === "COMPLETED" ? slotKeyFor(doctor.id, startsAt) : null,
          reminderSent24h: true,
          reminderSent1Hour: true,
          createdAt: new Date(startsAt.getTime() - 7 * 864e5),
        },
      });
      if (status === "COMPLETED") {
        await prisma.visitNote.create({
          data: {
            appointmentId: appt.id,
            summary:
              "Healthy gums; mild plaque on lower molars. Discussed flossing technique.",
            treatment: `${service.name} completed without complications.`,
            followUpInDays: 180,
            createdBy: "seed",
          },
        });
        if (i === 0) {
          await prisma.review.create({
            data: {
              appointmentId: appt.id,
              userId: user.id,
              doctorId: doctor.id,
              rating: 5 - (pi % 2),
              comment: "Clear explanations and no waiting.",
            },
          });
        }
      }
    }

    // One upcoming visit on a genuinely free slot.
    const doctor = doctors[pi % doctors.length];
    const service = doctor.services[0];
    for (let d = 2 + pi; d < 14; d++) {
      const date = addDaysToLocalDate(today, d);
      const range = localDayRange(date, rules.timeZone);
      const busy = (
        await prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
            startsAt: { lt: range.end },
            endsAt: { gt: range.start },
          },
          select: { startsAt: true, endsAt: true },
        })
      ).map((b) => ({
        startsAt: b.startsAt as Date,
        endsAt: b.endsAt as Date,
      }));
      const slots = computeAvailableSlots({
        ...rules,
        date,
        durationMinutes: service.durationMinutes,
        schedules: doctor.schedules,
        timeOff: [],
        busy,
        now,
      });
      const slot = slots[Math.min(2, slots.length - 1)];
      if (!slot) continue;
      await prisma.appointment.create({
        data: {
          userId: user.id,
          doctorId: doctor.id,
          serviceId: service.id,
          date: legacyDateColumn(date),
          time: slot.time,
          duration: Math.round(
            (slot.endsAt.getTime() - slot.startsAt.getTime()) / 60_000,
          ),
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status: "CONFIRMED",
          priceCents: service.priceCents,
          reason: service.name,
          slotKey: slotKeyFor(doctor.id, slot.startsAt),
        },
      });
      break;
    }
  }
  console.log(
    `demo: ${DEMO_PATIENTS.length} patients with appointments (clerkId demo_patient_*; they cannot sign in)`,
  );
}

async function main() {
  await seedServices();
  await seedDoctors();
  await backfillLegacyAppointments();
  if (process.argv.includes("--demo")) await seedDemo();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
