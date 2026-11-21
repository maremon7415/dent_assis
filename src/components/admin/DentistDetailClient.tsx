"use client";

import {
  ArrowLeft,
  CalendarSearch,
  Loader2,
  Pencil,
  Power,
} from "lucide-react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDeactivateDoctor, useAdminDoctor } from "@/hooks/use-admin";
import { ActionFailedError } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import { DentistFormSheet } from "./DentistFormSheet";
import { DentistAvatar } from "./DentistsClient";
import { ScheduleEditor } from "./ScheduleEditor";
import { errorMessage, Panel, QueryError } from "./shared";
import { TimeOffPanel } from "./TimeOffPanel";

export function DentistDetailClient({ id }: { id: string }) {
  const q = useAdminDoctor(id);
  const deactivate = useAdminDeactivateDoctor();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const back = (
    <Link
      href="/admin/dentists"
      className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All dentists
    </Link>
  );

  if (q.error && !q.data) {
    const notFound =
      q.error instanceof ActionFailedError && q.error.code === "NOT_FOUND";
    return (
      <>
        {back}
        <h1 className="sr-only">Dentist</h1>
        <QueryError
          error={q.error}
          title={
            notFound ? "Dentist not found" : "We could not load this dentist"
          }
          onRetry={notFound ? undefined : () => q.refetch()}
        />
      </>
    );
  }
  if (!q.data) {
    return (
      <>
        {back}
        <h1 className="sr-only">Dentist</h1>
        <div className="space-y-6" aria-busy="true">
          <p className="sr-only">Loading dentist</p>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </>
    );
  }

  const d = q.data;

  return (
    <>
      {back}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <DentistAvatar
            name={d.name}
            className="size-16 rounded-2xl text-xl"
          />
          <div className="min-w-0">
            <h1 className="font-display text-display-sm text-foreground sm:text-display-md">
              {d.name}
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              {d.speciality}
              {d.yearsExperience !== null
                ? ` · ${d.yearsExperience} years`
                : ""}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-semibold",
                  d.isActive
                    ? "bg-success/12 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {d.isActive ? "Active" : "Inactive"}
              </span>
              <a href={`mailto:${d.email}`} className="hover:underline">
                {d.email}
              </a>
              <span>{d.phone}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/appointments?doctor=${d.id}`}>
              <CalendarSearch aria-hidden />
              Appointments
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil aria-hidden />
            Edit
          </Button>
          {d.isActive ? (
            <Button variant="outline" onClick={() => setConfirming(true)}>
              <Power aria-hidden />
              Deactivate
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <ScheduleEditor doctor={d} />
          <TimeOffPanel doctor={d} />
        </div>
        <div className="min-w-0 space-y-6 lg:col-span-4">
          <Panel title="Services offered">
            {d.services.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None yet. Patients cannot book this dentist until a service is
                assigned.{" "}
                <button
                  type="button"
                  className="focus-ring font-medium text-primary hover:underline"
                  onClick={() => setEditing(true)}
                >
                  Assign services
                </button>
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {d.services.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md bg-accent px-2.5 py-1 text-sm text-accent-foreground"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Profile">
            <dl className="space-y-3 text-sm">
              <Item label="Languages" value={d.languages.join(", ")} />
              <Item label="Education" value={d.education} />
              <Item label="Bio" value={d.bio} />
              <Item
                label="Appointments on record"
                value={String(d.appointmentCount)}
              />
            </dl>
          </Panel>
        </div>
      </div>

      <DentistFormSheet open={editing} onOpenChange={setEditing} doctor={d} />

      <AlertDialog
        open={confirming}
        onOpenChange={(o) =>
          !o && !deactivate.isPending && setConfirming(false)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl font-normal">
              Deactivate {d.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They disappear from booking. Their history and existing
              appointments are kept, and you can reactivate them with Edit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivate.isPending}>
              Keep active
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deactivate.isPending}
              onClick={async () => {
                try {
                  const res = await deactivate.mutateAsync(d.id);
                  setConfirming(false);
                  if (res.upcomingAppointments > 0)
                    toast.warning(
                      `${d.name} is deactivated, but still has ${res.upcomingAppointments} upcoming appointment${res.upcomingAppointments === 1 ? "" : "s"}. Move or cancel them.`,
                      { duration: 10_000 },
                    );
                  else toast.success(`${d.name} deactivated`);
                } catch (e) {
                  toast.error(errorMessage(e));
                }
              }}
            >
              {deactivate.isPending ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : null}
              Deactivate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{value || "-"}</dd>
    </div>
  );
}
