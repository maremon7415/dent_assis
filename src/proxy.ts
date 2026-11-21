import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Next 16 proxy (formerly middleware). Attaches Clerk auth to every request and sends signed-out
 * visitors of the patient portal and admin console to sign in.
 *
 * This is a convenience redirect, not authorization: every server action and API route checks the
 * user (and the ADMIN role from the database) itself. Admin role is not checked here because roles
 * live in the database, which the proxy does not query.
 * API routes are not matched for protection: webhooks and cron authenticate with signatures/secrets.
 */
const isSignedInArea = createRouteMatcher([
  "/dashboard(.*)",
  "/appointments(.*)",
  "/visits(.*)",
  "/profile(.*)",
  "/pro",
  "/voice(.*)",
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isSignedInArea(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
