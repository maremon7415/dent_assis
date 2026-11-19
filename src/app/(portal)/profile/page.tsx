import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileView } from "@/components/portal/profile/ProfileView";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <ProfileView />
    </Suspense>
  );
}
