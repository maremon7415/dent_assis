/**
 * Client-safe result envelope shared by server actions and hooks (no server imports here).
 * Next.js hides thrown error messages from the client in production, so server actions return
 * `ActionResult` instead of throwing; hooks call `unwrap()` to get data or a typed error.
 */
export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "SLOT_TAKEN"
  | "TOO_LATE"
  | "INTERNAL";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export class ActionFailedError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ActionFailedError";
  }
}

export function unwrap<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  throw new ActionFailedError(result.code, result.error, result.fieldErrors);
}
