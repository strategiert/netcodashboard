# NetCo Dashboard Unified Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the KPI tracking dashboard (from `_archive/Dashboard`) into the existing NetCo Marketing Workstation (`strategiert/netcodashboard`), adding live data from GSC, Publer, and Google Ads via Convex Scheduled Actions.

**Architecture:** Convex (`sensible-bobcat-155`) serves as the single backend. New tables `kpiSnapshots` and `kpiTargets` store daily metric data. Three Convex scheduled actions pull data daily from GSC, Publer, and Google Ads. The Brand Dashboard page gets a KPI strip at the top; two new pages (`/[brand]/kpis` and `/kpis`) serve detailed analytics and executive overview.

**Tech Stack:** Next.js 14 (App Router), Convex, shadcn/ui, Tailwind CSS, Google Search Console API (service account), Publer REST API, Google Ads API (OAuth2 + Developer Token)

**Note on `api.brands.list`:** `convex/brands.ts` already exports `list` (returns all brands, no args). All sync actions use `api.brands.list` — do NOT add a duplicate `listAll`.

---

## Chunk 1: Convex Schema + Data Layer

### Task 1: Extend Convex Schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add `kpiSnapshots` and `kpiTargets` tables to schema**

Open `convex/schema.ts` and add after the closing `});` of the `campaignAssets` table definition, before the final `});` closing the schema:

```typescript
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
```

- [ ] **Step 2: Verify schema compiles**

```bash
cd C:\Users\karent\Documents\Software\netco\_shared\dashboard
npx convex dev --once
```
Expected: no TypeScript errors, `_generated/dataModel.d.ts` updated with `kpiSnapshots` and `kpiTargets`.

- [ ] **Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(convex): add kpiSnapshots and kpiTargets tables"
```

---

### Task 2: Convex KPI Queries and Mutations

**Files:**
- Create: `convex/kpi.ts`

- [ ] **Step 1: Create `convex/kpi.ts`**

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getTodayAllSources = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const today = new Date().toISOString().slice(0, 10);
    return await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).eq("date", today))
      .collect();
  },
});

export const getYesterdayAllSources = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, { brandId }) => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    return await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_date", (q) => q.eq("brandId", brandId).eq("date", yesterday))
      .collect();
  },
});

export const getSnapshotsRange = query({
  args: { brandId: v.id("brands"), source: v.string(), days: v.number() },
  handler: async (ctx, { brandId, source, days }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    return await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_source_date", (q) =>
        q.eq("brandId", brandId).eq("source", source as any).gte("date", sinceStr)
      )
      .order("asc")
      .collect();
  },
});

export const getAllBrandsLatest = query({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db.query("brands").collect();
    const today = new Date().toISOString().slice(0, 10);
    const result = [];
    for (const brand of brands) {
      const snapshots = await ctx.db
        .query("kpiSnapshots")
        .withIndex("by_brand_date", (q) => q.eq("brandId", brand._id).eq("date", today))
        .collect();
      result.push({ brand, snapshots });
    }
    return result;
  },
});

export const getTarget = query({
  args: { brandId: v.id("brands"), year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kpiTargets")
      .withIndex("by_brand_year_month", (q) =>
        q.eq("brandId", args.brandId).eq("year", args.year).eq("month", args.month)
      )
      .first() ?? null;
  },
});

export const upsertSnapshot = mutation({
  args: {
    brandId: v.id("brands"),
    date: v.string(),
    source: v.union(v.literal("gsc"), v.literal("publer"), v.literal("ads"), v.literal("manual")),
    clicks: v.optional(v.number()),
    impressions: v.optional(v.number()),
    ctr: v.optional(v.number()),
    avgPosition: v.optional(v.number()),
    socialReach: v.optional(v.number()),
    socialEngagement: v.optional(v.number()),
    socialFollowers: v.optional(v.number()),
    socialPosts: v.optional(v.number()),
    adSpend: v.optional(v.number()),
    adClicks: v.optional(v.number()),
    adImpressions: v.optional(v.number()),
    adConversions: v.optional(v.number()),
    adCpc: v.optional(v.number()),
    leadsCount: v.optional(v.number()),
    leadsNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kpiSnapshots")
      .withIndex("by_brand_source_date", (q) =>
        q.eq("brandId", args.brandId).eq("source", args.source).eq("date", args.date)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("kpiSnapshots", args);
  },
});

export const upsertTarget = mutation({
  args: {
    brandId: v.id("brands"),
    year: v.number(),
    month: v.number(),
    targetClicks: v.optional(v.number()),
    targetLeads: v.optional(v.number()),
    targetReach: v.optional(v.number()),
    targetAdSpend: v.optional(v.number()),
    targetConversions: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("kpiTargets")
      .withIndex("by_brand_year_month", (q) =>
        q.eq("brandId", args.brandId).eq("year", args.year).eq("month", args.month)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("kpiTargets", args);
  },
});
```

