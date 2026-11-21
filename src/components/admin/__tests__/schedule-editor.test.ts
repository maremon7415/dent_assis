import { describe, expect, it } from "vitest";
import { scheduleSchema } from "@/lib/validation";
import {
  END_OF_DAY,
  endTimeFromInput,
  endTimeToInput,
} from "../ScheduleEditor";

describe("schedule editor end of day", () => {
  it("shows a stored 24:00 end in a time input as 23:59", () => {
    expect(endTimeToInput("24:00")).toBe("23:59");
    expect(endTimeToInput("17:30")).toBe("17:30");
  });

  it("saves an entered 23:59 end as 24:00, which the server accepts", () => {
    const end = endTimeFromInput("23:59");
    expect(end).toBe(END_OF_DAY);
    expect(endTimeFromInput("18:00")).toBe("18:00");
    const parsed = scheduleSchema.safeParse({
      doctorId: "d1",
      windows: [{ weekday: 5, startTime: "18:00", endTime: end }],
    });
    expect(parsed.success).toBe(true);
  });
});
