/**
 * Pure availability rules. No database access here: callers load schedules, time off and busy
 * appointments, then ask these functions. Unit-tested in src/lib/availability.test.ts.
 */
import {
  addDaysToLocalDate,
  localToUtc,
  minutesToTime,
  parseLocalDate,
  timeToMinutes,
  todayInClinic,
  weekdayOfLocalDate,
} from "./time";

export interface ScheduleWindow {
  /** 0 = Sunday ... 6 = Saturday */
  weekday: number;
  /** clinic-local "HH:mm" */
  startTime: string;
  /** clinic-local "HH:mm" (or "24:00") */
  endTime: string;
}

export interface Interval {
  startsAt: Date;
  endsAt: Date;
}

export interface Slot extends Interval {
  /** clinic-local "HH:mm" */
  time: string;
}

export interface AvailabilityRules {
  timeZone: string;
  slotMinutes: number;
  minNoticeHours: number;
  bookingWindowDays: number;
}

export interface AvailabilityInput extends AvailabilityRules {
  /** clinic-local "YYYY-MM-DD" */
  date: string;
  durationMinutes: number;
  schedules: ScheduleWindow[];
  timeOff: Interval[];
  /** Appointments that block the doctor (active or completed). */
  busy: Interval[];
  now: Date;
}

/** [a.start, a.end) and [b.start, b.end) overlap. Touching ends do not overlap. */
export function overlaps(a: Interval, b: Interval): boolean {
  return (
    a.startsAt.getTime() < b.endsAt.getTime() &&
    b.startsAt.getTime() < a.endsAt.getTime()
  );
}

/** A service's duration rounded up to whole slots (the slot grid from siteConfig). */
export function blockMinutes(
  durationMinutes: number,
  slotMinutes: number,
): number {
  if (!(durationMinutes > 0) || !(slotMinutes > 0))
    throw new RangeError("Durations must be positive");
  return Math.ceil(durationMinutes / slotMinutes) * slotMinutes;
}

export type DateCheck =
  | { ok: true }
  | { ok: false; reason: "INVALID_DATE" | "PAST_DATE" | "OUTSIDE_WINDOW" };

/** Is this clinic-local date bookable at all (today .. today + bookingWindowDays)? */
export function checkBookableDate(
  date: string,
  now: Date,
  rules: Pick<AvailabilityRules, "timeZone" | "bookingWindowDays">,
): DateCheck {
  if (!parseLocalDate(date)) return { ok: false, reason: "INVALID_DATE" };
  const today = todayInClinic(now, rules.timeZone);
  if (date < today) return { ok: false, reason: "PAST_DATE" };
  if (date > addDaysToLocalDate(today, rules.bookingWindowDays))
    return { ok: false, reason: "OUTSIDE_WINDOW" };
  return { ok: true };
}

/**
 * Every start time on `date` where the doctor works for the full (slot-rounded) duration, is not
 * on time off, has no overlapping appointment, and which respects the minimum notice.
 */
export function computeAvailableSlots(input: AvailabilityInput): Slot[] {
  if (!checkBookableDate(input.date, input.now, input).ok) return [];

  const block = blockMinutes(input.durationMinutes, input.slotMinutes);
  const weekday = weekdayOfLocalDate(input.date);
  const earliest = input.now.getTime() + input.minNoticeHours * 36e5;
  const blockers = [...input.timeOff, ...input.busy];

  const byStart = new Map<number, Slot>();
  for (const window of input.schedules) {
    if (window.weekday !== weekday) continue;
    const open = timeToMinutes(window.startTime);
    const close = timeToMinutes(window.endTime);
    for (let m = open; m + block <= close; m += input.slotMinutes) {
      const time = minutesToTime(m);
      const startsAt = localToUtc(input.date, time, input.timeZone);
      if (!startsAt) continue; // wall-clock time skipped by a DST change
      const endsAt = new Date(startsAt.getTime() + block * 60_000);
      const slot = { time, startsAt, endsAt };
      if (startsAt.getTime() < earliest) continue;
      if (blockers.some((b) => overlaps(slot, b))) continue;
      byStart.set(startsAt.getTime(), slot);
    }
  }
  return [...byStart.values()].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
}

/** Find the slot for a requested local time, or null when that start is not offered. */
export function findSlot(input: AvailabilityInput, time: string): Slot | null {
  return computeAvailableSlots(input).find((s) => s.time === time) ?? null;
}

/** Can an appointment starting at `startsAt` still be changed online? */
export function hasMinNotice(
  startsAt: Date,
  now: Date,
  minNoticeHours: number,
): boolean {
  return startsAt.getTime() - now.getTime() >= minNoticeHours * 36e5;
}

/** The DB-enforced double-booking key: unique while the appointment holds its slot. */
export function slotKeyFor(doctorId: string, startsAt: Date): string {
  return `${doctorId}|${startsAt.toISOString()}`;
}

/** Short weekly summary for public doctor cards, e.g. [{weekday:1, ranges:["09:00-12:00","13:00-17:00"]}]. */
export function summariseSchedule(schedules: ScheduleWindow[]) {
  const days = new Map<number, string[]>();
  for (const s of [...schedules].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  )) {
    const list = days.get(s.weekday) ?? [];
    list.push(`${s.startTime}-${s.endTime}`);
    days.set(s.weekday, list);
  }
  return [...days.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekday, ranges]) => ({ weekday, ranges }));
}
