import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { cancelBooking } from "@/lib/booking";
import { defer } from "@/lib/defer";
import { sendCancellationEmail } from "@/lib/email";
import { type ErrorCode, toFailure } from "@/lib/errors";
import { cancelSchema } from "@/lib/validation";

const STATUS: Record<string, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  CONFLICT: 409,
  TOO_LATE: 409,
  SLOT_TAKEN: 409,
  LIMIT_REACHED: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} satisfies Record<ErrorCode, number>;

/**
 * POST /api/appointments/cancel  { appointmentId, reason? }
 * Signed-in patients cancel their OWN upcoming appointment (min notice applies). Prefer the
 * cancelMyAppointment server action; this route exists for non-React clients.
 */
export async function POST(request: Request) {
  // JSON only: blocks cross-site HTML form posts (they cannot send application/json without CORS).
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return NextResponse.json(
      { error: "Expected application/json" },
      { status: 415 },
    );
  }
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => {
      throw new z.ZodError([
        { code: "custom", message: "Invalid JSON", path: [], input: undefined },
      ]);
    });
    const data = cancelSchema.parse(body);
    const appointment = await cancelBooking({
      ...data,
      by: "PATIENT",
      userId: user.id,
    });
    defer("cancellation email", () => sendCancellationEmail(appointment.id));
    return NextResponse.json({
      message: "Appointment cancelled",
      appointment: {
        id: appointment.id,
        status: appointment.status,
        cancelledAt: appointment.cancelledAt,
      },
    });
  } catch (error) {
    const failure = toFailure(error);
    return NextResponse.json(
      {
        error: failure.error,
        code: failure.code,
        fieldErrors: failure.fieldErrors,
      },
      { status: STATUS[failure.code] ?? 500 },
    );
  }
}
