import type { AppointmentDTO } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { STATUS_META, type StatusTone } from "./format";

const TONE: Record<StatusTone, string> = {
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  info: "bg-info/12 text-info",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-destructive/12 text-destructive",
};

const DOT: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  muted: "bg-muted-foreground/60",
  danger: "bg-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentDTO["status"];
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
        TONE[meta.tone],
        className,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", DOT[meta.tone])}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}