- [ ] **Step 2: Verify compiles**

```bash
npx convex dev --once
```
Expected: no errors, `api.kpi.*` available in generated types.

- [ ] **Step 3: Commit**

```bash
git add convex/kpi.ts
git commit -m "feat(convex): add KPI queries and mutations"
```

---

## Chunk 2: Sync Actions (GSC + Publer + Ads)

### Task 3: GSC Sync Action

**Files:**
- Create: `convex/actions/syncGSC.ts`
- Modify: (none — `api.brands.list` already exists in `convex/brands.ts`)

- [ ] **Step 1: Install google-auth-library**

```bash
cd C:\Users\karent\Documents\Software\netco\_shared\dashboard
npm install google-auth-library
```

- [ ] **Step 2: Set Convex environment secrets for GSC**

```bash
npx convex env set GSC_SERVICE_ACCOUNT_JSON "$(cat C:/Users/karent/.env | grep -A 25 '^GSC_SERVICE_ACCOUNT_JSON=' | python3 -c \"import sys; raw=sys.stdin.read(); start=raw.index('{'); end=raw.rindex('}')+1; import json; print(json.dumps(json.loads(raw[start:end])))\")"
npx convex env set GSC_PROPERTY_BODYCAM "https://www.netco-bodycam.com/"
npx convex env set GSC_PROPERTY_MICROVISTA "https://www.microvista.de/"
npx convex env set GSC_PROPERTY_BAUTV "https://www.bautv.de/"
```
**Note:** Verify the 3 property URLs match exactly what's registered in Google Search Console (Search Console → Property Selector to confirm).

- [ ] **Step 3: Create `convex/actions/syncGSC.ts`**

```typescript
"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

const GSC_PROPERTIES: Record<string, string> = {
  bodycam: process.env.GSC_PROPERTY_BODYCAM ?? "",
  microvista: process.env.GSC_PROPERTY_MICROVISTA ?? "",
  bautv: process.env.GSC_PROPERTY_BAUTV ?? "",
};

async function fetchGSCData(property: string, date: string) {
  const serviceAccountJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GSC_SERVICE_ACCOUNT_JSON not set");

  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: JSON.parse(serviceAccountJson),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate: date, endDate: date, dimensions: [] }),
    }
  );

  if (!res.ok) throw new Error(`GSC API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const row = data.rows?.[0];
  if (!row) return null;
  return {
    clicks: row.clicks as number,
    impressions: row.impressions as number,
    ctr: row.ctr as number,
    avgPosition: row.position as number,
  };
}

export const syncGSC = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const property = GSC_PROPERTIES[brand.slug];
      if (!property) { results.push(`SKIP ${brand.slug}: no property`); continue; }
      try {
        const data = await fetchGSCData(property, date);
        if (!data) { results.push(`SKIP ${brand.slug}: no data for ${date}`); continue; }
        await ctx.runMutation(api.kpi.upsertSnapshot, { brandId: brand._id, date, source: "gsc", ...data });
        results.push(`OK ${brand.slug}: clicks=${data.clicks}`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});
```

- [ ] **Step 4: Verify compiles**

```bash
npx convex dev --once
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add convex/actions/syncGSC.ts package.json package-lock.json
git commit -m "feat(convex): add GSC sync action"
```

---

### Task 4: Verify Publer API + Create Sync Action

**Prerequisite:** Task 3 complete (uses `api.brands.list` which already exists).

**Files:**
- Create: `convex/actions/syncPubler.ts`

- [ ] **Step 1: Fetch Publer accounts to get IDs and verify API shape**

```bash
curl -s -H "Authorization: Bearer 56b1f631e54605aa71572eefb336667d836eded8d8d12a23" \
  https://app.publer.io/api/v1/accounts | python3 -m json.tool
