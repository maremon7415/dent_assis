import {
  AudioLines,
  CalendarPlus,
  ClipboardList,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the phone tab bar. */
  shortLabel?: string;
  icon: LucideIcon;
};

/** Public site links, in header order. */
export const marketingNav: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/services", label: "Services" },
  { href: "/dentists", label: "Dentists" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

/** Signed-in patient portal links. */
export const portalNav: ReadonlyArray<NavItem> = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
  },
  { href: "/appointments", label: "Book", icon: CalendarPlus },
  {
    href: "/visits",
    label: "My visits",
    shortLabel: "Visits",
    icon: ClipboardList,
  },
  {
    href: "/voice",
    label: "AI assistant",
    shortLabel: "Assistant",
    icon: AudioLines,
  },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Shown only when the server says the user is an admin. Hiding it is not authorization. */
export const adminNavItem: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
};

export function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
