import { describe, expect, it } from "vitest";
import { crescentPath } from "../Crescent";
import { FAQ_GROUPS, faqJsonLd } from "../faq";
import {
  bookingHref,
  formatDuration,
  formatLocalDate,
  formatPrice,
  formatRange,
  shortDoctorName,
  workingDaysLabel,
} from "../format";

describe("marketing format helpers", () => {
  it("formats prices in the clinic currency and calls zero free", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(9500)).toBe("$95");
    expect(formatPrice(9550)).toBe("$95.50");
  });

  it("formats durations", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  it("formats local dates and wall-clock ranges without shifting days", () => {
    expect(formatLocalDate("2026-11-20")).toBe("Friday, November 20");
    expect(formatRange("08:30-12:30")).toBe("8:30 AM – 12:30 PM");
  });

  it("summarises working days Monday first", () => {
    const wk = (days: number[]) =>
      days.map((weekday) => ({ weekday, ranges: ["09:00-17:00"] }));
    expect(workingDaysLabel(wk([1, 2, 3, 4, 5]))).toBe("Mon – Fri");
    expect(workingDaysLabel(wk([1, 3, 6]))).toBe("Mon, Wed, Sat");
    expect(workingDaysLabel(wk([0, 1]))).toBe("Mon, Sun");
    expect(workingDaysLabel([])).toBeNull();
  });

  it("builds booking links only from present params", () => {
    expect(bookingHref({})).toBe("/appointments");
    expect(bookingHref({ doctor: null, service: "checkup-and-clean" })).toBe(
      "/appointments?service=checkup-and-clean",
    );
    expect(bookingHref({ doctor: "amara-okafor", service: "x" })).toBe(
      "/appointments?service=x&doctor=amara-okafor",
    );
    expect(shortDoctorName("Dr. Mei Lin Chen")).toBe("Dr. Chen");
  });
});

describe("crescent geometry", () => {
  it("draws a closed path for every phase and a full disc at 1", () => {
    for (const p of [0.05, 0.3, 0.5, 0.7, 1]) {
      expect(crescentPath(p)).toMatch(/^M.*Z$/);
    }
    // crescent bows toward the lit side (sweep 0), gibbous away (sweep 1)
    expect(crescentPath(0.2)).toContain("0 0 0 50 0Z");
    expect(crescentPath(0.8)).toContain("0 0 1 50 0Z");
  });
});

describe("FAQ structured data", () => {
  it("emits one Question per FAQ with its answer", () => {
    const items = FAQ_GROUPS.flatMap((g) => g.items);
    const ld = faqJsonLd(items);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(items.length);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe("groupedHours", () => {
  it("folds consecutive days with the same hours", async () => {
    const { groupedHours } = await import("../format");
    const day = (weekday: number, ranges: string[]) => ({ weekday, ranges });
    const rows = groupedHours([
      day(1, ["08:30-12:30", "13:30-17:00"]),
      day(2, ["08:30-12:30", "13:30-17:00"]),
      day(3, ["10:00-18:00"]),
      day(6, ["09:00-13:00"]),
    ]);
    expect(rows.map((r) => r.label)).toEqual([
      "Monday – Tuesday",
      "Wednesday",
      "Thursday – Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(rows[3].ranges).toEqual(["09:00-13:00"]);
    expect(rows[4].ranges).toEqual([]);
  });
});
