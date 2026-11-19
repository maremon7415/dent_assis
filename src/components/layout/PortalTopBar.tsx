"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { adminNavItem, isActivePath, portalNav } from "./nav";
import { SkipLink } from "./SkipLink";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Fixed 4rem portal top bar, for pages that are not on AppShell yet.
 * Pages using it must pad their content top by at least 4rem (they use pt-20/pt-24).
 */
export function PortalTopBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...portalNav, adminNavItem] : portalNav;

  return (
    <>
      <SkipLink />
      <header className="fixed inset-x-0 top-0 z-50 h-(--header-height) border-b bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo size="md" href="/dashboard" markVariant="tile" />

          <nav
            aria-label="Portal"
            className="hidden flex-1 justify-center lg:flex"
          >
            <ul className="flex items-center gap-1">
              {items.map((item) => {
                const active = isActivePath(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-ring flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <ThemeToggle />
            <UserButton
              appearance={{
                elements: { avatarBox: "size-8 ring-1 ring-border" },
              }}
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(20rem,85vw)] gap-0 p-0"
              >
                <SheetHeader className="border-b px-5 py-4">
                  <SheetTitle asChild>
                    <div>
                      <Logo size="sm" href={null} markVariant="tile" />
                    </div>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Portal menu
                  </SheetDescription>
                </SheetHeader>
                <nav aria-label="Portal" className="px-3 py-4">
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "focus-ring flex h-11 items-center gap-3 rounded-lg px-3 text-base font-medium",
                                active
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground hover:bg-muted",
                              )}
                            >
                              <Icon
                                className="size-5 text-primary"
                                aria-hidden
                              />
                              {item.label}
                            </Link>
                          </SheetClose>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
