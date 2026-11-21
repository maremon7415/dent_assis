/**
 * Typed errors and the result envelope every server action returns.
 * Server only (imports Prisma). Client code imports from ./action-result.
 */
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import type { ActionResult, ErrorCode } from "./action-result";

export type { ActionResult, ErrorCode } from "./action-result";
export { ActionFailedError, unwrap } from "./action-result";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super("UNAUTHENTICATED", message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export function isPrismaUniqueViolation(
  error: unknown,
  field?: string,
): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  )
    return false;
  if (!field) return true;
  const target = (error.meta as { target?: string[] | string } | undefined)
    ?.target;
  return Array.isArray(target)
    ? target.includes(field)
    : String(target ?? "").includes(field);
}

/**
 * A log line for an unexpected error without personal data. Prisma messages and meta echo the query
 * arguments (health-profile fields included), so Prisma errors are logged by name and code only;
 * other errors by name and the first line of their message, shortened.
 */
export function describeForLog(error: unknown): string {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    const code = "code" in error && error.code ? ` ${String(error.code)}` : "";
    const errorCode =
      "errorCode" in error && error.errorCode
        ? ` ${String(error.errorCode)}`
        : "";
    return `${error.name}${code}${errorCode}`;
  }
  if (error instanceof Error) {
    const firstLine = (error.message.split("\n")[0] ?? "").slice(0, 120);
    return `${error.name}: ${firstLine}`;
  }
  return typeof error;
}

/** Map any thrown value to a safe, user-facing failure. Internals are logged, never returned. */
export function toFailure(
  error: unknown,
): Extract<ActionResult<never>, { ok: false }> {
  if (error instanceof AppError) {
    return {
      ok: false,
      code: error.code,
      error: error.message,
      fieldErrors: error.fieldErrors,
    };
  }
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return {
      ok: false,
      code: "VALIDATION",
      error: "Please check the highlighted fields.",
      fieldErrors,
    };
  }
  if (isPrismaUniqueViolation(error, "slotKey")) {
    return {
      ok: false,
      code: "SLOT_TAKEN",
      error: "That time was just taken. Please pick another slot.",
    };
  }
  if (isPrismaUniqueViolation(error)) {
    return {
      ok: false,
      code: "CONFLICT",
      error: "That record already exists.",
    };
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return { ok: false, code: "NOT_FOUND", error: "Not found." };
  }
  console.error(`[action] unexpected error: ${describeForLog(error)}`);
  return {
    ok: false,
    code: "INTERNAL",
    error: "Something went wrong. Please try again.",
  };
}

/** Run `fn` and wrap its value or error into an ActionResult. */
export async function runAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return toFailure(error);
  }
}
