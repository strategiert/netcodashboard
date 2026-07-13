# Datalake Paket A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fundament des Attribution-Datalakes: Ad-Level-Parameter an allen Anzeigen, consentierte Web-Events und alle Leads landen dedupliziert und HMAC-gesichert in Convex.

**Architecture:** Website (Cloudflare Pages Functions) schreibt per signiertem POST an eine neue Convex-HTTP-Route; Convex validiert (HMAC+Nonce), dedupliziert über `sourceRecords` und legt `persons/identityKeys/touchpoints/conversions` an. PII erreicht Convex nur als HMAC-Keys (Hashing passiert im Website-Backend).

**Tech Stack:** Convex (Dashboard-Repo `netco/_shared/dashboard`), Cloudflare Pages Functions (Website-Repo `netco/bautv/website`), Vitest, Web Crypto.

## Global Constraints

- Zwei Repos: **DASH** = `C:\Users\karent\Documents\Software\netco\_shared\dashboard`, **WEB** = `C:\Users\karent\Documents\Software\netco\bautv\website`. Jeder Task nennt sein Repo.
- Convex-Konventionen aus `convex/schema.ts`: `brandId: v.id("brands")`, Indexe im Stil `.index("by_brand", ["brandId"])`; brands haben `slug` (bautv = BauTV+).
- Zwei getrennte Secrets: `DATALAKE_INGEST_SECRET` (Transport-Auth Website→Convex) und `IDENTITY_HMAC_SECRET` (PII-Keying). Beide leben in CF-Pages-Secrets UND Convex-Env. Niemals ins Repo.
- ev.ts-Blob-Schema ist positionskritisch und projektübergreifend (ANALYTICS-ROLLOUT.md im Shared Workspace): bestehende Positionen 1–13 NIE ändern, nur 14–17 anhängen; ANALYTICS-ROLLOUT.md nach Merge nachziehen (Task 6).
- WEB-Tests: `npm test` (Vitest, `test/**/*.test.ts`). DASH bekommt Vitest erst in Task 2.
- Deploys: WEB via push auf master (Actions); DASH-Convex via `npx convex dev --once` (dev) und `npx convex deploy -y` (prod) — prod erst in Task 6.
- Im WEB-Repo arbeitet zeitweise ein zweiter Agent: vor Task 5 `git status` prüfen; bei fremden uncommitted Änderungen im Worktree arbeiten (`git worktree add`).

---

### Task 1: Tracking-Templates in den Werbekonten (manuell, Klaus)

**Files:** keine (Konto-UIs). Ohne diesen Task tragen Klicks kein Werbeelement — zuerst erledigen.

- [ ] **Step 1: Google Ads** (Konto „NL Baustellenkamera", 278-546-2988): Verwaltung → Kontoeinstellungen → **Tracking** („No options set") → **Final-URL-Suffix**:
  `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={creative}&utm_term={keyword}&gad_group={adgroupid}&gad_device={device}`
  Speichern. Prüfung: Anzeigenvorschau-Link enthält die Parameter.
- [ ] **Step 2: Microsoft Ads** (NetCo Professional Services): Konto-Ebene → Einstellungen → **Tracking-Vorlage/Final-URL-Suffix**:
  `utm_source=bing&utm_medium=cpc&utm_campaign={CampaignId}&utm_content={AdId}&utm_term={keyword:default}&gad_group={AdGroupId}`
- [ ] **Step 3: Meta Ads Manager** (BauTV-Konto): auf Anzeigen-Ebene URL-Parameter-Vorlage:
  `utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.id}}&utm_content={{ad.id}}&gad_group={{adset.id}}`
  (Bei Bestands-Anzeigen: Duplizieren nicht nötig — Parameter-Feld ist ohne Review-Reset editierbar.)
- [ ] **Step 4:** Kurz melden, welche Konten gesetzt sind (Screenshot reicht).

### Task 2: DASH — Schema-Erweiterung + Vitest

