import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-11", px: 44 },
  md: { box: "size-16", px: 64 },
  lg: { box: "size-28 sm:size-32", px: 128 },
} as const;

/**
 * Dentist portrait: the clinic's generated initials avatar (no photos of real people). Decorative,
 * because the dentist's name is always printed next to it.
 */
export function DoctorAvatar({
  src,
  size = "md",
  className,
}: {
  src: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <Image
      src={src}
      alt=""
      width={s.px}
      height={s.px}
      unoptimized
      className={cn(
        "shrink-0 rounded-full ring-1 ring-border",
        s.box,
        className,
      )}
    />
  );
}
