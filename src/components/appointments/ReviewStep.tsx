"use client";

import { CalendarCheck2, Mail, TriangleAlert } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import {
  AppointmentSlip,
  type SlipData,
} from "@/components/portal/AppointmentSlip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";

export const REVIEW_FORM_ID = "booking-review";
const NOTE_MAX = 1000;

export function ReviewStep({
  slip,
  slipAside,
  email,
  note,
  onNoteChange,
  noteError,
  error,
  onSubmit,
}: {
  slip: SlipData;
  slipAside?: ReactNode;
  email: string | null;
  note: string;
  onNoteChange: (value: string) => void;
  noteError?: string | null;
  error?: ReactNode;
  onSubmit: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      id={REVIEW_FORM_ID}
      onSubmit={handleSubmit}
      className="space-y-8"
      noValidate
    >
      <AppointmentSlip slip={slip} size="lg" as="h3" aside={slipAside} />

      <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <li className="flex gap-3">
          <CalendarCheck2
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          Move or cancel it online up to {siteConfig.clinic.minNoticeHours}{" "}
          hours before. After that, call {siteConfig.phone}.
        </li>
        <li className="flex gap-3">
          <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {email
            ? `We'll email the confirmation to ${email}.`
            : "We'll email you a confirmation."}
        </li>
      </ul>

      <div className="space-y-2">
        <Label htmlFor="booking-note" className="text-sm font-semibold">
          Anything the dentist should know?{" "}
          <span className="font-normal text-muted-foreground">Optional</span>
        </Label>
        <Textarea
          id="booking-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          maxLength={NOTE_MAX}
          rows={4}
          placeholder="For example: a tooth on the lower left is sensitive to cold."
          aria-invalid={!!noteError}
          aria-describedby="booking-note-hint"
          className="resize-y bg-card"
        />
        <p
          id="booking-note-hint"
          className="flex justify-between gap-4 text-xs text-muted-foreground"
        >
          <span className={noteError ? "text-destructive" : undefined}>
            {noteError ?? "Shared only with your dentist and the front desk."}
          </span>
          <span className="tabular-nums">
            {note.length}/{NOTE_MAX}
          </span>
        </p>
      </div>

      <div aria-live="assertive">
        {error ? (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/6 p-4 text-sm text-foreground"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden
            />
            <div>{error}</div>
          </div>
        ) : null}
      </div>
    </form>
  );
}
