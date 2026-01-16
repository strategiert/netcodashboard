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
  }).index("by_brand", ["brandId"]),

  journeys: defineTable({
    brandId: v.id("brands"),
    name: v.string(),
    role: v.string(),
    situation: v.string(),
    icon: v.string(),
    color: v.string(),
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
});
