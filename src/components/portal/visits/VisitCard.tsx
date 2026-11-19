"use client";

import {
  CalendarClock,
  CalendarPlus,
  RotateCcw,
  Star,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import type { AppointmentDTO } from "@/lib/dto";
import { AppointmentSlip, slipFromAppointment } from "../AppointmentSlip";
import { downloadIcs } from "../ics";
import { CancelVisitDialog } from "./CancelVisitDialog";
import { RescheduleDialog } from "./RescheduleDialog";
import { ReviewDialog } from "./ReviewDialog";

export function bookAgainHref(a: AppointmentDTO): string {
  const q = new URLSearchParams();
  if (a.service?.slug) q.set("service", a.service.slug);
  if (a.doctor.slug) q.set("doctor", a.doctor.slug);
  const qs = q.toString();
  return qs ? `/appointments?${qs}` : "/appointments";
}

function VisitNote({
  note,
}: {
  note: NonNullable<AppointmentDTO["visitNote"]>;
}) {
  return (
    <div className="rounded-xl bg-muted/60 p-4 text-sm">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">
        Dentist's note
      </p>
      <p className="whitespace-pre-line leading-relaxed text-foreground">
        {note.summary}
      </p>
      {note.treatment ? (
        <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Treatment: </span>
          {note.treatment}
        </p>
      ) : null}
      {note.followUpInDays ? (
        <p className="mt-2 flex items-center gap-1.5 font-medium text-primary">
          <CalendarClock className="size-4" aria-hidden />
          Follow-up advised in {note.followUpInDays}{" "}
          {note.followUpInDays === 1 ? "day" : "days"}
        </p>
      ) : null}
    </div>
  );
}

function ReviewStars({
  review,
}: {
  review: NonNullable<AppointmentDTO["review"]>;
}) {
  return (
    <div className="text-sm">
      <p className="flex items-center gap-2">
        <span
          className="flex"
          role="img"
          aria-label={`You rated this visit ${review.rating} out of 5`}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={
                n <= review.rating
                  ? "size-4 fill-current text-warning"
                  : "size-4 text-muted-foreground/40"
              }
              aria-hidden
            />
          ))}
        </span>
        <span className="text-muted-foreground">Your review</span>
      </p>
      {review.comment ? (
        <p className="mt-1 text-muted-foreground">“{review.comment}”</p>
      ) : null}
    </div>
  );
}

/** One visit with what the patient can do about it. */
export function VisitCard({
  appointment: a,
  movedTo,
}: {
  appointment: AppointmentDTO;
  /** The visit this one was rescheduled to, if any. */
  movedTo?: AppointmentDTO;
}) {
  const [dialog, setDialog] = useState<
    "reschedule" | "cancel" | "review" | null
  >(null);
  const upcoming = a.status === "CONFIRMED" || a.status === "PENDING";
  const quiet =
    a.status === "CANCELLED" ||
    a.status === "EXPIRED" ||
    a.status === "NO_SHOW";
  const lockedIn = upcoming && !a.canCancel && !a.canReschedule;

  return (
    <li>
      <AppointmentSlip
        slip={slipFromAppointment(a)}
        muted={quiet}
        aside={
          movedTo ? (
            <span className="inline-flex h-6 items-center rounded-full bg-muted px-2.5 text-xs font-semibold text-muted-foreground">
              Moved
            </span>
          ) : undefined
        }
      >
        {movedTo ? (
          <p className="text-sm text-muted-foreground">
            Moved to{" "}
            <span className="font-medium text-foreground">
              {movedTo.dateLabel} at {movedTo.timeLabel}
            </span>
            .
          </p>
        ) : a.status === "CANCELLED" && a.cancelReason ? (
          <p className="text-sm text-muted-foreground">
            {a.cancelledBy === "PATIENT"
              ? "You cancelled"
              : "The clinic cancelled"}
            : {a.cancelReason}
          </p>
        ) : null}
        {a.notes && upcoming ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Your note: </span>
            {a.notes}
          </p>
        ) : null}
        {a.visitNote ? <VisitNote note={a.visitNote} /> : null}
        {a.review ? <ReviewStars review={a.review} /> : null}

        <div className="flex flex-wrap items-center gap-2">
          {upcoming ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog("reschedule")}
                disabled={!a.canReschedule}
              >
                <CalendarClock className="size-4" aria-hidden />
                Reschedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialog("cancel")}
                disabled={!a.canCancel}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <XCircle className="size-4" aria-hidden />
                Cancel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadIcs(a)}
                className="sm:ml-auto"
              >
                <CalendarPlus className="size-4" aria-hidden />
                Add to calendar
              </Button>
              {lockedIn ? (
                <p className="w-full text-xs text-muted-foreground">
                  It's less than {siteConfig.clinic.minNoticeHours} hours away,
                  so it can't be changed online. Call{" "}
                  <a
                    href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {siteConfig.phone}
                  </a>
                  .
                </p>
              ) : null}
            </>
          ) : (
            <>
              {a.canReview ? (
                <Button size="sm" onClick={() => setDialog("review")}>
                  <Star className="size-4" aria-hidden />
                  Leave a review
                </Button>
              ) : null}
              <Button variant="outline" size="sm" asChild>
                <Link href={bookAgainHref(a)}>
                  <RotateCcw className="size-4" aria-hidden />
                  Book again
                </Link>
              </Button>
            </>
          )}
        </div>
      </AppointmentSlip>

      {upcoming ? (
        <>
          <RescheduleDialog
            appointment={a}
            open={dialog === "reschedule"}
            onOpenChange={(o) => setDialog(o ? "reschedule" : null)}
          />
          <CancelVisitDialog
            appointment={a}
            open={dialog === "cancel"}
            onOpenChange={(o) => setDialog(o ? "cancel" : null)}
          />
        </>
      ) : null}
      {a.canReview ? (
        <ReviewDialog
          appointment={a}
          open={dialog === "review"}
          onOpenChange={(o) => setDialog(o ? "review" : null)}
        />
      ) : null}
    </li>
  );
}
