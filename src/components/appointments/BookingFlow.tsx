"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { CalendarX2, Phone, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import type { SlipData } from "@/components/portal/AppointmentSlip";
import { SlotPicker } from "@/components/portal/SlotPicker";
import { useSlotGrid } from "@/components/portal/use-slot-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import { useBookAppointment } from "@/hooks/use-appointment";
import { useActiveDoctors } from "@/hooks/use-doctors";
import { useMyProfile } from "@/hooks/use-profile";
import { useServices } from "@/hooks/use-services";
import { ActionFailedError } from "@/lib/action-result";
import type { AppointmentDTO } from "@/lib/dto";
import { BookingProgress } from "./BookingProgress";
import { BookingSuccess } from "./BookingSuccess";
import {
  type BookingAction,
  BookingActionBar,
  BookingSummary,
} from "./BookingSummary";
import { ANY_DENTIST, type StepKey, useBookingParams } from "./booking-state";
import { DentistStep } from "./DentistStep";
import { REVIEW_FORM_ID, ReviewStep } from "./ReviewStep";
import { ServiceStep } from "./ServiceStep";

const STEP_COPY: Record<StepKey, { title: string; body: string }> = {
  service: {
    title: "What do you need?",
    body: "Prices are what the clinic charges before any insurance.",
  },
  dentist: {
    title: "Who would you like to see?",
    body: "Every dentist listed offers this service.",
  },
  time: {
    title: "When suits you?",
    body: `Times are in the clinic's local time. You can book up to ${siteConfig.clinic.bookingWindowDays} days ahead.`,
  },
  review: {
    title: "Check and confirm",
    body: "Nothing is booked until you confirm.",
  },
};

const PREVIOUS: Record<StepKey, StepKey | null> = {
  service: null,
  dentist: "service",
  time: "dentist",
  review: "time",
};

/**
 * Guided booking: service, dentist (or any available), day and time from real availability, review.
 * All state lives in the URL (see useBookingParams).
 */
