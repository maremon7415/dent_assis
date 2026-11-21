import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: ReactNode;
  /** A real figure from the database. Render nothing rather than a made-up number. */
  value: ReactNode;
  /** One short line of context, e.g. "Next 7 days". */
  hint?: ReactNode;
  icon?: LucideIcon;
  trend?: {
    direction: "up" | "down" | "flat";
    label: ReactNode;
    /** Whether this direction is good news; colours the trend. Defaults to up = good. */
    positive?: boolean;
  };
  className?: string;
};

const TREND_ICON = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;
  const good = trend ? (trend.positive ?? trend.direction === "up") : false;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground shadow-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 text-primary" aria-hidden /> : null}
      </div>
      <p className="font-display text-4xl leading-none tracking-tight tabular-nums">
        {value}
      </p>
      {trend || hint ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {trend && TrendIcon ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
                trend.direction === "flat"
                  ? "text-muted-foreground"
                  : good
                    ? "text-success"
                    : "text-destructive",
              )}
            >
              <TrendIcon className="size-3.5" aria-hidden />
              {trend.label}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
