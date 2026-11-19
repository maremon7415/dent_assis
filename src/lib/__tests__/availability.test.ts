import { describe, expect, it } from "vitest";
import {
  type AvailabilityInput,
  blockMinutes,
  checkBookableDate,
  computeAvailableSlots,
  hasMinNotice,
  overlaps,
  slotKeyFor,
  summariseSchedule,
} from "../availability";
import { localToUtc } from "../time";

const UTC = "UTC";
// Monday 2026-03-16; "now" is the previous Friday so min notice never interferes unless a test wants it.
const MONDAY = "2026-03-16";
const FRIDAY_BEFORE = new Date("2026-03-13T12:00:00Z");

function input(over: Partial<AvailabilityInput> = {}): AvailabilityInput {
  return {
    timeZone: UTC,
    slotMinutes: 30,
    minNoticeHours: 2,
    bookingWindowDays: 30,
    date: MONDAY,
    durationMinutes: 30,
    schedules: [{ weekday: 1, startTime: "09:00", endTime: "12:00" }],
    timeOff: [],
    busy: [],
    now: FRIDAY_BEFORE,
    ...over,
  };
}

const at = (date: string, time: string, tz = UTC) =>
  localToUtc(date, time, tz) as Date;
const times = (i: AvailabilityInput) =>
  computeAvailableSlots(i).map((s) => s.time);

describe("overlaps", () => {
  const iv = (a: string, b: string) => ({
    startsAt: at(MONDAY, a),
    endsAt: at(MONDAY, b),
  });
  it("treats touching intervals as free", () => {
    expect(overlaps(iv("09:00", "09:30"), iv("09:30", "10:00"))).toBe(false);
  });
  it("detects partial and full containment", () => {
    expect(overlaps(iv("09:00", "10:00"), iv("09:30", "09:45"))).toBe(true);
    expect(overlaps(iv("09:15", "09:45"), iv("09:00", "10:00"))).toBe(true);
  });
});

describe("computeAvailableSlots", () => {
  it("offers every slot start on the grid inside the working window", () => {
    expect(times(input())).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
  });

  it("returns nothing on a day without a schedule", () => {
    expect(times(input({ date: "2026-03-17" }))).toEqual([]); // Tuesday
  });

  it("rounds duration up to whole slots and keeps the full block inside the window", () => {
    expect(blockMinutes(45, 30)).toBe(60);
    const slots = computeAvailableSlots(input({ durationMinutes: 45 }));
    expect(slots.map((s) => s.time)).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
    ]);
    expect(slots.at(-1)?.endsAt.toISOString()).toBe("2026-03-16T12:00:00.000Z");
  });

  it("blocks every start whose block overlaps an existing appointment of a different length", () => {
    // existing 60-minute appointment 10:00-11:00; we want 60 minutes
    const busy = [
      { startsAt: at(MONDAY, "10:00"), endsAt: at(MONDAY, "11:00") },
    ];
    expect(times(input({ durationMinutes: 60, busy }))).toEqual([
      "09:00",
      "11:00",
    ]);
    // a 30-minute request can sit right before and right after it
    expect(times(input({ busy }))).toEqual([
      "09:00",
      "09:30",
      "11:00",
      "11:30",
    ]);
  });

  it("respects lunch gaps between windows and never straddles them", () => {
    const schedules = [
      { weekday: 1, startTime: "09:00", endTime: "12:00" },
      { weekday: 1, startTime: "13:00", endTime: "15:00" },
    ];
    expect(times(input({ schedules, durationMinutes: 90 }))).toEqual([
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "13:00",
      "13:30",
    ]);
  });

  it("removes slots covered by time off", () => {
    const timeOff = [
      { startsAt: at(MONDAY, "09:45"), endsAt: at(MONDAY, "11:15") },
    ];
    expect(times(input({ timeOff }))).toEqual(["09:00", "11:30"]);
  });

  it("enforces minimum notice from now", () => {
    const now = at(MONDAY, "08:15");
    expect(times(input({ now }))).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("refuses past dates and dates beyond the booking window", () => {
    expect(times(input({ date: "2026-03-09" }))).toEqual([]);
    expect(
      checkBookableDate("2026-03-09", FRIDAY_BEFORE, {
        timeZone: UTC,
        bookingWindowDays: 30,
      }),
    ).toEqual({ ok: false, reason: "PAST_DATE" });
    expect(
      checkBookableDate("2026-04-13", FRIDAY_BEFORE, {
        timeZone: UTC,
        bookingWindowDays: 30,
      }),
    ).toEqual({ ok: false, reason: "OUTSIDE_WINDOW" });
    expect(
      checkBookableDate("2026-04-12", FRIDAY_BEFORE, {
        timeZone: UTC,
        bookingWindowDays: 30,
      }).ok,
    ).toBe(true);
    expect(
      checkBookableDate("2026-02-30", FRIDAY_BEFORE, {
        timeZone: UTC,
        bookingWindowDays: 30,
      }),
    ).toEqual({ ok: false, reason: "INVALID_DATE" });
  });

  it("de-duplicates overlapping schedule windows", () => {
    const schedules = [
      { weekday: 1, startTime: "09:00", endTime: "10:00" },
      { weekday: 1, startTime: "09:30", endTime: "10:30" },
    ];
    expect(times(input({ schedules }))).toEqual(["09:00", "09:30", "10:00"]);
  });
});

