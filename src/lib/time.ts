/**
 * Clinic-timezone helpers. Pure (no I/O), built on Intl so they work in Node, edge and tests alike.
 *
 * Vocabulary:
 * - "local date"  = clinic calendar day, "YYYY-MM-DD"
 * - "local time"  = clinic wall-clock time, "HH:mm"
 * - "instant"     = a JS Date (always a UTC instant)
 */
import { siteConfig } from "@/config/site";

export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function clinicTimeZone(): string {
  return siteConfig.clinic.timezone;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(tz: string) {
  let f = partsFormatterCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "short",
    });
    partsFormatterCache.set(tz, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

/** Wall-clock parts of an instant in a timezone. */
export function zonedParts(
  instant: Date,
  tz: string = clinicTimeZone(),
): ZonedParts {
  const parts: Record<string, string> = {};
  for (const p of partsFormatter(tz).formatToParts(instant))
    parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday] ?? 0,
  };
}

/** Offset of `tz` from UTC at `instant`, in milliseconds (e.g. +6h for Asia/Dhaka). */
export function tzOffsetMs(
  instant: Date,
  tz: string = clinicTimeZone(),
): number {
  const p = zonedParts(instant, tz);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Parse "YYYY-MM-DD" strictly (rejects 2026-02-30). */
export function parseLocalDate(
  date: string,
): { year: number; month: number; day: number } | null {
  if (!DATE_RE.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** "HH:mm" -> minutes after midnight. Accepts "24:00" as end-of-day. */
export function timeToMinutes(time: string): number {
  if (time === "24:00") return 24 * 60;
  if (!TIME_RE.test(time)) throw new RangeError(`Invalid time "${time}"`);
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/**
 * Clinic-local date + time -> UTC instant.
 * Returns null when the wall-clock time does not exist in that zone (spring-forward DST gap) or the
 * input is malformed. For ambiguous times (fall-back) the earlier instant is returned.
 */
export function localToUtc(
  date: string,
  time: string,
  tz: string = clinicTimeZone(),
): Date | null {
  const d = parseLocalDate(date);
  if (!d || !TIME_RE.test(time)) return null;
  const [hour, minute] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(d.year, d.month - 1, d.day, hour, minute);

  // Try both offsets around the wall time; pick candidates that round-trip to the same wall clock.
  const candidates = new Set<number>();
  for (const probe of [
    wallAsUtc - 36e5 * 14,
    wallAsUtc,
    wallAsUtc + 36e5 * 14,
  ]) {
    candidates.add(wallAsUtc - tzOffsetMs(new Date(probe), tz));
  }
  const valid = [...candidates]
    .filter((ms) => {
      const p = zonedParts(new Date(ms), tz);
      return (
        p.year === d.year &&
        p.month === d.month &&
        p.day === d.day &&
        p.hour === hour &&
        p.minute === minute
      );
    })
    .sort((a, b) => a - b);
  return valid.length ? new Date(valid[0]) : null;
}

/** UTC instant -> clinic-local "YYYY-MM-DD". */
export function toLocalDate(
  instant: Date,
  tz: string = clinicTimeZone(),
): string {
  const p = zonedParts(instant, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** UTC instant -> clinic-local "HH:mm". */
export function toLocalTime(
  instant: Date,
  tz: string = clinicTimeZone(),
): string {
  const p = zonedParts(instant, tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Today's date in the clinic timezone. */
export function todayInClinic(
  now: Date = new Date(),
  tz: string = clinicTimeZone(),
): string {
  return toLocalDate(now, tz);
}

/** Add whole calendar days to a "YYYY-MM-DD" string. */
export function addDaysToLocalDate(date: string, days: number): string {
  const d = parseLocalDate(date);
  if (!d) throw new RangeError(`Invalid date "${date}"`);
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Day of week (0 = Sunday) of a calendar date; independent of timezone. */
export function weekdayOfLocalDate(date: string): number {
  const d = parseLocalDate(date);
  if (!d) throw new RangeError(`Invalid date "${date}"`);
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

/** Calendar day stored in the legacy `Appointment.date` column (UTC midnight of the local date). */
export function legacyDateColumn(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * The UTC range [start, end) covering one clinic-local calendar day (23 or 25 hours on DST days).
 */
export function localDayRange(
  date: string,
  tz: string = clinicTimeZone(),
): { start: Date; end: Date } {
  const startOf = (d: string) => {
    // midnight may not exist on some DST days (e.g. America/Santiago); walk forward to the first valid minute
    for (let m = 0; m < 180; m += 15) {
      const t = localToUtc(d, minutesToTime(m), tz);
      if (t) return t;
    }
    throw new RangeError(`Cannot resolve start of day ${d} in ${tz}`);
  };
  return { start: startOf(date), end: startOf(addDaysToLocalDate(date, 1)) };
}

/** Human formatting in the clinic timezone, e.g. "Monday, March 9, 2026" and "2:30 PM". */
export function formatClinicDate(
  instant: Date,
  tz: string = clinicTimeZone(),
  locale: string = siteConfig.clinic.locale,
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(instant);
}

export function formatClinicTime(
  instant: Date,
  tz: string = clinicTimeZone(),
  locale: string = siteConfig.clinic.locale,
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(instant);
}

export function formatMoney(
  cents: number,
  currency: string = siteConfig.clinic.currency,
  locale: string = siteConfig.clinic.locale,
) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100,
  );
}

/** Legacy rows have no startsAt: derive it from date (UTC midnight of local day) + time. */
export function legacyStartsAt(
  date: Date,
  time: string,
  tz: string = clinicTimeZone(),
): Date | null {
  return localToUtc(date.toISOString().slice(0, 10), time, tz);
}
