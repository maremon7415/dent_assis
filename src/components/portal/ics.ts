/**
 * Builds an iCalendar (.ics) file for one appointment from its UTC instants, so the patient's calendar
 * app shows it in their own timezone. Instants are copied as UTC; nothing is formatted in the browser.
 */
import { siteConfig } from "@/config/site";
import type { AppointmentDTO } from "@/lib/dto";
import { visitTitle } from "./format";

function icsStamp(iso: string): string {
  // 2026-11-24T09:30:00.000Z -> 20261124T093000Z
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** RFC 5545: lines longer than 75 octets are folded with CRLF + space. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export type IcsAppointment = Pick<
  AppointmentDTO,
  "id" | "startsAt" | "endsAt" | "service" | "reason" | "doctor"
>;

export function buildIcs(a: IcsAppointment, now: Date = new Date()): string {
  const title = `${visitTitle(a)} with ${a.doctor.name}`;
  const description = `${siteConfig.name} visit. To change it, open My visits in the patient portal or call ${siteConfig.phone}.`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteConfig.name}//Patient portal//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${a.id}@${siteConfig.name.toLowerCase()}`,
    `DTSTAMP:${icsStamp(now.toISOString())}`,
    `DTSTART:${icsStamp(a.startsAt)}`,
    `DTEND:${icsStamp(a.endsAt)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `LOCATION:${escapeText(`${siteConfig.name}, ${siteConfig.address}`)}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function downloadIcs(a: IcsAppointment): void {
  const blob = new Blob([buildIcs(a)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${siteConfig.name.toLowerCase()}-visit-${a.startsAt.slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
