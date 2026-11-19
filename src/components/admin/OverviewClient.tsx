"use client";

import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  Coins,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboardStats } from "@/hooks/use-admin";
import type { AdminDashboardStatsDTO } from "@/lib/actions/admin";
import { formatMoney } from "@/lib/time";
import {
  AppointmentActionsMenu,
  useAppointmentActions,
} from "./AppointmentActions";
import { dayLabel, Panel, QueryError, StatusBadge } from "./shared";

const chartConfig = {
  count: { label: "Bookings", color: "var(--chart-1)" },
} satisfies ChartConfig;

const pct = (v: number | null) =>
  v === null ? "-" : `${Math.round(v * 100)}%`;

export function OverviewClient() {
  const { data, error, refetch, isPending } = useAdminDashboardStats();
  const { onAction, dialogs } = useAppointmentActions();

  const header = (
    <PageHeader
      eyebrow={
        data
          ? dayLabel(data.today.date, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : "Today"
      }
      title="Today at the clinic"
      description="What needs attention first, then how the clinic is doing."
    />
  );

  if (error && !data) {
    return (
      <>
        {header}
        <QueryError error={error} onRetry={() => refetch()} />
      </>
    );
  }
  if (isPending || !data) return <OverviewSkeleton header={header} />;

  return (
    <>
      {header}
      <div className="space-y-6">
        <AttentionBanner count={data.needsOutcome} />

        <div className="grid gap-6 lg:grid-cols-12">
          <Panel
            className="lg:col-span-8"
            title="Today's schedule"
            description={
              data.today.count === 0
                ? undefined
                : `${data.today.count} appointment${data.today.count === 1 ? "" : "s"} in ${data.timezone}`
            }
            action={
              <Link
                href="/admin/appointments"
                className="focus-ring inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline"
              >
                All appointments <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            }
          >
            <TodayList
              appointments={data.today.appointments}
              onAction={onAction}
            />
          </Panel>

          <Panel
            className="lg:col-span-4"
            title="Dentist load"
            description="Booked time against scheduled hours, next 7 days"
          >
            <DoctorLoad rows={data.doctorLoad} />
          </Panel>
        </div>

        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Key figures"
        >
          <StatCard
            label="Upcoming, 7 days"
            value={data.upcoming7Days}
            hint="Pending and confirmed"
            icon={CalendarClock}
          />
          <StatCard
            label="Completion rate"
            value={pct(data.outcomes.completionRate)}
            hint={outcomeHint(data)}
            icon={CircleCheck}
          />
          <StatCard
            label="No-show rate"
            value={pct(data.outcomes.noShowRate)}
            hint={outcomeHint(data)}
            icon={UserX}
          />
          <StatCard
            label="Revenue, 30 days"
            value={formatMoney(
              data.revenue.last30DaysCents,
              data.revenue.currency,
            )}
            hint="From completed visits"
            icon={Coins}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-12">
          <Panel
            className="lg:col-span-8"
            title="Bookings per day"
            description="New bookings created in the last 30 days"
          >
            <BookingsChart data={data.bookingsPerDay} />
          </Panel>
          <Panel
            className="lg:col-span-4"
            title="Top services"
            description="By bookings, last 90 days"
          >
            <TopServices
              rows={data.topServices}
              currency={data.revenue.currency}
            />
          </Panel>
        </div>
      </div>
      {dialogs}
    </>
  );
}

function outcomeHint(d: AdminDashboardStatsDTO) {
  const n = d.outcomes.completed + d.outcomes.noShow;
  return n === 0
    ? "No outcomes recorded yet"
    : `Of ${n} recorded, last ${d.outcomes.windowDays} days`;
}

function AttentionBanner({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-accent/60 px-5 py-4 text-accent-foreground">
        <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />
        <p className="text-sm font-medium">
          All caught up: every past appointment has an outcome.
        </p>
      </div>
    );
  }
  return (
    <Link
      href="/admin/appointments?needsOutcome=1"
      className="focus-ring group flex items-center gap-4 rounded-2xl border border-destructive/30 bg-coral/15 px-5 py-4 transition-colors hover:bg-coral/25"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-coral/40 font-display text-xl text-destructive tabular-nums">
        {count}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg text-foreground">
          {count === 1
            ? "1 appointment needs an outcome"
            : `${count} appointments need an outcome`}
        </span>
        <span className="block text-sm text-muted-foreground">
          These visits are over. Mark each completed (with a visit note) or
          no-show.
        </span>
      </span>
      <ArrowRight
        className="size-5 shrink-0 text-destructive transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function TodayList({
  appointments,
  onAction,
}: {
  appointments: AdminDashboardStatsDTO["today"]["appointments"];
  onAction: ReturnType<typeof useAppointmentActions>["onAction"];
}) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Nothing scheduled today"
        body="No pending or confirmed appointments fall on today's date."
        action={
          <Link
            href="/admin/appointments"
            className="focus-ring text-sm font-medium text-primary hover:underline"
          >
            Browse all appointments
          </Link>
        }
        className="border-0 bg-transparent py-8"
      />
    );
  }
  return (
    <ol className="divide-y">
      {appointments.map((a) => (
        <li key={a.id} className="flex items-center gap-3 py-3">
          <div
            className="w-[4.5rem] shrink-0 whitespace-nowrap text-right"
            data-numeric
          >
            <p className="font-display text-lg leading-none">{a.timeLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {a.durationMinutes} min
            </p>
          </div>
          <span className="h-10 w-px shrink-0 bg-border" aria-hidden />
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/patients/${a.patient.id}`}
              className="focus-ring block truncate text-sm font-semibold hover:underline"
            >
              {a.patient.name}
            </Link>
            <p className="truncate text-sm text-muted-foreground">
              {a.service?.name ?? a.reason ?? "Appointment"} · {a.doctor.name}
            </p>
          </div>
          <StatusBadge status={a.status} needsOutcome={a.needsOutcome} />
          <AppointmentActionsMenu
            appointment={a}
            onAction={onAction}
            size="icon-sm"
          />
        </li>
      ))}
    </ol>
  );
}

function DoctorLoad({ rows }: { rows: AdminDashboardStatsDTO["doctorLoad"] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No active dentists"
        body="Add a dentist and a weekly schedule to see their load here."
        action={
          <Link
            href="/admin/dentists"
            className="text-sm font-medium text-primary hover:underline"
          >
            Go to dentists
          </Link>
        }
        className="border-0 bg-transparent py-6"
      />
    );
  }
  return (
    <ul className="space-y-4">
      {rows.map((d) => {
        const pctBooked =
          d.utilisation === null ? null : Math.round(d.utilisation * 100);
        return (
          <li key={d.doctorId}>
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/admin/dentists/${d.doctorId}`}
                className="focus-ring truncate text-sm font-semibold hover:underline"
              >
                {d.name}
              </Link>
              <span
                className="shrink-0 text-xs text-muted-foreground"
                data-numeric
              >
                {d.upcoming7Days} appt{d.upcoming7Days === 1 ? "" : "s"}
                {pctBooked === null ? "" : ` · ${pctBooked}%`}
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={
                pctBooked === null
                  ? `${d.name} has no scheduled hours`
                  : `${d.name} is ${pctBooked}% booked`
              }
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${Math.min(100, pctBooked ?? 0)}%` }}
              />
            </div>
            {pctBooked === null ? (
              <p className="mt-1 text-xs text-muted-foreground">
                No weekly hours set
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function BookingsChart({
  data,
}: {
  data: AdminDashboardStatsDTO["bookingsPerDay"];
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No bookings yet"
        body="Bookings made in the last 30 days will chart here."
        className="border-0 bg-transparent py-8"
      />
    );
  }
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div>
      <p className="sr-only">
        {total} bookings in the last 30 days, at most {max} on one day.
      </p>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-56 w-full"
        aria-hidden
      >
        <BarChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(v: string) => dayLabel(v)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={44}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(v) =>
                  dayLabel(String(v), {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                }
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

function TopServices({
  rows,
  currency,
}: {
  rows: AdminDashboardStatsDTO["topServices"];
  currency: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        body="The services patients book most will rank here."
        className="border-0 bg-transparent py-6"
      />
    );
  }
  const max = Math.max(...rows.map((r) => r.bookings));
  return (
    <ol className="space-y-4">
      {rows.map((s, i) => (
        <li key={s.serviceId}>
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              <span
                className="mr-2 font-display text-muted-foreground"
                data-numeric
              >
                {i + 1}
              </span>
              {s.name}
            </p>
            <p className="shrink-0 text-xs text-muted-foreground" data-numeric>
              {s.bookings} · {formatMoney(s.revenueCents, currency)}
            </p>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-chart-2"
              style={{ width: `${(s.bookings / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function OverviewSkeleton({ header }: { header: React.ReactNode }) {
  return (
    <>
      {header}
      <div className="space-y-6" aria-busy="true">
        <p className="sr-only">Loading overview</p>
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
          <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </>
  );
}