describe("computeAvailableSlots in real clinic time zones", () => {
  it("Asia/Dhaka: local 09:00 is 03:00Z and the booking window uses Dhaka's today", () => {
    // 20:00Z on Sunday is already Monday 02:00 in Dhaka, so Monday 09:00 (7h away) is bookable with 2h notice
    const now = new Date("2026-03-15T20:00:00Z");
    const slots = computeAvailableSlots(input({ timeZone: "Asia/Dhaka", now }));
    expect(slots[0].time).toBe("09:00");
    expect(slots[0].startsAt.toISOString()).toBe("2026-03-16T03:00:00.000Z");
    // but at 02:00Z Monday (08:00 Dhaka) the 09:00 and 09:30 slots fall inside the 2h notice
    const later = computeAvailableSlots(
      input({ timeZone: "Asia/Dhaka", now: new Date("2026-03-16T02:00:00Z") }),
    );
    expect(later[0].time).toBe("10:00");
  });

  it("America/New_York spring-forward: skipped wall times are never offered", () => {
    // Sunday 2026-03-08: 02:00-02:59 does not exist
    const now = new Date("2026-03-01T12:00:00Z");
    const slots = computeAvailableSlots(
      input({
        timeZone: "America/New_York",
        date: "2026-03-08",
        now,
        schedules: [{ weekday: 0, startTime: "01:00", endTime: "04:00" }],
      }),
    );
    expect(slots.map((s) => s.time)).toEqual([
      "01:00",
      "01:30",
      "03:00",
      "03:30",
    ]);
    // 01:30 EST + 30 real minutes = 03:00 EDT
    expect(slots[1].endsAt.toISOString()).toBe(slots[2].startsAt.toISOString());
  });

  it("America/New_York fall-back: the repeated hour is offered once and blocks are real durations", () => {
    const now = new Date("2026-10-25T12:00:00Z");
    const slots = computeAvailableSlots(
      input({
        timeZone: "America/New_York",
        date: "2026-11-01",
        now,
        schedules: [{ weekday: 0, startTime: "00:00", endTime: "03:00" }],
      }),
    );
    expect(slots.map((s) => s.time)).toEqual([
      "00:00",
      "00:30",
      "01:00",
      "01:30",
      "02:00",
      "02:30",
    ]);
    expect(new Set(slots.map((s) => s.startsAt.getTime())).size).toBe(
      slots.length,
    );
    expect(slots[2].startsAt.toISOString()).toBe("2026-11-01T05:00:00.000Z"); // first 01:00 (EDT)
  });

  it("New York summer vs winter: the same wall time maps to different UTC instants", () => {
    const winter = computeAvailableSlots(
      input({
        timeZone: "America/New_York",
        date: "2026-01-12",
        now: new Date("2026-01-01T00:00:00Z"),
      }),
    );
    const summer = computeAvailableSlots(
      input({
        timeZone: "America/New_York",
        date: "2026-07-13",
        now: new Date("2026-07-01T00:00:00Z"),
      }),
    );
    expect(winter[0].startsAt.toISOString()).toBe("2026-01-12T14:00:00.000Z");
    expect(summer[0].startsAt.toISOString()).toBe("2026-07-13T13:00:00.000Z");
  });
});

describe("helpers", () => {
  it("min notice", () => {
    const start = new Date("2026-03-16T10:00:00Z");
    expect(hasMinNotice(start, new Date("2026-03-16T08:00:00Z"), 2)).toBe(true);
    expect(hasMinNotice(start, new Date("2026-03-16T08:00:01Z"), 2)).toBe(
      false,
    );
  });

  it("slot key is doctor + UTC instant", () => {
    expect(slotKeyFor("doc1", new Date("2026-03-16T10:00:00Z"))).toBe(
      "doc1|2026-03-16T10:00:00.000Z",
    );
  });

  it("summarises schedules per weekday in order", () => {
    expect(
      summariseSchedule([
        { weekday: 2, startTime: "13:00", endTime: "17:00" },
        { weekday: 2, startTime: "09:00", endTime: "12:00" },
        { weekday: 1, startTime: "09:00", endTime: "17:00" },
      ]),
    ).toEqual([
      { weekday: 1, ranges: ["09:00-17:00"] },
      { weekday: 2, ranges: ["09:00-12:00", "13:00-17:00"] },
    ]);
  });
});
