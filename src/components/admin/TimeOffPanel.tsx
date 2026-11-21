"use client";

import { CalendarOff, Loader2, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAddTimeOff, useAdminRemoveTimeOff } from "@/hooks/use-admin";
import type { AdminDoctorDTO } from "@/lib/actions/admin";
import { errorMessage, fieldError, Panel, useFormatInstant } from "./shared";

type TimeOff = AdminDoctorDTO["upcomingTimeOff"][number];

export function TimeOffPanel({ doctor }: { doctor: AdminDoctorDTO }) {
  const fmt = useFormatInstant();
  const add = useAdminAddTimeOff();
  const remove = useAdminRemoveTimeOff();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [clash, setClash] = useState<{
    ids: string[];
    from: string;
    to: string;
  } | null>(null);
  const [toRemove, setToRemove] = useState<TimeOff | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const end = endDate || startDate;
    try {
      const res = await add.mutateAsync({
        doctorId: doctor.id,
        startDate,
        endDate: end,
        startTime: allDay ? "00:00" : startTime,
        endTime: allDay ? "24:00" : endTime,
        reason: reason || null,
      });
      toast.success("Time off added");
      setClash(
        res.clashingAppointmentIds.length
          ? { ids: res.clashingAppointmentIds, from: startDate, to: end }
          : null,
      );
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  /** A whole-day block ends at the next midnight; show the last day it covers. */
  function describe(t: TimeOff) {
    const dayOpts: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    const hm = (iso: string) =>
      fmt(iso, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const wholeDay =
      hm(t.startsAt) === "00:00" && /^(00|24):00$/.test(hm(t.endsAt));
    if (wholeDay) {
      const last = new Date(new Date(t.endsAt).getTime() - 1).toISOString();
      const a = fmt(t.startsAt, dayOpts);
      const b = fmt(last, dayOpts);
      return a === b ? `${a}, all day` : `${a} to ${b}`;
    }
    return `${fmt(t.startsAt, { ...dayOpts, hour: "numeric", minute: "2-digit" })} to ${fmt(t.endsAt, { ...dayOpts, hour: "numeric", minute: "2-digit" })}`;
  }

  return (
    <Panel
      title="Time off"
      description="Block holidays or leave. Patients cannot book these times."
    >
      {clash ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4"
        >
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-warning"
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-foreground">
              {clash.ids.length === 1
                ? "1 booked appointment falls in this time off"
                : `${clash.ids.length} booked appointments fall in this time off`}
            </p>
            <p className="mt-1 text-muted-foreground">
              They were not cancelled. Contact those patients to move or cancel
              them.
            </p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {clash.ids.join(", ")}
            </p>
            <Link
              href={`/admin/appointments?doctor=${doctor.id}&from=${clash.from}&to=${clash.to}`}
              className="focus-ring mt-2 inline-block font-medium text-primary hover:underline"
            >
              Review these appointments
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setClash(null)}
            aria-label="Dismiss warning"
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : null}

      {doctor.upcomingTimeOff.length === 0 ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarOff className="size-4" aria-hidden />
          No upcoming time off.
        </p>
      ) : (
        <ul className="mb-4 divide-y rounded-xl border">
          {doctor.upcomingTimeOff.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{describe(t)}</p>
                {t.reason ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {t.reason}
                  </p>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setToRemove(t)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl bg-muted/50 p-4"
      >
        <p className="text-sm font-medium">Add time off</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="to-start">From</Label>
            <Input
              id="to-start"
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || endDate < e.target.value)
                  setEndDate(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to-end">To (inclusive)</Label>
            <Input
              id="to-end"
              type="date"
              required
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <label htmlFor="to-allday" className="flex items-center gap-2 text-sm">
          <Checkbox
            id="to-allday"
            checked={allDay}
            onCheckedChange={(c) => setAllDay(c === true)}
          />
          All day
        </label>
        {!allDay ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="to-start-time">Starts at</Label>
              <Input
                id="to-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to-end-time">Ends at</Label>
              <Input
                id="to-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="to-reason">Reason (optional)</Label>
          <Input
            id="to-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Annual leave, conference..."
          />
          {fieldError(add.error, "_") ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldError(add.error, "_")}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={add.isPending || !startDate}>
            {add.isPending ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : null}
            Add time off
          </Button>
        </div>
      </form>

      <AlertDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && !remove.isPending && setToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-normal">
              Remove this time off?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove ? describe(toRemove) : ""}. Patients will be able to
              book these times again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Keep it
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={async () => {
                if (!toRemove) return;
                try {
                  await remove.mutateAsync(toRemove.id);
                  toast.success("Time off removed");
                  setToRemove(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              {remove.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
