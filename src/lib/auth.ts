/**
 * Server-side identity and authorization. Every server action and protected route handler calls
 * requireUser() or requireAdmin(); hiding a link in the UI is never authorization.
 *
 * Roles live in the database (User.role). Bootstrap admins with ADMIN_EMAILS (comma separated; the
 * legacy single ADMIN_EMAIL is honoured too): a user whose *verified* primary email is listed is
 * promoted to ADMIN when synced. Promotion is one-way: removing an address from ADMIN_EMAILS does not
 * demote anyone. Revoke with `npm run admin:revoke -- <email>` (see README).
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { cache } from "react";
import { isAdminEmail } from "./auth-shared";
import { defer } from "./defer";
import { sendWelcomeEmailOnce } from "./email";
import { ForbiddenError, UnauthenticatedError } from "./errors";
import { prisma } from "./prisma";
import { type ClerkUserPayload, upsertUserFromClerk } from "./users";

export type CurrentUser = User;
export { adminEmails, isAdminEmail } from "./auth-shared";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

/** The Backend API user in the webhook's shape, so both paths share one set of linking rules. */
function toPayload(clerkUser: ClerkUser): ClerkUserPayload {
  return {
    id: clerkUser.id,
    email_addresses: clerkUser.emailAddresses.map((e) => ({
      id: e.id,
      email_address: e.emailAddress,
      verification: { status: e.verification?.status },
    })),
    primary_email_address_id: clerkUser.primaryEmailAddressId,
    phone_numbers: clerkUser.phoneNumbers.map((p) => ({
      id: p.id,
      phone_number: p.phoneNumber,
    })),
    primary_phone_number_id: clerkUser.primaryPhoneNumberId,
    first_name: clerkUser.firstName,
    last_name: clerkUser.lastName,
  };
}

/**
 * Create or refresh the local row for a Clerk user (see upsertUserFromClerk for the rules).
 * Idempotent; safe to race with the webhook.
 */
export async function syncClerkUser(
  clerkUser: ClerkUser,
): Promise<User | null> {
  const result = await upsertUserFromClerk(toPayload(clerkUser), prisma);
  if (!result || result.user.deletedAt) return null;
  const user = result.user;

  if (!user.welcomeEmailSentAt) {
    const id = user.id;
    defer("welcome email", () => sendWelcomeEmailOnce(id));
  }
  return user;
}

/**
 * The signed-in, non-deleted user, synced from Clerk on first sight. Null when signed out.
 * Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing?.deletedAt) return null;

  // Fast path: known user who needs no promotion.
  if (existing && (existing.role === "ADMIN" || !isAdminEmail(existing.email)))
    return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) return existing ?? null;
  return syncClerkUser(clerkUser);
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ForbiddenError();
  return user;
}

/** For pages: true when the signed-in user is an admin. Never throws. */
export async function isAdmin(): Promise<boolean> {
  try {
    return (await getCurrentUser())?.role === "ADMIN";
  } catch {
    return false;
  }
}
