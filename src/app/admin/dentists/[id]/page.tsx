import type { Metadata } from "next";
import { DentistDetailClient } from "@/components/admin/DentistDetailClient";

export const metadata: Metadata = { title: "Dentist" };

export default async function AdminDentistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DentistDetailClient id={id} />;
}
