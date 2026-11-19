import { AudioLines, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Crescent, CrescentBullet } from "../Crescent";
import { Container } from "../primitives";

const CAN = [
  "Explain what a symptom might mean and how urgent it sounds",
  "Talk you through pain relief until your visit",
  "Describe what a treatment involves and how to prepare",
  "Answer aftercare questions once you are home",
];

const CANNOT = [
  "Diagnose you or prescribe medicine",
  "See your X-rays, records or appointments",
  "Book, move or cancel visits for you",
  "Replace an emergency service",
];

/**
 * Always the night-side palette (the `dark` scope flips the tokens): the assistant is the part of
 * the clinic that is open after hours. The transcript is example copy and labelled as such.
 */
export function AssistantBand() {
  return (
    <section
      aria-labelledby="assistant-title"
      className="dark relative overflow-hidden bg-background py-20 text-foreground lg:py-28"
    >
      <Crescent
        phase={0.16}
        className="pointer-events-none absolute -top-40 -left-56 size-[40rem] opacity-60"
        litClassName="fill-mint/10"
      />
      <Container className="relative grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <h2
            id="assistant-title"
            className="font-display text-display-sm text-foreground md:text-display-md"
          >
            A calm voice for the 2 a.m. toothache
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Talk to the Lumadent assistant out loud, from any browser. It gives
            clear, general guidance and tells you plainly when you need to see
            someone.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">It can</h3>
              <ul className="mt-3 space-y-3">
                {CAN.map((c) => (
                  <li
                    key={c}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <CrescentBullet />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                It will not
              </h3>
              <ul className="mt-3 space-y-3">
                {CANNOT.map((c) => (
                  <li
                    key={c}
                    className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                  >
                    <X
                      className="mt-1 size-3.5 shrink-0 text-coral"
                      aria-hidden
                    />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-base active:scale-[0.97]"
            >
              <Link href="/voice">
                <AudioLines aria-hidden />
                Try the AI assistant
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 px-5 text-base"
            >
              <Link href="/pricing">See AI plans</Link>
            </Button>
          </div>
        </div>

        <figure className="lg:col-span-5 lg:col-start-8">
          <div className="rounded-2xl border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <AudioLines className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Lumadent assistant
                </p>
                <p className="text-xs text-muted-foreground">Voice call</p>
              </div>
              <span aria-hidden className="flex h-5 items-end gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="animate-sound-wave w-0.5 rounded-full bg-primary"
                    style={{ animationDelay: `${i * 140}ms` }}
                  />
                ))}
              </span>
            </div>
            <div className="space-y-4 pt-5 text-sm leading-relaxed">
              <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground">
                My back tooth aches when I drink something cold. Should I worry?
              </p>
              <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-foreground">
                A short, sharp ache with cold is often sensitivity, for example
                from a worn spot or a small cavity. It is worth a check-up
                within the next couple of weeks. Until then, a sensitive
                toothpaste can help.
              </p>
              <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-foreground">
                If the pain lingers, wakes you at night or your face swells,
                book an emergency visit.
              </p>
            </div>
          </div>
          <figcaption className="mt-3 text-xs text-muted-foreground">
            Example conversation. Real answers are general guidance, not a
            diagnosis.
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
