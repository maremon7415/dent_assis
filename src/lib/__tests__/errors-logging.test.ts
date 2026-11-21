/**
 * toFailure logs unexpected errors, but Prisma error messages echo the query arguments (which can be
 * health-profile fields). Only the error name, code and a short, argument-free line may be logged.
 */
import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defer } from "../defer";
import { toFailure } from "../errors";

vi.mock("next/server", () => ({
  after: () => {
    throw new Error("outside a request scope");
  },
}));

const SECRET = "medicalNotes: 'HIV positive, on PrEP'";

function logged() {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => {
    // every argument must be a plain string (no error objects whose fields get dumped)
    for (const call of spy.mock.calls)
      for (const arg of call) expect(typeof arg).toBe("string");
    return spy.mock.calls.flat().join(" ");
  };
}

afterEach(() => vi.restoreAllMocks());

describe("toFailure logging", () => {
  it("logs a Prisma validation error by name only, without the query arguments", () => {
    const read = logged();
    const err = new Prisma.PrismaClientValidationError(
      `Invalid \`prisma.user.update()\` invocation:\n{ data: { ${SECRET} } }`,
      { clientVersion: "6" },
    );
    expect(toFailure(err)).toMatchObject({ code: "INTERNAL" });
    const text = read();
    expect(text).toContain("PrismaClientValidationError");
    expect(text).not.toContain("HIV");
  });

  it("logs a known Prisma request error by its code, without the message or meta", () => {
    const read = logged();
    const err = new Prisma.PrismaClientKnownRequestError(
      `Foreign key failed: ${SECRET}`,
      { code: "P2003", clientVersion: "6", meta: { field: SECRET } },
    );
    toFailure(err);
    const text = read();
    expect(text).toContain("P2003");
    expect(text).not.toContain("HIV");
  });

  it("deferred work that fails is logged the same way", async () => {
    const read = logged();
    defer("welcome email", async () => {
      throw new Prisma.PrismaClientValidationError(`{ ${SECRET} }`, {
        clientVersion: "6",
      });
    });
    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    const text = read();
    expect(text).toContain("welcome email");
    expect(text).not.toContain("HIV");
  });

  it("logs only the first line of other errors, shortened", () => {
    const read = logged();
    toFailure(new Error(`boom\n${SECRET}`));
    const text = read();
    expect(text).toContain("boom");
    expect(text).not.toContain("HIV");
  });
});
