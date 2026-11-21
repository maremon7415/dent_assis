"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { Sparkles, Star, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/layout/EmptyState";
import { DoctorAvatar } from "@/components/portal/DoctorAvatar";
import { QueryError } from "@/components/portal/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";
import type { PublicDoctorDTO } from "@/lib/actions/doctors";
import { ANY_DENTIST } from "./booking-state";
import { ChoiceCard } from "./ChoiceCard";

function Rating({ rating }: { rating: PublicDoctorDTO["rating"] }) {
  if (!rating.count || rating.average === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-foreground">
      <Star className="size-3.5 fill-current text-warning" aria-hidden />
      <span className="font-semibold tabular-nums">
        {rating.average.toFixed(1)}
      </span>
      <span className="text-muted-foreground">
        ({rating.count} {rating.count === 1 ? "review" : "reviews"})
      </span>
    </span>
  );
}

export function DentistStep({
  doctors,
  selected,
  serviceName,
  onChoose,
  onChangeService,
}: {
  doctors: UseQueryResult<PublicDoctorDTO[]>;
  /** dentist slug/id or "any" */
  selected: string | null;
  serviceName: string;
  onChoose: (value: string) => void;
  onChangeService: () => void;
}) {
  if (doctors.isError)
    return (
      <QueryError
        title="Dentists didn't load"
        error={doctors.error}
        onRetry={() => doctors.refetch()}
        retrying={doctors.isFetching}
      />
    );

  if (doctors.isPending)
    return (
      <div className="space-y-3" aria-busy="true">
        <output className="sr-only">Loading dentists</output>
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );

  if (doctors.data.length === 0)
    return (
      <EmptyState
        icon={UsersRound}
        title={`No dentist offers ${serviceName} online right now`}
        body={`Pick another service, or call ${siteConfig.phone} and we'll arrange it.`}
        action={<Button onClick={onChangeService}>Pick another service</Button>}
      />
    );

  return (
    <ul className="space-y-3">
      {doctors.data.length > 1 ? (
        <li>
          <ChoiceCard
            selected={selected === ANY_DENTIST}
            onChoose={() => onChoose(ANY_DENTIST)}
            leading={
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="size-5" aria-hidden />
              </span>
            }
            title="Any available dentist"
          >
            See every opening across {doctors.data.length} dentists. We'll book
            you with whoever is free at the time you pick.
          </ChoiceCard>
        </li>
      ) : null}
      {doctors.data.map((d) => {
        const facts = [
          d.yearsExperience ? `${d.yearsExperience} years in practice` : null,
          d.languages.length ? d.languages.join(", ") : null,
        ].filter((f): f is string => !!f);
        return (
          <li key={d.id}>
            <ChoiceCard
              selected={selected === (d.slug ?? d.id)}
              onChoose={() => onChoose(d.slug ?? d.id)}
              leading={<DoctorAvatar src={d.imageUrl} className="size-12" />}
              title={d.name}
              meta={d.speciality}
            >
              <span className="flex flex-col gap-1">
                <Rating rating={d.rating} />
                {facts.length ? (
                  <span className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {facts.map((f) => (
                      <span key={f}>{f}</span>
                    ))}
                  </span>
                ) : null}
              </span>
            </ChoiceCard>
          </li>
        );
      })}
    </ul>
  );
}
