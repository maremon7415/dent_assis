import { siteConfig } from "@/config/site";
import type { PublicDoctorDTO } from "@/lib/actions/doctors";
import type { ServiceDTO } from "@/lib/actions/services";
import { formatMoney } from "@/lib/time";

/** "Free" for zero, otherwise the clinic currency, e.g. "$95.00" -> "$95". */
export function formatPrice(cents: number) {
  if (cents === 0) return "Free";
  const whole = cents % 100 === 0;
  return whole
    ? new Intl.NumberFormat(siteConfig.clinic.locale, {
        style: "currency",
        currency: siteConfig.clinic.currency,
        maximumFractionDigits: 0,
      }).format(cents / 100)
    : formatMoney(cents);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Monday-first display order. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function weekdayShort(d: number) {
  return WEEKDAY_SHORT[d] ?? "";
}
export function weekdayLong(d: number) {
  return WEEKDAY_LONG[d] ?? "";
}

/** "09:00" -> "9:00 AM" in the clinic locale, without touching timezones (wall-clock text). */
export function formatWallTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(siteConfig.clinic.locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

export function formatRange(range: string) {
  const [a, b] = range.split("-");
  return `${formatWallTime(a)} – ${formatWallTime(b)}`;
}

/** A clinic-local "YYYY-MM-DD" as "Thursday, November 20". */
export function formatLocalDate(
  date: string,
  opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(siteConfig.clinic.locale, {
    ...opts,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, mo - 1, d, 12)));
}

/** Weekdays a dentist works, compressed: "Mon – Fri", "Mon, Wed, Fri". */
export function workingDaysLabel(schedule: PublicDoctorDTO["schedule"]) {
  const days = WEEK_ORDER.filter((d) =>
    schedule.some((s) => s.weekday === d && s.ranges.length > 0),
  );
  if (days.length === 0) return null;
  const idx = days.map((d) => WEEK_ORDER.indexOf(d));
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (contiguous && days.length >= 3) {
    return `${weekdayShort(days[0])} – ${weekdayShort(days[days.length - 1])}`;
  }
  return days.map(weekdayShort).join(", ");
}

export function groupByCategory(services: ServiceDTO[]) {
  const groups = new Map<string, ServiceDTO[]>();
  for (const s of services) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }
  return [...groups.entries()].map(([category, items]) => ({
    category,
    items,
  }));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "Dr. Amara Okafor" -> "Dr. Okafor" for compact buttons. */
export function shortDoctorName(name: string) {
  const parts = name
    .replace(/^Dr\.?\s+/i, "")
    .trim()
    .split(/\s+/);
  return `Dr. ${parts[parts.length - 1]}`;
}

export function bookingHref(params: {
  service?: string | null;
  doctor?: string | null;
}) {
  const q = new URLSearchParams();
  if (params.service) q.set("service", params.service);
  if (params.doctor) q.set("doctor", params.doctor);
  const s = q.toString();
  return s ? `/appointments?${s}` : "/appointments";
}

/**
 * Weekly hours with consecutive days that share the same ranges folded together, Monday first:
 * [{ label: "Monday – Friday", ranges: [...] }, { label: "Saturday", ranges: [] }].
 */
export function groupedHours(schedule: PublicDoctorDTO["schedule"]) {
  const rows: { key: string; label: string; ranges: string[] }[] = [];
  let run: { from: number; to: number; ranges: string[] } | null = null;
  const flush = () => {
    if (!run) return;
    const label =
      run.from === run.to
        ? weekdayLong(run.from)
        : `${weekdayLong(run.from)} – ${weekdayLong(run.to)}`;
    rows.push({ key: `${run.from}-${run.to}`, label, ranges: run.ranges });
  };
  for (const wd of WEEK_ORDER) {
    const ranges = schedule.find((s) => s.weekday === wd)?.ranges ?? [];
    if (run && run.ranges.join() === ranges.join()) {
      run.to = wd;
    } else {
      flush();
      run = { from: wd, to: wd, ranges };
    }
  }
  flush();
  return rows;
}
