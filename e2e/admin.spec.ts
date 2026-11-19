import { expect, test } from "@playwright/test";
import {
  addDaysToLocalDate,
  legacyDateColumn,
  localToUtc,
  todayInClinic,
} from "@/lib/time";
import { db } from "./db";
import { fullName, loadRun, storageStatePath } from "./users";

const run = loadRun();
const summary = `Cleaned and polished; no decay found (${run.runId}).`;
let appointmentId = "";

test.describe
  .serial("admin records a visit outcome", () => {
    test.beforeAll(async () => {
      // A visit that already happened can't be booked through the UI, so arrange it directly.
      const prisma = db();
      const service = await prisma.service.findFirstOrThrow({
        where: { isActive: true, doctors: { some: { isActive: true } } },
        orderBy: { sortOrder: "asc" },
        include: { doctors: { where: { isActive: true }, take: 1 } },
      });
      const doctor = service.doctors[0];
      const date = addDaysToLocalDate(todayInClinic(), -2);
      // An off-grid minute keeps this row clear of real bookings' slot keys.
      const time = `06:${String(10 + Math.floor(Math.random() * 49)).padStart(2, "0")}`;
      const startsAt = localToUtc(date, time);
      if (!startsAt) throw new Error(`Invalid clinic time ${date} ${time}`);
      const endsAt = new Date(
        startsAt.getTime() + service.durationMinutes * 60_000,
      );
      const appt = await prisma.appointment.create({
        data: {
          userId: run.users.patient.dbId,
          doctorId: doctor.id,
          serviceId: service.id,
          date: legacyDateColumn(date),
          time,
          duration: service.durationMinutes,
          startsAt,
          endsAt,
          status: "CONFIRMED",
          priceCents: service.priceCents,
          slotKey: `${doctor.id}|${startsAt.toISOString()}`,
        },
      });
      appointmentId = appt.id;
    });

    test.afterAll(async () => {
      await db().$disconnect();
    });

    test.describe("as admin", () => {
      test.use({ storageState: storageStatePath("admin") });

      test("marks the visit completed with a visit note", async ({ page }) => {
        const patient = run.users.patient;
        await page.goto(
          `/admin/appointments?q=${encodeURIComponent(patient.email)}`,
        );
        const actions = page.getByRole("button", {
          name: new RegExp(`^Actions for ${fullName(patient)} at `),
        });
        await expect(actions.filter({ visible: true })).toHaveCount(1);
        await actions.filter({ visible: true }).click();
        await page.getByRole("menuitem", { name: "Mark completed" }).click();

        const dialog = page.getByRole("dialog", {
          name: "Complete this visit",
        });
        await dialog.getByLabel("Summary").fill(summary);
        await dialog
          .getByLabel("Treatment (optional)")
          .fill("Scale and polish");
        await dialog.getByLabel("Follow-up in (days, optional)").fill("180");
        await dialog
          .getByRole("button", { name: "Complete and save note" })
          .click();
        await expect(dialog).toBeHidden();
        await expect(
          page.getByText("Note added").filter({ visible: true }),
        ).toBeVisible();

        const row = await db().appointment.findUniqueOrThrow({
          where: { id: appointmentId },
          include: { visitNote: true },
        });
        expect(row.status).toBe("COMPLETED");
        expect(row.visitNote?.summary).toBe(summary);
      });
    });

    test.describe("as the patient", () => {
      test.use({ storageState: storageStatePath("patient") });

      test("reads the dentist's note and leaves a review", async ({ page }) => {
        await page.goto("/visits");
        const card = page.getByRole("listitem").filter({ hasText: summary });
        await expect(card).toHaveCount(1);
        await expect(card.getByText("Dentist's note")).toBeVisible();
        await expect(
          card.getByText("Follow-up advised in 180 days"),
        ).toBeVisible();

        await card.getByRole("button", { name: "Leave a review" }).click();
        const dialog = page.getByRole("dialog", {
          name: "How was your visit?",
        });
        await dialog
          .locator("label")
          .filter({ has: page.getByRole("radio", { name: /^5 stars/ }) })
          .click();
        await dialog
          .getByLabel(/comment/i)
          .fill(`Gentle and quick (${run.runId})`);
        await dialog.getByRole("button", { name: "Post review" }).click();
        await expect(dialog).toBeHidden();
        await expect(
          card.getByLabel("You rated this visit 5 out of 5"),
        ).toBeVisible();
        await expect(
          card.getByRole("button", { name: "Leave a review" }),
        ).toHaveCount(0);
      });
    });
  });
