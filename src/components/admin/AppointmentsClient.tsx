"use client";

import { CalendarSearch, Search, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAppointments, useAdminDoctors } from "@/hooks/use-admin";
import type { AdminAppointmentDTO } from "@/lib/dto";
import { formatMoney } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { AdminAppointmentsQuery } from "@/lib/validation";
import {
  AppointmentActionsMenu,
  useAppointmentActions,
} from "./AppointmentActions";
import {
  ListSkeleton,
  Pager,
  QueryError,
  StatusBadge,
  statusLabel,
} from "./shared";

const PAGE_SIZE = 20;
const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
const ALL = "all";

type Filters = {
  status: string;
  doctorId: string;
  from: string;
  to: string;
  search: string;
  needsOutcome: boolean;
  page: number;
};

function readFilters(sp: URLSearchParams): Filters {
  const status = sp.get("status") ?? "";
  const page = Number(sp.get("page") ?? "1");
  return {
    status: (STATUSES as readonly string[]).includes(status) ? status : "",
    doctorId: sp.get("doctor") ?? "",
    from: sp.get("from") ?? "",
    to: sp.get("to") ?? "",
    search: sp.get("q") ?? "",
    needsOutcome: sp.get("needsOutcome") === "1",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function toQuery(f: Filters): AdminAppointmentsQuery {
  return {
    status: (f.status || undefined) as AdminAppointmentsQuery["status"],
    doctorId: f.doctorId || undefined,
    from: f.from || undefined,
    to: f.to || undefined,
    search: f.search || undefined,
    needsOutcome: f.needsOutcome || undefined,
    page: f.page,
    pageSize: PAGE_SIZE,
  };
}

export function AppointmentsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const filters = useMemo(
    () => readFilters(new URLSearchParams(sp.toString())),
    [sp],
  );
  const [searchText, setSearchText] = useState(filters.search);

  function setParams(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    if (!("page" in patch)) next.page = 1;
    const p = new URLSearchParams();
    if (next.status) p.set("status", next.status);
    if (next.doctorId) p.set("doctor", next.doctorId);
    if (next.from) p.set("from", next.from);
    if (next.to) p.set("to", next.to);
    if (next.search) p.set("q", next.search);
    if (next.needsOutcome) p.set("needsOutcome", "1");
    if (next.page > 1) p.set("page", String(next.page));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Debounce the search box into the URL; keep the box in sync with back/forward navigation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to text and the URL value
  useEffect(() => {
    if (searchText === filters.search) return;
    const t = setTimeout(() => setParams({ search: searchText.trim() }), 300);
    return () => clearTimeout(t);
  }, [searchText]);
  useEffect(() => setSearchText(filters.search), [filters.search]);

  const doctors = useAdminDoctors();
  const list = useAdminAppointments(toQuery(filters));
  const { onAction, dialogs } = useAppointmentActions();

  const active =
    !!filters.status ||
    !!filters.doctorId ||
    !!filters.from ||
    !!filters.to ||
    !!filters.search ||
    filters.needsOutcome;

  return (
    <>
      <PageHeader
        eyebrow="Appointments"
        title="Every booking"
        description="Filter by outcome, dentist or date, and record how each visit ended."
      />

      <section
        aria-label="Filters"
        className="mb-5 space-y-3 rounded-2xl border bg-card p-4 shadow-xs"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <Label htmlFor="f-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="f-search"
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Patient, email, dentist or service"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="f-status">Status</Label>
            <Select
              value={filters.status || ALL}
              onValueChange={(v) =>
                setParams({ status: v === ALL ? "" : v, needsOutcome: false })
              }
            >
              <SelectTrigger id="f-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="f-doctor">Dentist</Label>
            <Select
              value={filters.doctorId || ALL}
              onValueChange={(v) => setParams({ doctorId: v === ALL ? "" : v })}
            >
              <SelectTrigger id="f-doctor" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All dentists</SelectItem>
                {doctors.data?.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="f-from">From</Label>
            <Input
              id="f-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => setParams({ from: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <Label htmlFor="f-to">To</Label>
            <Input
              id="f-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => setParams({ to: e.target.value })}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filters.needsOutcome ? "default" : "outline"}
            size="sm"
            aria-pressed={filters.needsOutcome}
            onClick={() =>
              setParams({ needsOutcome: !filters.needsOutcome, status: "" })
            }
          >
            <TriangleAlert aria-hidden />
            Needs outcome
          </Button>
          {active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchText("");
                router.replace(pathname, { scroll: false });
              }}
            >
              <X aria-hidden />
              Clear filters
            </Button>
          ) : null}
        </div>
      </section>

      <div aria-live="polite" aria-busy={list.isFetching}>
        {list.error && !list.data ? (
          <QueryError error={list.error} onRetry={() => list.refetch()} />
        ) : !list.data ? (
          <ListSkeleton />
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={CalendarSearch}
            title={active ? "No appointments match" : "No appointments yet"}
            body={
              active
                ? "Try widening the dates or clearing a filter."
                : "Bookings made by patients will appear here."
            }
            action={
              active ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchText("");
                    router.replace(pathname, { scroll: false });
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/admin/dentists">Check dentist schedules</Link>
                </Button>
              )
            }
          />
        ) : (
          <div
            className={cn(list.isFetching && "opacity-70 transition-opacity")}
          >
            <AppointmentsTable items={list.data.items} onAction={onAction} />
            <AppointmentCards items={list.data.items} onAction={onAction} />
            <Pager
              page={list.data.page}
              pageCount={list.data.pageCount}
              total={list.data.total}
              pageSize={list.data.pageSize}
              noun="appointments"
              onPage={(p) => setParams({ page: p })}
            />
          </div>
        )}
      </div>
      {dialogs}
    </>
  );
}

