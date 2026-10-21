/* ==========================================================================
   SEASON SWITCH

   Change the word below to change the scene on the homepage hero and in the
   forest floor at the bottom of every page. Then rebuild and publish.

     "autumn"  falling leaves, yellow birches, mushrooms
     "winter"  falling snow, frosted birches, snow on the mushrooms

   Visitors never see a switch: only you change this.
   ========================================================================== */

export type Season = "autumn" | "winter";

export const SEASON: Season = "autumn";

/* --------------------------------------------------------------------------
   Dango artwork: your own Dango, unchanged. The scene adapts to him with
   light and shadow; nothing is drawn on top of him.
   -------------------------------------------------------------------------- */

export const DANGO = {
  src: "/seasons/dango/dango.webp",
  ratio: 0.44, // width divided by height of the artwork
} as const;

/* --------------------------------------------------------------------------
   Colours for each season
   -------------------------------------------------------------------------- */

export const PALETTE = {
  autumn: {
    shelfTop: "#c98f4e",
    shelfLight: "#e2b578",
    shelfEdge: "#8a5a2e",
    shelfUnder: "#efe2c4",
    capA: "#b5562f",
    capB: "#d99a4e",
    stem: "#efe4cc",
    birch: ["#e8b730", "#d98a26", "#f2cf5b"],
    rowan: "#c2452d",
    snow: false,
  },
  winter: {
    shelfTop: "#b98a55",
    shelfLight: "#d6b07c",
    shelfEdge: "#7d5330",
    shelfUnder: "#ece6da",
    capA: "#9c4f33",
    capB: "#c08a52",
    stem: "#efe9dc",
    birch: ["#e6edf1", "#d5e0e6", "#f4f8fa"],
    rowan: "#b8403a",
    snow: true,
  },
} as const;

export const colors = PALETTE[SEASON];
