import type { Json } from "@/lib/types/database.types";

export interface VenueBrand {
  name: string;
  headingFont: string;
  bodyFont: string;
  goldColor: string;
  blackColor: string;
}

const DEFAULTS: Omit<VenueBrand, "name"> = {
  headingFont: "Georgia, serif",
  bodyFont: "Helvetica, Arial, sans-serif",
  goldColor: "#c8a24a",
  blackColor: "#0d0d0d",
};

/**
 * Reads brand values from venues.brand_config (JSON) at render time.
 * Falls back to neutral defaults for a venue that hasn't configured its
 * brand yet, rather than hardcoding The Queens' specific values here.
 */
export function resolveBrand(venueName: string, brandConfig: Json): VenueBrand {
  const config = (brandConfig && typeof brandConfig === "object" && !Array.isArray(brandConfig)
    ? (brandConfig as Record<string, Json>)
    : {}) as Record<string, string | undefined>;

  return {
    name: venueName,
    headingFont: config.headingFont ?? DEFAULTS.headingFont,
    bodyFont: config.bodyFont ?? DEFAULTS.bodyFont,
    goldColor: config.goldColor ?? DEFAULTS.goldColor,
    blackColor: config.blackColor ?? DEFAULTS.blackColor,
  };
}
