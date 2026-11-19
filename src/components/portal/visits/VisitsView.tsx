"use client";

import { CalendarPlus, ClipboardList, History } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyAppointments } from "@/hooks/use-appointment";
import type { AppointmentDTO } from "@/lib/dto";
import { QueryError } from "../QueryError";
import { VisitCard } from "./VisitCard";

type Tab = "upcoming" | "past";

function List({
  items,
  all,
}: {
  items: AppointmentDTO[];
  all: AppointmentDTO[];
}) {
  const movedTo = new Map(
    all.filter((a) => a.rescheduledFromId).map((a) => [a.rescheduledFromId, a]),
  );
  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <VisitCard key={a.id} appointment={a} movedTo={movedTo.get(a.id)} />
      ))}
    </ul>
  );
}

function Count({ n }: { n: number | undefined }) {
  if (n === undefined) return null;
  return (
    <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground group-data-[state=active]:bg-accent group-data-[state=active]:text-accent-foreground">
      {n}
    </span>
  );
}

export function VisitsView() {
  const mine = useMyAppointments();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: Tab = search.get("tab") === "past" ? "past" : "upcoming";

  const setTab = (next: string) => {
    router.replace(next === "past" ? `${pathname}?tab=past` : pathname, {
      scroll: false,
    });
  };

  const body = (items: AppointmentDTO[] | undefined, which: Tab) => {
    if (mine.isError)
      return (
        <QueryError
          title="Your visits didn't load"
          error={mine.error}
          onRetry={() => mine.refetch()}
          retrying={mine.isFetching}
        />
      );
    if (!items)
      return (
        <div className="space-y-4" aria-busy="true">
          <output className="sr-only">Loading visits</output>
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      );
    if (items.length === 0)
      return which === "upcoming" ? (
        <EmptyState
          icon={CalendarPlus}
          title="No upcoming visits"
          body="Book a visit and it will show up here, with options to move or cancel it."
          action={
            <Button asChild>
              <Link href="/appointments">Book a visit</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={History}
          title="No past visits yet"
          body="After each visit, your dentist's notes and follow-up advice appear here."
          action={
            <Button variant="outline" asChild>
              <Link href="/appointments">Book your first visit</Link>
            </Button>
          }
        />
      );
    return (
      <List
        items={items}
        all={[...(mine.data?.upcoming ?? []), ...(mine.data?.past ?? [])]}
      />
    );
  };

  return (
    <>
      <PageHeader
        title="My visits"
        description="Move or cancel upcoming visits, read your dentist's notes, and review past visits."
        actions={
          <Button asChild>
            <Link href="/appointments">
              <CalendarPlus className="size-4" aria-hidden />
              Book a visit
            </Link>
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="h-10 w-full sm:w-fit">
          <TabsTrigger value="upcoming" className="group gap-2 px-4">
            <ClipboardList className="size-4" aria-hidden />
            Upcoming
            <Count n={mine.data?.upcoming.length} />
          </TabsTrigger>
          <TabsTrigger value="past" className="group gap-2 px-4">
            <History className="size-4" aria-hidden />
            Past
            <Count n={mine.data?.past.length} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {body(mine.data?.upcoming, "upcoming")}
        </TabsContent>
        <TabsContent value="past">{body(mine.data?.past, "past")}</TabsContent>
      </Tabs>
    </>
  );
}
