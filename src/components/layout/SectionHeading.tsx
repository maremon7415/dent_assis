import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionHeadingProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Heading level; defaults to h2. */
  as?: "h2" | "h3";
  /** Id for the heading, so a `<section aria-labelledby>` can point at it. */
  id?: string;
  className?: string;
};

/** Heading for a block inside a page. h2 uses the display serif; h3 uses the UI sans. */
export function SectionHeading({
  title,
  description,
  actions,
  as: Tag = "h2",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-4",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl space-y-1">
        <Tag
          id={id}
          className={
            Tag === "h2"
              ? "font-display text-2xl leading-tight tracking-tight text-foreground"
              : "text-base font-semibold text-foreground"
          }
        >
          {title}
        </Tag>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