export function BookingFlow() {
  const { params, update } = useBookingParams();
  const { user } = useUser();
  const clerk = useClerk();
  const profile = useMyProfile();
  const email =
    profile.data?.email ?? user?.primaryEmailAddress?.emailAddress ?? null;

  const services = useServices();
  const service =
    services.data?.find(
      (s) => s.slug === params.service || s.id === params.service,
    ) ?? null;
  const allDoctors = useActiveDoctors();
  const doctors = useActiveDoctors(service?.id);

  const isAny = params.doctor === ANY_DENTIST;
  const doctor =
    !isAny && params.doctor
      ? (doctors.data?.find(
          (d) => d.slug === params.doctor || d.id === params.doctor,
        ) ?? null)
      : null;
  // A dentist from the URL who doesn't offer the chosen service (or no longer exists).
  const doctorMismatch =
    !!params.doctor && !isAny && !!service && doctors.isSuccess && !doctor;
  const preferredDoctor =
    params.doctor && !isAny
      ? (allDoctors.data?.find(
          (d) => d.slug === params.doctor || d.id === params.doctor,
        ) ?? null)
      : null;
  const doctorChosen =
    !!service && (isAny ? (doctors.data?.length ?? 0) > 0 : !!doctor);

  const doctorIds = !service
    ? []
    : isAny
      ? (doctors.data?.map((d) => d.id) ?? [])
      : doctor
        ? [doctor.id]
        : [];

  const grid = useSlotGrid({
    doctorIds,
    serviceId: service?.id,
    date: params.date,
  });
  const slot = params.time
    ? (grid.slots.find((s) => s.time === params.time) ?? null)
    : null;
  const slotGone =
    !!params.time && !!params.date && !grid.slotsLoading && !slot;
  const assignedDoctor = slot
    ? (doctors.data?.find((d) => d.id === slot.doctorIds[0]) ?? null)
    : null;

  const resolving =
    (!!params.service && services.isPending) ||
    (!!service && !!params.doctor && doctors.isPending);

  // Resolve the step from what is actually chosen, so a hand-edited URL can't skip ahead.
  let step: StepKey =
    params.step ?? (service ? (doctorChosen ? "time" : "dentist") : "service");
  if (!resolving) {
    if (!service) step = "service";
    else if ((step === "time" || step === "review") && !doctorChosen)
      step = "dentist";
    if (step === "review" && !(params.date && params.time)) step = "time";
  }

  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<ReactNode>(null);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);
  const [justBooked, setJustBooked] = useState<AppointmentDTO | null>(null);
  const book = useBookAppointment();

  // Move focus to the step heading on each step change (not on first load).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(step);
  useEffect(() => {
    if (firstStep.current === step) return;
    firstStep.current = step;
    window.scrollTo({ top: 0, behavior: "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const go = (target: StepKey) => update({ step: target }, "push");

  const chooseService = (slug: string, serviceId: string) => {
    const keepDoctor =
      preferredDoctor?.services.some((s) => s.id === serviceId) ?? false;
    update(
      {
        service: slug,
        doctor: keepDoctor || isAny ? params.doctor : null,
        date: null,
        time: null,
        step: keepDoctor ? "time" : "dentist",
      },
      "push",
    );
  };

  const confirm = () => {
    if (!service || !slot || !assignedDoctor || !params.date) return;
    setFormError(null);
    setNoteError(null);
    book.mutate(
      {
        doctorId: assignedDoctor.id,
        serviceId: service.id,
        date: params.date,
        time: slot.time,
        notes: note.trim() || null,
      },
      {
        onSuccess: (booked) => {
          setJustBooked(booked);
          setNote("");
          toast.success("Visit booked");
          update(
            {
              confirmed: booked.id,
              service: null,
              doctor: null,
              date: null,
              time: null,
              step: null,
            },
            "replace",
          );
        },
        onError: (error) => {
          const code = error instanceof ActionFailedError ? error.code : null;
          if (code === "SLOT_TAKEN" || code === "TOO_LATE") {
            const message =
              code === "SLOT_TAKEN"
                ? "That time was just taken. Pick another slot."
                : error.message ||
                  `That time is too soon to book online. Pick a later slot or call ${siteConfig.phone}.`;
            setSlotNotice(message);
            toast.error(message);
            void grid.refetchDays();
            void grid.refetchSlots();
            update({ time: null, step: "time" }, "replace");
            return;
          }
          if (error instanceof ActionFailedError && error.fieldErrors?.notes) {
            setNoteError(error.fieldErrors.notes[0]);
            return;
          }
          if (code === "UNAUTHENTICATED") {
            setFormError(
              <>
                Your session ended.{" "}
                <button
                  type="button"
                  onClick={() => clerk.openSignIn()}
                  className="focus-ring rounded font-medium text-primary underline underline-offset-4"
                >
                  Sign in again
                </button>{" "}
                and your choices will still be here.
              </>,
            );
            return;
          }
          setFormError(
            error.message ||
              "We couldn't book that visit. Check your connection and try again.",
          );
        },
      },
    );
  };

  if (params.confirmed) {
    return (
      <BookingSuccess
        id={params.confirmed}
        justBooked={justBooked}
        email={email}
        onBookAnother={() => {
          setJustBooked(null);
          update(
            {
              confirmed: null,
              service: null,
              doctor: null,
              date: null,
              time: null,
              step: null,
            },
            "push",
          );
        }}
      />
    );
  }

  const previous = PREVIOUS[step];
  const reachable = new Set<StepKey>(["service"]);
  if (service) reachable.add("dentist");
  if (doctorChosen) reachable.add("time");
  if (slot) reachable.add("review");

  let action: BookingAction | null = null;
  if (step === "service")
    action = {
      label: "Continue",
      disabled: !service,
      onClick: () => go("dentist"),
    };
  else if (step === "dentist")
    action = {
      label: "Continue",
      disabled: !doctorChosen,
      onClick: () => go("time"),
    };
  else if (step === "time")
    action = {
      label: "Review booking",
      disabled: !slot,
      onClick: () => go("review"),
    };
  else
    action = {
      label: book.isPending ? "Booking…" : "Confirm booking",
      form: REVIEW_FORM_ID,
      pending: book.isPending,
      disabled: !slot || !assignedDoctor,
    };

  const dentistLabel = isAny
    ? assignedDoctor
      ? assignedDoctor.name
      : doctorChosen
        ? "Any available dentist"
        : null
    : (doctor?.name ?? null);
  const dentistSub = isAny
    ? assignedDoctor
      ? "Free at your time"
      : null
    : (doctor?.speciality ?? null);

  const summary = {
    service,
    dentist: dentistLabel,
    dentistSub,
    date: slot ? params.date : null,
    timeLabel: slot?.label ?? null,
    step,
    onGo: go,
    onBack: previous ? () => go(previous) : null,
    action,
  };

  const reviewSlip: SlipData | null =
    service && slot && assignedDoctor && params.date
      ? {
          date: params.date,
          timeLabel: slot.label,
          title: service.name,
          doctor: assignedDoctor,
          durationMinutes: service.durationMinutes,
          priceCents: service.priceCents,
        }
      : null;

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Book a visit"
        description="Four short steps. You'll see real openings and can change anything before you confirm."
        className="pb-6"
      />
      <BookingProgress current={step} reachable={reachable} onGo={go} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-labelledby="booking-step-title" className="min-w-0">
          <div className="mb-6">
            <h2
              id="booking-step-title"
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-2xl text-foreground outline-none sm:text-[1.75rem]"
            >
              {STEP_COPY[step].title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "time" && isAny && doctors.data
                ? `Openings across ${doctors.data.length} dentists for ${service?.name}. ${STEP_COPY.time.body}`
                : STEP_COPY[step].body}
            </p>
          </div>

          {resolving ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : step === "service" ? (
            <>
              {params.service && !service && services.isSuccess ? (
                <p className="mb-6 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
                  That service can't be booked online. Pick one below.
                </p>
              ) : null}
              <ServiceStep
                selectedId={service?.id ?? null}
                onChoose={(s) => chooseService(s.slug, s.id)}
                onlyDoctor={!service ? preferredDoctor : null}
                onShowAll={() => update({ doctor: null }, "replace")}
              />
            </>
          ) : step === "dentist" && service ? (
            <>
              {doctorMismatch ? (
                <p className="mb-6 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
                  {preferredDoctor
                    ? `${preferredDoctor.name} doesn't offer ${service.name}.`
                    : "That dentist isn't taking online bookings."}{" "}
                  Pick a dentist below.
                </p>
              ) : null}
              <DentistStep
                doctors={doctors}
                selected={doctor ? (doctor.slug ?? doctor.id) : params.doctor}
                serviceName={service.name}
                onChoose={(value) =>
                  update(
                    { doctor: value, date: null, time: null, step: "time" },
                    "push",
                  )
                }
                onChangeService={() => go("service")}
              />
            </>
          ) : step === "time" ? (
            <SlotPicker
              days={grid.days}
              daysLoading={grid.daysLoading}
              daysError={grid.daysError}
              onRetryDays={() => void grid.refetchDays()}
              selectedDate={params.date}
              onSelectDate={(date) => {
                setSlotNotice(null);
                update({ date, time: null });
              }}
              slots={grid.slots}
              slotsLoading={grid.slotsLoading}
              slotsError={grid.slotsError}
              onRetrySlots={() => void grid.refetchSlots()}
              selectedTime={slot ? params.time : null}
              onSelectTime={(s) => {
                setSlotNotice(null);
                update({ time: s.time });
              }}
              notice={
                slotNotice ? (
                  <p className="mb-4 rounded-lg bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                    {slotNotice}
                  </p>
                ) : null
              }
              noDays={
                <EmptyState
                  icon={CalendarX2}
                  title={`No openings in the next ${siteConfig.clinic.bookingWindowDays} days`}
                  body={
                    isAny
                      ? `Every dentist who offers ${service?.name} is fully booked. Call us and we'll add you to the waiting list.`
                      : `${doctor?.name} is fully booked for ${service?.name}. Another dentist may have time sooner.`
                  }
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      {!isAny && (doctors.data?.length ?? 0) > 1 ? (
                        <Button
                          onClick={() =>
                            update(
                              {
                                doctor: ANY_DENTIST,
                                date: null,
                                time: null,
                              },
                              "push",
                            )
                          }
                        >
                          <Sparkles className="size-4" aria-hidden />
                          Try any available dentist
                        </Button>
                      ) : null}
                      <Button variant="outline" asChild>
                        <a
                          href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}
                        >
                          <Phone className="size-4" aria-hidden />
                          Call {siteConfig.phone}
                        </a>
                      </Button>
                    </div>
                  }
                />
              }
            />
          ) : grid.slotsLoading || !reviewSlip ? (
            slotGone ? (
              <EmptyState
                icon={CalendarX2}
                title="That time is no longer free"
                body="Someone booked it a moment ago. Pick another time."
                action={
                  <Button onClick={() => update({ time: null, step: "time" })}>
                    Pick another time
                  </Button>
                }
              />
            ) : (
              <Skeleton className="h-56 rounded-2xl" aria-busy="true" />
            )
          ) : (
            <ReviewStep
              slip={reviewSlip}
              slipAside={
                isAny ? (
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                    Free at this time
                  </span>
                ) : undefined
              }
              email={email}
              note={note}
              onNoteChange={(v) => {
                setNote(v);
                setNoteError(null);
              }}
              noteError={noteError}
              error={formError}
              onSubmit={confirm}
            />
          )}
        </section>

        <BookingSummary {...summary} />
      </div>

      <BookingActionBar {...summary} />
    </div>
  );
}
