import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Convex-Auth-Tabellen (authAccounts, authSessions, authRefreshTokens, …).
  ...authTables,

  // users aus authTables mit eigenen Feldern für Rollen + Sicht-Rechte überschrieben.
  // Standardfelder + Indizes von authTables.users müssen erhalten bleiben.
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Eigene Felder:
    role: v.optional(v.string()),              // "admin" | "member"
    approved: v.optional(v.boolean()),         // vom Admin freigeschaltet?
    allowedSections: v.optional(v.array(v.string())), // section-keys (report, daily, social, rankings)
    allowedBrands: v.optional(v.array(v.string())),   // brand-slugs (bodycam, bautv, microvista)
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  brands: defineTable({
    name: v.string(),
    slug: v.string(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
      accent: v.string(),
    }),
    logo: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  phases: defineTable({
    brandId: v.id("brands"),
    order: v.number(),
    name: v.string(),
    shortName: v.string(),
    color: v.string(),
    mindset: v.string(),
    description: v.optional(v.string()),
  }).index("by_brand", ["brandId"]),

  contentPieces: defineTable({
    brandId: v.id("brands"),
    phaseId: v.id("phases"),
    title: v.string(),
    format: v.string(),
    description: v.string(),
    proximity: v.string(),
    status: v.string(),
    priority: v.optional(v.string()),
    goal: v.optional(v.string()),
    targetRoles: v.optional(v.array(v.string())),
  })
    .index("by_brand", ["brandId"])
    .index("by_phase", ["phaseId"])
    .index("by_brand_status", ["brandId", "status"]),

  stakeholders: defineTable({
    brandId: v.id("brands"),
    name: v.string(),
    role: v.string(),
    type: v.string(),
    ageRange: v.string(),
    painPoints: v.array(v.string()),
    gains: v.array(v.string()),
    preferredChannels: v.array(v.string()),
    quote: v.optional(v.string()),
    buyingCenterRole: v.optional(v.string()),
    segment: v.optional(v.string()),
  }).index("by_brand", ["brandId"]),

  journeys: defineTable({
    brandId: v.id("brands"),
    name: v.string(),
    role: v.string(),
    situation: v.string(),
    icon: v.string(),
    color: v.string(),
    stakeholderId: v.optional(v.id("stakeholders")),
  }).index("by_brand", ["brandId"]),

  journeySteps: defineTable({
    journeyId: v.id("journeys"),
    phaseId: v.id("phases"),
    order: v.number(),
    trigger: v.string(),
    searchQuery: v.optional(v.string()),
    contentIds: v.array(v.id("contentPieces")),
    insight: v.string(),
  }).index("by_journey", ["journeyId"]),

  seoClusters: defineTable({
    brandId: v.id("brands"),
    name: v.string(),
    proximity: v.string(),
    description: v.string(),
    topics: v.array(v.string()),
  }).index("by_brand", ["brandId"]),

  editorialPlan: defineTable({
    brandId: v.id("brands"),
    year: v.number(),
    month: v.number(),
    theme: v.string(),
    leadmagnetId: v.optional(v.id("contentPieces")),
    contentTopics: v.array(v.string()),
    cluster: v.string(),
    cta: v.string(),
  }).index("by_brand", ["brandId"]),

  campaigns: defineTable({
    brandId: v.id("brands"),
    name: v.string(),
    objective: v.string(),
    status: v.string(),
    priority: v.optional(v.string()),
    owner: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    budgetTotal: v.optional(v.number()),
    budgetSpent: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_brand", ["brandId"])
    .index("by_brand_status", ["brandId", "status"]),

  campaignScenarios: defineTable({
    campaignId: v.id("campaigns"),
    key: v.string(),
    name: v.string(),
    trigger: v.string(),
    pressAngle: v.string(),
    socialAngle: v.string(),
    adAngle: v.string(),
    cta: v.string(),
    status: v.string(),
    order: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_campaign_status", ["campaignId", "status"]),

  campaignTasks: defineTable({
    campaignId: v.id("campaigns"),
    scenarioId: v.optional(v.id("campaignScenarios")),
    channel: v.string(),
    title: v.string(),
    owner: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.string(),
    priority: v.optional(v.string()),
    assetType: v.optional(v.string()),
    note: v.optional(v.string()),
    link: v.optional(v.string()),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_campaign_status", ["campaignId", "status"])
    .index("by_scenario", ["scenarioId"]),

  campaignAssets: defineTable({
    campaignId: v.id("campaigns"),
    scenarioId: v.optional(v.id("campaignScenarios")),
    title: v.string(),
    category: v.string(),
    filePath: v.string(),
    publicUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    owner: v.optional(v.string()),
    status: v.string(),
    order: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_campaign_status", ["campaignId", "status"])
    .index("by_scenario", ["scenarioId"]),

  kpiSnapshots: defineTable({
    brandId: v.id("brands"),
    date: v.string(), // YYYY-MM-DD
    source: v.union(v.literal("gsc"), v.literal("publer"), v.literal("ads"), v.literal("manual")),
    // GSC fields
    clicks: v.optional(v.number()),
    impressions: v.optional(v.number()),
    ctr: v.optional(v.number()),
    avgPosition: v.optional(v.number()),
    // Publer fields
    socialReach: v.optional(v.number()),
    socialEngagement: v.optional(v.number()),
    socialFollowers: v.optional(v.number()),
    socialPosts: v.optional(v.number()),
    socialVideoViews: v.optional(v.number()),
    socialLinkClicks: v.optional(v.number()),
    // Ads fields
    adSpend: v.optional(v.number()),
    adClicks: v.optional(v.number()),
    adImpressions: v.optional(v.number()),
    adConversions: v.optional(v.number()),
    adCpc: v.optional(v.number()),
    // Manual fields
    leadsCount: v.optional(v.number()),
    leadsNote: v.optional(v.string()),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_brand_source_date", ["brandId", "source", "date"]),

  // Tages-Traffic pro Brand (GA4). Grundlage für Tagesreport + Wochenvergleich.
  // sessions/visitors aus dimensionsloser Total-Query (autoritativ); Kanal-Split
  // aus sessionDefaultChannelGroup kann attributionsbedingt leicht abweichen.
  dailyTraffic: defineTable({
    brandId: v.id("brands"),
    date: v.string(),        // YYYY-MM-DD
    sessions: v.number(),
    visitors: v.number(),
    pageviews: v.number(),
    // Traffic by channel (Sitzungen)
    chAds: v.optional(v.number()),
    chSeo: v.optional(v.number()),
    chDirect: v.optional(v.number()),
    chSocial: v.optional(v.number()),
    chReferral: v.optional(v.number()),
    chOther: v.optional(v.number()),
    // Fragebogen-Funnel (Event-Counts; nur Brands mit Fragebogen, z. B. Microvista)
    fbStart: v.optional(v.number()),
    fbSchritt: v.optional(v.number()),
    fbErgebnis: v.optional(v.number()),
    fbLead: v.optional(v.number()),
    fbAbbruch: v.optional(v.number()),
  })
    .index("by_brand_date", ["brandId", "date"]),

  weeklyReports: defineTable({
    brandId: v.id("brands"),
    kw: v.string(),          // "KW 1", "KW 2" etc.
    weekStart: v.string(),   // YYYY-MM-DD (Monday)
    year: v.number(),
    // Website traffic
    visitors: v.optional(v.number()),
    sessions: v.optional(v.number()),
    pageviews: v.optional(v.number()),
    bounceRate: v.optional(v.number()),
    avgVisitDuration: v.optional(v.string()),
    // Traffic by channel
    chAds: v.optional(v.number()),
    chSeo: v.optional(v.number()),
    chDirect: v.optional(v.number()),
    chSocial: v.optional(v.number()),
    chReferral: v.optional(v.number()),
    chOther: v.optional(v.number()),
    // Visitors by language
    visitorsDE: v.optional(v.number()),
    visitorsEN: v.optional(v.number()),
    visitorsFR: v.optional(v.number()),
    visitorsIT: v.optional(v.number()),
    // KPIs
    leads: v.optional(v.number()),
    adSpend: v.optional(v.number()),
    topKeyword: v.optional(v.string()),
  })
    .index("by_brand_year", ["brandId", "year"]),

  crmLeads: defineTable({
    brandId: v.id("brands"),
    kw: v.number(),
    date: v.string(),        // YYYY-MM-DD
    company: v.string(),
    contactChannel: v.optional(v.string()),
    leadType: v.optional(v.string()),  // Lead | Stammkunde
    description: v.optional(v.string()),
    offerMade: v.optional(v.boolean()),
    orderReceived: v.optional(v.boolean()),
    newCustomer: v.optional(v.boolean()),
    status: v.optional(v.string()),
    note: v.optional(v.string()),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_brand_kw", ["brandId", "kw"]),

  adsCampaigns: defineTable({
    brandId: v.id("brands"),
    period: v.string(),      // "Q1 2026" etc.
    campaignName: v.string(),
    campaignType: v.optional(v.string()),
    budgetPerDay: v.optional(v.number()),
    spend: v.optional(v.number()),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    ctr: v.optional(v.number()),
    conversions: v.optional(v.number()),
  })
    .index("by_brand_period", ["brandId", "period"]),

  publerSnapshots: defineTable({
    brandId: v.id("brands"),
    date: v.string(),           // YYYY-MM-DD
    accountId: v.string(),      // Publer account ID
    accountType: v.string(),    // fb_page, ig_business, in_profile, in_page, youtube
    accountName: v.string(),
    workspaceId: v.string(),
    // Growth
    followers: v.optional(v.number()),
    connections: v.optional(v.number()),   // LinkedIn connections
    profileViews: v.optional(v.number()),  // YouTube total views
    talking: v.optional(v.number()),       // FB people talking about this
    // Reach
    reach: v.optional(v.number()),
    reachRate: v.optional(v.number()),
    // Engagement
    engagement: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    // Content
    videoViews: v.optional(v.number()),
    linkClicks: v.optional(v.number()),
    ctr: v.optional(v.number()),
    posts: v.optional(v.number()),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_account_date", ["accountId", "date"]),

  publerPosts: defineTable({
    brandId: v.id("brands"),
    workspaceId: v.string(),
    publerPostId: v.number(),        // Publer internal post ID
    accountId: v.string(),
    accountType: v.string(),
    accountName: v.string(),
    publishedAt: v.string(),         // ISO date string
    postLink: v.optional(v.string()),
    postType: v.optional(v.string()), // video, image, text, reel
    text: v.optional(v.string()),
    thumbnail: v.optional(v.string()),
    // Metrics
    reach: v.optional(v.number()),
    reachRate: v.optional(v.number()),
    videoViews: v.optional(v.number()),
    likes: v.optional(v.number()),
    comments: v.optional(v.number()),
    shares: v.optional(v.number()),
    postClicks: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    linkClicks: v.optional(v.number()),
    ctr: v.optional(v.number()),
  })
    .index("by_brand_date", ["brandId", "publishedAt"])
    .index("by_publer_id", ["publerPostId"]),

  gadsKeywords: defineTable({
    brandId: v.id("brands"),
    period: v.string(),           // "all-time", "Q1 2026", etc.
    campaign: v.string(),
    adGroup: v.string(),
    keyword: v.string(),
    matchType: v.optional(v.string()),   // Phrase, Exact, Broad
    qualityScore: v.optional(v.number()),
    status: v.string(),                  // Enabled, Paused
    clicks: v.number(),
    cost: v.number(),
    impressions: v.number(),
    conversions: v.number(),
    avgCpc: v.optional(v.number()),
  })
    .index("by_brand_period", ["brandId", "period"])
    .index("by_brand_campaign", ["brandId", "campaign"]),

  gadsCampaignStats: defineTable({
    brandId: v.id("brands"),
    period: v.string(),
    campaign: v.string(),
    campaignType: v.optional(v.string()),
    budget: v.optional(v.number()),
    status: v.string(),
    clicks: v.number(),
    cost: v.number(),
    impressions: v.number(),
    conversions: v.number(),
  })
    .index("by_brand_period", ["brandId", "period"]),

  gadsAdGroups: defineTable({
    brandId: v.id("brands"),
    period: v.string(),
    campaign: v.string(),
    adGroup: v.string(),
    status: v.string(),
    clicks: v.number(),
    cost: v.number(),
    impressions: v.number(),
    conversions: v.number(),
  })
    .index("by_brand_period", ["brandId", "period"])
    .index("by_brand_campaign", ["brandId", "campaign"]),

  publerWorkspaces: defineTable({
    workspaceId: v.string(),       // Publer workspace ID
    name: v.string(),              // Workspace name from Publer API
    brandId: v.optional(v.id("brands")), // Assigned brand (null = unassigned)
    accountCount: v.optional(v.number()), // Number of social accounts
    lastSynced: v.optional(v.string()),   // ISO date of last fetch
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_brand", ["brandId"]),

  kpiTargets: defineTable({
    brandId: v.id("brands"),
    year: v.number(),
    month: v.number(),
    targetClicks: v.optional(v.number()),
    targetLeads: v.optional(v.number()),
    targetReach: v.optional(v.number()),
    targetAdSpend: v.optional(v.number()),
    targetConversions: v.optional(v.number()),
  })
    .index("by_brand_year_month", ["brandId", "year", "month"]),

  // Team-Board: Status-Updates der Claude-Code-Instanzen des Marketing-Teams.
  // Kein UI-Link — nur über /intern/agent-board (key-gated) + /api/team-board/* erreichbar.
  teamTasks: defineTable({
    agent: v.string(),             // z. B. "Claude Code (ffranz)"
    title: v.string(),
    status: v.string(),            // "In Arbeit" | "Fertig" | "Blockiert" | "Backlog"
    notes: v.optional(v.string()), // Fortschritt/Entscheidungen/Ergebnis
    project: v.optional(v.string()), // z. B. "bodycam", "microvista", "seo"
    updatedAt: v.number(),
  })
    .index("by_agent", ["agent"])
    .index("by_status", ["status"]),

  // HTML-Previews: Team veröffentlicht Arbeitsstände als unerratbare URL /p/{slug},
  // damit Bereichsleitung Ergebnisse direkt im Browser ansehen kann. Public read, noindex.
  previews: defineTable({
    slug: v.string(),
    title: v.string(),
    html: v.string(),
    agent: v.string(),
    project: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  // ── SE Ranking ────────────────────────────────────────────────────────────
  // Rank-Tracking + Sichtbarkeit + Competitors + Backlinks pro Brand.
  // Eine Brand kann mehrere SE-Ranking-Sites haben (z. B. bautv = BK DE/NL/IT).

  // Tägliches Sichtbarkeits-Aggregat pro Brand-Site (aus Positions berechnet).
  serankingDaily: defineTable({
    brandId: v.id("brands"),
    siteId: v.number(),          // SE Ranking site_id
    siteTitle: v.string(),       // z. B. "BC DE"
    domain: v.string(),
    date: v.string(),            // YYYY-MM-DD
    totalKeywords: v.number(),
    ranked: v.number(),          // Keywords mit Position > 0
    top3: v.number(),
    top10: v.number(),
    top30: v.number(),
    top100: v.number(),
    avgPosition: v.optional(v.number()), // nur über gerankte Keywords
    totalVolume: v.number(),
    visibilityScore: v.optional(v.number()), // 0–100, volumengewichtet
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_site_date", ["siteId", "date"]),

  // Letzter Stand pro getracktem Keyword (überschrieben pro Sync).
  serankingKeywords: defineTable({
    brandId: v.id("brands"),
    siteId: v.number(),
    keywordId: v.string(),       // SE Ranking keyword id
    keyword: v.string(),
    date: v.string(),            // YYYY-MM-DD des Positionswerts
    position: v.number(),        // 0 = nicht in Top-Tiefe
    change: v.optional(v.number()),
    volume: v.optional(v.number()),
    cpc: v.optional(v.number()),
    competition: v.optional(v.number()),
    url: v.optional(v.string()), // Landingpage in SERP
  })
    .index("by_brand", ["brandId"])
    .index("by_site_keyword", ["siteId", "keywordId"])
    .index("by_brand_position", ["brandId", "position"]),

  // Competitors pro Brand-Site (Snapshot pro Sync, überschrieben).
  serankingCompetitors: defineTable({
    brandId: v.id("brands"),
    siteId: v.number(),
    competitorId: v.number(),
    name: v.string(),
    url: v.string(),
    domainTrust: v.optional(v.number()),
  })
    .index("by_brand", ["brandId"])
    .index("by_site", ["siteId"]),

  // Backlink-Summary pro Brand-Domain (täglich).
  serankingBacklinks: defineTable({
    brandId: v.id("brands"),
    domain: v.string(),
    date: v.string(),            // YYYY-MM-DD
    backlinks: v.number(),
    refDomains: v.number(),
    dofollowBacklinks: v.optional(v.number()),
    nofollowBacklinks: v.optional(v.number()),
    inlinkRank: v.optional(v.number()),        // URL Trust
    domainInlinkRank: v.optional(v.number()),  // Domain Trust
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_domain_date", ["domain", "date"]),

  // On-Demand Keyword-Research (Data API, credits-basiert). Pro Brand gespeichert.
  serankingResearch: defineTable({
    brandId: v.optional(v.id("brands")),
    source: v.string(),          // Regions-DB, z. B. "de"
    keyword: v.string(),
    volume: v.optional(v.number()),
    cpc: v.optional(v.number()),
    competition: v.optional(v.number()),
    difficulty: v.optional(v.number()),
    intents: v.optional(v.array(v.string())),
    isDataFound: v.boolean(),
    fetchedAt: v.number(),
  })
    .index("by_brand", ["brandId"])
    .index("by_keyword", ["source", "keyword"]),
});
