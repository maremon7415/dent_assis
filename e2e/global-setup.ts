import { PrismaClient } from "@prisma/client";
import "./env";
import { createClerkUser } from "./clerk-api";
import { type Role, saveRun, type TestUser } from "./users";

/**
 * Creates three Clerk users for this run (two patients and an admin) through the Clerk Backend API and
 * their local rows. The admin gets role ADMIN in the database, which is where roles live. Emails use
 * the `+clerk_test` suffix so the development instance accepts the fixed code 424242.
 */
export default async function globalSetup() {
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const prisma = new PrismaClient();
  const specs: Record<Role, { firstName: string; admin: boolean }> = {
    patient: { firstName: "Ava", admin: false },
    otherPatient: { firstName: "Ben", admin: false },
    admin: { firstName: "Ada", admin: true },
  };
  const users = {} as Record<Role, TestUser>;
  try {
    for (const [role, spec] of Object.entries(specs) as [
      Role,
      (typeof specs)[Role],
    ][]) {
      const email = `e2e-${role.toLowerCase()}-${runId}+clerk_test@example.com`;
      const password = `E2e-${runId}-Pass!`;
      const lastName = `E2E${runId}`;
      const clerkUser = await createClerkUser({
        email,
        password,
        firstName: spec.firstName,
        lastName,
      });
      const row = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email,
          firstName: spec.firstName,
          lastName,
          role: spec.admin ? "ADMIN" : "PATIENT",
        },
      });
      users[role] = {
        role,
        clerkId: clerkUser.id,
        dbId: row.id,
        email,
        password,
        firstName: spec.firstName,
        lastName,
      };
    }
  } finally {
    await prisma.$disconnect();
  }
  saveRun({ runId, users });
}
