"use client";

import { CalendarClock, Plus, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useAdminDashboardStats, useAdminDoctors } from "@/hooks/use-admin";
import type { AdminDoctorDTO } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";
import { DentistFormSheet } from "./DentistFormSheet";
import { initials, ListSkeleton, QueryError, WEEKDAYS } from "./shared";

export function DentistAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-base text-accent-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function scheduleLine(d: AdminDoctorDTO) {
  if (d.scheduleSummary.length === 0) return null;
  const days = d.scheduleSummary.map((s) => WEEKDAYS[s.weekday].slice(0, 3));
  return days.join(" ");
}

export function DentistsClient() {
  const doctors = useAdminDoctors();
  const stats = useAdminDashboardStats();
  const [creating, setCreating] = useState(false);

  const load = new Map(stats.data?.doctorLoad.map((l) => [l.doctorId, l]));

  return (
    <>
      <PageHeader
        eyebrow="Dentists"
        title="Your care team"
        description="Who can be booked, which services they offer and when they work."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Add dentist
          </Button>
        }
      />

      {doctors.error && !doctors.data ? (
        <QueryError error={doctors.error} onRetry={() => doctors.refetch()} />
      ) : !doctors.data ? (
        <ListSkeleton rows={4} />
      ) : doctors.data.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No dentists yet"
          body="Add your first dentist, then set their weekly hours so patients can book."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Add dentist
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {doctors.data.map((d) => {
            const l = load.get(d.id);
            const sched = scheduleLine(d);
            return (
              <li key={d.id} className="min-w-0">
                <Link
                  href={`/admin/dentists/${d.id}`}
                  className={cn(
                    "focus-ring group flex h-full flex-col gap-4 rounded-2xl border bg-card p-5 shadow-xs transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md",
                    !d.isActive && "opacity-75",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <DentistAvatar name={d.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg leading-tight">
                        {d.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {d.speciality}
                      </p>
                    </div>
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
                  </div>
                  <dl className="grid grid-cols-3 gap-3 border-t pt-4 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Next 7 days
                      </dt>
                      <dd className="font-display text-xl tabular-nums">
                        {l ? l.upcoming7Days : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Booked</dt>
                      <dd className="font-display text-xl tabular-nums">
                        {l?.utilisation == null
                          ? "-"
                          : `${Math.round(l.utilisation * 100)}%`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Services
                      </dt>
                      <dd className="font-display text-xl tabular-nums">
                        {d.services.length}
                      </dd>
                    </div>
                  </dl>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5 shrink-0" aria-hidden />
                    {sched ? `Works ${sched}` : "No weekly hours set"}
                    {d.upcomingTimeOff.length
                      ? ` · ${d.upcomingTimeOff.length} time off`
                      : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <DentistFormSheet
        open={creating}
        onOpenChange={setCreating}
        doctor={null}
      />
    </>
  );
}
