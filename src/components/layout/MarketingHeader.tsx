"use client";

import { ClerkLoading, Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { isActivePath, marketingNav } from "./nav";
import { SkipLink } from "./SkipLink";
import { ThemeToggle } from "./ThemeToggle";

/** Where "Book a visit" lands after sign-up or sign-in. */
const BOOKING_PATH = "/appointments";

function AuthActions({ stacked = false }: { stacked?: boolean }) {
  const size = stacked ? "lg" : "default";
  return (
    <>
      <ClerkLoading>
        <span
          className={cn("block h-9 w-44", stacked && "h-10 w-full")}
          aria-hidden
        />
      </ClerkLoading>
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
          <Button variant={stacked ? "outline" : "ghost"} size={size}>
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal" forceRedirectUrl={BOOKING_PATH}>
          <Button size={size}>Book a visit</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Button asChild size={size}>
          <Link href="/dashboard">Open portal</Link>
        </Button>
      </Show>
    </>
  );
}

/**
 * Public site header: logo, the five site links, theme, and the sign-in or
 * portal call to action. Sticky; gains a hairline and blur once scrolled.
 */
export function MarketingHeader({ className }: { className?: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <SkipLink />
      <header
        className={cn(
          "sticky top-0 z-40 h-(--header-height) border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-border/70 bg-background/85 backdrop-blur-lg"
            : "border-transparent bg-background",
          className,
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Logo size="md" />

          <nav
            aria-label="Main"
            className="hidden flex-1 justify-center md:flex"
          >
            <ul className="flex items-center gap-1">
              {marketingNav.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "focus-ring relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-foreground after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <ThemeToggle />
            <div className="hidden items-center gap-1.5 md:flex">
              <AuthActions />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(22rem,88vw)] gap-0 p-0"
              >
                <SheetHeader className="border-b px-5 py-4">
                  <SheetTitle asChild>
                    <div>
                      <Logo size="sm" href={null} />
                    </div>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {siteConfig.tagline}
                  </SheetDescription>
                </SheetHeader>
                <nav
                  aria-label="Main"
                  className="flex-1 overflow-y-auto px-3 py-4"
                >
                  <ul className="flex flex-col">
                    {marketingNav.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "focus-ring flex items-center rounded-lg px-3 py-3 font-display text-2xl transition-colors",
                                active
                                  ? "bg-accent text-accent-foreground"
                                  : "text-foreground hover:bg-muted",
                              )}
                            >
                              {item.label}
                            </Link>
                          </SheetClose>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
                <div className="grid gap-2 border-t p-5 pb-safe">
                  <AuthActions stacked />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
