import { type ConsoleMessage, expect, type Page } from "@playwright/test";
import type { TestUser } from "./users";

/** Sign in through the real Clerk UI (the modal opened from the site header). */
export async function signInThroughClerk(page: Page, user: TestUser) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).first().click();
  const dialog = page.locator(".cl-signIn-root");
  await dialog.getByLabel(/email address/i).fill(user.email);
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel(/^password/i).fill(user.password);
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  // A first sign-in from a new browser asks for an email code; +clerk_test addresses accept 424242.
  const verify = dialog.getByText(/check your email/i);
  await Promise.race([
    page.waitForURL("**/dashboard", { timeout: 20_000 }),
    verify.waitFor({ timeout: 20_000 }),
  ]);
  if (await verify.isVisible().catch(() => false)) {
    await page.keyboard.type("424242");
  }
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
}

/**
 * Collects console errors raised by this app. Failures of third-party requests (Clerk telemetry and
 * bot protection, which this sandbox's network may block) are not app defects and are ignored.
 */
export function collectConsoleErrors(
  page: Page,
  origin = "http://localhost:3200",
) {
  const errors: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const url = msg.location().url ?? "";
    if (url && !url.startsWith(origin)) return;
    errors.push(`${msg.text()} (${url})`);
  };
  page.on("console", onConsole);
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

export async function expectHeading(page: Page, name: string | RegExp) {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}
