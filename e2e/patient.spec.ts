import { expect, type Locator, type Page, test } from "@playwright/test";
import { loadRun, storageStatePath } from "./users";

const run = loadRun();

/** Picks a random entry (avoids always taking the same slot across runs). */
function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

async function chooseDayAndTime(scope: Page | Locator, avoidFirstDay = false) {
  const days = scope.locator("label[data-date]");
  await expect(days.first()).toBeVisible();
  const count = await days.count();
  const start = avoidFirstDay && count > 1 ? 1 : 0;
  const day = days.nth(start + Math.floor(Math.random() * (count - start)));
  await day.click();
  const times = scope.locator('label:has(input[type="radio"][name$="-time"])');
  await expect(times.first()).toBeVisible();
  const all = await times.all();
  await pick(all).click();
}

test.describe
  .serial("patient booking journey", () => {
    test.use({ storageState: storageStatePath("patient") });
    const note = `E2E note ${run.runId}`;
    let bookedId = "";

    test("books from /services 'Book this' through the four steps", async ({
      page,
    }) => {
      await page.goto("/services");
      const book = page.getByRole("link", { name: /^Book this/ }).first();
      const serviceName = ((await book.textContent()) ?? "")
        .replace(/^Book this:\s*/, "")
        .trim();
      await book.click();
      await expect(page).toHaveURL(/\/appointments\?service=/);

      await expect(
        page.getByRole("heading", { name: "Who would you like to see?" }),
      ).toBeVisible();
      const dentists = page.locator("button[aria-pressed]").filter({
        hasNotText: "Any available dentist",
      });
      await dentists.first().click();

      await expect(
        page.getByRole("heading", { name: "When suits you?" }),
      ).toBeVisible();
      await chooseDayAndTime(page, true);
      await page
        .getByRole("button", { name: "Review booking" })
        .filter({ visible: true })
        .click();

      await expect(
        page.getByRole("heading", { name: "Check and confirm" }),
      ).toBeVisible();
      await expect(page.getByText(serviceName).first()).toBeVisible();
      await page.locator("#booking-note").fill(note);
      await page
        .getByRole("button", { name: "Confirm booking" })
        .filter({ visible: true })
        .click();

      await expect(page).toHaveURL(/confirmed=/);
      bookedId = new URL(page.url()).searchParams.get("confirmed") ?? "";
      expect(bookedId).not.toBe("");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("sees the visit on /visits, reschedules it and cancels it", async ({
      page,
    }) => {
      await page.goto("/visits");
      const card = page.getByRole("listitem").filter({ hasText: note });
      await expect(card).toHaveCount(1);

      await card.getByRole("button", { name: "Reschedule" }).click();
      const move = page.getByRole("dialog", { name: "Move your visit" });
      await expect(move).toBeVisible();
      await chooseDayAndTime(move);
      const moveButton = move.getByRole("button", { name: "Move visit" });
      if (await moveButton.isDisabled()) {
        // Picked the current time by chance; any other slot will do.
        await move
          .locator(
            'label:has(input[type="radio"][name$="-time"]):not(:has(input:checked))',
          )
          .first()
          .click();
      }
      await moveButton.click();
      await expect(move).toBeHidden();

      // The new time is the only upcoming visit; the old one moves to Past and says where it went.
      const upcoming = page.getByRole("listitem").filter({ hasText: note });
      await expect(upcoming).toHaveCount(1);
      await expect(
        upcoming.getByRole("button", { name: "Reschedule" }),
      ).toBeEnabled();
      await page.getByRole("tab", { name: /past/i }).click();
      await expect(page.getByText("Moved to")).toBeVisible();
      await page.getByRole("tab", { name: /upcoming/i }).click();

      await upcoming.getByRole("button", { name: "Cancel" }).click();
      const confirm = page.getByRole("alertdialog", {
        name: "Cancel this visit?",
      });
      await confirm.getByLabel(/reason/i).fill(`Travelling ${run.runId}`);
      await confirm.getByRole("button", { name: "Cancel visit" }).click();
      await expect(confirm).toBeHidden();
      await expect(page.getByText("No upcoming visits")).toBeVisible();
      await page.getByRole("tab", { name: /past/i }).click();
      await expect(
        page.getByText(`You cancelled: Travelling ${run.runId}`),
      ).toBeVisible();
    });

    test.describe("another patient", () => {
      test.use({ storageState: storageStatePath("otherPatient") });

      test("cannot see the first patient's visit", async ({ page }) => {
        expect(bookedId).not.toBe("");
        await page.goto("/visits");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByText(note)).toHaveCount(0);
        await expect(page.getByText(`Travelling ${run.runId}`)).toHaveCount(0);

        // Opening the first patient's confirmation by id must not reveal it either.
        await page.goto(`/appointments?confirmed=${bookedId}`);
        await expect(
          page.getByText("We couldn't find that booking"),
        ).toBeVisible();
      });
    });
  });
