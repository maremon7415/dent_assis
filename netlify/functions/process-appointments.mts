/**
 * Netlify Scheduled Function: runs hourly and calls the app's cron route with the shared secret.
 * The route does the work (and can also be called by any external cron with the same header).
 * Netlify provides URL (the site's main URL). Set CRON_SECRET in the site's environment variables.
 */
export default async function processAppointments(): Promise<Response> {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error(
      "[process-appointments] URL or CRON_SECRET is not set; skipping",
    );
    return new Response("not configured", { status: 500 });
  }
  const res = await fetch(new URL("/api/cron/process-appointments", base), {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  const body = await res.text();
  if (!res.ok)
    console.error(
      `[process-appointments] ${res.status}: ${body.slice(0, 500)}`,
    );
  else console.info(`[process-appointments] ${body.slice(0, 500)}`);
  return new Response(null, { status: res.ok ? 204 : 502 });
}

export const config = { schedule: "@hourly" };
