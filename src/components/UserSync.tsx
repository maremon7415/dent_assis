"use client";

import { syncUser } from "@/lib/actions/user";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

const UserSync = () => {
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    const handleUserChange = async () => {
      try {
        await syncUser();
      } catch (error) {
        console.log("Error syncing user:", error);
      }
    };
    handleUserChange();
  }, [isLoaded, isSignedIn]);

  return null;
};

export default UserSync;
