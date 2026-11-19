import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { LogoMark } from "./LogoMark";

const SIZES = {
  sm: { mark: "size-6", word: "text-lg", gap: "gap-1.5" },
  md: { mark: "size-8", word: "text-[1.375rem]", gap: "gap-2" },
  lg: { mark: "size-11", word: "text-3xl", gap: "gap-2.5" },
} as const;

export type LogoProps = {
  size?: keyof typeof SIZES;
  /** Show only the mark (the name is still announced to screen readers). */
  markOnly?: boolean;
  /** Wrap in a link. Pass `null` for no link. Defaults to "/". */
  href?: string | null;
  /** Mark style; `tile` suits dense app chrome, `glyph` suits open marketing space. */
  markVariant?: "glyph" | "tile";
  className?: string;
};

/**
 * The Lumadent lockup: the tooth-and-crescent mark plus the wordmark set in the
 * display serif. Colour follows `currentColor` (mark in primary), so it works on
 * any surface that sets a readable text colour.
 */
export function Logo({
  size = "md",
  markOnly = false,
  href = "/",
  markVariant = "glyph",
  className,
}: LogoProps) {
  const s = SIZES[size];
  const content = (
    <>
      <LogoMark
        variant={markVariant}
        className={cn(s.mark, markVariant === "glyph" && "text-primary")}
      />
      {markOnly ? (
        <span className="sr-only">{siteConfig.name}</span>
      ) : (
        <span
          className={cn(
            "font-display font-medium leading-none tracking-tight",
            s.word,
          )}
        >
          {siteConfig.name}
        </span>
      )}
    </>
  );

  const classes = cn(
    "inline-flex items-center text-foreground",
    s.gap,
    className,
  );

  if (href === null) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={cn(classes, "focus-ring rounded-md")}>
      {content}
    </Link>
  );
}
