/** Questions we ask Clerk's Backend API about accounts (server only). */
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Whether a Clerk user still exists. False only on a definite 404; any other failure (network, 5xx,
 * rate limit) is rethrown so a caller deciding whether to hand a local account to someone else
 * refuses instead of guessing.
 */
export async function clerkAccountExists(clerkId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    await client.users.getUser(clerkId);
    return true;
  } catch (error) {
    if ((error as { status?: unknown } | null)?.status === 404) return false;
    throw error;
  }
}
