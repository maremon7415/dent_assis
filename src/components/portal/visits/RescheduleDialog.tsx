"use client";

import { CalendarX2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { siteConfig } from "@/config/site";
import { useRescheduleAppointment } from "@/hooks/use-appointment";
import { ActionFailedError } from "@/lib/action-result";
import type { AppointmentDTO } from "@/lib/dto";
import { longDayLabel, visitTitle } from "../format";
import { SlotPicker } from "../SlotPicker";
import { useSlotGrid } from "../use-slot-grid";

function RescheduleBody({
  appointment,
  onDone,
}: {
  appointment: AppointmentDTO;
  onDone: () => void;
}) {
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const reschedule = useRescheduleAppointment();
  const grid = useSlotGrid({
    doctorIds: [appointment.doctor.id],
    serviceId: appointment.service?.id ?? null,
    date,
    excludeAppointmentId: appointment.id,
  });
  const slot = time ? grid.slots.find((s) => s.time === time) : undefined;
  const sameAsNow =
    !!slot && date === appointment.date && time === appointment.time;

  const submit = () => {
    if (!date || !slot) return;
    setNotice(null);
    reschedule.mutate(
      { appointmentId: appointment.id, date, time: slot.time },
      {
        onSuccess: (moved) => {
          toast.success("Visit moved", {
            description: `${moved.dateLabel} at ${moved.timeLabel}`,
          });
          onDone();
        },
        onError: (e) => {
          const code = e instanceof ActionFailedError ? e.code : null;
          if (code === "SLOT_TAKEN") {
            setNotice("That time was just taken. Pick another slot.");
            setTime(null);
            void grid.refetchSlots();
            void grid.refetchDays();
          } else {
            setNotice(e.message || "We couldn't move it. Try again.");
          }
        },
      },
    );
  };

  return (
    <>
      <div className="min-h-0 overflow-y-auto px-6 py-2">
        <SlotPicker
          days={grid.days}
          daysLoading={grid.daysLoading}
          daysError={grid.daysError}
          onRetryDays={() => void grid.refetchDays()}
          selectedDate={date}
          onSelectDate={(d) => {
            setDate(d);
            setTime(null);
            setNotice(null);
          }}
          slots={grid.slots}
          slotsLoading={grid.slotsLoading}
          slotsError={grid.slotsError}
          onRetrySlots={() => void grid.refetchSlots()}
          selectedTime={slot ? time : null}
          onSelectTime={(s) => {
            setTime(s.time);
            setNotice(null);
          }}
          notice={
            notice ? (
              <p className="mb-4 rounded-lg bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                {notice}
              </p>
            ) : null
          }
          noDays={
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
              <CalendarX2
                className="size-6 text-muted-foreground"
                aria-hidden
              />
              <p className="font-medium text-foreground">
                {appointment.doctor.name} has no other openings soon
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Keep this visit, or cancel it and book with another dentist. You
                can also call {siteConfig.phone}.
              </p>
            </div>
          }
        />
      </div>
      <DialogFooter className="border-t px-6 py-4">
        <p
          className="mr-auto self-center text-sm text-muted-foreground"
          aria-live="polite"
        >
          {slot && date
            ? sameAsNow
              ? "That's the current time."
              : `New time: ${longDayLabel(date)}, ${slot.label}`
            : "Pick a new day and time."}
        </p>
        <Button
          onClick={submit}
          disabled={!slot || sameAsNow || reschedule.isPending}
        >
          {reschedule.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {reschedule.isPending ? "Moving…" : "Move visit"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Pick a new time with the same dentist and service; the old slot is released by the server. */
export function RescheduleDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AppointmentDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-display text-xl font-normal">
            Move your visit
          </DialogTitle>
          <DialogDescription>
            {visitTitle(appointment)} with {appointment.doctor.name}, now{" "}
            {appointment.dateLabel} at {appointment.timeLabel}.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <RescheduleBody
            appointment={appointment}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
