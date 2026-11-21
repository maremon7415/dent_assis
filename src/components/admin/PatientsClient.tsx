"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPatients } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { ListSkeleton, Pager, QueryError, useFormatInstant } from "./shared";

const PAGE_SIZE = 20;

export function PatientsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const search = sp.get("q") ?? "";
  const pageParam = Number(sp.get("page") ?? "1");
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const [text, setText] = useState(search);
  const fmt = useFormatInstant();

  function go(next: { q?: string; page?: number }) {
    const p = new URLSearchParams();
    const q = next.q ?? search;
    const pg = next.page ?? 1;
    if (q) p.set("q", q);
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to the text
  useEffect(() => {
    if (text.trim() === search) return;
    const t = setTimeout(() => go({ q: text.trim(), page: 1 }), 300);
    return () => clearTimeout(t);
  }, [text]);
  useEffect(() => setText(search), [search]);

  const q = useAdminPatients({
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const day: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  return (
    <>
      <PageHeader
        eyebrow="Patients"
        title="People in your care"
        description="Search by name, email or phone to open a patient's history and health profile."
      />
      <div className="mb-5 max-w-md space-y-1.5">
        <Label htmlFor="p-search">Search patients</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="p-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Name, email or phone"
            className="pl-9"
          />
        </div>
      </div>

      <div aria-live="polite" aria-busy={q.isFetching}>
        {q.error && !q.data ? (
          <QueryError error={q.error} onRetry={() => q.refetch()} />
        ) : !q.data ? (
          <ListSkeleton />
        ) : q.data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No patients match" : "No patients yet"}
            body={
              search
                ? `Nothing found for "${search}".`
                : "Patients appear here after they create an account."
            }
            action={
              search ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setText("");
                    go({ q: "", page: 1 });
                  }}
                >
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className={cn(q.isFetching && "opacity-70 transition-opacity")}>
            <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-xs md:block">
              <Table className="table-fixed">
                <caption className="sr-only">Patients</caption>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Patient</TableHead>
                    <TableHead className="w-24 text-right">Visits</TableHead>
                    <TableHead className="w-36">Last visit</TableHead>
                    <TableHead className="w-36">Next</TableHead>
                    <TableHead className="w-36">Member since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {q.data.items.map((p) => (
                    <TableRow key={p.id} className="h-16">
                      <TableCell>
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="focus-ring block truncate font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.email}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.completedVisits}
                        <span className="text-muted-foreground">
                          {" "}
                          / {p.appointmentCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.lastVisit ? fmt(p.lastVisit, day) : "-"}
                      </TableCell>
                      <TableCell>
                        {p.nextAppointment ? fmt(p.nextAppointment, day) : "-"}
                      </TableCell>
                      <TableCell>{fmt(p.memberSince, day)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-3 md:hidden">
              {q.data.items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/patients/${p.id}`}
                    className="focus-ring block rounded-2xl border bg-card p-4 shadow-xs"
                  >
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.email}
                    </p>
                    <p
                      className="mt-2 text-xs text-muted-foreground"
                      data-numeric
                    >
                      {p.completedVisits} of {p.appointmentCount} visits
                      completed
                      {p.nextAppointment
                        ? ` · next ${fmt(p.nextAppointment, day)}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <Pager
              page={q.data.page}
              pageCount={q.data.pageCount}
              total={q.data.total}
              pageSize={q.data.pageSize}
              noun="patients"
              onPage={(p) => go({ page: p })}
            />
          </div>
        )}
      </div>
    </>
  );
}
