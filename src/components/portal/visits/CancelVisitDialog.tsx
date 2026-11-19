"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelAppointment } from "@/hooks/use-appointment";
import type { AppointmentDTO } from "@/lib/dto";
import { visitTitle } from "../format";

export function CancelVisitDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AppointmentDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancel = useCancelAppointment();

  const submit = () => {
    setError(null);
    cancel.mutate(
      { appointmentId: appointment.id, reason: reason.trim() || null },
      {
        onSuccess: () => {
          toast.success("Visit cancelled");
          setReason("");
          onOpenChange(false);
        },
        onError: (e) =>
          setError(e.message || "We couldn't cancel it. Try again."),
      },
    );
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (cancel.isPending) return;
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-normal">
            Cancel this visit?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {visitTitle(appointment)} with {appointment.doctor.name} on{" "}
            {appointment.dateLabel} at {appointment.timeLabel}. The time goes
            back on the calendar for other patients.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`cancel-reason-${appointment.id}`}>
            Reason{" "}
            <span className="font-normal text-muted-foreground">Optional</span>
          </Label>
          <Textarea
            id={`cancel-reason-${appointment.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="For example: I'm travelling that week."
          />
        </div>
        <div aria-live="assertive">
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancel.isPending}>
            Keep visit
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={cancel.isPending}
          >
            {cancel.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {cancel.isPending ? "Cancelling…" : "Cancel visit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