**Files:**
- Modify: `convex/schema.ts` (am Ende des defineSchema-Objekts, vor der schließenden Klammer)
- Modify: `package.json` (scripts + devDependencies)

**Interfaces:**
- Produces: Tabellen `persons`, `identityKeys`, `sourceRecords`, `touchpoints`, `conversions`, `consentLedger`, `ingestNonces` — Feldnamen exakt wie unten; Task 4 verlässt sich darauf.

- [ ] **Step 1: Vitest einrichten**

```bash
npm install -D vitest
```

In `package.json` unter scripts ergänzen: `"test": "vitest run"`.

- [ ] **Step 2: Schema ergänzen** — in `convex/schema.ts` vor der schließenden `});` einfügen:

```ts
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
  }).index("by_nonce", ["nonce"]),
```

- [ ] **Step 3: Push + Verifikation**

Run: `npx convex dev --once`
Expected: „Convex functions ready" ohne Schema-Fehler.

- [ ] **Step 4: Commit**

```bash
git add convex/schema.ts package.json package-lock.json
git commit -m "feat(datalake): Schema Paket A (persons/identityKeys/sourceRecords/touchpoints/conversions/consentLedger) + vitest"
```

### Task 3: DASH — HMAC-Verify als pure function (TDD)

**Files:**
- Create: `src/lib/datalake-hmac.ts`
- Test: `src/lib/datalake-hmac.test.ts`

**Interfaces:**
- Produces: `verifyIngestSignature(secret: string, ts: string, nonce: string, body: string, sigHex: string, nowMs?: number): Promise<{ ok: true } | { ok: false; reason: string }>` und `signIngest(secret: string, ts: string, nonce: string, body: string): Promise<string>` (hex). Signatur-Basis: `` `${ts}.${nonce}.${body}` ``. Zeitfenster: ±300 000 ms.

- [ ] **Step 1: Failing test schreiben** — `src/lib/datalake-hmac.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { signIngest, verifyIngestSignature } from "./datalake-hmac";

const SECRET = "test-secret";

describe("datalake hmac", () => {
  it("accepts a fresh, correctly signed request", async () => {
    const ts = String(Date.now());
    const sig = await signIngest(SECRET, ts, "n1", '{"a":1}');
    expect(await verifyIngestSignature(SECRET, ts, "n1", '{"a":1}', sig)).toEqual({ ok: true });
  });

  it("rejects a wrong signature", async () => {
    const ts = String(Date.now());
    const r = await verifyIngestSignature(SECRET, ts, "n1", '{"a":1}', "00".repeat(32));
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a stale timestamp (> 5 min)", async () => {
    const ts = String(Date.now() - 6 * 60 * 1000);
    const sig = await signIngest(SECRET, ts, "n1", "{}");
    const r = await verifyIngestSignature(SECRET, ts, "n1", "{}", sig);
    expect(r).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("rejects tampered body", async () => {
    const ts = String(Date.now());
    const sig = await signIngest(SECRET, ts, "n1", '{"a":1}');
    const r = await verifyIngestSignature(SECRET, ts, "n1", '{"a":2}', sig);
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });
});
```

- [ ] **Step 2: Fail verifizieren** — Run: `npx vitest run src/lib/datalake-hmac.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 3: Implementieren** — `src/lib/datalake-hmac.ts`:

```ts
// HMAC-Transportsicherung für den Datalake-Ingest (Website → Convex).
// Basisstring `${ts}.${nonce}.${body}`, HMAC-SHA-256, hex. Fenster ±5 Minuten.
const WINDOW_MS = 300_000;

