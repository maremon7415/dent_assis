import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";
import { clinicTimeZone } from "@/lib/time";

export const metadata: Metadata = {
  title: { default: "Clinic console", template: "%s · Clinic console" },
  robots: { index: false, follow: false },
};

/**
 * Role comes from the database (User.role), never from an env email check on the page.
 * Signed out goes to the home page, signed in without the ADMIN role goes to the patient portal.
 * Every admin action checks again; this layout only decides what to render.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return <AdminShell timezone={clinicTimeZone()}>{children}</AdminShell>;
}