```
Expected: JSON array of accounts with `id`, `name`/`label` fields. Note the `id` for each of the 3 brands (bodycam, microvista, bautv).

- [ ] **Step 2: Fetch sample analytics to verify response field names**

Replace `<ACCOUNT_ID>` with one of the IDs from Step 1:
```bash
curl -s -H "Authorization: Bearer 56b1f631e54605aa71572eefb336667d836eded8d8d12a23" \
  "https://app.publer.io/api/v1/analytics?account_id=<ACCOUNT_ID>&start=2026-03-10&end=2026-03-10" \
  | python3 -m json.tool
```
Note the exact field names for: reach/impressions, engagements/engagement, followers, posts count. These go into `syncPubler.ts` Step 3.

- [ ] **Step 3: Add Publer account IDs to `.env.local` and Convex env**

In `C:\Users\karent\Documents\Software\netco\_shared\dashboard\.env.local` add:
```
PUBLER_ACCOUNT_ID_BODYCAM=<id from Step 1>
PUBLER_ACCOUNT_ID_MICROVISTA=<id from Step 1>
PUBLER_ACCOUNT_ID_BAUTV=<id from Step 1>
```

Set in Convex:
```bash
npx convex env set PUBLER_API_KEY "56b1f631e54605aa71572eefb336667d836eded8d8d12a23"
npx convex env set PUBLER_ACCOUNT_ID_BODYCAM "<id>"
npx convex env set PUBLER_ACCOUNT_ID_MICROVISTA "<id>"
npx convex env set PUBLER_ACCOUNT_ID_BAUTV "<id>"
```

- [ ] **Step 4: Create `convex/actions/syncPubler.ts`**

Use the exact field names confirmed in Step 2. The template below uses common Publer field names — update if Step 2 shows different names:

```typescript
"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

const PUBLER_ACCOUNT_IDS: Record<string, string> = {
  bodycam:    process.env.PUBLER_ACCOUNT_ID_BODYCAM ?? "",
  microvista: process.env.PUBLER_ACCOUNT_ID_MICROVISTA ?? "",
  bautv:      process.env.PUBLER_ACCOUNT_ID_BAUTV ?? "",
};

async function fetchPublerAnalytics(accountId: string, date: string) {
  const apiKey = process.env.PUBLER_API_KEY;
  if (!apiKey) throw new Error("PUBLER_API_KEY not set");

  const res = await fetch(
    `https://app.publer.io/api/v1/analytics?account_id=${accountId}&start=${date}&end=${date}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!res.ok) throw new Error(`Publer ${res.status}: ${await res.text()}`);
  const data = await res.json();

  // IMPORTANT: Update field names below based on actual API response from Task 4 Step 2
  return {
    socialReach:       data.reach       ?? data.impressions  ?? 0,
    socialEngagement:  data.engagements ?? data.engagement   ?? 0,
    socialFollowers:   data.followers   ?? 0,
    socialPosts:       data.posts_count ?? data.posts        ?? 0,
  };
}

export const syncPubler = action({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.runQuery(api.brands.list);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const results: string[] = [];
    for (const brand of brands) {
      const accountId = PUBLER_ACCOUNT_IDS[brand.slug];
      if (!accountId) { results.push(`SKIP ${brand.slug}: no account ID`); continue; }
      try {
        const data = await fetchPublerAnalytics(accountId, date);
        await ctx.runMutation(api.kpi.upsertSnapshot, { brandId: brand._id, date, source: "publer", ...data });
        results.push(`OK ${brand.slug}: reach=${data.socialReach}`);
      } catch (e: any) {
        results.push(`ERROR ${brand.slug}: ${e.message}`);
      }
    }
    return results;
  },
});
```

- [ ] **Step 5: Verify compiles**

```bash
npx convex dev --once
```

- [ ] **Step 6: Commit**

```bash
git add convex/actions/syncPubler.ts
git commit -m "feat(convex): add Publer sync action"
```

---

### Task 5: Google Ads Auth Script + Sync Action

**Prerequisite:** Task 3 complete.

**Files:**
- Create: `scripts/ads-auth.ts`
- Create: `convex/actions/syncAds.ts`

- [ ] **Step 1: Add tsx as dev dependency**

```bash
npm install -D tsx
```

- [ ] **Step 2: Create `scripts/ads-auth.ts`**

```typescript
// Einmaliges Script zum Generieren des Google Ads Refresh Tokens
// Ausführen: npx tsx --env-file=.env.local scripts/ads-auth.ts

import * as http from "http";
import * as url from "url";

const CLIENT_ID = process.env.GADS_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.GADS_OAUTH_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:8080";
const SCOPE = "https://www.googleapis.com/auth/adwords";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("GADS_OAUTH_CLIENT_ID or GADS_OAUTH_CLIENT_SECRET not set in .env.local");
  process.exit(1);
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPE)}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log("\nÖffne diese URL im Browser:\n");
console.log(authUrl);
console.log("\nWarte auf Callback auf http://localhost:8080 ...\n");

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url ?? "", true);
  const code = parsed.query.code as string;
  if (!code) { res.end("Kein Code erhalten."); return; }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI, grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json() as any;

  if (!tokens.refresh_token) {
    console.error("Kein Refresh Token erhalten:", JSON.stringify(tokens));
    res.end("Fehler — kein refresh_token. Schau in die Konsole.");
    server.close();
    return;
  }

  console.log("\n✅ Refresh Token:\n");
  console.log(`GADS_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\nIn .env.local eintragen und dann: npx convex env set GADS_REFRESH_TOKEN <token>\n");
  res.end("✅ Fertig! Schau in die Konsole.");
  server.close();
});

