import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rating line; renders nothing until a dentist has at least one review. */
export function DoctorRating({
  rating,
  className,
}: {
  rating: { average: number | null; count: number };
  className?: string;
}) {
  if (rating.count === 0 || rating.average === null) return null;
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <Star className="size-4 fill-warning text-warning" aria-hidden />
      <span data-numeric className="font-semibold text-foreground">
        {rating.average.toFixed(1)}
      </span>
      <span>
        from {rating.count} review{rating.count === 1 ? "" : "s"}
      </span>
      <span className="sr-only">out of 5</span>
    </p>
  );
}
