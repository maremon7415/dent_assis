import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  /** The next step, usually one Button. Every empty list should offer one. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      {body ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
