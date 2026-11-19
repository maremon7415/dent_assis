import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DoctorAvatar } from "./DoctorAvatar";
import type { NextOpening } from "./data";
import {
  bookingHref,
  formatDuration,
  formatLocalDate,
  formatPrice,
} from "./format";

const MAX_SLOTS = 6;

/**
 * The hero's product moment: the clinic's real next opening, read from the live diary on the
 * server. Each time is a link that carries dentist, service, date and time into booking.
 */
export function NextOpeningCard({
  opening,
  className,
}: {
  opening: NextOpening | null;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="next-opening-title"
      className={cn(
        "relative rounded-2xl border bg-card/95 p-5 shadow-xl backdrop-blur-sm sm:p-6",
        className,
      )}
    >
      {opening ? <Filled opening={opening} /> : <Empty />}
    </section>
  );
}

function Filled({ opening }: { opening: NextOpening }) {
  const { doctor, service, date, slots } = opening;
  const shown = slots.slice(0, MAX_SLOTS);
  const more = slots.length - shown.length;
  const base = bookingHref({ service: service.slug, doctor: doctor.slug });
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="next-opening-title"
            className="text-sm font-semibold text-muted-foreground"
          >
            Next opening
          </h2>
          <p className="mt-1 font-display text-2xl leading-tight text-foreground">
            {formatLocalDate(date)}
          </p>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          Live diary
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/70 p-3">
        <DoctorAvatar src={doctor.imageUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {doctor.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {service.name}
          </p>
        </div>
        <p
          data-numeric
          className="shrink-0 text-right text-xs text-muted-foreground"
        >
          {formatDuration(service.durationMinutes)}
          <br />
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(service.priceCents)}
          </span>
        </p>
      </div>

      <ul
        aria-label={`Free start times on ${formatLocalDate(date)}`}
        className="mt-5 grid grid-cols-3 gap-2"
      >
        {shown.map((s, i) => (
          <li
            key={s.time}
            className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500"
            style={{ animationDelay: `${180 + i * 45}ms` }}
          >
            <Link
              href={`${base}&date=${date}&time=${s.time}`}
              className={cn(
                "focus-ring flex h-10 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97]",
                i === 0
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-input bg-background text-foreground hover:border-primary hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
        <p>
          {more > 0
            ? `${more} more time${more === 1 ? "" : "s"} that day. `
            : null}
          Clinic local time.
        </p>
        <Link
          href={base}
          className="focus-ring shrink-0 rounded-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Other days
        </Link>
      </div>
    </>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-start">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <CalendarClock className="size-5" aria-hidden />
      </span>
      <h2
        id="next-opening-title"
        className="mt-4 font-display text-2xl leading-tight text-foreground"
      >
        Find a time that suits you
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Pick a treatment and a dentist, then choose from their open times for
        the weeks ahead.
      </p>
      <Link
        href="/appointments"
        className="focus-ring mt-5 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]"
      >
        See open times
      </Link>
    </div>
  );
}
