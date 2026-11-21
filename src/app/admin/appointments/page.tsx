import type { Metadata } from "next";
import { Suspense } from "react";
import { AppointmentsClient } from "@/components/admin/AppointmentsClient";
import { ListSkeleton } from "@/components/admin/shared";

export const metadata: Metadata = { title: "Appointments" };

export default function AdminAppointmentsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <AppointmentsClient />
    </Suspense>
  );
}
