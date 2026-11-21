/**
 * Account linking: a new Clerk id that arrives with an email already on a local row may take that row
 * over only when the old Clerk account is really gone, and never inherits an elevated role.
 * Covers both entry points (sign-in sync in auth.ts and the Clerk webhook in users.ts).
 */
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clerkAccount = vi.hoisted(() => ({ clerkAccountExists: vi.fn() }));
const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("../clerk-account", () => clerkAccount);
vi.mock("../prisma", () => ({ prisma: db }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));
vi.mock("../email", () => ({ sendWelcomeEmailOnce: vi.fn() }));
vi.mock("../defer", () => ({ defer: vi.fn() }));

import { syncClerkUser } from "../auth";
import { type ClerkUserPayload, upsertUserFromClerk } from "../users";

function uniqueViolation(field: string) {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "6",
    meta: { target: [field] },
  });
}

const oldRow = {
  id: "u1",
  clerkId: "clerk_old",
  email: "pat@example.com",
  firstName: "Pat",
  lastName: "Lee",
  phone: null,
  role: "ADMIN" as const,
  deletedAt: null,
  welcomeEmailSentAt: new Date(),
};

function payload(
  email: string,
  opts: { id?: string; verified?: boolean; first?: string } = {},
): ClerkUserPayload {
  return {
    id: opts.id ?? "clerk_new",
    primary_email_address_id: "e1",
    email_addresses: [
      {
        id: "e1",
        email_address: email,
        verification: {
          status: opts.verified === false ? "unverified" : "verified",
        },
      },
    ],
    first_name: opts.first ?? "Pat",
    last_name: "Lee",
  };
}

/** The same user as the sign-in sync sees it (camelCase Clerk Backend API object). */
function clerkUser(
  email: string,
  opts: { id?: string; verified?: boolean; first?: string } = {},
) {
  return {
    id: opts.id ?? "clerk_new",
    firstName: opts.first ?? "Pat",
    lastName: "Lee",
    primaryEmailAddressId: "e1",
    primaryPhoneNumberId: null,
    emailAddresses: [
      {
        id: "e1",
        emailAddress: email,
        verification: {
          status: opts.verified === false ? "unverified" : "verified",
        },
      },
    ],
    phoneNumbers: [],
  } as unknown as Parameters<typeof syncClerkUser>[0];
}

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.ADMIN_EMAILS;
  delete process.env.ADMIN_EMAIL;
});

/** No row for the new Clerk id; creating it clashes on email with `oldRow`. */
function emailHeldByOldRow(row = oldRow) {
  db.user.findUnique.mockImplementation(
    async ({ where }: { where: Record<string, string> }) => {
      if (where.clerkId) return null;
      if (where.email === row.email) return row;
      if (where.id === row.id) return { ...row, clerkId: "clerk_new" };
      return null;
    },
  );
  db.user.create.mockRejectedValue(uniqueViolation("email"));
}

const entryPoints = {
  webhook: (email: string, opts?: { verified?: boolean; first?: string }) =>
    upsertUserFromClerk(payload(email, opts)).then((r) => r?.user ?? null),
  "sign-in sync": (
    email: string,
    opts?: { verified?: boolean; first?: string },
  ) => syncClerkUser(clerkUser(email, opts)),
};

describe.each(Object.entries(entryPoints))(
  "account re-link via %s",
  (_, run) => {
    it("refuses to move a row whose old Clerk account still exists", async () => {
      emailHeldByOldRow();
      clerkAccount.clerkAccountExists.mockResolvedValue(true);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      await expect(run("pat@example.com")).resolves.toBeNull();

      expect(clerkAccount.clerkAccountExists).toHaveBeenCalledWith("clerk_old");
      expect(db.user.update).not.toHaveBeenCalled();
      expect(db.user.updateMany).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
      expect(JSON.stringify(warn.mock.calls)).not.toContain("pat@example.com");
    });

    it("re-links only when Clerk says the old account is gone, and resets the role to PATIENT", async () => {
      emailHeldByOldRow();
      clerkAccount.clerkAccountExists.mockResolvedValue(false);
      db.user.updateMany.mockResolvedValue({ count: 1 });

      const user = await run("pat@example.com");

      expect(user).toMatchObject({ id: "u1" });
      expect(db.user.updateMany).toHaveBeenCalledWith({
        where: { id: "u1", clerkId: "clerk_old" },
        data: expect.objectContaining({
          clerkId: "clerk_new",
          role: "PATIENT",
        }),
      });
    });

    it("re-evaluates ADMIN_EMAILS on re-link", async () => {
      process.env.ADMIN_EMAILS = "pat@example.com";
      emailHeldByOldRow({ ...oldRow, role: "PATIENT" as never });
      clerkAccount.clerkAccountExists.mockResolvedValue(false);
      db.user.updateMany.mockResolvedValue({ count: 1 });

      await run("pat@example.com");

      expect(db.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: "ADMIN" }),
        }),
      );
    });

    it("propagates a Clerk outage instead of re-linking", async () => {
      emailHeldByOldRow();
      clerkAccount.clerkAccountExists.mockRejectedValue(new Error("clerk 503"));
      await expect(run("pat@example.com")).rejects.toThrow("clerk 503");
      expect(db.user.updateMany).not.toHaveBeenCalled();
    });

    it("never creates a row for an unverified primary email", async () => {
      db.user.findUnique.mockResolvedValue(null);
      await expect(
        run("new@example.com", { verified: false }),
      ).resolves.toBeNull();
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("refreshes the email and name when Clerk's verified primary email changed", async () => {
      const row = { ...oldRow, clerkId: "clerk_new", role: "PATIENT" as const };
      db.user.findUnique.mockResolvedValue(row);
      db.user.update.mockImplementation(async ({ data }) => ({
        ...row,
        ...data,
      }));

      const user = await run("pat.new@example.com", { first: "Patricia" });

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { email: "pat.new@example.com", firstName: "Patricia" },
      });
      expect(user).toMatchObject({ email: "pat.new@example.com" });
    });

    it("keeps the old email when the new primary email is unverified", async () => {
      const row = { ...oldRow, clerkId: "clerk_new", role: "PATIENT" as const };
      db.user.findUnique.mockResolvedValue(row);

      await run("attacker-chosen@example.com", { verified: false });

      expect(db.user.update).not.toHaveBeenCalled();
    });

    it("keeps the old email (and still updates the name) when the new one belongs to another row", async () => {
      const row = { ...oldRow, clerkId: "clerk_new", role: "PATIENT" as const };
      db.user.findUnique.mockResolvedValue(row);
      db.user.update
        .mockRejectedValueOnce(uniqueViolation("email"))
        .mockImplementation(async ({ data }) => ({ ...row, ...data }));
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = await run("taken@example.com", { first: "Patricia" });

      expect(db.user.update).toHaveBeenLastCalledWith({
        where: { id: "u1" },
        data: { firstName: "Patricia" },
      });
      expect(user).toMatchObject({ email: "pat@example.com" });
    });
  },
);
