"use client";

import { BRAND_HEX } from "@/components/brand/paths";
import { crescentPath } from "@/components/marketing/Crescent";
import { siteConfig } from "@/config/site";

/**
 * Last-resort boundary: replaces the root layout, so no providers, fonts or Tailwind tokens can be
 * assumed. Inline styles with the brand hex values keep it on-brand and readable in both themes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: BRAND_HEX.enamel,
          color: BRAND_HEX.ink,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <svg viewBox="0 0 100 100" width="64" height="64" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke={BRAND_HEX.teal}
              strokeOpacity="0.3"
              strokeWidth="2"
            />
            <path d={crescentPath(0.08, 49)} fill={BRAND_HEX.teal} />
          </svg>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontWeight: 400,
              fontSize: 34,
              lineHeight: 1.1,
              margin: "24px 0 12px",
            }}
          >
            {siteConfig.name} could not load
          </h1>
          <p
            role="alert"
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              margin: 0,
              color: "#4f6467",
            }}
          >
            Something went wrong on our side. Try again, or call the front desk
            on {siteConfig.phone}.
          </p>
          {error.digest ? (
            <p style={{ fontSize: 12, color: "#4f6467" }}>
              Reference {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              height: 44,
              padding: "0 24px",
              border: 0,
              borderRadius: 10,
              background: BRAND_HEX.teal,
              color: "#f4fbf9",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
