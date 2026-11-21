import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  /** Optional context line above the title (e.g. a section or breadcrumb). Sentence case. */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Buttons or links aligned to the end on wide screens, below on phones. */
  actions?: ReactNode;
  className?: string;
};

/** The one h1 of a page, in the display serif. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 pb-8 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl space-y-2">
        {eyebrow ? (
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-display-sm text-foreground sm:text-display-md">
          {title}
        </h1>
        {description ? (
          <p className="text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
