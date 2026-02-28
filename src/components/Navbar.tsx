"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import {
  CalendarIcon,
  CrownIcon,
  HomeIcon,
  MenuIcon,
  MicIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

function Navbar() {
  const { user } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/appointments", label: "Appointments", icon: CalendarIcon },
    { href: "/voice", label: "Voice", icon: MicIcon },
    { href: "/pro", label: "Pro", icon: CrownIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-2 glass-panel border-x-0 border-t-0 rounded-none h-16">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-full">
          {/* LOGO */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Dent-Assist Logo"
                width={32}
                height={32}
                className="w-9 sm:w-11"
              />
            </Link>
          </div>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 transition-colors ${
                    pathname === link.href
                      ? "text-foreground hover:text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.emailAddresses?.[0]?.emailAddress}
              </span>
            </div>

            <UserButton />

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-8 pt-20">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 text-xl transition-colors ${
                    pathname === link.href
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
export default Navbar;
