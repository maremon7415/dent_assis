"use client";

import { ArrowLeft, Mail, Phone, Pill, ShieldAlert, Star } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPatient } from "@/hooks/use-admin";
import { ActionFailedError } from "@/lib/action-result";
import { formatMoney } from "@/lib/time";
import {
  AppointmentActionsMenu,
  useAppointmentActions,
} from "./AppointmentActions";
import { Panel, QueryError, StatusBadge, useFormatInstant } from "./shared";

export function PatientDetailClient({ id }: { id: string }) {
  const q = useAdminPatient(id);
  const fmt = useFormatInstant();
  const { onAction, dialogs } = useAppointmentActions();

  const back = (
    <Link
      href="/admin/patients"
      className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All patients
    </Link>
  );

  if (q.error && !q.data) {
    const notFound =
      q.error instanceof ActionFailedError && q.error.code === "NOT_FOUND";
    return (
      <>
        {back}
        <h1 className="sr-only">Patient</h1>
        <QueryError
          error={q.error}
          title={
            notFound ? "Patient not found" : "We could not load this patient"
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
        <h1 className="sr-only">Patient</h1>
        <div className="space-y-6" aria-busy="true">
          <p className="sr-only">Loading patient</p>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </>
    );
  }

  const p = q.data;
  const completed = p.appointments.filter(
    (a) => a.status === "COMPLETED",
  ).length;
  const hasHealth = p.allergies || p.medications || p.medicalNotes;

  return (
    <>
      {back}
      <header className="mb-8 space-y-2">
        <h1 className="font-display text-display-sm text-foreground sm:text-display-md">
          {p.name}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <a
            href={`mailto:${p.email}`}
            className="inline-flex items-center gap-1.5 hover:underline"
          >
            <Mail className="size-3.5" aria-hidden />
            {p.email}
          </a>
          {p.phone ? (
            <a
              href={`tel:${p.phone}`}
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <Phone className="size-3.5" aria-hidden />
              {p.phone}
            </a>
          ) : null}
          <span>
            Member since{" "}
            {fmt(p.memberSince, { month: "long", year: "numeric" })}
          </span>
          <span data-numeric>
            {completed} of {p.appointments.length} visits completed
          </span>
          {p.deleted ? (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">
              Account deleted
            </span>
          ) : null}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-4 lg:order-2">
          <Panel
            title="Health profile"
            description="Review before every treatment."
          >
            {hasHealth ? (
              <div className="space-y-3">
                <Callout
                  tone="danger"
                  icon={ShieldAlert}
                  label="Allergies"
                  value={p.allergies}
                />
                <Callout
                  tone="warning"
                  icon={Pill}
                  label="Medications"
                  value={p.medications}
                />
                {p.medicalNotes ? (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Medical notes
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm">
                      {p.medicalNotes}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This patient has not filled in a health profile yet.
              </p>
            )}
          </Panel>
          <Panel title="Details">
            <dl className="space-y-3 text-sm">
              <Row label="Date of birth" value={p.dateOfBirth} />
              <Row label="Emergency contact" value={p.emergencyContactName} />
              <Row label="Emergency phone" value={p.emergencyContactPhone} />
            </dl>
          </Panel>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-8 lg:order-1">
          <Panel title="Appointment history" description="Newest first">
            {p.appointments.length === 0 ? (
              <EmptyState
                title="No appointments yet"
                body="Visits this patient books will be listed here."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ol className="divide-y">
                {p.appointments.map((a) => (
                  <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium" data-numeric>
                          {a.dateLabel}, {a.timeLabel}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {a.service?.name ?? a.reason ?? "Appointment"} ·{" "}
                          {a.doctor.name}
                          {a.priceCents !== null
                            ? ` · ${formatMoney(a.priceCents)}`
                            : ""}
                        </p>
                      </div>
                      <StatusBadge
                        status={a.status}
                        needsOutcome={a.needsOutcome}
                      />
                      <AppointmentActionsMenu
                        appointment={a}
                        onAction={onAction}
                        size="icon-sm"
                      />
                    </div>
                    {a.cancelReason ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cancelled: {a.cancelReason}
                      </p>
                    ) : null}
                    {a.visitNote ? (
                      <div className="mt-3 space-y-1.5 rounded-xl bg-muted/60 p-3 text-sm">
                        <p>{a.visitNote.summary}</p>
                        {a.visitNote.treatment ? (
                          <p className="text-muted-foreground">
                            Treatment: {a.visitNote.treatment}
                          </p>
                        ) : null}
                        {a.visitNote.followUpInDays ? (
                          <p className="text-muted-foreground">
                            Follow up in {a.visitNote.followUpInDays} days
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {p.reviews.length > 0 ? (
            <Panel title="Reviews">
              <ul className="space-y-3">
                {p.reviews.map((r) => (
                  <li key={r.id} className="text-sm">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Star
                        className="size-3.5 fill-warning text-warning"
                        aria-hidden
                      />
                      <span data-numeric>{r.rating}/5</span>
                      <span className="font-normal text-muted-foreground">
                        for {r.doctorName}
                      </span>
                    </p>
                    {r.comment ? <p className="mt-0.5">{r.comment}</p> : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
      {dialogs}
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value || "-"}</dd>
    </div>
  );
}

function Callout({
  tone,
  icon: Icon,
  label,
  value,
}: {
  tone: "danger" | "warning";
  icon: typeof ShieldAlert;
  label: string;
  value: string | null;
}) {
  if (!value) {
    return (
      <p className="text-sm text-muted-foreground">{label}: none reported</p>
    );
  }
  return (
    <div
      className={
        tone === "danger"
          ? "rounded-xl border border-destructive/40 bg-coral/15 p-3"
          : "rounded-xl border border-warning/40 bg-warning/10 p-3"
      }
    >
      <p
        className={
          tone === "danger"
            ? "flex items-center gap-1.5 text-xs font-semibold text-destructive"
            : "flex items-center gap-1.5 text-xs font-semibold text-warning"
        }
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 whitespace-pre-line text-sm font-medium">{value}</p>
    </div>
  );
}
