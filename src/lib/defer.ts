import { after } from "next/server";

/**
 * Run work after the response is sent (emails, notifications) so a slow provider never delays or
 * breaks the user's request. Falls back to fire-and-forget outside a request scope (scripts, tests).
 * The task must not throw; it is wrapped anyway.
 */
export function defer(label: string, task: () => Promise<unknown>): void {
  const safe = async () => {
    try {
      await task();
    } catch (error) {
      console.error(`[defer] ${label} failed`, error);
    }
  };
  try {
    after(safe);
  } catch {
    void safe();
  }
}
