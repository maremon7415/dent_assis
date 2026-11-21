import { describe, expect, it } from "vitest";
import {
  addDaysToLocalDate,
  localDayRange,
  localToUtc,
  parseLocalDate,
  timeToMinutes,
  todayInClinic,
  toLocalDate,
  toLocalTime,
  weekdayOfLocalDate,
} from "../time";

const NY = "America/New_York";
const DHAKA = "Asia/Dhaka";

describe("localToUtc", () => {
  it("converts a fixed-offset zone (Asia/Dhaka, UTC+6, no DST)", () => {
    expect(localToUtc("2026-03-10", "09:00", DHAKA)?.toISOString()).toBe(
      "2026-03-10T03:00:00.000Z",
    );
    // early morning local is the previous UTC day
    expect(localToUtc("2026-03-10", "02:30", DHAKA)?.toISOString()).toBe(
      "2026-03-09T20:30:00.000Z",
    );
  });

  it("uses EST in winter and EDT in summer for New York", () => {
    expect(localToUtc("2026-01-15", "09:00", NY)?.toISOString()).toBe(
      "2026-01-15T14:00:00.000Z",
    );
    expect(localToUtc("2026-07-15", "09:00", NY)?.toISOString()).toBe(
      "2026-07-15T13:00:00.000Z",
    );
  });

  it("returns null for a wall time skipped by spring-forward (2026-03-08 02:30 NY)", () => {
    expect(localToUtc("2026-03-08", "02:30", NY)).toBeNull();
    expect(localToUtc("2026-03-08", "03:00", NY)?.toISOString()).toBe(
      "2026-03-08T07:00:00.000Z",
    );
    expect(localToUtc("2026-03-08", "01:59", NY)?.toISOString()).toBe(
      "2026-03-08T06:59:00.000Z",
    );
  });

  it("picks the earlier instant for an ambiguous fall-back time (2026-11-01 01:30 NY)", () => {
    expect(localToUtc("2026-11-01", "01:30", NY)?.toISOString()).toBe(
      "2026-11-01T05:30:00.000Z",
    );
  });

  it("rejects malformed and impossible input", () => {
    expect(localToUtc("2026-02-30", "09:00", NY)).toBeNull();
    expect(localToUtc("2026-02-10", "24:00", NY)).toBeNull();
    expect(localToUtc("2026-2-10", "09:00", NY)).toBeNull();
  });

  it("round-trips through toLocalDate/toLocalTime", () => {
    for (const tz of [NY, DHAKA, "UTC", "Australia/Lord_Howe"]) {
      const t = localToUtc("2026-06-01", "16:45", tz) as Date;
      expect(toLocalDate(t, tz)).toBe("2026-06-01");
      expect(toLocalTime(t, tz)).toBe("16:45");
    }
  });
});

describe("calendar helpers", () => {
  it("validates real dates", () => {
    expect(parseLocalDate("2028-02-29")).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
    expect(parseLocalDate("2027-02-29")).toBeNull();
  });

  it("adds days across month and year ends", () => {
    expect(addDaysToLocalDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToLocalDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("knows the weekday of a calendar date regardless of zone", () => {
    expect(weekdayOfLocalDate("2026-11-19")).toBe(4); // Thursday
    expect(weekdayOfLocalDate("2026-11-22")).toBe(0); // Sunday
  });

  it("finds today in the clinic zone, not the server's", () => {
    const instant = new Date("2026-03-10T20:30:00Z");
    expect(todayInClinic(instant, DHAKA)).toBe("2026-03-11"); // 02:30 next day in Dhaka
    expect(todayInClinic(instant, NY)).toBe("2026-03-10");
  });

  it("gives 23h and 25h days on DST changes", () => {
    const spring = localDayRange("2026-03-08", NY);
    const fall = localDayRange("2026-11-01", NY);
    expect((spring.end.getTime() - spring.start.getTime()) / 36e5).toBe(23);
    expect((fall.end.getTime() - fall.start.getTime()) / 36e5).toBe(25);
  });

  it("parses times", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("24:00")).toBe(1440);
    expect(() => timeToMinutes("9:00")).toThrow();
  });
});
