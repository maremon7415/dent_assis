"use client";

import { RotateCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Error state for a failed query: what happened and a way to try again. */
export function QueryError({
  title = "This didn't load",
  error,
  onRetry,
  retrying,
  className,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Check your connection and try again.";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-4 rounded-xl border border-destructive/30 bg-destructive/6 p-5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <TriangleAlert className="size-5 shrink-0 text-destructive" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={retrying}
        >
          <RotateCw
            className={cn("size-4", retrying && "animate-spin")}
            aria-hidden
          />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
