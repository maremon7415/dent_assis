"use client";

import { useUser } from "@clerk/nextjs";
import {
  AudioLines,
  CalendarCheck2,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  NotebookPen,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { DoctorAvatar } from "@/components/portal/DoctorAvatar";
import { longDayLabel, visitTitle } from "@/components/portal/format";
import { QueryError } from "@/components/portal/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyAppointments, useMyStats } from "@/hooks/use-appointment";
import { useMyProfile } from "@/hooks/use-profile";
import type { AppointmentDTO } from "@/lib/dto";
import { NextVisitCard } from "./NextVisitCard";
import { buildTodos, TodoList } from "./TodoList";

function LatestNote({ visit }: { visit: AppointmentDTO | null }) {
  return (
    <section
      aria-labelledby="latest-note-title"
      className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-xs sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="latest-note-title"
          className="font-display text-xl text-foreground"
        >
          From your last visit
        </h2>
        {visit ? (
          <Link
            href="/visits?tab=past"
            className="focus-ring inline-flex shrink-0 items-center gap-0.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            History
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      {!visit ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-2 py-6 text-sm text-muted-foreground">
          <NotebookPen className="size-6 text-primary" aria-hidden />
          After your first visit, your dentist's summary and aftercare advice
          appear here.
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-3">
            <DoctorAvatar src={visit.doctor.imageUrl} className="size-9" />
            <div className="min-w-0 text-sm leading-tight">
              <p className="font-medium text-foreground">
                {visitTitle(visit)} with {visit.doctor.name}
              </p>
              <p className="text-muted-foreground">
                <time dateTime={visit.date}>{longDayLabel(visit.date)}</time>
              </p>
            </div>
          </div>
          {visit.visitNote ? (
            <blockquote className="rounded-xl bg-muted/60 p-4">
              <p className="whitespace-pre-line leading-relaxed text-foreground">
                {visit.visitNote.summary}
              </p>
              {visit.visitNote.treatment ? (
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Treatment:{" "}
                  </span>
                  {visit.visitNote.treatment}
                </p>
              ) : null}
            </blockquote>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your dentist didn't leave a note for this visit.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function AssistantTile() {
  return (
    <Link
      href="/voice"
      className="focus-ring group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm transition-transform duration-150 ease-out active:scale-[0.99] sm:p-6"
    >
      <span
        aria-hidden
        className="absolute -top-10 -right-10 size-40 rounded-full bg-mint/25 blur-2xl"
      />
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
        <AudioLines className="size-5" aria-hidden />
      </span>
      <span className="relative">
        <span className="block font-display text-xl">
          Questions between visits?
        </span>
        <span className="mt-1 block text-sm leading-relaxed opacity-85">
          Talk to the voice assistant about aftercare, what a treatment
          involves, or how to prepare.
        </span>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
          Open the assistant
          <ChevronRight
            className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </span>
    </Link>
  );
}

export function DashboardView() {
  const { user } = useUser();
  const stats = useMyStats();
  const visits = useMyAppointments();
  const profile = useMyProfile();

  const firstName = profile.data?.firstName ?? user?.firstName;
  const next = stats.data?.nextAppointment ?? null;

  const description = stats.data
    ? next
      ? `Your next visit is ${next.dateLabel} at ${next.timeLabel}.`
      : "You have no visits booked."
    : "Here's what's next.";

  return (
    <>
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Hello"}
        description={description}
        actions={
          // With nothing booked, the "Nothing booked yet" card carries the same action.
          next ? (
            <Button asChild size="lg">
              <Link href="/appointments">
                <CalendarPlus className="size-4" aria-hidden />
                Book a visit
              </Link>
            </Button>
          ) : null
        }
      />

      {stats.isError ? (
        <QueryError
          title="Your dashboard didn't load"
          error={stats.error}
          onRetry={() => {
            void stats.refetch();
            void visits.refetch();
          }}
          retrying={stats.isFetching}
          className="mb-6"
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          {stats.isPending ? (
            <Skeleton className="h-64 rounded-2xl" aria-busy="true" />
          ) : stats.isSuccess ? (
            <NextVisitCard next={next} lastVisit={stats.data.lastVisit} />
          ) : null}
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          {visits.isPending || profile.isPending ? (
            <Skeleton className="h-64 rounded-2xl" aria-busy="true" />
          ) : visits.isSuccess ? (
            <TodoList todos={buildTodos(visits.data, profile.data)} />
          ) : null}
        </div>

        <section
          aria-label="Your visits in numbers"
          className={
            stats.isSuccess && stats.data.total === 0
              ? "hidden"
              : "grid grid-cols-3 gap-3 sm:gap-4 lg:col-span-12"
          }
        >
          {stats.isSuccess ? (
            <>
              <StatCard
                label="Upcoming"
                value={stats.data.upcoming}
                icon={CalendarCheck2}
                className="p-4 sm:p-5"
              />
              <StatCard
                label="Completed"
                value={stats.data.completed}
                icon={ClipboardCheck}
                className="p-4 sm:p-5"
              />
              <StatCard
                label="Total"
                value={stats.data.total}
                hint={
                  stats.data.cancelled
                    ? `${stats.data.cancelled} cancelled`
                    : undefined
                }
                icon={Stethoscope}
                className="p-4 sm:p-5"
              />
            </>
          ) : stats.isPending ? (
            [0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          ) : null}
        </section>

        <div className="lg:col-span-7 xl:col-span-8">
          {stats.isSuccess ? (
            <LatestNote visit={stats.data.lastVisit} />
          ) : stats.isPending ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : null}
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <AssistantTile />
        </div>
      </div>
    </>
  );
}
