"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { adminNavItem, isActivePath, type NavItem, portalNav } from "./nav";
import { SkipLink } from "./SkipLink";
import { ThemeToggle } from "./ThemeToggle";

export type AppShellProps = {
  children: ReactNode;
  /** Pass the server-checked admin flag. Showing the link is not authorization. */
  isAdmin?: boolean;
};

const userButtonAppearance = {
  elements: { avatarBox: "size-8 ring-1 ring-border" },
};

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-[1.125rem] shrink-0",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
        aria-hidden
      />
      {item.label}
    </Link>
  );
}

/**
 * Signed-in patient portal frame.
 * Desktop (lg+): fixed left rail. Phones and tablets: slim top bar plus a bottom tab bar.
 * Content sits in `<main id="main">` with a 72rem max width and consistent padding.
 */
export function AppShell({ children, isAdmin = false }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-(--header-height) items-center px-5">
          <Logo size="md" href="/dashboard" markVariant="tile" />
        </div>
        <nav aria-label="Portal" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {portalNav.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  item={item}
                  active={isActivePath(pathname, item.href)}
                />
              </li>
            ))}
          </ul>
          {isAdmin ? (
            <div className="mt-6 border-t border-sidebar-border pt-4">
              <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">
                Clinic
              </p>
              <SidebarLink
                item={adminNavItem}
                active={isActivePath(pathname, adminNavItem.href)}
              />
            </div>
          ) : null}
        </nav>
        <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-3">
          <UserButton appearance={userButtonAppearance} />
          <ThemeToggle />
        </div>
      </aside>

      {/* Phone and tablet top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur-lg lg:hidden">
        <Logo size="sm" href="/dashboard" markVariant="tile" />
        <div className="ml-auto flex items-center gap-1">
          {isAdmin ? (
            <Link
              href={adminNavItem.href}
              aria-current={
                isActivePath(pathname, adminNavItem.href) ? "page" : undefined
              }
              className={cn(
                "focus-ring inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium",
                isActivePath(pathname, adminNavItem.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <adminNavItem.icon className="size-4" aria-hidden />
              Admin
            </Link>
          ) : null}
          <ThemeToggle />
          <UserButton appearance={userButtonAppearance} />
        </div>
      </header>

      <div className="lg:pl-64">
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
        >
          {children}
        </main>
      </div>

      {/* Phone and tablet tab bar */}
      <nav
        aria-label="Portal"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-safe backdrop-blur-lg lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {portalNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-md pt-2 text-[0.6875rem] font-semibold transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-accent",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {item.shortLabel ?? item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
