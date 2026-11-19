"use client";

import { Stethoscope } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDuration, formatPrice } from "@/components/portal/format";
import { QueryError } from "@/components/portal/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useServices } from "@/hooks/use-services";
import type { PublicDoctorDTO } from "@/lib/actions/doctors";
import type { ServiceDTO } from "@/lib/actions/services";
import { ChoiceCard } from "./ChoiceCard";

export function ServiceStep({
  selectedId,
  onChoose,
  onlyDoctor,
  onShowAll,
}: {
  selectedId: string | null;
  onChoose: (service: ServiceDTO) => void;
  /** Came from a dentist's page: list only what that dentist offers. */
  onlyDoctor: PublicDoctorDTO | null;
  onShowAll: () => void;
}) {
  const services = useServices();

  if (services.isError)
    return (
      <QueryError
        title="Services didn't load"
        error={services.error}
        onRetry={() => services.refetch()}
        retrying={services.isFetching}
      />
    );

  if (services.isPending)
    return (
      <div className="space-y-3" aria-busy="true">
        <output className="sr-only">Loading services</output>
        {Array.from({ length: 5 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );

  const offered = onlyDoctor
    ? new Set(onlyDoctor.services.map((s) => s.id))
    : null;
  const list = services.data.filter((s) => !offered || offered.has(s.id));

  if (list.length === 0)
    return (
      <EmptyState
        icon={Stethoscope}
        title="No services can be booked online right now"
        body="Call the clinic and we'll find you a time."
      />
    );

  const categories = [...new Set(list.map((s) => s.category))];

  return (
    <div className="space-y-8">
      {onlyDoctor ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-accent/50 px-4 py-3 text-sm text-accent-foreground">
          Showing what {onlyDoctor.name} offers.
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={onShowAll}
          >
            Show every service
          </Button>
        </p>
      ) : null}
      {categories.map((category, i) => (
        <section key={category} aria-labelledby={`service-cat-${i}`}>
          <h3
            id={`service-cat-${i}`}
            className="mb-3 text-sm font-semibold text-muted-foreground"
          >
            {category}
          </h3>
          <ul className="space-y-3">
            {list
              .filter((s) => s.category === category)
              .map((s) => {
                const unavailable = s.doctorCount === 0;
                return (
                  <li key={s.id}>
                    <ChoiceCard
                      selected={selectedId === s.id}
                      disabled={unavailable}
                      onChoose={() => onChoose(s)}
                      title={s.name}
                      meta={formatDuration(s.durationMinutes)}
                      trailing={
                        <span
                          className="font-display text-lg leading-none text-foreground"
                          data-numeric
                        >
                          {formatPrice(s.priceCents)}
                        </span>
                      }
                    >
                      {unavailable
                        ? "Not bookable online right now. Call us to arrange it."
                        : s.description}
                    </ChoiceCard>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
