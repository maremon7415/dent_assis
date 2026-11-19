"use client";

import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminSetDoctorSchedule } from "@/hooks/use-admin";
import type { AdminDoctorDTO } from "@/lib/actions/admin";
import { errorMessage, Panel, WEEK_ORDER, WEEKDAYS } from "./shared";

type Win = { key: string; weekday: number; startTime: string; endTime: string };

let counter = 0;
const nextKey = () => `w${++counter}`;

function fromDoctor(d: AdminDoctorDTO): Win[] {
  return d.schedules.map((s) => ({
    key: nextKey(),
    weekday: s.weekday,
    startTime: s.startTime,
    endTime: s.endTime,
  }));
}

const signature = (
  ws: { weekday: number; startTime: string; endTime: string }[],
) =>
  JSON.stringify(
    [...ws]
      .map((w) => [w.weekday, w.startTime, w.endTime] as const)
      .sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])),
  );

/** Returns a message per window key; empty when the whole week is valid. */
function validate(ws: Win[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const w of ws) {
    if (!w.startTime || !w.endTime) out[w.key] = "Set both times";
    else if (w.startTime >= w.endTime) out[w.key] = "End must be after start";
  }
  for (const a of ws)
    for (const b of ws)
      if (
        a !== b &&
        !out[a.key] &&
        !out[b.key] &&
        a.weekday === b.weekday &&
        a.startTime < b.endTime &&
        b.startTime < a.endTime
      )
        out[a.key] = "Overlaps another window on this day";
  return out;
}

export function ScheduleEditor({ doctor }: { doctor: AdminDoctorDTO }) {
  const serverSig = useMemo(
    () => signature(doctor.schedules),
    [doctor.schedules],
  );
  const [wins, setWins] = useState<Win[]>(() => fromDoctor(doctor));
  const save = useAdminSetDoctorSchedule();

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-seed the draft only when the saved schedule changes
  useEffect(() => setWins(fromDoctor(doctor)), [serverSig]);

  const errors = useMemo(() => validate(wins), [wins]);
  const dirty = signature(wins) !== serverSig;
  const invalid = Object.keys(errors).length > 0;

  const patch = (key: string, p: Partial<Win>) =>
    setWins((ws) => ws.map((w) => (w.key === key ? { ...w, ...p } : w)));
  const remove = (key: string) =>
    setWins((ws) => ws.filter((w) => w.key !== key));
  const add = (weekday: number) =>
    setWins((ws) => {
      const last = ws
        .filter((w) => w.weekday === weekday)
        .sort((a, b) => a.endTime.localeCompare(b.endTime))
        .at(-1);
      const start = last && last.endTime < "17:00" ? last.endTime : "09:00";
      return [
        ...ws,
        {
          key: nextKey(),
          weekday,
          startTime: start,
          endTime: start < "17:00" ? "17:00" : "18:00",
        },
      ];
    });
  const copyMondayToWeekdays = () =>
    setWins((ws) => {
      const monday = ws.filter((w) => w.weekday === 1);
      return [
        ...ws.filter((w) => ![2, 3, 4, 5].includes(w.weekday)),
        ...[2, 3, 4, 5].flatMap((wd) =>
          monday.map((m) => ({ ...m, key: nextKey(), weekday: wd })),
        ),
      ];
    });

  async function onSave() {
    try {
      await save.mutateAsync({
        doctorId: doctor.id,
        windows: wins.map(({ weekday, startTime, endTime }) => ({
          weekday,
          startTime,
          endTime,
        })),
      });
      toast.success("Weekly schedule saved");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <Panel
      title="Weekly schedule"
      description="Working windows in clinic time. Add two windows on a day for a lunch gap. Existing appointments are not changed."
    >
      <ul className="divide-y">
        {WEEK_ORDER.map((weekday) => {
          const dayWins = wins
            .filter((w) => w.weekday === weekday)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <li
              key={weekday}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4"
            >
              <p className="w-28 shrink-0 pt-1.5 text-sm font-medium">
                {WEEKDAYS[weekday]}
              </p>
              <div className="min-w-0 flex-1 space-y-2">
                {dayWins.length === 0 ? (
                  <p className="pt-1.5 text-sm text-muted-foreground">Closed</p>
                ) : (
                  dayWins.map((w) => (
                    <div key={w.key}>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          step={900}
                          value={w.startTime}
                          onChange={(e) =>
                            patch(w.key, { startTime: e.target.value })
                          }
                          aria-label={`${WEEKDAYS[weekday]} start`}
                          aria-invalid={!!errors[w.key]}
                          className="w-28 sm:w-32"
                        />
                        <span className="text-muted-foreground" aria-hidden>
                          to
                        </span>
                        <Input
                          type="time"
                          step={900}
                          value={w.endTime}
                          onChange={(e) =>
                            patch(w.key, { endTime: e.target.value })
                          }
                          aria-label={`${WEEKDAYS[weekday]} end`}
                          aria-invalid={!!errors[w.key]}
                          className="w-28 sm:w-32"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(w.key)}
                          aria-label={`Remove ${WEEKDAYS[weekday]} window ${w.startTime} to ${w.endTime}`}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                      {errors[w.key] ? (
                        <p
                          className="mt-1 text-xs text-destructive"
                          role="alert"
                        >
                          {errors[w.key]}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {weekday === 1 && dayWins.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyMondayToWeekdays}
                  >
                    <Copy aria-hidden />
                    Copy to Tue-Fri
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => add(weekday)}
                >
                  <Plus aria-hidden />
                  Add window
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        {dirty ? (
          <p
            className="mr-auto text-sm text-muted-foreground"
            aria-live="polite"
          >
            Unsaved changes
          </p>
        ) : null}
        <Button
          variant="outline"
          disabled={!dirty || save.isPending}
          onClick={() => setWins(fromDoctor(doctor))}
        >
          Discard
        </Button>
        <Button disabled={!dirty || invalid || save.isPending} onClick={onSave}>
          {save.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : null}
          Save schedule
        </Button>
      </div>
    </Panel>
  );
}
