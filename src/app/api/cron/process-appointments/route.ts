import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { describeForLog } from "@/lib/errors";
import { processReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly job: 24h and 1h reminder emails (idempotent) and a count of past appointments that still need
 * an outcome. Requires `Authorization: Bearer $CRON_SECRET`.
 * Scheduled by netlify/functions/process-appointments.mts; any external cron can call it too (GET or POST).
 */
async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET is not set; refusing to run");
    return NextResponse.json(
      { error: "Cron is not configured" },
      { status: 503 },
    );
  }
  if (!isAuthorizedCron(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await processReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(
      `[cron] process-appointments failed: ${describeForLog(error)}`,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;