type RowProps = {
  items: AdminAppointmentDTO[];
  onAction: ReturnType<typeof useAppointmentActions>["onAction"];
};

function AppointmentsTable({ items, onAction }: RowProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-xs md:block">
      <Table className="table-fixed">
        <caption className="sr-only">Appointments</caption>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-44">When</TableHead>
            <TableHead className="w-[28%]">Patient</TableHead>
            <TableHead>Service and dentist</TableHead>
            <TableHead className="w-36">Status</TableHead>
            <TableHead className="w-24 text-right">Fee</TableHead>
            <TableHead className="w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id} className="h-16">
              <TableCell>
                <p className="font-medium">{a.timeLabel}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.dateLabel.replace(/, \d{4}$/, "")}
                </p>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/patients/${a.patient.id}`}
                  className="focus-ring block truncate font-medium hover:underline"
                >
                  {a.patient.name}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {a.patient.email}
                </p>
              </TableCell>
              <TableCell>
                <p className="truncate">
                  {a.service?.name ?? a.reason ?? "Appointment"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.doctor.name} · {a.durationMinutes} min
                </p>
              </TableCell>
              <TableCell>
                <StatusBadge status={a.status} needsOutcome={a.needsOutcome} />
                {a.visitNote ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Note added
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                {a.priceCents === null ? (
                  <span className="text-muted-foreground">-</span>
                ) : (
                  formatMoney(a.priceCents)
                )}
              </TableCell>
              <TableCell>
                <AppointmentActionsMenu appointment={a} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AppointmentCards({ items, onAction }: RowProps) {
  return (
    <ul className="space-y-3 md:hidden">
      {items.map((a) => (
        <li key={a.id} className="rounded-2xl border bg-card p-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight" data-numeric>
                {a.timeLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.dateLabel.replace(/, \d{4}$/, "")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge status={a.status} needsOutcome={a.needsOutcome} />
              <AppointmentActionsMenu appointment={a} onAction={onAction} />
            </div>
          </div>
          <Link
            href={`/admin/patients/${a.patient.id}`}
            className="focus-ring mt-3 block truncate text-sm font-semibold hover:underline"
          >
            {a.patient.name}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {a.service?.name ?? a.reason ?? "Appointment"} · {a.doctor.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground" data-numeric>
            {a.durationMinutes} min
            {a.priceCents === null ? "" : ` · ${formatMoney(a.priceCents)}`}
            {a.visitNote ? " · Note added" : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
