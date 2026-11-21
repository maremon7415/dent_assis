import type { Metadata } from "next";
import { Suspense } from "react";
import { VisitsView } from "@/components/portal/visits/VisitsView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "My visits",
  robots: { index: false },
};

export default function VisitsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <VisitsView />
    </Suspense>
  );
}
