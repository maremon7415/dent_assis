"use client";

import { UserProfile } from "@clerk/nextjs";
import { HeartPulse, ShieldCheck } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyProfile } from "@/hooks/use-profile";
import { calendarParts } from "../format";
import { QueryError } from "../QueryError";
import { HealthProfileForm } from "./HealthProfileForm";

export function ProfileView() {
  const profile = useMyProfile();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = search.get("tab") === "account" ? "account" : "health";

  const p = profile.data;
  const name = p ? [p.firstName, p.lastName].filter(Boolean).join(" ") : "";
  const since = p ? calendarParts(p.memberSince.slice(0, 10)) : null;

  return (
    <>
      <PageHeader
        title="Profile"
        description={
          p ? (
            <>
              {name ? `${name}, ` : null}
              {p.email}
              {since ? (
                <span className="block text-sm">
                  Patient since {since.monthLong} {since.year}
                </span>
              ) : null}
            </>
          ) : (
            "Your health details and account."
          )
        }
      />
      <Tabs
        value={tab}
        onValueChange={(v) =>
          router.replace(
            v === "account" ? `${pathname}?tab=account` : pathname,
            {
              scroll: false,
            },
          )
        }
        className="gap-6"
      >
        <TabsList className="h-10 w-full sm:w-fit">
          <TabsTrigger value="health" className="gap-2 px-4">
            <HeartPulse className="size-4" aria-hidden />
            Health profile
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2 px-4">
            <ShieldCheck className="size-4" aria-hidden />
            Account & security
          </TabsTrigger>
        </TabsList>

        {/* Kept mounted so switching tabs never drops unsaved edits. */}
        <TabsContent
          value="health"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {profile.isError ? (
            <QueryError
              title="Your profile didn't load"
              error={profile.error}
              onRetry={() => profile.refetch()}
              retrying={profile.isFetching}
            />
          ) : p ? (
            <HealthProfileForm profile={p} />
          ) : (
            <div className="space-y-4" aria-busy="true">
              <output className="sr-only">Loading your profile</output>
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="account">
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            Your name, email, password and signed-in devices are managed by our
            sign-in provider. Changes to your name show up here after you save
            them.
          </p>
          <UserProfile
            routing="hash"
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "w-full max-w-none shadow-xs border rounded-2xl",
              },
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
