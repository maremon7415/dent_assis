import { ImageResponse } from "next/og";
import { BRAND_HEX, CRESCENT_PATH, TOOTH_PATH } from "@/components/brand/paths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applies its own rounded mask, so the tile is full-bleed here.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="180" height="180"><rect width="48" height="48" fill="${BRAND_HEX.teal}"/><g transform="translate(24 24.5) scale(0.82) translate(-24 -24.5)"><path fill="${BRAND_HEX.mint}" d="${CRESCENT_PATH}"/><path fill="${BRAND_HEX.enamel}" fill-rule="evenodd" d="${TOOTH_PATH} ${CRESCENT_PATH}"/></g></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    // biome-ignore lint/performance/noImgElement: ImageResponse renders plain elements, not next/image
    <img
      alt=""
      width={180}
      height={180}
      src={`data:image/svg+xml,${encodeURIComponent(svg)}`}
    />,
    size,
  );
}
