import { describe, expect, it } from "vitest";
import { buildTodos } from "@/components/dashboard/TodoList";
import type { MyAppointmentsDTO } from "@/lib/actions/appointments";
import type { ProfileDTO } from "@/lib/actions/profile";
import type { AppointmentDTO } from "@/lib/dto";
import {
  addDays,
  calendarParts,
  daysBetween,
  formatDuration,
  formatPrice,
  longDayLabel,
  partOfDay,
} from "../format";
import { buildIcs } from "../ics";

function appt(over: Partial<AppointmentDTO> = {}): AppointmentDTO {
  return {
    id: "a1",
    status: "CONFIRMED",
    startsAt: "2026-11-24T09:30:00.000Z",
    endsAt: "2026-11-24T10:30:00.000Z",
    date: "2026-11-24",
    time: "09:30",
    dateLabel: "Tuesday, November 24, 2026",
    timeLabel: "9:30 AM",
    durationMinutes: 60,
    priceCents: 9500,
    reason: null,
    notes: null,
    doctor: {
      id: "d1",
      name: "Dr. Mei Lin Chen",
      speciality: "General",
      imageUrl: "",
      slug: "mei-lin-chen",
    },
    service: { id: "s1", name: "Check-up, clean; polish", slug: "checkup" },
    visitNote: null,
    review: null,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    rescheduledFromId: null,
    canCancel: true,
    canReschedule: true,
    canReview: false,
    doctorName: "Dr. Mei Lin Chen",
    doctorImageUrl: "",
    doctorId: "d1",
    ...over,
  };
}

describe("calendar helpers", () => {
  it("reads clinic-local dates as calendar values", () => {
    expect(calendarParts("2026-11-24")).toMatchObject({
      day: 24,
      weekday: "Tue",
      monthShort: "Nov",
      year: 2026,
    });
    expect(longDayLabel("2026-03-01")).toBe("Sunday, March 1");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
  });

  it("groups times into parts of the day", () => {
    expect(partOfDay("08:30")).toBe("morning");
    expect(partOfDay("12:00")).toBe("afternoon");
    expect(partOfDay("17:00")).toBe("evening");
  });

  it("formats prices and durations", () => {
    expect(formatPrice(9500)).toBe("$95");
    expect(formatPrice(9550)).toBe("$95.50");
    expect(formatPrice(0)).toBe("No charge");
    expect(formatPrice(null)).toBeNull();
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });
});

describe("buildIcs", () => {
  it("copies UTC instants and escapes text", () => {
    const ics = buildIcs(appt(), new Date("2026-11-19T12:00:00.000Z"));
    const lines = ics.split("\r\n");
    expect(lines).toContain("DTSTART:20261124T093000Z");
    expect(lines).toContain("DTEND:20261124T103000Z");
    expect(lines).toContain("DTSTAMP:20261119T120000Z");
    expect(ics).toContain(
      "SUMMARY:Check-up\\, clean\\; polish with Dr. Mei Lin Chen",
    );
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(75);
  });
});

describe("buildTodos", () => {
  const emptyProfile = {
    phone: null,
    dateOfBirth: null,
    allergies: null,
    medications: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
  } as ProfileDTO;
  const none: MyAppointmentsDTO = { upcoming: [], past: [] };

  it("asks for health details when the profile is empty", () => {
    const todos = buildTodos(none, emptyProfile);
    expect(todos.map((t) => t.key)).toEqual(["profile"]);
    expect(todos[0].title).toBe("Add your health details");
  });

  it("suggests a follow-up unless a later visit is booked", () => {
    const done = appt({
      id: "past",
      status: "COMPLETED",
      date: "2026-10-01",
      visitNote: {
        summary: "ok",
        treatment: null,
        followUpInDays: 30,
        createdAt: "",
        updatedAt: "",
      },
    });
    const withoutBooking = buildTodos(
      { upcoming: [], past: [done] },
      undefined,
    );
    expect(withoutBooking[0].key).toBe("follow-up");
    expect(withoutBooking[0].body).toContain("Saturday, October 31");
    const booked = buildTodos({ upcoming: [appt()], past: [done] }, undefined);
    expect(booked.find((t) => t.key === "follow-up")).toBeUndefined();
  });

  it("asks for reviews of completed visits", () => {
    const todos = buildTodos(
      { upcoming: [], past: [appt({ status: "COMPLETED", canReview: true })] },
      undefined,
    );
    expect(todos.map((t) => t.key)).toEqual(["review"]);
  });
});
