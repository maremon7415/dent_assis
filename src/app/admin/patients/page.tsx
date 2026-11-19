import type { Metadata } from "next";
import { Suspense } from "react";
import { PatientsClient } from "@/components/admin/PatientsClient";
import { ListSkeleton } from "@/components/admin/shared";

export const metadata: Metadata = { title: "Patients" };

export default function AdminPatientsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <PatientsClient />
    </Suspense>
  );
}
