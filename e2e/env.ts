import { loadEnvConfig } from "@next/env";

// Same files and precedence as Next (.env.local over .env), so tests see the server's keys.
loadEnvConfig(process.cwd());

export function clerkSecretKey(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "CLERK_SECRET_KEY is not set. Put Clerk development keys in .env.local before running e2e tests.",
    );
  }
  if (!key.startsWith("sk_test_")) {
    throw new Error(
      "e2e tests only run against a Clerk development instance (sk_test_ key).",
    );
  }
  return key;
}
