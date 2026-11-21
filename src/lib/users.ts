/**
 * User lifecycle driven by Clerk (webhooks and the sign-in sync). Idempotent: replays of the same
 * event are harmless.
 */
import type { Prisma, PrismaClient, User } from "@prisma/client";
import { isAdminEmail } from "./auth-shared";
import { clerkAccountExists } from "./clerk-account";
import { isPrismaUniqueViolation } from "./errors";
import { prisma as defaultPrisma } from "./prisma";

/** The subset of Clerk's webhook user object we use (snake_case, as Clerk sends it). */
export interface ClerkUserPayload {
  id: string;
  email_addresses?: Array<{
    id: string;
    email_address: string;
    verification?: { status?: string } | null;
  }>;
  primary_email_address_id?: string | null;
  phone_numbers?: Array<{ id: string; phone_number: string }>;
  primary_phone_number_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export function primaryEmailOf(
  data: ClerkUserPayload,
): { email: string; verified: boolean } | null {
  const list = data.email_addresses ?? [];
  const primary =
    list.find((e) => e.id === data.primary_email_address_id) ?? list[0];
  if (!primary?.email_address) return null;
  return {
    email: primary.email_address.toLowerCase(),
    verified: primary.verification?.status === "verified",
  };
}

type Profile = { firstName: string | null; lastName: string | null };

/**
 * Create or update the local user for a Clerk user.created / user.updated event or a sign-in sync.
 * Returns the user and whether it was newly created, or null when no row may be created or linked.
 * Soft-deleted users are never revived.
 *
 *  - A row is only created for a *verified* primary email.
 *  - An existing row takes Clerk's name and, when verified, its new primary email. An email that
 *    already belongs to another row is not taken; the old one is kept.
 *  - A new Clerk id whose verified email is already on a row with another Clerk id takes that row over
 *    only when Clerk confirms the old account is gone (404). The role is then reset to PATIENT and
 *    re-evaluated against ADMIN_EMAILS, so a re-registered address never inherits admin rights.
 */
export async function upsertUserFromClerk(
  data: ClerkUserPayload,
  db: PrismaClient = defaultPrisma,
): Promise<{ user: User; created: boolean } | null> {
  const primary = primaryEmailOf(data);
  if (!primary) return null;
  const phone =
    (data.phone_numbers ?? []).find(
      (p) => p.id === data.primary_phone_number_id,
    )?.phone_number ??
    data.phone_numbers?.[0]?.phone_number ??
    null;

  const existing = await db.user.findUnique({ where: { clerkId: data.id } });
  if (existing?.deletedAt) return { user: existing, created: false };

  const promote = primary.verified && isAdminEmail(primary.email);
  const profile: Profile = {
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
  };

  if (existing) {
    const user = await refreshUser(db, existing, primary, profile, promote);
    return { user, created: false };
  }

  if (!primary.verified) return null;

  try {
    const user = await db.user.create({
      data: {
        clerkId: data.id,
        email: primary.email,
        phone,
        ...profile,
        ...(promote ? { role: "ADMIN" as const } : {}),
      },
    });
    return { user, created: true };
  } catch (error) {
    if (isPrismaUniqueViolation(error, "clerkId")) {
      // raced with the sign-in sync or another delivery: the row now exists
      const user = await db.user.findUniqueOrThrow({
        where: { clerkId: data.id },
      });
      return { user, created: false };
    }
    if (isPrismaUniqueViolation(error, "email")) {
      const user = await relinkByEmail(
        db,
        data.id,
        primary.email,
        profile,
        promote,
      );
      return user ? { user, created: false } : null;
    }
    throw error;
  }
}

async function refreshUser(
  db: PrismaClient,
  existing: User,
  primary: { email: string; verified: boolean },
  profile: Profile,
  promote: boolean,
): Promise<User> {
  const changes: Prisma.UserUpdateInput = {};
  if (primary.verified && primary.email !== existing.email)
    changes.email = primary.email;
  if (profile.firstName !== existing.firstName)
    changes.firstName = profile.firstName;
  if (profile.lastName !== existing.lastName)
    changes.lastName = profile.lastName;
  if (promote && existing.role !== "ADMIN") changes.role = "ADMIN";
  if (Object.keys(changes).length === 0) return existing;

  try {
    return await db.user.update({ where: { id: existing.id }, data: changes });
  } catch (error) {
    if (!changes.email || !isPrismaUniqueViolation(error, "email")) throw error;
    console.warn(
      `[users] user ${existing.id}: the new email already belongs to another account; kept the old email`,
    );
    const { email: _kept, ...rest } = changes;
    if (Object.keys(rest).length === 0) return existing;
    return db.user.update({ where: { id: existing.id }, data: rest });
  }
}

/** Hand the row holding `email` to `newClerkId`, only if that row's Clerk account no longer exists. */
async function relinkByEmail(
  db: PrismaClient,
  newClerkId: string,
  email: string,
  profile: Profile,
  promote: boolean,
): Promise<User | null> {
  const holder = await db.user.findUnique({ where: { email } });
  if (!holder || holder.deletedAt) return null;
  if (holder.clerkId === newClerkId) return holder;

  // Throws when Clerk cannot answer: the caller fails (the webhook is retried) instead of guessing.
  if (await clerkAccountExists(holder.clerkId)) {
    console.warn(
      `[users] refused to re-link user ${holder.id}: its email arrived on a new Clerk account while the old Clerk account still exists`,
    );
    return null;
  }

  // Conditional on the old clerkId so two racing deliveries cannot both move it.
  const moved = await db.user.updateMany({
    where: { id: holder.id, clerkId: holder.clerkId },
    data: {
      clerkId: newClerkId,
      ...profile,
      role: promote ? "ADMIN" : "PATIENT",
    },
  });
  if (moved.count === 0) return null;
  console.info(
    `[users] re-linked user ${holder.id} to a new Clerk account (the old one is deleted in Clerk)`,
  );
  return db.user.findUnique({ where: { id: holder.id } });
}

/**
 * user.deleted: keep the row (appointments, visit notes and reviews reference it for the clinic's
 * records) but erase personal data, cancel future appointments to free the slots, and mark deletedAt.
 */
export async function softDeleteUserByClerkId(
  clerkId: string,
  now: Date = new Date(),
  db: PrismaClient = defaultPrisma,
) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user || user.deletedAt)
    return { deleted: false, cancelledAppointments: 0 };
  return db.$transaction(async (tx) => {
    const cancelled = await tx.appointment.updateMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gt: now },
      },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelledBy: "SYSTEM",
        cancelReason: "Account deleted",
        slotKey: null,
      },
    });
    await tx.review.updateMany({
      where: { userId: user.id },
      data: { comment: null },
    });
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@deleted.invalid`,
        firstName: null,
        lastName: null,
        phone: null,
        dateOfBirth: null,
        allergies: null,
        medications: null,
        medicalNotes: null,
        emergencyContactName: null,
        emergencyContactPhone: null,
        marketingOptIn: false,
        role: "PATIENT",
        deletedAt: now,
      },
    });
    return { deleted: true, cancelledAppointments: cancelled.count };
  });
}
