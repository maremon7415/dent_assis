"use server";

import type { User } from "@prisma/client";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { runAction } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { type ProfileInput, profileSchema } from "@/lib/validation";

export interface ProfileDTO {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: User["role"];
  /** "YYYY-MM-DD" */
  dateOfBirth: string | null;
  allergies: string | null;
  medications: string | null;
  medicalNotes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  marketingOptIn: boolean;
  memberSince: string;
}

function toProfile(u: User): ProfileDTO {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    dateOfBirth: u.dateOfBirth
      ? u.dateOfBirth.toISOString().slice(0, 10)
      : null,
    allergies: u.allergies,
    medications: u.medications,
    medicalNotes: u.medicalNotes,
    emergencyContactName: u.emergencyContactName,
    emergencyContactPhone: u.emergencyContactPhone,
    marketingOptIn: u.marketingOptIn,
    memberSince: u.createdAt.toISOString(),
  };
}

/** The signed-in patient's own profile and health information. */
export async function getMyProfile(): Promise<ActionResult<ProfileDTO>> {
  return runAction(async () => toProfile(await requireUser()));
}

/**
 * Update the signed-in patient's profile. Email is managed by Clerk and synced by the webhook, so it is
 * not editable here. Omitted fields are left unchanged; null clears a field.
 */
export async function updateMyProfile(
  input: ProfileInput,
): Promise<ActionResult<ProfileDTO>> {
  return runAction(async () => {
    const user = await requireUser();
    const parsed = profileSchema.parse(input);
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in input)) continue; // omitted -> unchanged
      data[key] =
        key === "dateOfBirth"
          ? value
            ? new Date(`${value}T00:00:00.000Z`)
            : null
          : value;
    }
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return toProfile(updated);
  });
}
