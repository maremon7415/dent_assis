import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Faq } from "./faq";

/**
 * Native disclosure list: works without JavaScript, every answer is in the HTML for search and
 * find-in-page, and the keyboard behaviour is the browser's own.
 */
export function FaqList({
  items,
  headingLevel = "h3",
  className,
}: {
  items: Faq[];
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const H = headingLevel;
  return (
    <div className={cn("divide-y divide-border border-y", className)}>
      {items.map((f) => (
        <details key={f.id} id={f.id} className="group scroll-mt-28">
          <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-5 [&::-webkit-details-marker]:hidden">
            <H className="font-display text-lg leading-snug text-foreground sm:text-xl">
              {f.q}
            </H>
            <span
              aria-hidden
              className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-input text-primary transition-[transform,background-color] duration-200 ease-out group-open:rotate-45 group-open:bg-accent"
            >
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="max-w-2xl pb-6 text-base leading-relaxed text-muted-foreground">
            {f.a}
          </p>
        </details>
      ))}
    </div>
  );
}
