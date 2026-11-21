import "./env";
import { deleteClerkUser } from "./clerk-api";
import { loadRun } from "./users";

/**
 * Removes this run's users from the Clerk development instance so it doesn't fill up. Their local rows
 * and appointments stay (appointment history is never deleted).
 */
export default async function globalTeardown() {
  let run: ReturnType<typeof loadRun>;
  try {
    run = loadRun();
  } catch {
    return;
  }
  for (const u of Object.values(run.users)) {
    await deleteClerkUser(u.clerkId).catch((e) => console.warn(String(e)));
  }
}
