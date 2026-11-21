import { cn } from "@/lib/utils";

/**
 * Dentist portrait. The stored image is a generated initials SVG (data URI) or an https URL, so a plain
 * <img> avoids the image optimiser. Decorative: the name is always printed next to it.
 */
export function DoctorAvatar({
  src,
  className,
}: {
  src: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-10 shrink-0 overflow-hidden rounded-full bg-accent ring-1 ring-border",
        className,
      )}
    >
      {src ? (
        // biome-ignore lint/performance/noImgElement: data-URI avatars; next/image adds nothing here
        <img src={src} alt="" className="size-full object-cover" />
      ) : null}
    </span>
  );
}
