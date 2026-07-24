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
    pending: v.optional(v.boolean()),          // vom Admin vorgemerkt, noch nicht selbst registriert
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

  // ── AI Visibility / GEO ──────────────────────────────────────────────────
  // Prompt-Stammdaten: echte Entscheidungsfragen statt klassischer Keywords.
  aiPrompts: defineTable({
    brandId: v.id("brands"),
    prompt: v.string(),
    language: v.string(),         // de, en, nl, it
    region: v.string(),           // DE, NL, IT, global
    persona: v.string(),
    funnelStage: v.string(),      // awareness, consideration, decision
    priority: v.number(),         // 1-5
    cluster: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_brand", ["brandId"])
    .index("by_brand_active", ["brandId", "active"])
    .index("by_brand_prompt", ["brandId", "prompt"])
    .index("by_cluster", ["cluster"]),

  // Aggregierter Snapshot pro Prompt/Engine/Datum.
  aiVisibilitySnapshots: defineTable({
    brandId: v.id("brands"),
    promptId: v.id("aiPrompts"),
    date: v.string(),             // YYYY-MM-DD
    engine: v.string(),           // chatgpt, perplexity, gemini, ai-overview, ai-mode, bing-ai
    region: v.string(),
    brandMentioned: v.boolean(),
    brandPosition: v.optional(v.number()),
    mentionRate: v.optional(v.number()),
    linkPresent: v.boolean(),
    citationShare: v.optional(v.number()),
    sentiment: v.union(
      v.literal("positive"),
      v.literal("neutral"),
      v.literal("negative"),
      v.literal("unknown")
    ),
    competitorsMentioned: v.array(v.string()),
    sourceProvider: v.union(
      v.literal("seranking"),
      v.literal("bing"),
      v.literal("manual"),
      v.literal("dataforseo"),
      v.literal("ahrefs")
    ),
    rawUrl: v.optional(v.string()),
    fetchedAt: v.number(),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_prompt_date", ["promptId", "date"])
    .index("by_prompt_engine_date", ["promptId", "engine", "date"])
    .index("by_engine_date", ["engine", "date"]),

  // Antwort- und Quellen-Snapshot fuer Review, Citation-Analyse und Content-Ideen.
  aiResponseSnapshots: defineTable({
    brandId: v.id("brands"),
    promptId: v.id("aiPrompts"),
    date: v.string(),             // YYYY-MM-DD
    engine: v.string(),
    answerSummary: v.optional(v.string()),
    mentionedBrands: v.array(v.string()),
    citedUrls: v.array(v.string()),
    citedDomains: v.array(v.string()),
    missingAngles: v.array(v.string()),
    rawResponse: v.optional(v.string()),
    sourceProvider: v.union(
      v.literal("seranking"),
      v.literal("bing"),
      v.literal("manual"),
      v.literal("dataforseo"),
      v.literal("ahrefs")
    ),
    fetchedAt: v.number(),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_prompt_date", ["promptId", "date"])
    .index("by_prompt_engine_date", ["promptId", "engine", "date"]),

  // Bing classic Search Performance + AI Performance CSV-Import.
  bingSearchSnapshots: defineTable({
    brandId: v.id("brands"),
    date: v.string(),             // YYYY-MM-DD
    query: v.optional(v.string()),
    page: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
    clicks: v.optional(v.number()),
    impressions: v.optional(v.number()),
    ctr: v.optional(v.number()),
    position: v.optional(v.number()),
    aiImpressions: v.optional(v.number()),
    aiClicks: v.optional(v.number()),
    aiCitations: v.optional(v.number()),
    aiCitationShare: v.optional(v.number()),
    topic: v.optional(v.string()),
    intent: v.optional(v.string()),
    sourceProvider: v.union(v.literal("bing-api"), v.literal("bing-export")),
    importedAt: v.number(),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_query", ["query"])
    .index("by_page", ["page"]),

  // ── Datalake (Design: docs/superpowers/specs/2026-07-13-datalake-attribution-design.md) ──
  persons: defineTable({
    brandId: v.id("brands"),
    hubspotContactId: v.optional(v.string()),
    firstSeen: v.number(),
  }).index("by_brand", ["brandId"]),

  identityKeys: defineTable({
    personId: v.id("persons"),
    brandId: v.id("brands"),
    keyType: v.string(),   // "emailHmac" | "phoneHmac" | "pid" | "gaClientId" | "hubspotContactId"
    keyValue: v.string(),
    validFrom: v.number(),
    validTo: v.optional(v.number()),
    evidence: v.string(),  // sourceRecord-Schlüssel
    conflictStatus: v.string(), // "unique" | "shared" | "disputed"
  })
    .index("by_key", ["brandId", "keyType", "keyValue"])
    .index("by_person", ["personId"]),

  sourceRecords: defineTable({
    brandId: v.id("brands"),
    source: v.string(),        // "web" | "hubspot" | "cleverreach" | "ads" | "fair"
    sourceAccount: v.string(), // z. B. "bautvplus.com"
    objectType: v.string(),    // "event" | "lead" | "contact" | "deal"
    externalId: v.string(),
    eventType: v.string(),
    sourceVersion: v.number(),
  }).index("by_unique", ["brandId", "source", "sourceAccount", "objectType", "externalId", "eventType", "sourceVersion"]),

  touchpoints: defineTable({
    personId: v.optional(v.id("persons")),
    brandId: v.id("brands"),
    ts: v.number(),
    type: v.string(),      // "ad_click" | "pageview" | "form_start" | "email_click" | "nl_click" | "call" | "meeting" | "chat" | "fair_contact"
    channel: v.string(),   // utm_source oder "direct"
    campaignId: v.optional(v.string()),
    adgroupId: v.optional(v.string()),
    adId: v.optional(v.string()),
    keyword: v.optional(v.string()),
    device: v.optional(v.string()),
    urlPath: v.optional(v.string()),
    pid: v.optional(v.string()),
    clickIds: v.optional(v.object({
      gclid: v.optional(v.string()),
      fbclid: v.optional(v.string()),
      msclkid: v.optional(v.string()),
    })),
    sourceRecordId: v.id("sourceRecords"),
  })
    .index("by_brand_ts", ["brandId", "ts"])
    .index("by_person", ["personId"])
    .index("by_pid", ["brandId", "pid"]),

  conversions: defineTable({
    personId: v.id("persons"),
    brandId: v.id("brands"),
    ts: v.number(),
    type: v.string(),      // "lead" | "mql" | "sql" | "deal_won" | "deal_lost"
    value: v.optional(v.number()),
    currency: v.string(),
    hubspotDealId: v.optional(v.string()),
    eventId: v.string(),
    sourceRecordId: v.id("sourceRecords"),
    pid: v.optional(v.string()),
    clickIds: v.optional(v.object({
      gclid: v.optional(v.string()),
      fbclid: v.optional(v.string()),
      msclkid: v.optional(v.string()),
    })),
  })
    .index("by_brand_ts", ["brandId", "ts"])
    .index("by_person", ["personId"]),

  consentLedger: defineTable({
    personId: v.id("persons"),
    brandId: v.id("brands"),
    purpose: v.string(),      // "analytics" | "ads"
    legalBasis: v.string(),   // "consent" | "contract" | "legitimate_interest"
    grantedAt: v.number(),
    revokedAt: v.optional(v.number()),
    retentionUntil: v.optional(v.number()),
  }).index("by_person", ["personId"]),

  ingestNonces: defineTable({
    nonce: v.string(),
    ts: v.number(),
  })
    .index("by_nonce", ["nonce"])
    .index("by_ts", ["ts"]),

  // ── Datalake Paket B: Ad-Level-Kosten (Plan: docs/superpowers/plans/2026-07-14-datalake-paket-b-kosten.md) ──
  adCosts: defineTable({
    brandId: v.id("brands"),        // Klassifikation (detectBrand), NICHT Teil der Identität
    channel: v.string(),            // "google" | "bing" | "facebook"
    sourceAccount: v.string(),      // Plattform-Konto: Google-CID | MS-Account-ID | "act_…"
    date: v.string(),               // "YYYY-MM-DD" im Konto-Tag der jeweiligen Plattform
    campaignId: v.string(),
    campaignName: v.optional(v.string()),
    adgroupId: v.string(),          // "" wenn Ebene nicht existiert (z. B. PMax)
    adId: v.string(),               // "" wenn Ebene nicht existiert
    impressions: v.number(),
    clicks: v.number(),             // Meta: inline_link_clicks (Vergleichbarkeit mit Google-Klicks)
    spend: v.number(),              // EUR, ungerundet — Summen müssen Plattformtotalen entsprechen
    currency: v.string(),
    syncedAt: v.number(),
  })
    // by_unique deckt per Präfix (channel, sourceAccount, date) auch den Stale-Sweep ab.
    .index("by_unique", ["channel", "sourceAccount", "date", "campaignId", "adgroupId", "adId"])
    .index("by_brand_date", ["brandId", "date"]),

  clickViews: defineTable({
    brandId: v.id("brands"),
    sourceAccount: v.string(),
    gclid: v.string(),
    date: v.string(),
    campaignId: v.string(),
    adgroupId: v.string(),
    adId: v.string(),
    clickType: v.optional(v.string()),
    keyword: v.optional(v.string()),
    syncedAt: v.number(),
  })
    .index("by_gclid", ["gclid", "date"])
    .index("by_brand_date", ["brandId", "date"]),

  // MS rotiert Refresh-Tokens; der jeweils neueste muss persistiert werden, sonst stirbt der Cron.
  oauthTokens: defineTable({
    provider: v.string(),           // "msads"
    refreshToken: v.string(),
    updatedAt: v.number(),
  }).index("by_provider", ["provider"]),

  // ── Datalake Paket D: Attribution (Plan: docs/superpowers/plans/2026-07-14-datalake-paket-d-attribution.md) ──
  attributionFacts: defineTable({
    brandId: v.id("brands"),
    generation: v.number(),
    model: v.string(),             // "first" | "last" | "last_non_direct" | "linear" | "position" | "time_decay"
    conversionId: v.id("conversions"),
    conversionType: v.string(),    // denormalisiert für Aggregation ohne Join
    conversionTs: v.number(),
    value: v.number(),             // 0 wenn Conversion ohne value
    currency: v.string(),
    weight: v.number(),            // Anteil dieses Touchpoints an der Conversion (Σ je conversion+model = 1)
    modelVersion: v.optional(v.string()), // "v1" — optional nur wegen Bestandsdaten der Erst-Generation
    touchpointId: v.optional(v.id("touchpoints")), // fehlt beim "unattributed"-Fact und beim gclid-Backstop
    // Dimensionen des Touchpoints, denormalisiert:
    channel: v.string(),           // utm_source | "direct" | "unattributed" (kein zuordenbarer Touchpoint!)
    sourceAccount: v.optional(v.string()), // Plattform-Konto (nur wenn bekannt, z. B. gclid-Backstop)
    campaignId: v.optional(v.string()),
    adgroupId: v.optional(v.string()),
    adId: v.optional(v.string()),
  })
    .index("by_brand_gen_model_ts", ["brandId", "generation", "model", "conversionTs"])
    .index("by_conversion", ["conversionId", "generation"]),

  // Anonyme Web-Sessions (Tagesaggregat aus Cloudflare Analytics Engine).
  // Session-Definition: gleiche Tages-Hash-Kennung, Lücke < 30 Min; harte
  // Tagesgrenze (Hash rotiert täglich, keine tagesübergreifende Wiedererkennung).
  webSessionDaily: defineTable({
    brandId: v.id("brands"),
    date: v.string(),          // YYYY-MM-DD (UTC — Rotationsgrenze des Hashes)
    sessions: v.number(),
    visitors: v.number(),      // eindeutige Tages-Hashes
    pageviews: v.number(),
    pagesPerSession: v.number(),
    campaignSessions: v.number(), // Sessions mit utm_source am Einstieg
    syncedAt: v.number(),
  }).index("by_brand_date", ["brandId", "date"]),

  // GSC Brand/Non-Brand-Split (Regex-Filter der Search-Analytics-API).
  gscQuerySplitDaily: defineTable({
    brandId: v.id("brands"),
    date: v.string(),
    brandClicks: v.number(),
    brandImpressions: v.number(),
    nonBrandClicks: v.number(),
    nonBrandImpressions: v.number(),
    topNonBrandQueries: v.string(), // JSON [{query, clicks, impressions, position}] Top 5
    syncedAt: v.number(),
  }).index("by_brand_date", ["brandId", "date"]),

  // Indexierungs-Monitoring (URL-Inspection-Stichprobe aus der Sitemap).
  indexCoverage: defineTable({
    brandId: v.id("brands"),
    date: v.string(),
    inspected: v.number(),
    indexed: v.number(),
    notIndexed: v.number(),
    failures: v.string(),   // JSON [{url, verdict, coverageState}] nur die Nicht-Indexierten
    syncedAt: v.number(),
  }).index("by_brand_date", ["brandId", "date"]),

  // Aktive Facts-Generation je Brand — Leser sehen nur diese; Swap erst nach fehlerfreiem Komplettlauf.
  attributionMeta: defineTable({
    brandId: v.id("brands"),
    activeGeneration: v.number(),
    computedAt: v.number(),
    lookbackDays: v.number(),
    conversions: v.number(),
    facts: v.number(),
  }).index("by_brand", ["brandId"]),

  // ── Forecast (Chronos-2, externer nächtlicher Python-Prozess) ───────────────
  // 14-Tage-Prognosen (p10/p50/p90) je Marke/Metrik + Anomalien aus 7-Tage-Backtest.
  // Generation-Swap wie attributionFacts: Sweep erst nach fehlerfreiem Komplettlauf.
  forecasts: defineTable({
    brandId: v.id("brands"),
    metric: v.union(v.literal("sessions"), v.literal("adSpend"), v.literal("adConversions")),
    date: v.string(),        // YYYY-MM-DD
    p10: v.number(),
    p50: v.number(),
    p90: v.number(),
    generation: v.number(),
    computedAt: v.number(),
  })
    .index("by_brand_metric_date", ["brandId", "metric", "date"])
    .index("by_generation", ["generation"]),

  forecastAnomalies: defineTable({
    brandId: v.id("brands"),
    metric: v.union(v.literal("sessions"), v.literal("adSpend"), v.literal("adConversions")),
    date: v.string(),        // YYYY-MM-DD
    actual: v.number(),
    p10: v.number(),
    p90: v.number(),
    severity: v.union(v.literal("warn"), v.literal("critical")),
    generation: v.number(),
    computedAt: v.number(),
  })
    .index("by_brand_date", ["brandId", "date"])
    .index("by_generation", ["generation"]),
});
