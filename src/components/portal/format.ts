/**
 * Client-safe presentation helpers for the patient portal.
 * Appointment dates arrive from the server already in clinic-local form ("YYYY-MM-DD", "HH:mm");
 * these helpers only read those strings as calendar values and never convert an instant.
 */

import { siteConfig } from "@/config/site";
import type { AppointmentDTO } from "@/lib/dto";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface CalendarParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
  weekdayLong: string;
  monthShort: string;
  monthLong: string;
}

/** Split a clinic-local "YYYY-MM-DD" into display parts (pure calendar arithmetic). */
export function calendarParts(date: string): CalendarParts {
  const [year, month, day] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return {
    year,
    month,
    day,
    weekday: WEEKDAYS[wd],
    weekdayLong: WEEKDAYS_LONG[wd],
    monthShort: MONTHS[month - 1],
    monthLong: MONTHS_LONG[month - 1],
  };
}

/** "Tuesday, November 24" from a clinic-local date string. */
export function longDayLabel(date: string): string {
  const p = calendarParts(date);
  return `${p.weekdayLong}, ${p.monthLong} ${p.day}`;
}

/** Part of the day for a clinic-local "HH:mm". */
export function partOfDay(time: string): "morning" | "afternoon" | "evening" {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function formatPrice(cents: number | null | undefined): string | null {
  if (cents === null || cents === undefined) return null;
  if (cents === 0) return "No charge";
  return new Intl.NumberFormat(siteConfig.clinic.locale, {
    style: "currency",
    currency: siteConfig.clinic.currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Whole days from clinic-local date a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000,
  );
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** What the visit was for: the service, else the free-text reason. */
export function visitTitle(a: Pick<AppointmentDTO, "service" | "reason">) {
  return a.service?.name ?? a.reason ?? "Dental visit";
}

export type StatusTone = "success" | "warning" | "info" | "muted" | "danger";

export const STATUS_META: Record<
  AppointmentDTO["status"],
  { label: string; tone: StatusTone }
> = {
  CONFIRMED: { label: "Confirmed", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  NO_SHOW: { label: "Missed", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "muted" },
};
