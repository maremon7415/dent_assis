import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import UserSync from "@/components/UserSync";
import { Toaster } from "@/components/ui/sonner";
import { isAdmin } from "@/lib/auth";

/**
 * Frame for every signed-in patient page. The route group keeps the URLs unchanged
 * (/dashboard, /appointments, /visits, /profile, /voice, /pro).
 */
export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppShell isAdmin={await isAdmin()}>
      <UserSync />
      {children}
      <Toaster position="top-right" closeButton />
    </AppShell>
  );
}
