import { expect, test } from "@playwright/test";
import { storageStatePath } from "./users";

test.describe("signed out", () => {
  test("visiting /dashboard redirects to Clerk sign-in and back", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/sign-in/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirect_url")).toMatch(/\/dashboard$/);
  });

  test("a deep booking link keeps every query parameter through the redirect", async ({
    page,
  }) => {
    await page.goto(
      "/appointments?service=checkup-and-clean&doctor=any&step=time",
    );
    await page.waitForURL(/\/sign-in/);
    const back = new URL(
      new URL(page.url()).searchParams.get("redirect_url") ?? "",
    );
    expect(back.pathname).toBe("/appointments");
    expect(back.searchParams.get("service")).toBe("checkup-and-clean");
    expect(back.searchParams.get("doctor")).toBe("any");
    expect(back.searchParams.get("step")).toBe("time");
  });
});

test.describe("patient (not an admin)", () => {
  test.use({ storageState: storageStatePath("otherPatient") });

  test("is sent from /admin to the patient dashboard", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/admin/appointments");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("a deep booking link keeps every query parameter on a full page load", async ({
    page,
  }) => {
    await page.goto(
      "/appointments?service=checkup-and-clean&doctor=any&step=time",
    );
    const url = new URL(page.url());
    expect(url.pathname).toBe("/appointments");
    expect(url.searchParams.get("service")).toBe("checkup-and-clean");
    expect(url.searchParams.get("doctor")).toBe("any");
  });
});
