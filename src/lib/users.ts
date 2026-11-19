/**
 * User lifecycle driven by Clerk webhooks. Idempotent: replays of the same event are harmless.
 */
import type { PrismaClient, User } from "@prisma/client";
import { isAdminEmail } from "./auth-shared";
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

/**
 * Create or update the local user for a Clerk user.created / user.updated event.
 * Returns the user and whether it was newly created. Soft-deleted users are never revived.
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
  const profile = {
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
  };

  if (existing) {
    try {
      const user = await db.user.update({
        where: { id: existing.id },
        data: {
          ...profile,
          email: primary.email,
          ...(promote ? { role: "ADMIN" as const } : {}),
        },
      });
      return { user, created: false };
    } catch (error) {
      if (!isPrismaUniqueViolation(error, "email")) throw error;
      console.warn(
        "[users] email change clashes with another account; kept the old email",
      );
      const user = await db.user.update({
        where: { id: existing.id },
        data: profile,
      });
      return { user, created: false };
    }
  }

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
      // raced with the sign-in sync: the row now exists
      const user = await db.user.findUniqueOrThrow({
        where: { clerkId: data.id },
      });
      return { user, created: false };
    }
    if (isPrismaUniqueViolation(error, "email") && primary.verified) {
      const user = await db.user.update({
        where: { email: primary.email },
        data: {
          clerkId: data.id,
          ...profile,
          ...(promote ? { role: "ADMIN" as const } : {}),
        },
      });
      return { user, created: false };
    }
    throw error;
  }
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
