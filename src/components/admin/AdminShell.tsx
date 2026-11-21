"use client";

import { UserButton } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { SkipLink } from "@/components/layout/SkipLink";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { type AdminNavItem, adminNav, isAdminActive } from "./admin-nav";
import { ClinicProvider } from "./shared";

const userButtonAppearance = {
  elements: { avatarBox: "size-8 ring-1 ring-border" },
};

function RailLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      {active ? (
        <span
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary"
          aria-hidden
        />
      ) : null}
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
 * The clinic console frame. Desktop: a sticky rail (in a full-height column) with the five jobs, the way back to the patient
 * portal and the signed-in staff member. Phones: a slim top bar and a five-tab bottom bar.
 */
export function AdminShell({
  children,
  timezone,
}: {
  children: ReactNode;
  timezone: string;
}) {
  const pathname = usePathname();

  return (
    <ClinicProvider value={{ timezone }}>
      <div className="min-h-dvh bg-background lg:flex">
        <SkipLink />

        <div className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
          <aside className="sticky top-0 z-30 flex h-dvh flex-col">
            <div className="flex h-(--header-height) flex-col justify-center px-5">
              <Logo size="md" href="/admin" markVariant="tile" />
            </div>
            <div className="px-5 pb-2">
              <p className="text-xs font-medium text-muted-foreground">
                Clinic console
              </p>
            </div>
            <nav aria-label="Clinic console" className="flex-1 px-3 py-2">
              <ul className="space-y-1">
                {adminNav.map((item) => (
                  <li key={item.href}>
                    <RailLink
                      item={item}
                      active={isAdminActive(pathname, item.href)}
                    />
                  </li>
                ))}
              </ul>
            </nav>
            <div className="space-y-3 border-t border-sidebar-border px-3 py-3">
              <Link
                href="/dashboard"
                className="focus-ring flex h-10 items-center justify-between rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                Patient portal
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
              <div className="flex items-center justify-between px-2">
                <UserButton appearance={userButtonAppearance} />
                <ThemeToggle />
              </div>
            </div>
          </aside>
        </div>

        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur-lg lg:hidden">
          <Logo size="sm" href="/admin" markVariant="tile" />
          <span className="hidden rounded-md min-[420px]:inline bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            Console
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/dashboard"
              className="focus-ring inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Portal
              <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
            <ThemeToggle />
            <UserButton appearance={userButtonAppearance} />
          </div>
        </header>

        <div className="min-w-0 lg:flex-1">
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
          >
            {children}
          </main>
        </div>

        <nav
          aria-label="Clinic console"
          className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-lg lg:hidden"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5">
            {adminNav.map((item) => {
              const active = isAdminActive(pathname, item.href);
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
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Toaster position="top-center" richColors closeButton />
      </div>
    </ClinicProvider>
  );
}
