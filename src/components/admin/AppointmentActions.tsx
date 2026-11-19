"use client";

import {
  Ban,
  CheckCheck,
  CircleCheck,
  FileText,
  Loader2,
  MoreHorizontal,
  UserX,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminUpdateAppointmentStatus,
  useAdminUpsertVisitNote,
} from "@/hooks/use-admin";
import type { AdminAppointmentDTO } from "@/lib/dto";
import { errorMessage, fieldError } from "./shared";

export type AppointmentActionKind =
  | "complete"
  | "no-show"
  | "cancel"
  | "note"
  | "confirm";

export type ActiveAction = {
  kind: Exclude<AppointmentActionKind, "confirm">;
  appointment: AdminAppointmentDTO;
} | null;

/** True once the appointment's start time has passed: the earliest moment an outcome can be recorded. */
function hasStarted(a: AdminAppointmentDTO) {
  return new Date(a.startsAt).getTime() <= Date.now();
}

/**
 * Row actions for one appointment. Which actions appear follows the server's transition table:
 * pending can be confirmed or cancelled; confirmed can be completed or marked no-show once it has
 * started, or cancelled; completed keeps an editable note. Hiding is a convenience only.
 */
export function AppointmentActionsMenu({
  appointment: a,
  onAction,
  size = "icon",
}: {
  appointment: AdminAppointmentDTO;
  onAction: (kind: AppointmentActionKind, a: AdminAppointmentDTO) => void;
  size?: "icon" | "icon-sm";
}) {
  const started = hasStarted(a);
  const canOutcome = a.status === "CONFIRMED" && started;
  const canCancel = a.status === "PENDING" || a.status === "CONFIRMED";
  const canConfirm = a.status === "PENDING";
  const canNote = a.status === "COMPLETED" || a.status === "CONFIRMED";

  if (!canOutcome && !canCancel && !canConfirm && !canNote) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          aria-label={`Actions for ${a.patient.name} at ${a.timeLabel}`}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {canConfirm ? (
          <DropdownMenuItem onSelect={() => onAction("confirm", a)}>
            <CircleCheck aria-hidden /> Confirm booking
          </DropdownMenuItem>
        ) : null}
        {canOutcome ? (
          <>
            <DropdownMenuItem onSelect={() => onAction("complete", a)}>
              <CheckCheck aria-hidden /> Mark completed
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("no-show", a)}>
              <UserX aria-hidden /> Mark no-show
            </DropdownMenuItem>
          </>
        ) : null}
        {canNote && !(a.status === "CONFIRMED" && !a.visitNote) ? (
          <DropdownMenuItem onSelect={() => onAction("note", a)}>
            <FileText aria-hidden />
            {a.visitNote ? "View or edit visit note" : "Write visit note"}
          </DropdownMenuItem>
        ) : null}
        {canCancel ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onAction("cancel", a)}
            >
              <Ban aria-hidden /> Cancel appointment
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * State and handlers for the row actions. Pages render `dialogs` once and pass `onAction` to each row,
 * so a list of 20 rows mounts one set of dialogs, not 20.
 */
export function useAppointmentActions() {
  const [active, setActive] = useState<ActiveAction>(null);
  const update = useAdminUpdateAppointmentStatus();

  function onAction(
    kind: AppointmentActionKind,
    appointment: AdminAppointmentDTO,
  ) {
    if (kind === "confirm") {
      toast.promise(
        update.mutateAsync({
          appointmentId: appointment.id,
          status: "CONFIRMED",
        }),
        {
          loading: "Confirming booking...",
          success: `Confirmed ${appointment.patient.name} at ${appointment.timeLabel}`,
          error: (e) => errorMessage(e),
        },
      );
      return;
    }
    setActive({ kind, appointment });
  }

  const dialogs = (
    <AppointmentDialogs active={active} onClose={() => setActive(null)} />
  );
  return { onAction, dialogs };
}

function AppointmentDialogs({
  active,
  onClose,
}: {
  active: ActiveAction;
  onClose: () => void;
}) {
  return (
    <>
      <VisitNoteDialog
        open={active?.kind === "complete" || active?.kind === "note"}
        mode={active?.kind === "complete" ? "complete" : "edit"}
        appointment={active?.appointment ?? null}
        onClose={onClose}
      />
      <NoShowDialog
        open={active?.kind === "no-show"}
        appointment={active?.appointment ?? null}
        onClose={onClose}
      />
      <CancelDialog
        open={active?.kind === "cancel"}
        appointment={active?.appointment ?? null}
        onClose={onClose}
      />
    </>
  );
}

function AppointmentSummary({ a }: { a: AdminAppointmentDTO }) {
  return (
    <p className="rounded-lg bg-muted px-3 py-2 text-sm">
      <span className="font-medium">{a.patient.name}</span>
      <span className="text-muted-foreground">
        {" "}
        with {a.doctor.name}, {a.dateLabel} at {a.timeLabel}
      </span>
    </p>
  );
}