async function hmacHex(secret: string, base: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signIngest(secret: string, ts: string, nonce: string, body: string): Promise<string> {
  return hmacHex(secret, `${ts}.${nonce}.${body}`);
}

export async function verifyIngestSignature(
  secret: string, ts: string, nonce: string, body: string, sigHex: string,
  nowMs: number = Date.now(),
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const t = Number(ts);
  if (!Number.isFinite(t) || Math.abs(nowMs - t) > WINDOW_MS) return { ok: false, reason: "stale_timestamp" };
  const expected = await signIngest(secret, ts, nonce, body);
  if (expected.length !== sigHex.length) return { ok: false, reason: "bad_signature" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sigHex.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, reason: "bad_signature" };
}
```

- [ ] **Step 4: Pass verifizieren** — Run: `npx vitest run src/lib/datalake-hmac.test.ts` → 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/datalake-hmac.ts src/lib/datalake-hmac.test.ts
git commit -m "feat(datalake): HMAC-Signatur/Verify fuer Ingest (Fenster 5 Min, timing-safe)"
```

### Task 4: DASH — Ingest-Route + Mutation + Debug-Query

**Files:**
- Create: `convex/datalake.ts`
- Modify: `convex/http.ts`

**Interfaces:**
- Consumes: Schema aus Task 2, `verifyIngestSignature` aus Task 3 (Kopie der zwei Funktionen nach `convex/datalakeHmac.ts` — Convex-Functions dürfen nicht aus `src/` importieren; Datei 1:1 duplizieren, Kommentar „Quelle: src/lib/datalake-hmac.ts").
- Produces: HTTP `POST /datalake/ingest`; Payload:

```jsonc
{
  "brandSlug": "bautv",
  "records": [{
    "kind": "touchpoint" | "conversion",
    "sourceAccount": "bautvplus.com",
    "objectType": "event" | "lead",
    "externalId": "…",            // event_id bzw. `${pid}:${ts}`
    "eventType": "pageview" | "kontaktformular_gesendet" | "…",
    "ts": 1783958424000,
    "type": "pageview" | "lead" | "…",
    "channel": "google",
    "campaignId": "…", "adgroupId": "…", "adId": "…", "keyword": "…",
    "device": "…", "urlPath": "/nl/…", "pid": "…",
    "clickIds": { "gclid": "…" },
    "value": 800, "currency": "EUR",
    "emailHmac": "…", "phoneHmac": "…", "eventId": "…"
  }]
}
```

- [ ] **Step 1: `convex/datalakeHmac.ts` anlegen** — exakte Kopie von `src/lib/datalake-hmac.ts` (beide Funktionen), erste Zeile: `// Kopie von src/lib/datalake-hmac.ts — Convex kann nicht aus src/ importieren. Beide synchron halten.`

- [ ] **Step 2: `convex/datalake.ts` anlegen**

```ts
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { verifyIngestSignature } from "./datalakeHmac";

const recordValidator = v.object({
  kind: v.string(),
  sourceAccount: v.string(),
  objectType: v.string(),
  externalId: v.string(),
  eventType: v.string(),
  ts: v.number(),
  type: v.string(),
  channel: v.optional(v.string()),
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
  value: v.optional(v.number()),
  currency: v.optional(v.string()),
  emailHmac: v.optional(v.string()),
  phoneHmac: v.optional(v.string()),
  eventId: v.optional(v.string()),
});

export const ingest = internalMutation({
  args: { brandSlug: v.string(), nonce: v.string(), nonceTs: v.number(), records: v.array(recordValidator) },
  handler: async (ctx, args) => {
    // Nonce-Replay-Schutz
    const seen = await ctx.db.query("ingestNonces")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce)).unique();
    if (seen) return { ok: false, reason: "replay" };
    await ctx.db.insert("ingestNonces", { nonce: args.nonce, ts: args.nonceTs });

    const brand = await ctx.db.query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.brandSlug)).unique();
    if (!brand) return { ok: false, reason: "unknown_brand" };

    let inserted = 0, deduped = 0;
    for (const r of args.records) {
      const source = "web", sourceVersion = 1;
      const existing = await ctx.db.query("sourceRecords")
        .withIndex("by_unique", (q) => q
          .eq("brandId", brand._id).eq("source", source).eq("sourceAccount", r.sourceAccount)
          .eq("objectType", r.objectType).eq("externalId", r.externalId)
          .eq("eventType", r.eventType).eq("sourceVersion", sourceVersion))
        .unique();
      if (existing) { deduped++; continue; }
      const sourceRecordId = await ctx.db.insert("sourceRecords", {
        brandId: brand._id, source, sourceAccount: r.sourceAccount,
        objectType: r.objectType, externalId: r.externalId,
        eventType: r.eventType, sourceVersion,
      });

      if (r.kind === "conversion") {
        // Person über emailHmac finden oder anlegen (konfliktfreier Schlüssel)
        let personId = null as null | import("./_generated/dataModel").Id<"persons">;
        if (r.emailHmac) {
          const key = await ctx.db.query("identityKeys")
            .withIndex("by_key", (q) => q
              .eq("brandId", brand._id).eq("keyType", "emailHmac").eq("keyValue", r.emailHmac!))
            .first();
          if (key) personId = key.personId;
        }
        if (!personId) {
          personId = await ctx.db.insert("persons", { brandId: brand._id, firstSeen: r.ts });
          const mkKey = (keyType: string, keyValue: string) => ctx.db.insert("identityKeys", {
            personId: personId!, brandId: brand._id, keyType, keyValue,
            validFrom: r.ts, evidence: `web:${r.externalId}`, conflictStatus: "unique",
          });
          if (r.emailHmac) await mkKey("emailHmac", r.emailHmac);
          if (r.phoneHmac) await mkKey("phoneHmac", r.phoneHmac);
          if (r.pid) await mkKey("pid", r.pid);
          await ctx.db.insert("consentLedger", {
            personId, brandId: brand._id, purpose: "analytics",
            legalBasis: "consent", grantedAt: r.ts,
          });
        }
        await ctx.db.insert("conversions", {
          personId, brandId: brand._id, ts: r.ts, type: r.type,
          value: r.value, currency: r.currency ?? "EUR",
          eventId: r.eventId ?? r.externalId, sourceRecordId,
        });
      } else {
        await ctx.db.insert("touchpoints", {
          brandId: brand._id, ts: r.ts, type: r.type,
          channel: r.channel ?? "direct",
          campaignId: r.campaignId, adgroupId: r.adgroupId, adId: r.adId,
          keyword: r.keyword, device: r.device, urlPath: r.urlPath,
          pid: r.pid, clickIds: r.clickIds, sourceRecordId,
        });
      }
      inserted++;
    }
    return { ok: true, inserted, deduped };
  },
});

export const ingestHttp = httpAction(async (ctx, request) => {
  const secret = process.env.DATALAKE_INGEST_SECRET;
  if (!secret) return new Response("not configured", { status: 503 });
  const ts = request.headers.get("x-datalake-ts") ?? "";
  const nonce = request.headers.get("x-datalake-nonce") ?? "";
  const sig = request.headers.get("x-datalake-sig") ?? "";
  const body = await request.text();
  const verdict = await verifyIngestSignature(secret, ts, nonce, body, sig);
  if (!verdict.ok) return new Response(verdict.reason, { status: 401 });
  let parsed: { brandSlug: string; records: unknown[] };
  try { parsed = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
  const result = await ctx.runMutation(internal.datalake.ingest, {
    brandSlug: parsed.brandSlug, nonce, nonceTs: Number(ts),
    records: parsed.records as never,
  });
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 409, headers: { "content-type": "application/json" },
  });
});

// Admin-Debug: letzte Datalake-Zeilen je Brand (requireBrandAccess-Muster)
export const debugLast = query({
  args: { brandSlug: v.string() },
  handler: async (ctx, args) => {
    const userId = await (await import("@convex-dev/auth/server")).getAuthUserId(ctx);
    if (!userId) throw new Error("unauthorized");
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") throw new Error("forbidden");
    const brand = await ctx.db.query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.brandSlug)).unique();
    if (!brand) return { touchpoints: [], conversions: [] };
    const touchpoints = await ctx.db.query("touchpoints")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id)).order("desc").take(10);
    const conversions = await ctx.db.query("conversions")
      .withIndex("by_brand_ts", (q) => q.eq("brandId", brand._id)).order("desc").take(10);
    return { touchpoints, conversions };
  },
});
```

Hinweis für den Umsetzer: Der dynamische `getAuthUserId`-Import in `debugLast` ist unüblich — prüfe, wie andere Queries im Repo (`convex/users.ts:28 requireAdmin`) es machen, und verwende exakt dieses bestehende Muster stattdessen.

- [ ] **Step 3: Route registrieren** — `convex/http.ts` komplett ersetzen durch:

```ts
import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { ingestHttp } from "./datalake";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({ path: "/datalake/ingest", method: "POST", handler: ingestHttp });

export default http;
```

- [ ] **Step 4: Push + Secret setzen**

```bash
npx convex env set DATALAKE_INGEST_SECRET <64-hex-zufall>   # openssl rand -hex 32
npx convex dev --once
```

Expected: functions ready.

- [ ] **Step 5: Smoke per curl** (Signatur mit Node bauen):

```bash
node -e "
const c=require('crypto');const ts=Date.now().toString();const n=c.randomUUID();
const body=JSON.stringify({brandSlug:'bautv',records:[{kind:'touchpoint',sourceAccount:'smoke',objectType:'event',externalId:'smoke-1',eventType:'pageview',ts:Date.now(),type:'pageview',channel:'direct',urlPath:'/smoke'}]});
const sig=c.createHmac('sha256',process.env.S).update(ts+'.'+n+'.'+body).digest('hex');
console.log([ts,n,sig,body].join('|'))" S=<secret> 
# Werte in curl einsetzen:
curl -s -X POST "<CONVEX_SITE_URL>/datalake/ingest" -H "content-type: application/json" \
  -H "x-datalake-ts: <ts>" -H "x-datalake-nonce: <n>" -H "x-datalake-sig: <sig>" --data '<body>'
```

Expected: `{"ok":true,"inserted":1,"deduped":0}`; zweiter identischer Aufruf mit NEUER Nonce: `deduped:1`; Wiederholung mit GLEICHER Nonce: 409 replay.

- [ ] **Step 6: Commit**

```bash
git add convex/datalake.ts convex/datalakeHmac.ts convex/http.ts
git commit -m "feat(datalake): HMAC-gesicherte Ingest-Route mit sourceRecord-Dedupe und Person-Anlage bei Leads"
```

### Task 5: WEB — Beacon-Erweiterung + Lead-Dual-Write

**Files:**
- Create: `functions/api/_datalake.ts`
- Test: `test/datalake-client.test.ts`
- Modify: `functions/api/ev.ts` (Blobs 14–17 + Dual-Write)
- Modify: `functions/api/contact.ts` (Lead-Dual-Write in `fireServerConversion`-Nachbarschaft)
- Modify: `wrangler.toml` (`DATALAKE_INGEST_URL` als Var; Secrets-Doku)

**Interfaces:**
- Consumes: `POST /datalake/ingest` aus Task 4 (Header x-datalake-ts/nonce/sig; Payload-Format oben).
- Produces: `buildTouchpoint(...)`, `buildLeadConversion(...)`, `postToDatalake(env, brandSlug, records)` (fire-and-forget), `identityHmac(secret, value)` — Signaturen unten.

- [ ] **Step 1: Failing tests** — `test/datalake-client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { identityHmac, buildTouchpoint, buildLeadConversion, postToDatalake } from "../functions/api/_datalake";

describe("datalake client", () => {
  it("identityHmac is deterministic and secret-dependent", async () => {
    const a = await identityHmac("s1", "test@mail.com");
    expect(a).toBe(await identityHmac("s1", "test@mail.com"));
    expect(a).not.toBe(await identityHmac("s2", "test@mail.com"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("buildTouchpoint extracts ad-level params", () => {
    const tp = buildTouchpoint({
      path: "/nl/prijzen/", search: "?utm_source=google&utm_medium=cpc&utm_campaign=123&utm_content=456&utm_term=kw&gad_group=789&gad_device=m&gclid=XYZ",
      pid: "abc-123", ts: 1000, eventType: "pageview",
    });
    expect(tp).toMatchObject({
      kind: "touchpoint", objectType: "event", eventType: "pageview", type: "pageview",
      channel: "google", campaignId: "123", adId: "456", keyword: "kw",
      adgroupId: "789", device: "m", urlPath: "/nl/prijzen/", pid: "abc-123",
      clickIds: { gclid: "XYZ" }, ts: 1000,
    });
    expect(tp.externalId).toBe("abc-123:1000");
  });

  it("buildLeadConversion hashes identity fields", async () => {
    const c = await buildLeadConversion({
      identitySecret: "s1", eventId: "evt-1", ts: 2000,
      email: " Test@Mail.COM ", phone: "+31612345678", pid: "abc-123",
      value: 800, currency: "EUR", clickIds: { gclid: "XYZ" },
    });
    expect(c.kind).toBe("conversion");
    expect(c.emailHmac).toBe(await identityHmac("s1", "test@mail.com"));
    expect(c.phoneHmac).toBe(await identityHmac("s1", "31612345678"));
    expect(JSON.stringify(c)).not.toContain("Mail.COM");
    expect(c.eventId).toBe("evt-1");
  });

  it("postToDatalake signs and posts, never throws", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await postToDatalake(
      { DATALAKE_INGEST_URL: "https://x.convex.site/datalake/ingest", DATALAKE_INGEST_SECRET: "sec" },
      "bautv", [{ kind: "touchpoint" } as never],
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const h = new Headers((init as RequestInit).headers);
    expect(h.get("x-datalake-sig")).toMatch(/^[0-9a-f]{64}$/);
    expect(h.get("x-datalake-ts")).toBeTruthy();
    expect(h.get("x-datalake-nonce")).toBeTruthy();
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Fail verifizieren** — `npx vitest run test/datalake-client.test.ts` → FAIL.

- [ ] **Step 3: Implementieren** — `functions/api/_datalake.ts`:

```ts
// Datalake-Client: baut Touchpoint-/Conversion-Records und postet sie
// HMAC-signiert an den Convex-Ingest (fire-and-forget). PII wird VOR dem
// Versand mit IDENTITY_HMAC_SECRET gekeyt — Convex sieht nie Klartext.

export interface DatalakeEnv {
  DATALAKE_INGEST_URL?: string;
  DATALAKE_INGEST_SECRET?: string;
}

async function hmacHex(secret: string, base: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function identityHmac(secret: string, value: string): Promise<string> {
  return hmacHex(secret, value.trim().toLowerCase());
}

export function buildTouchpoint(p: {
  path: string; search: string; pid: string; ts: number; eventType: string;
}): Record<string, unknown> {
  let channel = "direct", campaignId, adId, keyword, adgroupId, device;
  const clickIds: Record<string, string> = {};
  try {
    const sp = new URLSearchParams(p.search.startsWith("?") ? p.search.slice(1) : p.search);
    channel = sp.get("utm_source") || "direct";
    campaignId = sp.get("utm_campaign") ?? undefined;
    adId = sp.get("utm_content") ?? undefined;
    keyword = sp.get("utm_term") ?? undefined;
    adgroupId = sp.get("gad_group") ?? undefined;
    device = sp.get("gad_device") ?? undefined;
    for (const k of ["gclid", "fbclid", "msclkid"] as const) {
      const v = sp.get(k); if (v) clickIds[k] = v;
    }
  } catch { /* egal */ }
  return {
    kind: "touchpoint", sourceAccount: "bautvplus.com", objectType: "event",
    externalId: `${p.pid}:${p.ts}`, eventType: p.eventType, ts: p.ts,
    type: p.eventType, channel, campaignId, adgroupId, adId, keyword, device,
    urlPath: p.path, pid: p.pid,
    clickIds: Object.keys(clickIds).length ? clickIds : undefined,
  };
}

export async function buildLeadConversion(p: {
  identitySecret: string; eventId: string; ts: number;
  email?: string; phone?: string; pid?: string;
  value?: number; currency?: string;
  clickIds?: Record<string, string>;
}): Promise<Record<string, unknown>> {
  return {
    kind: "conversion", sourceAccount: "bautvplus.com", objectType: "lead",
    externalId: p.eventId, eventType: "kontaktformular_gesendet", ts: p.ts,
    type: "lead", value: p.value, currency: p.currency ?? "EUR",
    pid: p.pid, clickIds: p.clickIds, eventId: p.eventId,
    emailHmac: p.email ? await identityHmac(p.identitySecret, p.email) : undefined,
    phoneHmac: p.phone ? await identityHmac(p.identitySecret, p.phone.replace(/\D/g, "")) : undefined,
  };
}

export async function postToDatalake(
  env: DatalakeEnv, brandSlug: string, records: Record<string, unknown>[],
): Promise<void> {
  try {
    if (!env.DATALAKE_INGEST_URL || !env.DATALAKE_INGEST_SECRET || records.length === 0) return;
    const body = JSON.stringify({ brandSlug, records });
    const ts = String(Date.now());
    const nonce = crypto.randomUUID();
    const sig = await hmacHex(env.DATALAKE_INGEST_SECRET, `${ts}.${nonce}.${body}`);
    await fetch(env.DATALAKE_INGEST_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-datalake-ts": ts, "x-datalake-nonce": nonce, "x-datalake-sig": sig,
      },
      body, signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.error("postToDatalake fehlgeschlagen:", String(err).slice(0, 200));
  }
}
```

- [ ] **Step 4: Pass verifizieren** — `npx vitest run test/datalake-client.test.ts` → 4 passed.

- [ ] **Step 5: ev.ts erweitern** — im Parse-Block (nach `utmCampaign`) ergänzen:

```ts
    let utmContent = "", utmTerm = "", gadGroup = "", gadDevice = "";
```

und im bestehenden `try` nach den utm-Zeilen:

```ts
      utmContent = sp.get("utm_content") ?? "";
      utmTerm = sp.get("utm_term") ?? "";
      gadGroup = sp.get("gad_group") ?? "";
      gadDevice = sp.get("gad_device") ?? "";
```

Blob-Array um vier Positionen erweitern (NACH `""  // blob13 identityId`):

```ts
        utmContent,                             // blob14
        utmTerm,                                // blob15
        gadGroup,                               // blob16 adgroupId
        gadDevice,                              // blob17
```

Direkt nach dem `writeDataPoint`-Aufruf (vor `return ok;`) den Dual-Write ergänzen — nur consentiert, nur Pageviews, fire-and-forget via `ctx.waitUntil`. Dafür Signatur der Function auf `async ({ request, env, waitUntil })` erweitern und Env-Interface um `DATALAKE_INGEST_URL?: string; DATALAKE_INGEST_SECRET?: string;` ergänzen:

```ts
    if (pid && type === "pv") {
      const { buildTouchpoint, postToDatalake } = await import("./_datalake");
      waitUntil(postToDatalake(env, "bautv", [
        buildTouchpoint({ path, search, pid, ts: Date.now(), eventType: "pageview" }),
      ]));
    }
```

- [ ] **Step 6: contact.ts erweitern** — in `fireServerConversion` (nach dem `waitUntil(sendServerConversion(...))`-Aufruf) zusätzlich:

```ts
    waitUntil((async () => {
      const { buildLeadConversion, postToDatalake } = await import("./_datalake");
      if (!env.IDENTITY_HMAC_SECRET) return;
      const rec = await buildLeadConversion({
        identitySecret: env.IDENTITY_HMAC_SECRET,
        eventId, ts: Date.now(),
        email: email || undefined, phone: phone || undefined,
        pid: cookies.bk_pid, value, currency: "EUR",
        clickIds: collectClickIds(cookies) as Record<string, string>,
      });
      await postToDatalake(env, "bautv", [rec]);
    })());
```

Dafür: `eventId` vor beiden waitUntil-Aufrufen einmal erzeugen (`const eventId = crypto.randomUUID();`) und in `sendServerConversion` weiterreichen statt dort neu zu würfeln; Env-Interface um `IDENTITY_HMAC_SECRET?: string; DATALAKE_INGEST_URL?: string; DATALAKE_INGEST_SECRET?: string;` ergänzen. `bk_pid` kommt aus dem bestehenden `parseCookies`-Ergebnis.

- [ ] **Step 7: wrangler.toml** — unter `[vars]`:

```toml
# Datalake-Ingest (Convex, NetCo Dashboard). Secrets via wrangler pages secret put:
#   DATALAKE_INGEST_SECRET  — Transport-HMAC (identisch mit Convex-Env)
#   IDENTITY_HMAC_SECRET    — PII-Keying (identisch mit Convex-Env, rotierbar)
DATALAKE_INGEST_URL = "https://<convex-site>.convex.site/datalake/ingest"
```

(`<convex-site>` = CONVEX_SITE_URL des Prod-Deployments `grandiose-cricket-4`.)

- [ ] **Step 8: Voll-Test + Commit**

Run: `npm test && npm run build` → alle Tests grün, Build ok.

```bash
git add functions/api/_datalake.ts functions/api/ev.ts functions/api/contact.ts wrangler.toml test/datalake-client.test.ts
git commit -m "feat(datalake): Beacon-Blobs 14-17 + Dual-Write consentierter Events und Leads an Convex-Ingest"
```

### Task 6: Ende-zu-Ende + Rollout

**Files:**
- Modify: `C:\Users\karent\.openclaw\workspace\ANALYTICS-ROLLOUT.md` (Blob-Schema 14–17 dokumentieren)

- [ ] **Step 1: Secrets setzen** (einmalig):

```bash
# im DASH-Repo — prod:
npx convex env set DATALAKE_INGEST_SECRET <hex> --prod
npx convex env set IDENTITY_HMAC_SECRET <hex2> --prod
# im WEB-Repo:
wrangler pages secret put DATALAKE_INGEST_SECRET --project-name bautv-website
wrangler pages secret put IDENTITY_HMAC_SECRET --project-name bautv-website
```

- [ ] **Step 2: DASH prod-Deploy** — `npx convex deploy -y` (Vercel-Frontend-Falle beachten: prod-Convex ist `grandiose-cricket-4`).
- [ ] **Step 3: WEB deploy** — push auf master, Actions abwarten, Live-Check `POST /api/ev` → 204.
- [ ] **Step 4: E2E-Probe** — Browser: bautvplus.com mit `?utm_source=google&utm_campaign=t1&utm_content=a1&gclid=e2e1` besuchen, Consent akzeptieren, Formular mit Testdaten absenden. Danach:

```bash
npx convex run datalake:debugLast '{"brandSlug":"bautv"}' --prod
```

Expected: mindestens 1 touchpoint (channel google, campaignId t1, adId a1, clickIds.gclid e2e1) + 1 conversion (type lead, value gesetzt) + zugehörige person mit identityKeys.
- [ ] **Step 5: ANALYTICS-ROLLOUT.md** um Blobs 14–17 ergänzen (utm_content, utm_term, gad_group, gad_device — optional, leer auf Projekten ohne Ad-Level).
- [ ] **Step 6: Commits pushen, Mission Control aktualisieren.**

## Self-Review-Ergebnis
- Spec-Coverage Paket A: A1→Task 1, A2→Task 5 (ev.ts) + Task 4 (Endpoint), A3→Task 5 (contact.ts), A4-Auth→Task 4 (debugLast admin-Muster; breite Query-Härtung bleibt als eigener Punkt im Design §5.4 für die D-Phase, wenn die Report-Queries entstehen). ✓
- Platzhalter: `<convex-site>`/`<hex>` sind bewusste Secret-/Umgebungswerte mit Beschaffungsanweisung, keine offenen Enden. ✓
- Typkonsistenz: Header-Namen, Signatur-Basisstring, Payload-Felder und Schema-Felder in Task 3/4/5 abgeglichen (emailHmac/phoneHmac/eventId/externalId). ✓
