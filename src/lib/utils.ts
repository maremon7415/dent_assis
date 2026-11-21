import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function initialsOf(name: string): string {
  const words = name
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const letters =
    words.length > 1
      ? [words[0][0], words[words.length - 1][0]]
      : [words[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}

const AVATAR_PALETTE = [
  ["#0E7C7B", "#E6F5F1"],
  ["#0B2A33", "#D9EEEA"],
  ["#2F6F63", "#EAF4EF"],
  ["#1F5C7A", "#E4EFF5"],
  ["#6A4C93", "#EFE9F6"],
] as const;

/**
 * Generated initials avatar as a self-contained SVG data URI: no third-party hotlink and no photo of a
 * real person. `gender` is accepted for backwards compatibility and does not change the output.
 */
export function generateAvatar(
  name: string,
  _gender?: "MALE" | "FEMALE",
): string {
  const initials = initialsOf(name).replace(/[^A-Z0-9]/g, "") || "?";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const [fg, bg] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${initials}"><rect width="128" height="128" rx="64" fill="${bg}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="48" font-weight="600" fill="${fg}">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** US-style phone formatting for inputs. */
export const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};
