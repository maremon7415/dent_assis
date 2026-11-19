import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { type Role, storageStatePath } from "./users";

/**
 * axe (WCAG 2.0/2.1/2.2 A and AA rules) on the main pages in light and dark. Serious and critical
 * violations fail the test; moderate and minor ones are printed. Clerk's own widgets are excluded:
 * they are third-party markup we can't change.
 */
async function audit(page: Page, label: string) {
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude(".cl-rootBox")
    .exclude(".cl-userButtonBox")
    .exclude("[data-clerk-component]")
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const minor = results.violations.filter((v) => !blocking.includes(v));
  if (minor.length) {
    console.log(
      `[axe] ${label}: ${minor.map((v) => `${v.id} (${v.impact})`).join(", ")}`,
    );
  }
  expect(
    blocking.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
    })),
    `${label} has serious/critical axe violations`,
  ).toEqual([]);
}

const PUBLIC = ["/", "/services", "/dentists", "/pricing", "/about", "/faq"];
const PORTAL = ["/dashboard", "/appointments", "/visits", "/profile"];
const ADMIN = [
  "/admin",
  "/admin/appointments",
  "/admin/dentists",
  "/admin/patients",
  "/admin/services",
];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`axe, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const path of PUBLIC) {
      test(`public ${path}`, async ({ page }) => {
        await page.goto(path);
        await audit(page, `${path} (${scheme})`);
      });
    }

    const signedIn: [Role, string[]][] = [
      ["patient", PORTAL],
      ["admin", ADMIN],
    ];
    for (const [role, paths] of signedIn) {
      test.describe(role, () => {
        test.use({ storageState: storageStatePath(role) });
        for (const path of paths) {
          test(`${role} ${path}`, async ({ page }) => {
            await page.goto(path);
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
            await audit(page, `${path} (${scheme})`);
          });
        }
      });
    }
  });
}
