import type { Metadata } from "next";
import { DentistsClient } from "@/components/admin/DentistsClient";

export const metadata: Metadata = { title: "Dentists" };

export default function AdminDentistsPage() {
  return <DentistsClient />;
}