server.listen(8080);
```

- [ ] **Step 3: Add ads:auth script to package.json**

In `package.json` → `"scripts"` block, add:
```json
"ads:auth": "tsx --env-file=.env.local scripts/ads-auth.ts"
```

- [ ] **Step 4: Set Convex env for Ads (excluding refresh token — that comes later)**

```bash
npx convex env set GADS_OAUTH_CLIENT_ID "<your-client-id>"
npx convex env set GADS_OAUTH_CLIENT_SECRET "<your-client-secret>"
npx convex env set GADS_MANAGER_CUSTOMER_ID "<your-manager-customer-id>"
npx convex env set GADS_DEVELOPER_TOKEN "<your-developer-token>"
npx convex env set GADS_CUSTOMER_ID_NETCO "<your-customer-id>"
```

- [ ] **Step 5: Create `convex/actions/syncAds.ts`**

```typescript
"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

// Campaign name keywords per brand slug (case-insensitive match)
const BRAND_KEYWORDS: Record<string, string[]> = {
  bodycam:    ["bodycam", "body-cam", "body cam", "netco-bc"],
  microvista: ["microvista", "micro vista"],
  bautv:      ["bautv", "bau-tv", "baustellenkamera"],
};

async function getAdsToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GADS_OAUTH_CLIENT_ID!,
      client_secret: process.env.GADS_OAUTH_CLIENT_SECRET!,
      refresh_token: process.env.GADS_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function fetchAdsCampaigns(token: string, date: string) {
  const customerId =        process.env.GADS_CUSTOMER_ID_NETCO!.replace(/-/g, "");
  const developerToken =    process.env.GADS_DEVELOPER_TOKEN!;
  const managerCustomerId = process.env.GADS_MANAGER_CUSTOMER_ID!.replace(/-/g, "");

  const query = `
    SELECT campaign.name, metrics.cost_micros, metrics.clicks,
           metrics.impressions, metrics.conversions, metrics.average_cpc
    FROM campaign
    WHERE segments.date = '${date}' AND campaign.status = 'ENABLED'
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization:      `Bearer ${token}`,
        "developer-token":  developerToken,
        "login-customer-id": managerCustomerId,
        "Content-Type":     "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  if (!res.ok) throw new Error(`Ads API ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  return (data.results ?? []) as any[];
}

