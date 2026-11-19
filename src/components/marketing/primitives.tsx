import type { ReactNode } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/layout";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Public page frame: header, the one `<main id="main">`, footer. */
export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}

/** The marketing measure: one max width and gutter for every band. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </div>
  );
}

/** A section title on marketing pages: display serif, left aligned, one short lede. */
export function BandTitle({
  id,
  title,
  lede,
  action,
  className,
}: {
  id: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <h2
          id={id}
          className="font-display text-display-sm text-foreground md:text-display-md"
        >
          {title}
        </h2>
        {lede ? (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            {lede}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Page-level h1 block for inner marketing pages. */
export function PageIntro({
  title,
  lede,
  children,
  className,
}: {
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <h1 className="font-display text-display-sm text-foreground sm:text-display-md lg:text-display-lg">
        {title}
      </h1>
      {lede ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {lede}
        </p>
      ) : null}
      {children}
    </div>
  );
}

/** Inline JSON-LD. Content is built from our own data; `<` is escaped so it cannot close the tag. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data from server-side values, escaped
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Shown when the database could not be reached; never a fake list. */
export function DataUnavailable({
  what,
  className,
}: {
  what: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed bg-card/60 px-6 py-10 text-center",
        className,
      )}
    >
      <p className="font-display text-xl text-foreground">
        {what} are not available right now
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Please refresh in a moment, or call the front desk on{" "}
        <a
          href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
          className="focus-ring rounded-sm font-medium text-primary underline"
        >
          {siteConfig.phone}
        </a>{" "}
        and they will book you in.
      </p>
    </div>
  );
}
