import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
});
