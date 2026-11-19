import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The marketing site's signature: the crescent of light from the Lumadent mark, drawn as a moon
 * phase. `phase` is the lit fraction (0 = new, 1 = full); the lit side faces right, so a row of
 * growing phases reads as progress. Pure path geometry, no masks, so it renders on the server.
 */
export function crescentPath(phase: number, r = 50, cx = 50, cy = 50) {
  const p = Math.min(1, Math.max(0, phase));
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  if (p >= 0.999) {
    return `M${top}A${r} ${r} 0 0 1 ${bottom}A${r} ${r} 0 0 1 ${top}Z`;
  }
  const rx = Math.abs(1 - 2 * p) * r;
  // Crescent (p < .5): terminator bows toward the lit side; gibbous: away from it.
  const sweep = p < 0.5 ? 0 : 1;
  return `M${top}A${r} ${r} 0 0 1 ${bottom}A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${top}Z`;
}

export type CrescentProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  phase?: number;
  /** Draw the unlit disc as a hairline so the phase reads on its own. */
  outline?: boolean;
  /** Classes for the lit shape (fill colour). Defaults to the primary teal. */
  litClassName?: string;
};

export function Crescent({
  phase = 0.22,
  outline = false,
  litClassName = "fill-primary",
  className,
  ...props
}: CrescentProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      {outline ? (
        <circle
          cx="50"
          cy="50"
          r="49"
          fill="none"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          className="stroke-current opacity-30"
        />
      ) : null}
      {phase > 0 ? (
        <path
          d={crescentPath(phase, outline ? 49 : 50)}
          className={litClassName}
        />
      ) : null}
    </svg>
  );
}

/** Small crescent used as the list marker across the marketing site. */
export function CrescentBullet({ className }: { className?: string }) {
  return (
    <Crescent
      phase={0.3}
      className={cn("mt-1 size-3.5", className)}
      litClassName="fill-primary"
    />
  );
}
