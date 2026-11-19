import { createHash, timingSafeEqual } from "node:crypto";

/**
 * True only when CRON_SECRET is configured and the request carries `Authorization: Bearer <secret>`.
 * Compared in constant time. With no secret configured the endpoint is closed, never open.
 */
export function isAuthorizedCron(
  authorization: string | null,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret || secret.length < 16 || !authorization) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match) return false;
  const a = createHash("sha256").update(match[1]).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}
