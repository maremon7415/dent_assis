/**
 * Demote an admin to PATIENT. The role in the database is the source of truth; removing an address
 * from ADMIN_EMAILS only stops future promotion. Takes effect on the user's next request.
 *
 *   npm run admin:revoke -- someone@clinic.example
 *
 * Refuses while the address is still listed in ADMIN_EMAILS / ADMIN_EMAIL (in the environment or .env),
 * because the next sign-in would promote it again. Remove it there (and in the deployed environment) first.
 */
import { revokeAdmin } from "@/lib/admin-revoke";
import { prisma } from "@/lib/prisma";

async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {
    // no .env: rely on the environment
  }
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npm run admin:revoke -- <email>");
    process.exitCode = 2;
    return;
  }
  const result = await revokeAdmin(arg);
  const messages: Record<typeof result.status, string> = {
    revoked: `Revoked: ${result.email} is now a PATIENT.`,
    "not-found": `No admin with the email ${result.email}; nothing changed.`,
    "still-listed": `${result.email} is still listed in ADMIN_EMAILS/ADMIN_EMAIL. Remove it there first (locally and in the deployed environment), or the next sign-in promotes it again.`,
    invalid: `"${result.email}" is not an email address.`,
  };
  const ok = result.status === "revoked" || result.status === "not-found";
  (ok ? console.log : console.error)(messages[result.status]);
  if (!ok) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
