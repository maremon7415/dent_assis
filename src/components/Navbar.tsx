"use client";

import { PortalTopBar } from "@/components/layout/PortalTopBar";

/**
 * Backwards-compatible portal navigation for pages not yet moved to
 * `AppShell` (src/components/layout/AppShell.tsx). Renders the fixed 4rem
 * Lumadent top bar; pages keep their own top padding.
 */
function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  return <PortalTopBar isAdmin={isAdmin} />;
}

export default Navbar;
