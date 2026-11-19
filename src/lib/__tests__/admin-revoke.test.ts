import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("../prisma", () => ({ prisma: {} }));

import { revokeAdmin } from "../admin-revoke";

function fakeDb(count: number) {
  const updateMany = vi.fn().mockResolvedValue({ count });
  return {
    db: { user: { updateMany } } as unknown as PrismaClient,
    updateMany,
  };
}

describe("revokeAdmin", () => {
  it("demotes the admin with that email (case-insensitive) to PATIENT", async () => {
    const { db, updateMany } = fakeDb(1);
    await expect(
      revokeAdmin(" Ops@Clinic.example ", { db, env: {} }),
    ).resolves.toEqual({ status: "revoked", email: "ops@clinic.example" });
    expect(updateMany).toHaveBeenCalledWith({
      where: { email: "ops@clinic.example", role: "ADMIN" },
      data: { role: "PATIENT" },
    });
  });

  it("refuses while the email is still in ADMIN_EMAILS (the next sign-in would promote it again)", async () => {
    const { db, updateMany } = fakeDb(1);
    await expect(
      revokeAdmin("ops@clinic.example", {
        db,
        env: { ADMIN_EMAILS: "owner@clinic.example,OPS@clinic.example" },
      }),
    ).resolves.toMatchObject({ status: "still-listed" });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("reports when no admin has that email", async () => {
    const { db } = fakeDb(0);
    await expect(
      revokeAdmin("nobody@clinic.example", { db, env: {} }),
    ).resolves.toMatchObject({ status: "not-found" });
  });

  it("rejects something that is not an email", async () => {
    const { db, updateMany } = fakeDb(1);
    await expect(revokeAdmin("", { db, env: {} })).resolves.toMatchObject({
      status: "invalid",
    });
    await expect(
      revokeAdmin("not-an-email", { db, env: {} }),
    ).resolves.toMatchObject({ status: "invalid" });
    expect(updateMany).not.toHaveBeenCalled();
  });
});
