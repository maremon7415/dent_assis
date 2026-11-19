import { Check, ShieldAlert, X } from "lucide-react";
import { siteConfig } from "@/config/site";

const CAN = [
  "Explain a treatment in plain words: what happens, how long it takes, how it feels",
  "Aftercare advice after a filling, extraction, whitening or a clean",
  "How to prepare for your visit and what to bring",
  "Everyday questions about brushing, flossing, sensitivity and diet",
];

const CANNOT = [
  "Diagnose a problem or tell you what's wrong",
  "Prescribe or change medication",
  "See your records, or book, move or cancel visits",
  "Replace a dentist's examination",
];

/** What the assistant is for, and its limits. Shown beside every state of the voice page. */
export function AssistantGuide() {
  return (
    <aside aria-label="About the assistant" className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="font-display text-xl text-foreground">
          What it can help with
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {CAN.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
        <h2 className="mt-8 font-display text-xl text-foreground">
          What it won't do
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {CANNOT.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <X className="size-3" strokeWidth={3} aria-hidden />
              </span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-warning/30 bg-warning/8 p-5 text-sm sm:p-6">
        <p className="flex items-center gap-2 font-semibold text-warning">
          <ShieldAlert className="size-4" aria-hidden />
          Medical disclaimer
        </p>
        <p className="mt-2 leading-relaxed text-foreground">
          The assistant gives general information, not a diagnosis or medical
          advice. For pain, swelling, bleeding or a broken tooth, call the
          clinic on{" "}
          <a
            href={`tel:${siteConfig.phone.replace(/[^+\d]/g, "")}`}
            className="font-semibold text-foreground underline underline-offset-4"
          >
            {siteConfig.phone}
          </a>
          . If your face or throat is swelling or you find it hard to breathe or
          swallow, call your local emergency number now.
        </p>
      </div>
    </aside>
  );
}
