import {
  CalendarCheck,
  LayoutDashboard,
  type LucideIcon,
  Stethoscope,
  Tags,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** The console's own jobs, in the order staff reach for them. */
export const adminNav: ReadonlyArray<AdminNavItem> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/admin/dentists", label: "Dentists", icon: Stethoscope },
  { href: "/admin/services", label: "Services", icon: Tags },
  { href: "/admin/patients", label: "Patients", icon: Users },
];

/** Overview is exact-match; every other item also owns its sub-routes. */
export function isAdminActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
