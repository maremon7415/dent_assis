"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { syncUser } from "@/lib/actions/user";

/**
 * Makes sure the signed-in Clerk user has a local row (and gets admin promotion / welcome email) even
 * if the Clerk webhook is not configured or arrives late. Runs once per signed-in user id.
 */
const UserSync = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || syncedFor.current === user.id)
      return;
    syncedFor.current = user.id;
    syncUser().catch((error) => {
      syncedFor.current = null;
      console.error("Error syncing user:", error);
    });
  }, [isLoaded, isSignedIn, user]);

  return null;
};

export default UserSync;
