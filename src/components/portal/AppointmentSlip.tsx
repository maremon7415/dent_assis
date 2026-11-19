import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import type { AppointmentDTO } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { DoctorAvatar } from "./DoctorAvatar";
import { calendarParts, formatDuration, formatPrice } from "./format";
import { StatusBadge } from "./StatusBadge";

export type SlipData = {
  /** clinic-local "YYYY-MM-DD" */
  date: string;
  /** server-formatted time, e.g. "9:30 AM" */
  timeLabel: string;
  title: string;
  doctor: Pick<AppointmentDTO["doctor"], "name" | "speciality" | "imageUrl">;
  durationMinutes?: number | null;
  priceCents?: number | null;
  status?: AppointmentDTO["status"];
};

/**
 * The portal's appointment card, drawn as a clinic appointment slip: a date stub, a perforation with
 * two notches, then the visit. Used for the next visit, the booking review and success, and visit lists.
 */
export function AppointmentSlip({
  slip,
  size = "md",
  as: Heading = "h3",
  muted = false,
  aside,
  children,
  className,
}: {
  slip: SlipData;
  size?: "md" | "lg";
  as?: "h2" | "h3";
  /** Past or cancelled visits: quieter stub. */
  muted?: boolean;
  /** Top-right slot (status badge by default). */
  aside?: ReactNode;
  /** Footer content: notes, actions. */
  children?: ReactNode;
  className?: string;
}) {
  const p = calendarParts(slip.date);
  const lg = size === "lg";
  const price = formatPrice(slip.priceCents);

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs",
        className,
      )}
    >
      <div className="relative flex flex-1">
        {/* Date stub */}
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center text-center",
            lg ? "w-24 py-6 sm:w-32" : "w-[4.5rem] py-4 sm:w-24",
            muted ? "bg-muted/60" : "bg-accent/70",
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold",
              muted ? "text-muted-foreground" : "text-accent-foreground",
            )}
          >
            {p.weekday}
          </span>
          <time
            dateTime={slip.date}
            className={cn(
              "font-display leading-none tracking-tight",
              lg ? "my-1.5 text-5xl sm:text-6xl" : "my-1 text-3xl sm:text-4xl",
              muted ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {p.day}
          </time>
          <span
            className={cn(
              "text-xs font-medium",
              muted ? "text-muted-foreground" : "text-accent-foreground",
            )}
          >
            {p.monthShort} {p.year}
          </span>
        </div>

        {/* Perforation */}
        <div className="relative w-0 shrink-0" aria-hidden>
          <span className="absolute inset-y-3 left-0 border-l border-dashed border-border" />
          <span className="absolute -top-2 -left-2 size-4 rounded-full border bg-background" />
          {children ? null : (
            <span className="absolute -bottom-2 -left-2 size-4 rounded-full border bg-background" />
          )}
        </div>

        {/* Visit */}
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            lg ? "gap-4 p-5 sm:p-6" : "gap-3 p-4 sm:p-5",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <Heading
                className={cn(
                  "font-display text-foreground",
                  lg ? "text-2xl sm:text-[1.75rem] leading-tight" : "text-lg",
                )}
              >
                {slip.title}
              </Heading>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="size-3.5 text-primary" aria-hidden />
                  {slip.timeLabel}
                </span>
                {slip.durationMinutes ? (
                  <span>{formatDuration(slip.durationMinutes)}</span>
                ) : null}
                {price ? <span data-numeric>{price}</span> : null}
              </p>
            </div>
            {aside ??
              (slip.status ? <StatusBadge status={slip.status} /> : null)}
          </div>

          <div className="flex items-center gap-3">
            <DoctorAvatar
              src={slip.doctor.imageUrl}
              className={lg ? "size-10" : "size-8"}
            />
            <div className="min-w-0 text-sm leading-tight">
              <p className="truncate font-medium text-foreground">
                {slip.doctor.name}
              </p>
              <p className="truncate text-muted-foreground">
                {slip.doctor.speciality}
              </p>
            </div>
          </div>
        </div>
      </div>

      {children ? (
        <div
          className={cn(
            "flex flex-col gap-3 border-t",
            lg ? "px-5 py-4 sm:px-6" : "px-4 py-3 sm:px-5",
          )}
        >
          {children}
        </div>
      ) : null}
    </article>
  );
}

export function slipFromAppointment(a: AppointmentDTO): SlipData {
  return {
    date: a.date,
    timeLabel: a.timeLabel,
    title: a.service?.name ?? a.reason ?? "Dental visit",
    doctor: a.doctor,
    durationMinutes: a.durationMinutes,
    priceCents: a.priceCents,
    status: a.status,
  };
}
