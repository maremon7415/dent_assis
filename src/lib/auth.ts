/**
 * Server-side identity and authorization. Every server action and protected route handler calls
 * requireUser() or requireAdmin(); hiding a link in the UI is never authorization.
 *
 * Roles live in the database (User.role). Bootstrap admins with ADMIN_EMAILS (comma separated; the
 * legacy single ADMIN_EMAIL is honoured too): a user whose *verified* primary email is listed is
 * promoted to ADMIN when synced. Promotion is one-way; demote by updating the row.
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { cache } from "react";
import { isAdminEmail } from "./auth-shared";
import { defer } from "./defer";
import { sendWelcomeEmailOnce } from "./email";
import {
  ForbiddenError,
  isPrismaUniqueViolation,
  UnauthenticatedError,
} from "./errors";
import { prisma } from "./prisma";

export type CurrentUser = User;
export { adminEmails, isAdminEmail } from "./auth-shared";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

function primaryEmail(
  clerkUser: ClerkUser,
): { email: string; verified: boolean } | null {
  const primary =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    ) ?? clerkUser.emailAddresses[0];
  if (!primary) return null;
  return {
    email: primary.emailAddress.toLowerCase(),
    verified: primary.verification?.status === "verified",
  };
}

/** Create or refresh the local row for a Clerk user. Idempotent; safe to race with the webhook. */
export async function syncClerkUser(
  clerkUser: ClerkUser,
): Promise<User | null> {
  const primary = primaryEmail(clerkUser);
  if (!primary) return null;

  const profile = {
    email: primary.email,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  };

  let user: User;
  try {
    user = await prisma.user.upsert({
      where: { clerkId: clerkUser.id },
      create: {
        clerkId: clerkUser.id,
        ...profile,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? null,
      },
      update: {},
    });
  } catch (error) {
    if (!isPrismaUniqueViolation(error, "email")) throw error;
    // Same verified email already belongs to an older Clerk account (re-registration): relink it.
    if (!primary.verified) return null;
    user = await prisma.user.update({
      where: { email: primary.email },
      data: { clerkId: clerkUser.id },
    });
  }

  if (user.deletedAt) return null;

  if (
    user.role !== "ADMIN" &&
    primary.verified &&
    isAdminEmail(primary.email)
  ) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

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
