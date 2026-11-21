"use client";

import { Loader2, Mic, PhoneOff, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { getVapi, vapiAssistantId } from "@/lib/vapi";

type CallState = "idle" | "connecting" | "active" | "ended" | "error";
type Line = { id: number; role: "assistant" | "user"; text: string };

type VapiMessage = {
  type?: string;
  transcriptType?: string;
  transcript?: string;
  role?: string;
};

const STATUS: Record<CallState, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  active: "Listening",
  ended: "Call ended",
  error: "Couldn't connect",
};

/**
 * Voice call with the clinic's AI assistant (Vapi). Only rendered when the Vapi keys are set; the page
 * shows a "not configured" state otherwise.
 */
export default function VapiWidget({
  firstName,
}: {
  firstName?: string | null;
}) {
  const [state, setState] = useState<CallState>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const nextId = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to the newest line whenever one arrives
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  useEffect(() => {
    const vapi = getVapi();
    const onStart = () => {
      setState("active");
      setError(null);
    };
    const onEnd = () => {
      setState((s) => (s === "error" ? s : "ended"));
      setSpeaking(false);
    };
    const onSpeechStart = () => setSpeaking(true);
    const onSpeechEnd = () => setSpeaking(false);
    const onMessage = (m: VapiMessage) => {
      if (
        m.type === "transcript" &&
        m.transcriptType === "final" &&
        m.transcript
      ) {
        const role = m.role === "assistant" ? "assistant" : "user";
        const text = m.transcript;
        setLines((prev) => [...prev, { id: nextId.current++, role, text }]);
      }
    };
    const onError = (e: unknown) => {
      console.error("[vapi]", e);
      setState("error");
      setSpeaking(false);
      setError(
        "The call dropped or couldn't start. Check that your microphone is allowed for this site, then try again.",
      );
    };

    vapi
      .on("call-start", onStart)
      .on("call-end", onEnd)
      .on("speech-start", onSpeechStart)
      .on("speech-end", onSpeechEnd)
      .on("message", onMessage)
      .on("error", onError);
    return () => {
      vapi
        .off("call-start", onStart)
        .off("call-end", onEnd)
        .off("speech-start", onSpeechStart)
        .off("speech-end", onSpeechEnd)
        .off("message", onMessage)
        .off("error", onError);
      vapi.stop();
    };
  }, []);

  const start = async () => {
    setLines([]);
    setError(null);
    setState("connecting");
    try {
      await getVapi().start(vapiAssistantId);
    } catch (e) {
      console.error("[vapi] start failed", e);
      setState("error");
      setError(
        "We couldn't start the call. Allow microphone access for this site and try again.",
      );
    }
  };

  const stop = () => getVapi().stop();
  const live = state === "active" || state === "connecting";

  return (
    <section
      aria-labelledby="assistant-call-title"
      className="overflow-hidden rounded-2xl border bg-card shadow-xs"
    >
      <h2 id="assistant-call-title" className="sr-only">
        Voice call
      </h2>
      <div className="surface-glow flex flex-col items-center px-6 pt-10 pb-8 text-center">
        <div className="relative flex size-36 items-center justify-center">
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-full bg-mint/30 blur-xl transition-[opacity,transform] duration-500 ease-out",
              state === "active"
                ? "scale-100 opacity-100"
                : "scale-75 opacity-0",
              speaking && "scale-110",
            )}
          />
          <span
            aria-hidden
            className={cn(
              "absolute inset-3 rounded-full border-2 transition-colors duration-300",
              state === "active" ? "border-primary/50" : "border-border",
            )}
          />
          <span className="relative flex size-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <LogoMark className="size-12" />
          </span>
        </div>

        <div className="mt-4 flex h-6 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "w-1 rounded-full bg-primary transition-opacity duration-200",
                speaking ? "animate-sound-wave opacity-100" : "h-1 opacity-30",
              )}
              style={speaking ? { animationDelay: `${i * 0.12}s` } : undefined}
            />
          ))}
        </div>

        <p
          className="mt-3 font-display text-2xl text-foreground"
          aria-live="polite"
        >
          {state === "active" && speaking ? "Speaking" : STATUS[state]}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {state === "idle"
            ? `${firstName ? `${firstName}, ask` : "Ask"} anything about your teeth, a treatment or your visit. Speak naturally; you can interrupt.`
            : state === "ended"
              ? "Your transcript is below. It isn't saved once you leave this page."
              : state === "error"
                ? error
                : "Speak when you're ready. End the call any time."}
        </p>

        <div className="mt-6">
          {live ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={stop}
              className="h-12 rounded-full px-7 active:scale-[0.97]"
            >
              {state === "connecting" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <PhoneOff className="size-4" aria-hidden />
              )}
              {state === "connecting" ? "Cancel" : "End call"}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={start}
              className="h-12 rounded-full px-7 active:scale-[0.97]"
            >
              {state === "idle" ? (
                <Mic className="size-4" aria-hidden />
              ) : (
                <RotateCcw className="size-4" aria-hidden />
              )}
              {state === "idle" ? "Start a voice call" : "Start a new call"}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Uses your microphone. Calls go to {siteConfig.name}'s assistant, not a
          person.
        </p>
      </div>

      {lines.length > 0 ? (
        <div className="border-t">
          <h3 className="px-6 pt-4 text-sm font-semibold text-muted-foreground">
            Transcript
          </h3>
          <ol
            ref={logRef}
            aria-live="polite"
            className="max-h-72 space-y-3 overflow-y-auto px-6 pt-3 pb-5"
          >
            {lines.map((l) => (
              <li
                key={l.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  l.role === "assistant"
                    ? "rounded-bl-md bg-muted text-foreground"
                    : "ml-auto rounded-br-md bg-primary text-primary-foreground",
                )}
              >
                <span className="sr-only">
                  {l.role === "assistant" ? "Assistant: " : "You: "}
                </span>
                {l.text}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
