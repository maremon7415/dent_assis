import { siteConfig } from "@/config/site";
import { Crescent } from "../Crescent";
import { BandTitle, Container } from "../primitives";

const STEPS = [
  {
    phase: 0.22,
    title: "Choose your care",
    body: "Start from what you need, a check-up, a filling, a whitening consult, and see who offers it, how long it takes and what it costs.",
  },
  {
    phase: 0.6,
    title: "Pick a real time",
    body: `Only genuinely free times are shown, up to ${siteConfig.clinic.bookingWindowDays} days ahead. Your slot is held for you alone the moment you confirm.`,
  },
  {
    phase: 1,
    title: "Arrive prepared",
    body: "A confirmation straight away, reminders the day before and an hour before, and your visit notes in the portal afterwards.",
  },
] as const;

/** Three steps drawn as a waxing moon: the phases carry the sequence, so no numbers are needed. */
export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-title"
      className="border-t bg-card/50 py-20 lg:py-28"
    >
      <Container>
        <BandTitle
          id="how-title"
          title="From toothache to booked in three steps"
          lede="No phone queue, no back-and-forth emails. The clinic's own diary, open to you."
        />
        <div className="relative mt-14">
          <span
            aria-hidden
            className="absolute top-6 right-[16%] left-[16%] hidden border-t border-dashed border-border md:block"
          />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="relative flex gap-5 md:flex-col md:items-center md:text-center"
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                  <Crescent phase={s.phase} outline className="size-12" />
                </span>
                <div>
                  <h3 className="font-display text-xl text-foreground md:mt-5">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground md:mx-auto">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
