"use client";

import {
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  AppointmentSlip,
  slipFromAppointment,
} from "@/components/portal/AppointmentSlip";
import { downloadIcs } from "@/components/portal/ics";
import { CancelVisitDialog } from "@/components/portal/visits/CancelVisitDialog";
import { RescheduleDialog } from "@/components/portal/visits/RescheduleDialog";
import { bookAgainHref } from "@/components/portal/visits/VisitCard";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { AppointmentDTO } from "@/lib/dto";

/** "in 3 days" / "in 5 hours" from the UTC instant (a duration, not a formatted date). */
function countdown(startsAt: string, now = Date.now()): string | null {
  const ms = new Date(startsAt).getTime() - now;
  if (ms <= 0) return null;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "within the hour";
  if (hours < 36) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  const days = Math.round(ms / 86_400_000);
  return `in ${days} days`;
}

export function NextVisitCard({
  next,
  lastVisit,
}: {
  next: AppointmentDTO | null;
  lastVisit: AppointmentDTO | null;
}) {
  const [dialog, setDialog] = useState<"reschedule" | "cancel" | null>(null);

  if (!next) {
    return (
      <section
        aria-labelledby="next-visit-title"
        className="surface-glow flex h-full flex-col justify-between gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
      >
        <div>
          <h2
            id="next-visit-title"
            className="font-display text-2xl text-foreground sm:text-[1.75rem]"
          >
            Nothing booked yet
          </h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            {lastVisit
              ? `Your last visit was ${lastVisit.dateLabel}. Most people come in for a check-up every six months.`
              : "Pick a service and a dentist, and you'll see real openings for the next month."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href="/appointments">
              <CalendarPlus className="size-4" aria-hidden />
              Book a visit
            </Link>
          </Button>
          {lastVisit ? (
            <Button asChild size="lg" variant="outline">
              <Link href={bookAgainHref(lastVisit)}>
                <RotateCcw className="size-4" aria-hidden />
                Book {lastVisit.doctor.name} again
              </Link>
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  const when = countdown(next.startsAt);

  return (
    <section
      aria-labelledby="next-visit-title"
      className="flex h-full flex-col gap-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="next-visit-title"
          className="text-sm font-semibold text-muted-foreground"
        >
          Your next visit
          {when ? (
            <span className="ml-2 font-normal text-primary">{when}</span>
          ) : null}
        </h2>
        <Link
          href="/visits"
          className="focus-ring inline-flex items-center gap-0.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          All visits
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <AppointmentSlip
        slip={slipFromAppointment(next)}
        size="lg"
        as="h3"
        className="flex-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => downloadIcs(next)}>
            <CalendarPlus className="size-4" aria-hidden />
            Add to calendar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("reschedule")}
            disabled={!next.canReschedule}
          >
            <CalendarClock className="size-4" aria-hidden />
            Reschedule
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDialog("cancel")}
            disabled={!next.canCancel}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="size-4" aria-hidden />
            Cancel
          </Button>
          {!next.canCancel ? (
            <p className="w-full text-xs text-muted-foreground">
              Less than {siteConfig.clinic.minNoticeHours} hours to go. To
              change it, call {siteConfig.phone}.
            </p>
          ) : null}
        </div>
      </AppointmentSlip>
      <RescheduleDialog
        appointment={next}
        open={dialog === "reschedule"}
        onOpenChange={(o) => setDialog(o ? "reschedule" : null)}
      />
      <CancelVisitDialog
        appointment={next}
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
      />
    </section>
  );
}
