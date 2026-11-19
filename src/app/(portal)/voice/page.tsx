import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { AssistantGuide } from "@/components/voice/AssistantGuide";
import { AssistantUnavailable } from "@/components/voice/AssistantUnavailable";
import VapiWidget from "@/components/voice/VapiWidget";
import { isVapiConfigured } from "@/lib/vapi";

export const metadata: Metadata = {
  title: "AI assistant",
  robots: { index: false },
};

export default async function VoicePage() {
  const { has } = await auth();
  const hasPlan = has({ plan: "ai_basic" }) || has({ plan: "ai_pro" });
  const configured = isVapiConfigured();
  const user = hasPlan && configured ? await currentUser() : null;

  return (
    <>
      <PageHeader
        title="AI assistant"
        description="A voice assistant for questions between visits. It knows dentistry in general, not your records."
      />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {!hasPlan ? (
            <AssistantUnavailable reason="plan" />
          ) : !configured ? (
            <AssistantUnavailable reason="not-configured" />
          ) : (
            <VapiWidget firstName={user?.firstName} />
          )}
        </div>
        <div className="lg:col-span-5">
          <AssistantGuide />
        </div>
      </div>
    </>
  );
}
