"use client";

import { CalendarPlus, Check, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import {
  AppointmentSlip,
  slipFromAppointment,
} from "@/components/portal/AppointmentSlip";
import { downloadIcs } from "@/components/portal/ics";
import { QueryError } from "@/components/portal/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyAppointments } from "@/hooks/use-appointment";
import type { AppointmentDTO } from "@/lib/dto";

/**
 * After booking. Reads the appointment by id from the patient's list, so a refresh of
 * /appointments?confirmed=<id> shows the same page.
 */
export function BookingSuccess({
  id,
  justBooked,
  email,
  onBookAnother,
}: {
  id: string;
  justBooked: AppointmentDTO | null;
  email: string | null;
  onBookAnother: () => void;
}) {
  const mine = useMyAppointments();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const appointment =
    (justBooked?.id === id ? justBooked : null) ??
    mine.data?.upcoming.find((a) => a.id === id) ??
    mine.data?.past.find((a) => a.id === id) ??
    null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!appointment) {
    if (mine.isError)
      return (
        <QueryError
          title="Your booking didn't load"
          error={mine.error}
          onRetry={() => mine.refetch()}
        />
      );
    if (mine.isPending)
      return <Skeleton className="h-64 rounded-2xl" aria-busy="true" />;
    return (
      <EmptyState
        icon={ClipboardList}
        title="We couldn't find that booking"
        body="It may have been moved or cancelled. Your visits list is always up to date."
        action={
          <Button asChild>
            <Link href="/visits">Open my visits</Link>
          </Button>
        }
      />
    );
  }

  const cancelled = appointment.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex flex-col items-start gap-4">
        <span className="flex animate-in fade-in zoom-in-75 duration-300 ease-out size-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-sm">
          <Check className="size-6" strokeWidth={2.5} aria-hidden />
        </span>
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-display-sm text-foreground outline-none sm:text-display-md"
          >
            {cancelled ? "This visit was cancelled" : "You're booked"}
          </h1>
          <output className="mt-2 block text-base text-muted-foreground">
            {cancelled
              ? "Book a new time whenever suits you."
              : email
                ? `A confirmation is on its way to ${email}.`
                : "A confirmation email is on its way."}
          </output>
        </div>
      </div>

      <AppointmentSlip
        slip={slipFromAppointment(appointment)}
        size="lg"
        as="h2"
      >
        {!cancelled ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadIcs(appointment)}
            >
              <CalendarPlus className="size-4" aria-hidden />
              Add to calendar
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/visits">
                <ClipboardList className="size-4" aria-hidden />
                Move or cancel
              </Link>
            </Button>
          </div>
        ) : null}
      </AppointmentSlip>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button variant="outline" size="lg" onClick={onBookAnother}>
          <Plus className="size-4" aria-hidden />
          Book another visit
        </Button>
      </div>
    </div>
  );
}
