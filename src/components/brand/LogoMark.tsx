import type { SVGProps } from "react";
import { cn } from "@/lib/utils";
import { BRAND_HEX, CRESCENT_PATH, TOOTH_PATH } from "./paths";

export type LogoMarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  /**
   * `glyph` (default): the tooth alone in `currentColor`, the crescent cut out.
   * `tile`: the fixed app-icon colours (teal tile, enamel tooth, mint crescent) in any theme.
   */
  variant?: "glyph" | "tile";
  /** Accessible name. Omit when the mark sits next to the visible word "Lumadent". */
  title?: string;
};

export function LogoMark({
  variant = "glyph",
  title,
  className,
  ...props
}: LogoMarkProps) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      {...props}
    >
      {labelled ? <title>{title}</title> : null}
      {variant === "tile" ? (
        <>
          <rect width="48" height="48" rx="11" fill={BRAND_HEX.teal} />
          <path d={CRESCENT_PATH} fill={BRAND_HEX.mint} />
          <path
            d={`${TOOTH_PATH} ${CRESCENT_PATH}`}
            fill={BRAND_HEX.enamel}
            fillRule="evenodd"
          />
        </>
      ) : (
        <path
          d={`${TOOTH_PATH} ${CRESCENT_PATH}`}
          fill="currentColor"
          fillRule="evenodd"
        />
      )}
    </svg>
  );
}
