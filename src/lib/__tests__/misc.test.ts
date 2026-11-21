import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { unwrap } from "../action-result";
import { isAuthorizedCron } from "../cron-auth";
import { AppError, toFailure } from "../errors";
import { generateAvatar } from "../utils";

describe("cron authorization", () => {
  const secret = "s3cret-s3cret-s3cret";
  it("accepts only the exact bearer secret", () => {
    expect(isAuthorizedCron(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedCron(`bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedCron(`Bearer ${secret}x`, secret)).toBe(false);
    expect(isAuthorizedCron(secret, secret)).toBe(false);
    expect(isAuthorizedCron(null, secret)).toBe(false);
  });
  it("is closed when no (or a too-short) secret is configured", () => {
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false);
    expect(isAuthorizedCron("Bearer short", "short")).toBe(false);
  });
});

describe("error mapping", () => {
  it("maps a slotKey unique violation to SLOT_TAKEN with a friendly message", () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "6",
        meta: { target: ["slotKey"] },
      },
    );
    expect(toFailure(err)).toMatchObject({
      ok: false,
      code: "SLOT_TAKEN",
      error: "That time was just taken. Please pick another slot.",
    });
  });
  it("never leaks unexpected error details", () => {
    expect(toFailure(new Error("connection string postgres://secret"))).toEqual(
      {
        ok: false,
        code: "INTERNAL",
        error: "Something went wrong. Please try again.",
      },
    );
  });
  it("keeps app errors and zod field errors", () => {
    expect(toFailure(new AppError("TOO_LATE", "Call us"))).toMatchObject({
      code: "TOO_LATE",
      error: "Call us",
    });
    const zodError = z
      .object({ rating: z.number().max(5) })
      .safeParse({ rating: 9 }).error;
    expect(toFailure(zodError)).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { rating: expect.any(Array) },
    });
  });
  it("unwrap throws a typed error on failure", () => {
    expect(() =>
      unwrap({ ok: false, code: "SLOT_TAKEN", error: "taken" }),
    ).toThrow(expect.objectContaining({ code: "SLOT_TAKEN" }));
    expect(unwrap({ ok: true, data: 1 })).toBe(1);
  });
});

describe("generated avatars", () => {
  it("are local SVG data URIs with initials, not third-party URLs", () => {
    const url = generateAvatar("Dr. Amara Okafor", "FEMALE");
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
    expect(decodeURIComponent(url)).toContain(">AO<");
  });
});
