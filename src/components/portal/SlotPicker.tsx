"use client";

import { CalendarX2, Moon, Sun, Sunrise } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { calendarParts, longDayLabel, partOfDay } from "./format";
import { QueryError } from "./QueryError";
import type { GridDay, GridSlot } from "./use-slot-grid";

const PARTS = [
  { key: "morning", label: "Morning", icon: Sunrise },
  { key: "afternoon", label: "Afternoon", icon: Sun },
  { key: "evening", label: "Evening", icon: Moon },
] as const;

const chip =
  "relative flex cursor-pointer select-none items-center justify-center rounded-lg border bg-card text-foreground transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-primary/50 hover:bg-accent/40 active:scale-[0.97] has-[input:checked]:border-primary has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring";

/**
 * Day then time picker. Days and times are native radio groups, so Tab enters a group once and the
 * arrow keys move within it.
 */
export function SlotPicker({
  days,
  daysLoading,
  daysError,
  onRetryDays,
  selectedDate,
  onSelectDate,
  slots,
  slotsLoading,
  slotsError,
  onRetrySlots,
  selectedTime,
  onSelectTime,
  noDays,
  notice,
}: {
  days: GridDay[];
  daysLoading: boolean;
  daysError: unknown;
  onRetryDays: () => void;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  slots: GridSlot[];
  slotsLoading: boolean;
  slotsError: unknown;
  onRetrySlots: () => void;
  selectedTime: string | null;
  onSelectTime: (slot: GridSlot) => void;
  /** Shown when no day in the window has an opening. */
  noDays: ReactNode;
  /** Inline message above the times (e.g. "that time was just taken"). */
  notice?: ReactNode;
}) {
  const name = useId();
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the chosen day in view on the phone strip.
  useEffect(() => {
    if (!selectedDate || !stripRef.current) return;
    const el = stripRef.current.querySelector<HTMLElement>(
      `[data-date="${selectedDate}"]`,
    );
    el?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [selectedDate]);

  if (daysError)
    return (
      <QueryError
        title="Openings didn't load"
        error={daysError}
        onRetry={onRetryDays}
      />
    );

  if (daysLoading)
    return (
      <div className="space-y-6" aria-busy="true">
        <output className="sr-only">Loading openings</output>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <Skeleton key={i} className="h-20 w-16 shrink-0 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
      </div>
    );

  if (days.length === 0) return <>{noDays}</>;

  const grouped = PARTS.map((part) => ({
    ...part,
    slots: slots.filter((s) => partOfDay(s.time) === part.key),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="space-y-8">
      <fieldset className="min-w-0">
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Day
          <span className="ml-2 font-normal text-muted-foreground">
            Only days with openings are shown
          </span>
        </legend>
        <div
          ref={stripRef}
          className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pt-1 pb-3 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] sm:overflow-visible sm:px-0 sm:pb-0"
        >
          {days.map((d) => {
            const p = calendarParts(d.date);
            return (
              <label
                key={d.date}
                data-date={d.date}
                className={cn(
                  chip,
                  "h-[5.25rem] w-[4.25rem] shrink-0 snap-start flex-col gap-0.5 sm:w-auto",
                )}
              >
                <input
                  type="radio"
                  name={`${name}-day`}
                  value={d.date}
                  checked={selectedDate === d.date}
                  onChange={() => onSelectDate(d.date)}
                  className="sr-only"
                  aria-label={`${longDayLabel(d.date)}, ${d.slots} ${d.slots === 1 ? "opening" : "openings"}`}
                />
                <span className="text-xs font-medium opacity-80">
                  {p.weekday}
                </span>
                <span className="font-display text-2xl leading-none">
                  {p.day}
                </span>
                <span className="text-[0.6875rem] opacity-80">
                  {p.monthShort}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="min-w-0" aria-describedby={`${name}-times-status`}>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Time
          {selectedDate ? (
            <span className="ml-2 font-normal text-muted-foreground">
              {longDayLabel(selectedDate)}
            </span>
          ) : null}
        </legend>
        <div aria-live="polite" id={`${name}-times-status`}>
          {notice}
        </div>
        {!selectedDate ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Pick a day to see its times.
          </p>
        ) : slotsError ? (
          <QueryError
            title="Times didn't load"
            error={slotsError}
            onRetry={onRetrySlots}
          />
        ) : slotsLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
            <CalendarX2 className="size-5 shrink-0" aria-hidden />
            This day just filled up. Pick another day.
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.key}>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <group.icon className="size-3.5" aria-hidden />
                  {group.label}
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                  {group.slots.map((s) => (
                    <label key={s.time} className={cn(chip, "h-11 text-sm")}>
                      <input
                        type="radio"
                        name={`${name}-time`}
                        value={s.time}
                        checked={selectedTime === s.time}
                        onChange={() => onSelectTime(s)}
                        className="sr-only"
                      />
                      <span className="font-semibold tabular-nums">
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </fieldset>
    </div>
  );
}
