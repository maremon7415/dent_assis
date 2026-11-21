import type { Metadata } from "next";
import { PatientDetailClient } from "@/components/admin/PatientDetailClient";

export const metadata: Metadata = { title: "Patient" };

export default async function AdminPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientDetailClient id={id} />;
}
