import type { Appointment } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { toAppointmentDTO } from "../dto";

function row(overrides: Partial<Appointment> = {}) {
  const startsAt = new Date("2030-03-04T09:00:00Z");
  // A 45-minute service holds a 60-minute block on a 30-minute grid.
  const endsAt = new Date("2030-03-04T10:00:00Z");
  return {
    id: "a1",
    date: new Date("2030-03-04T00:00:00Z"),
    time: "09:00",
    duration: 60,
    startsAt,
    endsAt,
    status: "CONFIRMED",
    notes: null,
    reason: null,
    priceCents: 9500,
    slotKey: "d1|2030-03-04T09:00:00.000Z",
    reminderSent24h: false,
    reminderSent1Hour: false,
    cancelledAt: null,
    cancelReason: null,
    cancelledBy: null,
    rescheduledFromId: null,
    createdAt: startsAt,
    updatedAt: startsAt,
    userId: "u1",
    doctorId: "d1",
    serviceId: "s1",
    ...overrides,
    doctor: {
      id: "d1",
      name: "Dr. A",
      speciality: "General",
      imageUrl: "/a.svg",
      slug: "a",
    },
  } as Appointment & {
    doctor: {
      id: string;
      name: string;
      speciality: string;
      imageUrl: string;
      slug: string;
    };
  };
}

describe("toAppointmentDTO duration", () => {
  const now = new Date("2030-03-01T00:00:00Z");

  it("shows the service's own duration, not the slot-rounded block", () => {
    const dto = toAppointmentDTO(
      {
        ...row(),
        service: {
          id: "s1",
          name: "Check-up",
          slug: "check-up",
          durationMinutes: 45,
        },
      },
      now,
    );
    expect(dto.durationMinutes).toBe(45);
    // The stored interval (what blocks the diary) is unchanged.
    expect(dto.endsAt).toBe("2030-03-04T10:00:00.000Z");
  });

  it("falls back to the stored interval when there is no service", () => {
    const dto = toAppointmentDTO(
      { ...row({ serviceId: null }), service: null },
      now,
    );
    expect(dto.durationMinutes).toBe(60);
  });
});
