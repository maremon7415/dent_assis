import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/appointments/BookingFlow";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Book a visit",
  robots: { index: false },
};

export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6" aria-busy="true">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      }
    >
      <BookingFlow />
    </Suspense>
  );
}