function detectBrand(campaignName: string): string | null {
  const lower = campaignName.toLowerCase();
  for (const [brand, keywords] of Object.entries(BRAND_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return brand;
  }
  return null;
}

export const syncAds = action({
  args: {},
  handler: async (ctx) => {
    if (!process.env.GADS_REFRESH_TOKEN) {
      return ["SKIP: GADS_REFRESH_TOKEN not set — run: npm run ads:auth"];
    }

    const brands = await ctx.runQuery(api.brands.list);
    const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b]));

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    const token = await getAdsToken();
    const campaigns = await fetchAdsCampaigns(token, date);

    type Agg = { adSpend: number; adClicks: number; adImpressions: number; adConversions: number; cpcSum: number; count: number };
    const aggregated: Record<string, Agg> = {};

    for (const row of campaigns) {
      const slug = detectBrand(row.campaign?.name ?? "");
      if (!slug) continue;
      if (!aggregated[slug]) aggregated[slug] = { adSpend: 0, adClicks: 0, adImpressions: 0, adConversions: 0, cpcSum: 0, count: 0 };
      const m = row.metrics;
      aggregated[slug].adSpend       += (m.cost_micros   ?? 0) / 1_000_000;
      aggregated[slug].adClicks      += m.clicks         ?? 0;
      aggregated[slug].adImpressions += m.impressions    ?? 0;
      aggregated[slug].adConversions += m.conversions    ?? 0;
      aggregated[slug].cpcSum        += (m.average_cpc   ?? 0) / 1_000_000;
      aggregated[slug].count++;
    }

    const results: string[] = [];
    for (const [slug, agg] of Object.entries(aggregated)) {
      const brand = brandMap[slug];
      if (!brand) continue;
      await ctx.runMutation(api.kpi.upsertSnapshot, {
        brandId: brand._id, date, source: "ads",
        adSpend: agg.adSpend, adClicks: agg.adClicks,
        adImpressions: agg.adImpressions, adConversions: agg.adConversions,
        adCpc: agg.count > 0 ? agg.cpcSum / agg.count : 0,
      });
      results.push(`OK ${slug}: spend=${agg.adSpend.toFixed(2)}€ conv=${agg.adConversions}`);
    }
    return results;
  },
});
```

- [ ] **Step 6: Verify compiles**

```bash
npx convex dev --once
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add convex/actions/syncAds.ts scripts/ads-auth.ts package.json package-lock.json
git commit -m "feat(convex): add Google Ads sync action and OAuth auth script"
```

---

### Task 6: Convex Crons

**Prerequisite:** Tasks 3, 4, 5 complete (syncGSC, syncPubler, syncAds all exist and compile).

**Files:**
- Create: `convex/crons.ts`

- [ ] **Step 1: Create `convex/crons.ts`**

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 06:00 UTC = 07:00 CET / 08:00 CEST
crons.daily("sync GSC",    { hourUTC: 6, minuteUTC:  0 }, internal.actions.syncGSC.syncGSC);
crons.daily("sync Publer", { hourUTC: 6, minuteUTC: 10 }, internal.actions.syncPubler.syncPubler);
crons.daily("sync Ads",    { hourUTC: 6, minuteUTC: 20 }, internal.actions.syncAds.syncAds);

export default crons;
```

- [ ] **Step 2: Verify and deploy crons**

```bash
npx convex dev --once
```
Expected: output includes "Crons: 3 registered". Verify at https://dashboard.convex.dev → your deployment → Scheduled Functions.

- [ ] **Step 3: Commit**

```bash
git add convex/crons.ts
git commit -m "feat(convex): register daily sync crons for GSC, Publer, Ads"
```

---

## Chunk 3: Frontend — KPI Components + Brand Dashboard

### Task 7: KPI Components

**Files:**
- Create: `src/components/kpi/kpi-card.tsx`
- Create: `src/components/kpi/kpi-strip.tsx`

- [ ] **Step 1: Create `src/components/kpi/kpi-card.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number; // % vs yesterday: positive = up, negative = down
  unit?: string;
  accentColor?: string;
  loading?: boolean;
}

export function KpiCard({ label, value, delta, unit, accentColor = "#3b82f6", loading }: KpiCardProps) {
  const deltaEl = delta !== undefined ? (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium",
      delta > 0 ? "text-emerald-500" : delta < 0 ? "text-red-500" : "text-muted-foreground"
    )}>
      {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  ) : null;

  return (
    <div className="relative rounded-lg border bg-card p-3 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg" style={{ backgroundColor: accentColor }} />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 pl-1">{label}</p>
      {loading ? (
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <div className="flex items-end gap-2 pl-1">
          <span className="text-xl font-bold leading-none">
            {typeof value === "number" ? value.toLocaleString("de-DE") : value}
            {unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}
          </span>
          {deltaEl}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/kpi/kpi-strip.tsx`**

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { KpiCard } from "./kpi-card";
import { useState } from "react";
import { cn } from "@/lib/utils";

const PERIODS = ["Heute", "MTD", "30T"] as const;
type Period = typeof PERIODS[number];

function calcDelta(today: number | undefined, yesterday: number | undefined): number | undefined {
  if (!today || !yesterday || yesterday === 0) return undefined;
  return ((today - yesterday) / yesterday) * 100;
}

interface KpiStripProps {
  brandId: Id<"brands">;
}

