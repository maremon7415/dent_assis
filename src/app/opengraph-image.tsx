import { ImageResponse } from "next/og";
import { BRAND_HEX, CRESCENT_PATH, TOOTH_PATH } from "@/components/brand/paths";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Load a static Fraunces cut for the card; fall back to the default face offline. */
async function loadDisplayFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@144,500&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const match = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
    );
    if (!match) return null;
    const res = await fetch(match[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

function svgData(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="${BRAND_HEX.teal}"/><path fill="${BRAND_HEX.mint}" d="${CRESCENT_PATH}"/><path fill="${BRAND_HEX.enamel}" fill-rule="evenodd" d="${TOOTH_PATH} ${CRESCENT_PATH}"/></svg>`;
const bigTooth = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="${BRAND_HEX.teal}" fill-rule="evenodd" d="${TOOTH_PATH} ${CRESCENT_PATH}"/><path fill="${BRAND_HEX.mint}" d="${CRESCENT_PATH}"/></svg>`;

export default async function OpengraphImage() {
  const text = `${siteConfig.name}${siteConfig.tagline}`;
  const display = await loadDisplayFont(text);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: BRAND_HEX.inkDeep,
        color: BRAND_HEX.enamel,
        padding: "72px 80px",
        overflow: "hidden",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: ImageResponse renders plain elements */}
      <img
        alt=""
        src={svgData(bigTooth)}
        width={620}
        height={620}
        style={{ position: "absolute", right: -90, top: 40, opacity: 0.9 }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 720,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* biome-ignore lint/performance/noImgElement: ImageResponse renders plain elements */}
          <img alt="" src={svgData(tile)} width={64} height={64} />
          <div
            style={{
              fontSize: 44,
              fontFamily: display ? "Fraunces" : "serif",
              letterSpacing: "-0.02em",
            }}
          >
            {siteConfig.name}
          </div>
        </div>
        <div
          style={{
            fontSize: 92,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            fontFamily: display ? "Fraunces" : "serif",
          }}
        >
          {siteConfig.tagline}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: display
        ? [{ name: "Fraunces", data: display, weight: 500, style: "normal" }]
        : undefined,
    },
  );
}
