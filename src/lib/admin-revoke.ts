/**
 * Revoke admin rights. The database role is the source of truth: removing an address from
 * ADMIN_EMAILS stops future promotion but does not demote anyone. Used by `npm run admin:revoke`.
 */
import type { PrismaClient } from "@prisma/client";
import { type EnvLike, isAdminEmail } from "./auth-shared";
import { prisma as defaultPrisma } from "./prisma";

export type RevokeResult =
  | { status: "revoked"; email: string }
  | { status: "not-found"; email: string }
  | { status: "still-listed"; email: string }
  | { status: "invalid"; email: string };

export async function revokeAdmin(
  rawEmail: string,
  opts: { db?: PrismaClient; env?: EnvLike } = {},
): Promise<RevokeResult> {
  const db = opts.db ?? defaultPrisma;
  const env = opts.env ?? process.env;
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { status: "invalid", email };
  // Still listed: the next sign-in sync would promote the user again.
  if (isAdminEmail(email, env)) return { status: "still-listed", email };

  const { count } = await db.user.updateMany({
    where: { email, role: "ADMIN" },
    data: { role: "PATIENT" },
  });
  return { status: count > 0 ? "revoked" : "not-found", email };
}
