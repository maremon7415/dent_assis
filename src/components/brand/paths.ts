/**
 * Lumadent mark geometry (48 x 48 grid). The tooth's outline carries a
 * crescent of light cut out of its crown: the "luma" in Lumadent.
 * Shared by the React mark, the favicon, the app icon and the OG image.
 */
export const TOOTH_PATH =
  "M24 9.6C20.6 7.2 15.2 6.7 12 9.3 8.6 12.1 8.7 17.5 10.1 21.7c1.2 3.6 2.6 6.8 3.3 11.3.8 4.6 1.8 8.5 4.2 8.5s3-3.9 3.8-7.7c.6-2.8 1.4-4.2 2.6-4.2s2 1.4 2.6 4.2c.8 3.8 1.4 7.7 3.8 7.7s3.4-3.9 4.2-8.5c.7-4.5 2.1-7.7 3.3-11.3 1.4-4.2 1.5-9.6-1.9-12.4C32.8 6.7 27.4 7.2 24 9.6Z";

export const CRESCENT_PATH =
  "M15.2 23.4C11.9 17.4 14.6 11.6 21.8 10.7 17.4 13.7 16.2 18 17 23.1 16.6 23.7 15.7 23.9 15.2 23.4Z";

/** Brand hex values for places CSS variables cannot reach (icons, OG image, email). */
export const BRAND_HEX = {
  enamel: "#f6f4ee",
  ink: "#0f2b2e",
  inkDeep: "#0b1d20",
  teal: "#0b6b66",
  tealBright: "#4ccbb8",
  mint: "#7fdcbf",
  coral: "#ee8a78",
} as const;
