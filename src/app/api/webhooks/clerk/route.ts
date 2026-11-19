import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { defer } from "@/lib/defer";
import { sendWelcomeEmailOnce } from "@/lib/email";
import {
  type ClerkUserPayload,
  softDeleteUserByClerkId,
  upsertUserFromClerk,
} from "@/lib/users";

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserPayload & { deleted?: boolean };
}

/**
 * Clerk -> local user sync, verified with svix against the RAW body (re-serialising JSON would change
 * the bytes and break or weaken verification). Every handler is idempotent, so Clerk retries are safe.
 */
export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[clerk-webhook] CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const body = await request.text();
  if (body.length > 256 * 1024)
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let evt: ClerkWebhookEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const result = await upsertUserFromClerk(evt.data);
        if (
          result &&
          !result.user.deletedAt &&
          !result.user.welcomeEmailSentAt
        ) {
          const id = result.user.id;
          defer("welcome email", () => sendWelcomeEmailOnce(id));
        }
        break;
      }
      case "user.deleted": {
        if (evt.data.id) await softDeleteUserByClerkId(evt.data.id);
        break;
      }
      default:
        break; // acknowledge events we don't handle
    }
  } catch (error) {
    console.error(`[clerk-webhook] ${evt.type} failed`, error);
    // 500 makes Clerk retry; handlers are idempotent
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
