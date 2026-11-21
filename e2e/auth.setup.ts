import { test as setup } from "@playwright/test";
import { signInThroughClerk } from "./helpers";
import { loadRun, type Role, storageStatePath } from "./users";

for (const role of ["patient", "otherPatient", "admin"] as Role[]) {
  setup(`sign in ${role} through the Clerk UI`, async ({ page }) => {
    const user = loadRun().users[role];
    await signInThroughClerk(page, user);
    await page.context().storageState({ path: storageStatePath(role) });
  });
}
