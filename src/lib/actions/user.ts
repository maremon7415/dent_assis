"use server";

import { getCurrentUser } from "@/lib/auth";

/**
 * Called by <UserSync /> after sign-in: makes sure the local user row exists (and admin promotion and
 * the welcome email happen). Returns only non-sensitive fields.
 */
export async function syncUser(): Promise<{
  id: string;
  role: "PATIENT" | "ADMIN";
} | null> {
  try {
    const user = await getCurrentUser();
    return user ? { id: user.id, role: user.role } : null;
  } catch (error) {
    console.error("[syncUser] failed", error);
    return null;
  }
}
