import type { Metadata } from "next";
import { ServicesClient } from "@/components/admin/ServicesClient";

export const metadata: Metadata = { title: "Services" };

export default function AdminServicesPage() {
  return <ServicesClient />;
}
