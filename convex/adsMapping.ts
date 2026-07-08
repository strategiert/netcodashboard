export function shouldIncludeInPerformanceSnapshot(channelType: string | undefined | null): boolean {
  return Boolean(channelType);
}

// Campaign name keywords per brand slug (case-insensitive match).
// NL-Markt-Kampagnen (BC/BK) werden per Markt-Token im Namen auf die
// eigenen NL-Brands (bodycam-nl / bautv-nl) gemappt, z. B. "BC-SN-NL -Conmax",
// "BK-PerformanceMax-Leads-NL". DE-Kampagnen tragen "-D".
export const BRAND_KEYWORDS: Record<string, string[]> = {
  bodycam:    ["bodycam", "body-cam", "body cam", "netco-bc", "bc-"],
  microvista: ["microvista", "micro vista", "ndt-"],
  bautv:      ["bautv", "bau-tv", "baustellenkamera", "btv-", "bk-"],
  netco:      ["nc-", "netco-"],
};

// Brands, für die Ads-Snapshots geschrieben werden (auch 0-Tage).
export const TRACKED_ADS_BRANDS = [...Object.keys(BRAND_KEYWORDS), "bodycam-nl", "bautv-nl"];

// "NL" als eigenständiges Token (nicht Teil eines Wortes wie "online").
const NL_TOKEN = /(^|[^a-z])nl(?![a-z])/i;

export function isNlCampaign(campaignName: string): boolean {
  return NL_TOKEN.test(campaignName);
}

export function detectBrand(campaignName: string): string | null {
  const lower = campaignName.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      if ((brand === "bodycam" || brand === "bautv") && isNlCampaign(campaignName)) {
        return `${brand}-nl`;
      }
      return brand;
    }
  }
  return null;
}
