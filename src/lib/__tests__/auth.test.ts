import { beforeEach, describe, expect, it, vi } from "vitest";

const clerk = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn() }));
const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

vi.mock("@clerk/nextjs/server", () => clerk);
vi.mock("../clerk-account", () => ({ clerkAccountExists: vi.fn() }));
vi.mock("../prisma", () => ({ prisma: db }));
vi.mock("../email", () => ({ sendWelcomeEmailOnce: vi.fn() }));
vi.mock("../defer", () => ({ defer: vi.fn() }));
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

import {
  getCurrentUser,
  isAdminEmail,
  requireAdmin,
  requireUser,
} from "../auth";
import { ForbiddenError, UnauthenticatedError } from "../errors";

const baseUser = {
  id: "u1",
  clerkId: "clerk_1",
  email: "pat@example.com",
  firstName: "Pat",
  lastName: "Lee",
  role: "PATIENT" as const,
  deletedAt: null,
  welcomeEmailSentAt: new Date(),
};

function clerkUser(email: string, verified = true) {
  return {
    id: "clerk_1",
    firstName: "Pat",
    lastName: "Lee",
    primaryEmailAddressId: "e1",
    emailAddresses: [
      {
        id: "e1",
        emailAddress: email,
        verification: { status: verified ? "verified" : "unverified" },
      },
    ],
    phoneNumbers: [],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.ADMIN_EMAILS;
  delete process.env.ADMIN_EMAIL;
});

describe("requireUser / requireAdmin", () => {
  it("rejects signed-out requests without touching the database", async () => {
    clerk.auth.mockResolvedValue({ userId: null });
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns the local user for a known patient", async () => {
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue(baseUser);
    await expect(requireUser()).resolves.toMatchObject({ id: "u1" });
    expect(clerk.currentUser).not.toHaveBeenCalled();
  });

  it("forbids admin actions for patients", async () => {
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue(baseUser);
    await expect(requireAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows admins by database role", async () => {
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue({ ...baseUser, role: "ADMIN" });
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("treats a soft-deleted account as signed out", async () => {
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue({
      ...baseUser,
      deletedAt: new Date(),
    });
    await expect(getCurrentUser()).resolves.toBeNull();
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

describe("admin bootstrap from ADMIN_EMAILS", () => {
  it("parses a comma separated list case-insensitively and honours legacy ADMIN_EMAIL", () => {
    const env = {
      ADMIN_EMAILS: " Owner@Clinic.example, ops@clinic.example ",
      ADMIN_EMAIL: "legacy@clinic.example",
    };
    expect(isAdminEmail("owner@clinic.example", env)).toBe(true);
    expect(isAdminEmail("OPS@clinic.example", env)).toBe(true);
    expect(isAdminEmail("legacy@clinic.example", env)).toBe(true);
    expect(isAdminEmail("someone@clinic.example", env)).toBe(false);
    expect(isAdminEmail("", {})).toBe(false);
  });

  it("promotes a listed user with a verified email on sync", async () => {
    process.env.ADMIN_EMAILS = "pat@example.com";
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue(baseUser);
    clerk.currentUser.mockResolvedValue(clerkUser("pat@example.com", true));
    db.user.update.mockResolvedValue({ ...baseUser, role: "ADMIN" });
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "ADMIN" },
    });
  });

  it("does not promote when the listed email is unverified", async () => {
    process.env.ADMIN_EMAILS = "pat@example.com";
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue(baseUser);
    clerk.currentUser.mockResolvedValue(clerkUser("pat@example.com", false));
    await expect(requireAdmin()).rejects.toBeInstanceOf(ForbiddenError);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("creates the local row on first sight (sign-in before the webhook)", async () => {
    clerk.auth.mockResolvedValue({ userId: "clerk_1" });
    db.user.findUnique.mockResolvedValue(null);
    clerk.currentUser.mockResolvedValue(clerkUser("Pat@Example.com"));
    db.user.create.mockResolvedValue({ ...baseUser, welcomeEmailSentAt: null });
    await expect(getCurrentUser()).resolves.toMatchObject({ id: "u1" });
    expect(db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkId: "clerk_1",
        email: "pat@example.com",
      }),
    });
  });
});
