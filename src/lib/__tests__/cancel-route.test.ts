import { beforeEach, describe, expect, it, vi } from "vitest";

const booking = vi.hoisted(() => ({ cancelBooking: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn().mockResolvedValue({ id: "p1" }),
}));
vi.mock("@/lib/booking", () => booking);
vi.mock("@/lib/defer", () => ({ defer: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendCancellationEmail: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { POST } from "@/app/api/appointments/cancel/route";
import { AppError } from "../errors";

function post() {
  return POST(
    new Request("http://localhost/api/appointments/cancel", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appointmentId: "cmabc123def456ghi789jkl0" }),
    }),
  );
}

beforeEach(() => {
  booking.cancelBooking.mockReset();
});

describe("POST /api/appointments/cancel status codes", () => {
  it("answers 429 when the patient is rate limited", async () => {
    booking.cancelBooking.mockRejectedValue(
      new AppError("RATE_LIMITED", "Please wait a few minutes."),
    );
    const res = await post();
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({ code: "RATE_LIMITED" });
  });
});
