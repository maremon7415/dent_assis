import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser } }),
}));

import { clerkAccountExists } from "../clerk-account";

beforeEach(() => {
  getUser.mockReset();
});

describe("clerkAccountExists", () => {
  it("is true when Clerk returns the user", async () => {
    getUser.mockResolvedValue({ id: "clerk_old" });
    await expect(clerkAccountExists("clerk_old")).resolves.toBe(true);
    expect(getUser).toHaveBeenCalledWith("clerk_old");
  });

  it("is false only when Clerk answers 404", async () => {
    getUser.mockRejectedValue(
      Object.assign(new Error("Not Found"), { status: 404 }),
    );
    await expect(clerkAccountExists("clerk_old")).resolves.toBe(false);
  });

  it("rethrows any other failure so the caller refuses to re-link", async () => {
    getUser.mockRejectedValue(
      Object.assign(new Error("Unavailable"), { status: 503 }),
    );
    await expect(clerkAccountExists("clerk_old")).rejects.toThrow(
      "Unavailable",
    );
  });
});
