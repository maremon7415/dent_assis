import { expect, test } from "@playwright/test";
import { collectConsoleErrors } from "./helpers";

const PAGES: { path: string; h1: RegExp }[] = [
  { path: "/", h1: /dental care that answers back/i },
  { path: "/services", h1: /./ },
  { path: "/dentists", h1: /./ },
  { path: "/pricing", h1: /./ },
  { path: "/about", h1: /./ },
  { path: "/faq", h1: /./ },
];

test.describe("public pages", () => {
  for (const { path, h1 } of PAGES) {
    test(`${path} renders without console errors`, async ({
      page,
      baseURL,
    }) => {
      const errors = collectConsoleErrors(page, baseURL);
      const res = await page.goto(path, { waitUntil: "networkidle" });
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      expect(errors).toEqual([]);
    });
  }

  test("a dentist profile renders without console errors", async ({
    page,
    baseURL,
  }) => {
    await page.goto("/dentists");
    const profile = page.locator('a[href^="/dentists/"]').first();
    const href = await profile.getAttribute("href");
    expect(href).toBeTruthy();
    const errors = collectConsoleErrors(page, baseURL);
    const res = await page.goto(href ?? "/dentists", {
      waitUntil: "networkidle",
    });
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/\S/);
    await expect(
      page.getByRole("link", { name: /book/i }).first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("an unknown page shows the 404 page", async ({ page, baseURL }) => {
    const errors = collectConsoleErrors(page, baseURL);
    const res = await page.goto("/no-such-page-e2e", {
      waitUntil: "networkidle",
    });
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /home|services|book/i }).first(),
    ).toBeVisible();
    // The browser itself logs the document's 404; anything else is a defect.
    expect(errors.filter((e) => !/status of 404/.test(e))).toEqual([]);
  });
});
