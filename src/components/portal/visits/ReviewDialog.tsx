"use client";

import { Loader2, Star } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitReview } from "@/hooks/use-appointment";
import type { AppointmentDTO } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { visitTitle } from "../format";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** 1 to 5 stars as a native radio group: arrow keys change the rating. */
export function StarInput({
  value,
  onChange,
  labelledBy,
}: {
  value: number;
  onChange: (value: number) => void;
  labelledBy: string;
}) {
  const name = useId();
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        className="flex"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className="cursor-pointer rounded-md p-1 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ring"
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${n} ${n === 1 ? "star" : "stars"}, ${LABELS[n]}`}
            />
            <Star
              className={cn(
                "size-8 transition-[color,transform] duration-150 ease-out",
                n <= shown
                  ? "fill-current text-warning"
                  : "text-muted-foreground/40",
                n === hover && "scale-110",
              )}
              aria-hidden
            />
          </label>
        ))}
      </div>
      <span className="text-sm font-medium text-foreground" aria-hidden>
        {LABELS[shown]}
      </span>
    </div>
  );
}

export function ReviewDialog({
  appointment,
  open,
  onOpenChange,
}: {
  appointment: AppointmentDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const review = useSubmitReview();
  const ratingLabel = useId();

  const submit = () => {
    if (!rating) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }
    setError(null);
    review.mutate(
      {
        appointmentId: appointment.id,
        rating,
        comment: comment.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Review posted", {
            description: `Thanks for helping ${appointment.doctor.name}'s future patients.`,
          });
          onOpenChange(false);
        },
        onError: (e) =>
          setError(e.message || "We couldn't post it. Try again."),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !review.isPending && onOpenChange(next)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            How was your visit?
          </DialogTitle>
          <DialogDescription>
            {visitTitle(appointment)} with {appointment.doctor.name} on{" "}
            {appointment.dateLabel}. Other patients see your first name and last
            initial.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-2">
            <p id={ratingLabel} className="text-sm font-medium">
              Rating
            </p>
            <StarInput
              value={rating}
              onChange={(n) => {
                setRating(n);
                setError(null);
              }}
              labelledBy={ratingLabel}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`review-${appointment.id}`}>
              Comment{" "}
              <span className="font-normal text-muted-foreground">
                Optional
              </span>
            </Label>
            <Textarea
              id={`review-${appointment.id}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What went well, and what could be better?"
            />
          </div>
          <div aria-live="assertive">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={review.isPending}
            >
              Not now
            </Button>
            <Button type="submit" disabled={review.isPending}>
              {review.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              {review.isPending ? "Posting…" : "Post review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
