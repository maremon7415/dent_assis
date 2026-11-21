/**
 * What each tier includes, written from what the app enforces: booking and the portal need only an
 * account; the voice assistant page checks for the `ai_basic` or `ai_pro` Clerk plan. Prices and
 * billing periods are NOT written here: they come from Clerk's PricingTable, the source of truth.
 */
export const FREE_FEATURES = [
  "Book, reschedule and cancel visits online",
  "Real-time availability for every dentist",
  "Email confirmations and reminders",
  "Your visit history and dentist's notes",
];

export const AI_FEATURES = [
  "Everything in the free account",
  "Voice conversations with the AI assistant",
  "General guidance on symptoms, pain and aftercare",
  "A live transcript of each call on screen",
];

export const PLAN_KEYS = ["ai_basic", "ai_pro"] as const;

export type ComparisonRow = {
  label: string;
  free: boolean | string;
  ai: boolean | string;
};

export const COMPARISON: ComparisonRow[] = [
  { label: "Online booking from the live diary", free: true, ai: true },
  { label: "Reschedule or cancel in the portal", free: true, ai: true },
  { label: "Confirmation and reminder emails", free: true, ai: true },
  { label: "Visit history and visit notes", free: true, ai: true },
  { label: "AI voice assistant", free: false, ai: true },
  { label: "On-screen call transcript", free: false, ai: true },
  { label: "Cancel any time", free: "Nothing to cancel", ai: true },
];
