import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PublicDoctorDTO } from "@/lib/actions/doctors";
import { DoctorAvatar } from "../DoctorAvatar";
import { DoctorRating } from "../DoctorRating";
import { workingDaysLabel } from "../format";
import { BandTitle, Container, DataUnavailable } from "../primitives";

const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

/** A staff board rather than a card grid: portraits on a shared baseline, divided by hairlines. */
export function DentistsTeaser({
  doctors,
}: {
  doctors: PublicDoctorDTO[] | null;
}) {
  return (
    <section
      aria-labelledby="dentists-title"
      className="border-t bg-card/50 py-20 lg:py-28"
    >
      <Container>
        <BandTitle
          id="dentists-title"
          title="Meet the people behind the chair"
          lede="Every dentist lists what they treat, the languages they speak and the days they see patients."
          action={
            doctors && doctors.length > 0 ? (
              <Button asChild variant="outline">
                <Link href="/dentists">
                  All dentists
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null
          }
        />
        {doctors === null ? (
          <DataUnavailable what="Dentist profiles" className="mt-12" />
        ) : doctors.length === 0 ? (
          <p className="mt-12 rounded-xl border border-dashed bg-card/60 px-6 py-10 text-center text-muted-foreground">
            Our team page is being updated. Call the clinic and we will match
            you with the right dentist.
          </p>
        ) : (
          <ul
            className={`mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 ${LG_COLS[Math.min(doctors.length, 5)]}`}
          >
            {doctors.slice(0, 5).map((d) => {
              const days = workingDaysLabel(d.schedule);
              return (
                <li
                  key={d.id}
                  className="bg-background sm:[&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1"
                >
                  <Link
                    href={d.slug ? `/dentists/${d.slug}` : "/dentists"}
                    className="focus-ring group flex h-full flex-col gap-4 p-6 transition-colors duration-200 hover:bg-accent/40"
                  >
                    <DoctorAvatar src={d.imageUrl} size="md" />
                    <div className="flex-1">
                      <h3 className="font-display text-lg leading-snug text-foreground group-hover:text-primary">
                        {d.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {d.speciality}
                      </p>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <DoctorRating rating={d.rating} className="text-xs" />
                      {d.languages.length > 0 ? (
                        <p>Speaks {d.languages.join(", ")}</p>
                      ) : null}
                      {days ? <p>Sees patients {days}</p> : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </section>
  );
}
