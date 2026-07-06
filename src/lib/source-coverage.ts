export type Granularity = "daily" | "weekly" | "monthly";

export type CoverageMetricView = "coverage" | "impressions" | "costs";

export type CoverageRow = {
  name: string;
  adsInteractions: number;
  googleSearchClicks: number;
  bingSearchClicks: number;
  organicSearchSessions: number;
  socialInteractions: number;
  directSessions: number;
  referralSessions: number;
  otherSessions: number;
  adsImpressions: number;
  googleSearchImpressions: number;
  bingSearchImpressions: number;
  socialReach: number;
  adsCost: number;
};

type KpiSnapshot = {
  date: string;
  source: "ads" | "gsc" | "publer" | string;
  adClicks?: number;
  adImpressions?: number;
  adSpend?: number;
  clicks?: number;
  impressions?: number;
  socialLinkClicks?: number;
  socialReach?: number;
};

type BingRow = {
  date: string;
  clicks?: number;
  impressions?: number;
  aiClicks?: number;
  aiImpressions?: number;
};

type DailyTrafficRow = {
  date: string;
  chSeo?: number;
  chDirect?: number;
  chReferral?: number;
  chOther?: number;
};

const EMPTY_ROW: Omit<CoverageRow, "name"> = {
  adsInteractions: 0,
  googleSearchClicks: 0,
  bingSearchClicks: 0,
  organicSearchSessions: 0,
  socialInteractions: 0,
  directSessions: 0,
  referralSessions: 0,
  otherSessions: 0,
  adsImpressions: 0,
  googleSearchImpressions: 0,
  bingSearchImpressions: 0,
  socialReach: 0,
  adsCost: 0,
};

export const COVERAGE_METRIC_CONFIG: Record<CoverageMetricView, {
  label: string;
  channels: { key: keyof CoverageRow; label: string; color: string }[];
}> = {
  coverage: {
    label: "Abdeckung",
    channels: [
      { key: "adsInteractions", label: "Ads", color: "#ef4444" },
      { key: "googleSearchClicks", label: "Google Search", color: "#22c55e" },
      { key: "bingSearchClicks", label: "Bing Search", color: "#2563eb" },
      { key: "organicSearchSessions", label: "Organic Sessions", color: "#84cc16" },
      { key: "socialInteractions", label: "Social", color: "#8b5cf6" },
      { key: "directSessions", label: "Direct", color: "#0f766e" },
      { key: "referralSessions", label: "Referral", color: "#f59e0b" },
      { key: "otherSessions", label: "Other / Unknown", color: "#64748b" },
    ],
  },
  impressions: {
    label: "Impressionen / Reichweite",
    channels: [
      { key: "adsImpressions", label: "Ads", color: "#ef4444" },
      { key: "googleSearchImpressions", label: "Google Search", color: "#22c55e" },
      { key: "bingSearchImpressions", label: "Bing Search", color: "#2563eb" },
      { key: "socialReach", label: "Social", color: "#8b5cf6" },
    ],
  },
  costs: {
    label: "Werbekosten",
    channels: [
      { key: "adsCost", label: "Ads", color: "#ef4444" },
    ],
  },
};

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function emptyRow(name: string): CoverageRow {
  return { name, ...EMPTY_ROW };
}

function addToRow(target: CoverageRow, source: CoverageRow) {
  for (const key of Object.keys(EMPTY_ROW) as (keyof typeof EMPTY_ROW)[]) {
    target[key] += source[key];
  }
}

export function aggregateSourceCoverage({
  snapshots,
  bingRows,
  dailyTraffic,
  granularity,
  multiYear,
}: {
  snapshots: KpiSnapshot[];
  bingRows: BingRow[];
  dailyTraffic: DailyTrafficRow[];
  granularity: Granularity;
  multiYear: boolean;
}): CoverageRow[] {
  const byDate: Record<string, CoverageRow> = {};
  const day = (date: string) => {
    if (!byDate[date]) byDate[date] = emptyRow(date);
    return byDate[date];
  };

  for (const snapshot of snapshots) {
    const row = day(snapshot.date);
    if (snapshot.source === "ads") {
      row.adsInteractions += snapshot.adClicks ?? 0;
      row.adsImpressions += snapshot.adImpressions ?? 0;
      row.adsCost += snapshot.adSpend ?? 0;
    } else if (snapshot.source === "gsc") {
      row.googleSearchClicks += snapshot.clicks ?? 0;
      row.googleSearchImpressions += snapshot.impressions ?? 0;
    } else if (snapshot.source === "publer") {
      row.socialInteractions += snapshot.socialLinkClicks ?? 0;
      row.socialReach += snapshot.socialReach ?? 0;
    }
  }

  for (const bing of bingRows) {
    const row = day(bing.date);
    row.bingSearchClicks += (bing.clicks ?? 0) + (bing.aiClicks ?? 0);
    row.bingSearchImpressions += (bing.impressions ?? 0) + (bing.aiImpressions ?? 0);
  }

  for (const traffic of dailyTraffic) {
    const row = day(traffic.date);
    row.organicSearchSessions += traffic.chSeo ?? 0;
    row.directSessions += traffic.chDirect ?? 0;
    row.referralSessions += traffic.chReferral ?? 0;
    row.otherSessions += traffic.chOther ?? 0;
  }

  const sortedDates = Object.keys(byDate).sort();
  if (granularity === "daily") {
    return sortedDates.map((date) => ({ ...byDate[date], name: date.slice(5) }));
  }

  const buckets: Record<string, CoverageRow> = {};
  for (const date of sortedDates) {
    const d = new Date(`${date}T12:00:00Z`);
    let key: string;
    let label: string;

    if (granularity === "weekly") {
      const dayOfWeek = d.getDay() || 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek + 1);
      key = monday.toISOString().slice(0, 10);
      label = multiYear ? `${d.getFullYear()} KW${getISOWeek(d)}` : `KW ${getISOWeek(d)}`;
    } else {
      key = date.slice(0, 7);
      label = multiYear ? key : d.toLocaleDateString("de-DE", { month: "short" });
    }

    if (!buckets[key]) buckets[key] = emptyRow(label);
    addToRow(buckets[key], byDate[date]);
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);
}