export function KpiStrip({ brandId }: KpiStripProps) {
  const [period, setPeriod] = useState<Period>("Heute");

  const todaySnaps  = useQuery(api.kpi.getTodayAllSources,     { brandId });
  const yestSnaps   = useQuery(api.kpi.getYesterdayAllSources, { brandId });

  const loading = todaySnaps === undefined;

  const today = (todaySnaps ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);
  const yest  = (yestSnaps  ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Live KPIs</p>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("rounded px-2 py-0.5 text-xs font-medium transition-colors",
                period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="GSC Klicks"   value={today.clicks       ?? "—"} delta={calcDelta(today.clicks,       yest.clicks)}       accentColor="#22c55e" loading={loading} />
        <KpiCard label="Impressionen" value={today.impressions   ?? "—"} delta={calcDelta(today.impressions,  yest.impressions)}   accentColor="#3b82f6" loading={loading} />
        <KpiCard label="CTR"          value={today.ctr ? `${(today.ctr * 100).toFixed(1)}` : "—"} unit="%" delta={calcDelta(today.ctr, yest.ctr)} accentColor="#8b5cf6" loading={loading} />
        <KpiCard label="Social Reach" value={today.socialReach  ?? "—"} delta={calcDelta(today.socialReach,  yest.socialReach)}   accentColor="#f59e0b" loading={loading} />
        <KpiCard label="Anfragen"     value={today.leadsCount   ?? "—"}                                                           accentColor="#ff6600" loading={loading} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/kpi/
git commit -m "feat(ui): add KpiCard and KpiStrip components with delta vs yesterday"
```

---

### Task 8: Update Brand Dashboard Page

**Files:**
- Modify: `src/app/[brand]/page.tsx`

- [ ] **Step 1: Read existing file to understand current structure**

Read `src/app/[brand]/page.tsx`. The file currently:
- Has `const brandId = brand?._id;` resolved from `useQuery(api.brands.getBySlug, { slug: brandSlug })`
- Returns `<div className="space-y-6">` as the root element with heading + stats cards inside

- [ ] **Step 2: Add KpiStrip import and embed in page**

Add import at the top of the file (after existing imports):
```tsx
import { KpiStrip } from "@/components/kpi/kpi-strip";
```

In the return block, insert `<KpiStrip>` between the heading `<div>` and the Stats Cards `<div>`. The exact insertion point is after the closing `</div>` of the title block and before `{/* Stats Cards */}`:

```tsx
    {/* KPI Strip — inserted between heading and stats cards */}
    {brandId && <KpiStrip brandId={brandId as Id<"brands">} />}
```

`brandId` is already typed as `Id<"brands"> | undefined` in the existing file via `brand?._id`. The conditional `{brandId && ...}` guards against undefined while Convex loads.

- [ ] **Step 3: Test in dev**

```bash
npm run dev
```
Open `http://localhost:3000/bodycam` — KPI strip appears above the stats cards, showing loading skeletons then "—" until first sync runs.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[brand]/page.tsx"
git commit -m "feat(ui): embed KPI strip in brand dashboard"
```

---

## Chunk 4: KPI Detail Page + Executive Overview

### Task 9: /[brand]/kpis — Detail Page with Lead Entry

**Files:**
- Create: `src/components/kpi/lead-entry-form.tsx`
- Create: `src/app/[brand]/kpis/page.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Create `src/components/kpi/lead-entry-form.tsx`**

```tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function LeadEntryForm({ brandId }: { brandId: Id<"brands"> }) {
  const upsert = useMutation(api.kpi.upsertSnapshot);
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(count);
    if (isNaN(n) || n < 0) return;
    setSaving(true);
    try {
      await upsert({ brandId, date: today, source: "manual", leadsCount: n, leadsNote: note || undefined });
      toast.success("Anfragen gespeichert");
      setCount(""); setNote("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Anfragen heute eintragen</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Anzahl</label>
            <Input type="number" min="0" placeholder="0" value={count}
              onChange={(e) => setCount(e.target.value)} className="w-24" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Notiz (optional)</label>
            <Input placeholder="z.B. 2 Bodycam, 1 Microvista" value={note}
              onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" size="sm" disabled={saving || !count}>
            {saving ? "Speichert…" : "Speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create `src/app/[brand]/kpis/page.tsx`**

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadEntryForm } from "@/components/kpi/lead-entry-form";
import { KpiCard } from "@/components/kpi/kpi-card";

export default function KpisPage() {
  const { brand: brandSlug } = useParams() as { brand: string };
  const brand   = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id as Id<"brands"> | undefined;

  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7); // YYYY-MM

  const today  = useQuery(api.kpi.getTodayAllSources, brandId ? { brandId } : "skip");
  const gsc30  = useQuery(api.kpi.getSnapshotsRange,  brandId ? { brandId, source: "gsc",    days: 30 } : "skip");
  const leads30= useQuery(api.kpi.getSnapshotsRange,  brandId ? { brandId, source: "manual", days: 30 } : "skip");
  const target = useQuery(api.kpi.getTarget,          brandId ? { brandId, year: now.getFullYear(), month: now.getMonth() + 1 } : "skip");

  const merged        = (today   ?? []).reduce((acc, s) => ({ ...acc, ...s }), {} as any);
  const totalClicksMTD = (gsc30  ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.clicks ?? 0), 0);
  const totalLeadsMTD  = (leads30 ?? []).filter(s => s.date.startsWith(monthPrefix)).reduce((sum, s) => sum + (s.leadsCount ?? 0), 0);

  if (!brand) return <div className="p-6 text-muted-foreground">Lädt…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KPIs</h1>
        <p className="text-muted-foreground">{brand.name} — Metriken & Ziele</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Klicks MTD"  value={totalClicksMTD}                                              accentColor="#22c55e" />
        <KpiCard label="Anfragen MTD" value={totalLeadsMTD}                                              accentColor="#ff6600" />
        <KpiCard label="CTR heute"   value={merged.ctr ? `${(merged.ctr * 100).toFixed(1)}` : "—"} unit="%" accentColor="#8b5cf6" />
        <KpiCard label="Ø Position"  value={merged.avgPosition ? merged.avgPosition.toFixed(1) : "—"}   accentColor="#3b82f6" />
      </div>

      {target && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Monatsziele {now.toLocaleString("de-DE", { month: "long" })}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {target.targetClicks && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Klicks</span><span>{totalClicksMTD.toLocaleString()} / {target.targetClicks.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (totalClicksMTD / target.targetClicks) * 100)}%` }} />
                </div>
              </div>
            )}
            {target.targetLeads && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Anfragen</span><span>{totalLeadsMTD} / {target.targetLeads}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.min(100, (totalLeadsMTD / target.targetLeads) * 100)}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {brandId && <LeadEntryForm brandId={brandId} />}
    </div>
  );
}
```

- [ ] **Step 3: Add KPIs entry to sidebar**

In `src/components/sidebar.tsx`:

Add `BarChart2` to the existing lucide-react import line.

Add to `navItems` array after the Dashboard entry:
```typescript
{ href: "/kpis", label: "KPIs", icon: BarChart2 },
```

- [ ] **Step 4: Test in dev**

```bash
npm run dev
```
- Open `http://localhost:3000/bodycam/kpis` — page loads, lead form submits without error
- Enter `3` in the form, click Speichern — toast "Anfragen gespeichert" appears
- Refresh page — "Anfragen MTD" shows 3

