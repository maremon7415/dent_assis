/** Admin-email bootstrap rules shared by sign-in sync and the Clerk webhook (no Clerk/Next imports). */

export type EnvLike = Record<string, string | undefined>;

/** Lower-cased admin emails from ADMIN_EMAILS (comma separated) plus the legacy single ADMIN_EMAIL. */
export function adminEmails(env: EnvLike = process.env): Set<string> {
  const raw = [env.ADMIN_EMAILS ?? "", env.ADMIN_EMAIL ?? ""].join(",");
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(
  email: string | null | undefined,
  env: EnvLike = process.env,
): boolean {
  return !!email && adminEmails(env).has(email.trim().toLowerCase());
}
