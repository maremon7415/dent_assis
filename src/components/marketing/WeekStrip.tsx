import type { PublicDoctorDTO } from "@/lib/actions/doctors";
import { cn } from "@/lib/utils";
import { Crescent } from "./Crescent";
import { WEEK_ORDER, weekdayLong, weekdayShort } from "./format";

/**
 * Seven moons, Monday first: a full moon on a working day, an empty disc on a day off. The text
 * alternative lists the working days in words.
 */
export function WeekStrip({
  schedule,
  className,
}: {
  schedule: PublicDoctorDTO["schedule"];
  className?: string;
}) {
  const works = (d: number) =>
    schedule.some((s) => s.weekday === d && s.ranges.length > 0);
  const working = WEEK_ORDER.filter(works).map(weekdayLong);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="sr-only">
        {working.length
          ? `Works ${working.join(", ")}`
          : "No regular hours published"}
      </p>
      <ol aria-hidden className="flex gap-1.5 text-primary">
        {WEEK_ORDER.map((d) => (
          <li key={d} className="flex flex-col items-center gap-1">
            <Crescent phase={works(d) ? 1 : 0} outline className="size-4" />
            <span
              className={cn(
                "text-[0.6875rem] leading-none",
                works(d)
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {weekdayShort(d).slice(0, 2)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