- [ ] **Step 5: Commit**

```bash
git add "src/app/[brand]/kpis/" src/components/kpi/lead-entry-form.tsx src/components/sidebar.tsx
git commit -m "feat(ui): add /[brand]/kpis page with lead entry, targets, and sidebar link"
```

---

### Task 10: /kpis — Executive Overview

**Files:**
- Create: `src/app/kpis/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/app/kpis/page.tsx`**

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/kpi/kpi-card";

export default function ExecutiveOverviewPage() {
  const allBrands = useQuery(api.kpi.getAllBrandsLatest);
  const dateStr = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

  if (!allBrands) return <div className="p-6 text-muted-foreground">Lädt…</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Overview</h1>
        <p className="text-muted-foreground">Alle Marken — {dateStr}</p>
      </div>

      {allBrands.map(({ brand, snapshots }) => {
        const merged = snapshots.reduce((acc, s) => ({ ...acc, ...s }), {} as any);
        return (
          <Card key={brand._id}>
            <CardHeader><CardTitle>{brand.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <KpiCard label="GSC Klicks"   value={merged.clicks      ?? "—"} accentColor="#22c55e" />
                <KpiCard label="Impressionen" value={merged.impressions  ?? "—"} accentColor="#3b82f6" />
                <KpiCard label="CTR"          value={merged.ctr ? `${(merged.ctr * 100).toFixed(1)}` : "—"} unit="%" accentColor="#8b5cf6" />
                <KpiCard label="Social Reach" value={merged.socialReach  ?? "—"} accentColor="#f59e0b" />
                <KpiCard label="Anfragen"     value={merged.leadsCount   ?? "—"} accentColor="#ff6600" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add Executive Overview link to root layout**

Read `src/app/layout.tsx`. The root layout wraps the entire app. Add a top-level nav bar or link before the brand-scoped sidebar. Find the outermost layout element and add:

```tsx
import Link from "next/link";
import { BarChart2 } from "lucide-react";

// Inside the layout body, above <children> or before the main section:
<div className="border-b px-4 py-2 flex items-center gap-4 text-sm">
  <Link href="/kpis" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
    <BarChart2 className="h-4 w-4" />
    Executive Overview
  </Link>
</div>
```

- [ ] **Step 3: Test in dev**

```bash
npm run dev
```
Open `http://localhost:3000/kpis` — all 3 brands visible with KPI cards showing "—" (until sync runs).

- [ ] **Step 4: Commit**

```bash
git add src/app/kpis/ src/app/layout.tsx
git commit -m "feat(ui): add /kpis executive overview page and top-level nav link"
```

---

## Chunk 5: Deploy

### Task 11: Deploy to Vercel + Convex Production

- [ ] **Step 1: Deploy Convex to production**

```bash
cd C:\Users\karent\Documents\Software\netco\_shared\dashboard
npx convex deploy
```
Expected: "Deployed Convex functions" with production URL. Crons visible at https://dashboard.convex.dev.

- [ ] **Step 2: Verify all Convex env secrets are set for production**

```bash
npx convex env list
```
Expected output includes: `GSC_SERVICE_ACCOUNT_JSON`, `GSC_PROPERTY_BODYCAM`, `GSC_PROPERTY_MICROVISTA`, `GSC_PROPERTY_BAUTV`, `PUBLER_API_KEY`, `PUBLER_ACCOUNT_ID_BODYCAM`, `PUBLER_ACCOUNT_ID_MICROVISTA`, `PUBLER_ACCOUNT_ID_BAUTV`, `GADS_OAUTH_CLIENT_ID`, `GADS_OAUTH_CLIENT_SECRET`, `GADS_MANAGER_CUSTOMER_ID`, `GADS_DEVELOPER_TOKEN`, `GADS_CUSTOMER_ID_NETCO`.

If any are missing, set them with `npx convex env set KEY "value"`.

Note: `GADS_REFRESH_TOKEN` will be added after running `npm run ads:auth`.

- [ ] **Step 3: Set Vercel environment variables**

In Vercel Dashboard → Project `netcodashboard` → Settings → Environment Variables, add:
- `NEXT_PUBLIC_CONVEX_URL` = production Convex URL from Step 1

All other secrets (GSC, Publer, Ads) are read by Convex actions at runtime — they do NOT need to be in Vercel.

- [ ] **Step 4: Deploy to Vercel**

```bash
git push origin main
```
Expected: Vercel build succeeds, `https://netcodashboard.vercel.app` live.

- [ ] **Step 5: Smoke test**

- `/bodycam` — loads, KPI strip shows loading skeleton then "—"
- `/bodycam/kpis` — lead form entry works (enter 1, save, value appears in MTD count)
- `/kpis` — all 3 brands visible

- [ ] **Step 6: Generate Google Ads Refresh Token**

```bash
npm run ads:auth
```
Browser opens Google OAuth. Log in with the NetCo Ads account. Copy the `GADS_REFRESH_TOKEN=...` value from the console.

```bash
# Add to .env.local, then:
npx convex env set GADS_REFRESH_TOKEN "<token>"
```

- [ ] **Step 7: Trigger manual sync to verify data flows**

In Convex Dashboard → Functions → Run Function:
- Run `actions/syncGSC:syncGSC` → check output for `OK bodycam:` entries
- Run `actions/syncPubler:syncPubler` → check output
- Reload `/bodycam` — KPI strip now shows real numbers

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "chore: post-deploy env verification complete"
```

---

## Post-Deploy: Seed brand slugs

The sync actions map brands by `slug` field. Verify the 3 brands in Convex have the expected slugs by opening Convex Dashboard → Data → brands table. If slugs differ from `bodycam`, `microvista`, `bautv`, update `GSC_PROPERTIES` in `syncGSC.ts`, `PUBLER_ACCOUNT_IDS` in `syncPubler.ts`, and `BRAND_KEYWORDS` in `syncAds.ts` accordingly.
