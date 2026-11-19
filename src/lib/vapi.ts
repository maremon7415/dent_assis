import Vapi from "@vapi-ai/web";

/** Both public Vapi values must be set for the voice assistant to work. */
export function isVapiConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_VAPI_API_KEY &&
    !!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID
  );
}

export const vapiAssistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "";

let instance: Vapi | null = null;

/** The browser Vapi client, created on first use (never during server rendering or without a key). */
export function getVapi(): Vapi {
  if (!instance)
    instance = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY ?? "");
  return instance;
}