function VisitNoteDialog({
  open,
  mode,
  appointment,
  onClose,
}: {
  open: boolean;
  mode: "complete" | "edit";
  appointment: AdminAppointmentDTO | null;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState("");
  const [treatment, setTreatment] = useState("");
  const [followUp, setFollowUp] = useState("");
  const complete = useAdminUpdateAppointmentStatus();
  const upsert = useAdminUpsertVisitNote();
  const pending = complete.isPending || upsert.isPending;
  const error = complete.error ?? upsert.error;

  const id = appointment?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the draft only when a different appointment (or reopen) is shown
  useEffect(() => {
    if (!open || !appointment) return;
    setSummary(appointment.visitNote?.summary ?? "");
    setTreatment(appointment.visitNote?.treatment ?? "");
    setFollowUp(
      appointment.visitNote?.followUpInDays
        ? String(appointment.visitNote.followUpInDays)
        : "",
    );
    complete.reset();
    upsert.reset();
  }, [open, id]);

  if (!appointment) return null;

  const completing = mode === "complete";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!appointment) return;
    const note = {
      summary,
      treatment: treatment || null,
      followUpInDays: followUp ? Number(followUp) : null,
    };
    try {
      if (completing) {
        await complete.mutateAsync({
          appointmentId: appointment.id,
          status: "COMPLETED",
          visitNote: note,
        });
        toast.success("Appointment completed and note saved");
      } else {
        await upsert.mutateAsync({ appointmentId: appointment.id, ...note });
        toast.success("Visit note saved");
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-normal">
              {completing ? "Complete this visit" : "Visit note"}
            </DialogTitle>
            <DialogDescription>
              {completing
                ? "A visit note is required to complete an appointment. The patient can read it in their visit history."
                : "The patient can read this note in their visit history."}
            </DialogDescription>
          </DialogHeader>
          <AppointmentSummary a={appointment} />
          <div className="space-y-1.5">
            <Label htmlFor="note-summary">Summary</Label>
            <Textarea
              id="note-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              maxLength={4000}
              rows={3}
              placeholder="What was done and how the visit went"
              aria-invalid={
                !!fieldError(error, "visitNote.summary") ||
                !!fieldError(error, "summary")
              }
              aria-describedby="note-summary-err"
            />
            <p
              id="note-summary-err"
              className="text-xs text-destructive"
              role="alert"
            >
              {fieldError(error, "visitNote.summary") ??
                fieldError(error, "summary")}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-treatment">Treatment (optional)</Label>
            <Textarea
              id="note-treatment"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              maxLength={4000}
              rows={2}
              placeholder="Procedure, materials, aftercare"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-followup">Follow-up in (days, optional)</Label>
            <Input
              id="note-followup"
              type="number"
              inputMode="numeric"
              min={1}
              max={730}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              className="w-32"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !summary.trim()}>
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              {completing ? "Complete and save note" : "Save note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NoShowDialog({
  open,
  appointment,
  onClose,
}: {
  open: boolean;
  appointment: AdminAppointmentDTO | null;
  onClose: () => void;
}) {
  const update = useAdminUpdateAppointmentStatus();
  if (!appointment) return null;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => !o && !update.isPending && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl font-normal">
            Mark as no-show?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {appointment.patient.name} did not attend on {appointment.dateLabel}{" "}
            at {appointment.timeLabel}. The slot is released and this cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={update.isPending}>
            Back
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={update.isPending}
            onClick={async () => {
              try {
                await update.mutateAsync({
                  appointmentId: appointment.id,
                  status: "NO_SHOW",
                });
                toast.success("Marked as no-show");
                onClose();
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            {update.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : null}
            Mark no-show
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CancelDialog({
  open,
  appointment,
  onClose,
}: {
  open: boolean;
  appointment: AdminAppointmentDTO | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const update = useAdminUpdateAppointmentStatus();
  const id = appointment?.id;
  // biome-ignore lint/correctness/useExhaustiveDependencies: clear the reason when a different appointment is shown
  useEffect(() => {
    if (open) {
      setReason("");
      update.reset();
    }
  }, [open, id]);

  if (!appointment) return null;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => !o && !update.isPending && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl font-normal">
            Cancel this appointment?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {appointment.patient.name} will be emailed and the slot reopens for
            booking.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AppointmentSummary a={appointment} />
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">
            Reason (shared with the patient)
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="For example: the dentist is unwell"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={update.isPending}>
            Keep appointment
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={update.isPending}
            onClick={async () => {
              try {
                await update.mutateAsync({
                  appointmentId: appointment.id,
                  status: "CANCELLED",
                  reason: reason || null,
                });
                toast.success("Appointment cancelled and patient notified");
                onClose();
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            {update.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : null}
            Cancel appointment
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
