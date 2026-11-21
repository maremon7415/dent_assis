"use client";

import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  HeartPulse,
  type LucideIcon,
  Star,
} from "lucide-react";
import Link from "next/link";
import { addDays, longDayLabel } from "@/components/portal/format";
import { bookAgainHref } from "@/components/portal/visits/VisitCard";
import type { MyAppointmentsDTO } from "@/lib/actions/appointments";
import type { ProfileDTO } from "@/lib/actions/profile";

type Todo = {
  key: string;
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  cta: string;
};

const PROFILE_FIELDS: ReadonlyArray<{
  label: string;
  filled: (p: ProfileDTO) => boolean;
}> = [
  { label: "phone", filled: (p) => !!p.phone },
  { label: "date of birth", filled: (p) => !!p.dateOfBirth },
  { label: "allergies", filled: (p) => p.allergies !== null },
  { label: "medications", filled: (p) => p.medications !== null },
  {
    label: "emergency contact",
    filled: (p) => !!p.emergencyContactName && !!p.emergencyContactPhone,
  },
];

/** What the patient should do next, derived only from their own data. */
export function buildTodos(
  visits: MyAppointmentsDTO,
  profile: ProfileDTO | undefined,
): Todo[] {
  const todos: Todo[] = [];

  const lastWithFollowUp = visits.past.find(
    (a) => a.status === "COMPLETED" && a.visitNote?.followUpInDays,
  );
  if (lastWithFollowUp?.visitNote?.followUpInDays) {
    const due = addDays(
      lastWithFollowUp.date,
      lastWithFollowUp.visitNote.followUpInDays,
    );
    // A visit booked after the one that asked for a follow-up counts as booked.
    const booked = visits.upcoming.some((a) => a.date > lastWithFollowUp.date);
    if (!booked)
      todos.push({
        key: "follow-up",
        icon: CalendarClock,
        title: "Book your follow-up",
        body: `${lastWithFollowUp.doctor.name} advised a follow-up around ${longDayLabel(due)}.`,
        href: bookAgainHref(lastWithFollowUp),
        cta: "Book follow-up",
      });
  }

  if (profile) {
    const missing = PROFILE_FIELDS.filter((f) => !f.filled(profile));
    if (missing.length > 0)
      todos.push({
        key: "profile",
        icon: HeartPulse,
        title:
          missing.length === PROFILE_FIELDS.length
            ? "Add your health details"
            : "Finish your health details",
        body:
          missing.length === PROFILE_FIELDS.length
            ? "Allergies, medications and an emergency contact help your dentist treat you safely."
            : `Still missing: ${missing.map((m) => m.label).join(", ")}.`,
        href: "/profile",
        cta: "Open health profile",
      });
  }

  const toReview = visits.past.filter((a) => a.canReview);
  if (toReview.length > 0)
    todos.push({
      key: "review",
      icon: Star,
      title:
        toReview.length === 1
          ? `Review your visit with ${toReview[0].doctor.name}`
          : `Review ${toReview.length} recent visits`,
      body: "A few words help other patients choose, and help the clinic improve.",
      href: "/visits?tab=past",
      cta: "Leave a review",
    });

  return todos;
}

export function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <section
      aria-labelledby="todo-title"
      className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-xs sm:p-6"
    >
      <h2 id="todo-title" className="font-display text-xl text-foreground">
        To do
      </h2>
      {todos.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-2 py-6">
          <CheckCircle2 className="size-6 text-success" aria-hidden />
          <p className="font-medium text-foreground">You're all set</p>
          <p className="text-sm text-muted-foreground">
            Nothing needs your attention right now.
          </p>
        </div>
      ) : (
        <ul className="mt-3 divide-y">
          {todos.map((t) => (
            <li key={t.key}>
              <Link
                href={t.href}
                className="focus-ring group -mx-2 flex items-start gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-accent/40"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <t.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {t.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                    {t.body}
                  </span>
                  <span className="sr-only">{t.cta}</span>
                </span>
                <ChevronRight
                  className="mt-2 size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
