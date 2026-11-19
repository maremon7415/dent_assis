import Link from "next/link";
import { cn } from "@/lib/utils";
import { bookingHref, formatDuration, formatPrice } from "./format";

export type ServiceMenuItem = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
};

/**
 * A clinic price list, not a card grid: each treatment is a row with a dotted leader running to its
 * duration and price, the way a printed menu at reception reads. The book link carries the service
 * (and dentist, when given) into the booking flow.
 */
export function ServiceMenu({
  items,
  doctorSlug,
  bookLabel = "Book this",
  compact = false,
  anchors = false,
  className,
}: {
  items: ServiceMenuItem[];
  doctorSlug?: string | null;
  bookLabel?: string;
  compact?: boolean;
  /** Give each row its service slug as id, so /services#slug links land on it. */
  anchors?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border border-y", className)}>
      {items.map((s) => (
        <li
          key={s.id}
          id={anchors ? s.slug : undefined}
          className={cn(
            "scroll-mt-24",
            "grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 sm:gap-x-6",
            compact ? "py-4" : "py-5 sm:py-6",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-lg leading-snug text-foreground sm:text-xl">
                {s.name}
              </h3>
              <span
                aria-hidden
                className="hidden min-w-8 flex-1 translate-y-[-0.3em] border-b border-dotted border-input sm:block"
              />
              <p
                data-numeric
                className="hidden shrink-0 text-sm text-muted-foreground sm:block"
              >
                {formatDuration(s.durationMinutes)}
                <span aria-hidden className="mx-2 text-input">
                  /
                </span>
                <span className="font-semibold text-foreground">
                  {formatPrice(s.priceCents)}
                </span>
              </p>
            </div>
            {s.description && !compact ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            ) : null}
            <p
              data-numeric
              className="mt-1 text-sm text-muted-foreground sm:hidden"
            >
              {formatDuration(s.durationMinutes)}
              <span aria-hidden className="mx-2 text-input">
                /
              </span>
              <span className="font-semibold text-foreground">
                {formatPrice(s.priceCents)}
              </span>
            </p>
          </div>
          <div className="flex items-start justify-end">
            <Link
              prefetch={false}
              href={bookingHref({ service: s.slug, doctor: doctorSlug })}
              className="focus-ring group inline-flex h-9 items-center rounded-md border border-input bg-card px-3.5 text-sm font-medium text-foreground transition-[background-color,border-color,transform] duration-150 ease-out hover:border-primary hover:bg-accent hover:text-accent-foreground active:scale-[0.97]"
            >
              {bookLabel}
              <span className="sr-only">: {s.name}</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
