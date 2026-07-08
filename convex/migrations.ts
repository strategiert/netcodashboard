// Einmal-Migrationen für die NL-Trennung (bodycam-nl / bautv-nl), Juli 2026.
// Aufruf: npx convex run migrations:runNlMigration [--prod]
import { internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { isNlCampaign } from "./adsMapping";

const NL_BRAND_DEFS = [
  {
    slug: "bodycam-nl",
    name: "NetCo Body-Cam NL",
    colors: { primary: "#003366", secondary: "#ff6600", accent: "#1a365d" },
  },
  {
    slug: "bautv-nl",
    name: "BauTV+ NL",
    colors: { primary: "#003366", secondary: "#ff6600", accent: "#004d99" },
  },
] as const;

// NL-SE-Ranking-Sites, die von bodycam/bautv in die NL-Brands umziehen.
const NL_SITE_TO_SLUG: Record<number, string> = {
  9984911: "bodycam-nl", // BC NL, netco-bodycam.com
  7818701: "bautv-nl",   // BK NL, bouwtvplus.nl
};
const NL_DOMAIN_TO_SLUG: Record<string, string> = {
  "netco-bodycam.com": "bodycam-nl",
  "bouwtvplus.nl": "bautv-nl",
};

export const ensureNlBrands = internalMutation({
  args: {},
  handler: async (ctx) => {
    const out: string[] = [];
    for (const def of NL_BRAND_DEFS) {
      const existing = await ctx.db
        .query("brands")
        .withIndex("by_slug", (q) => q.eq("slug", def.slug))
        .first();
      if (existing) {
        out.push(`vorhanden: ${def.slug}`);
        continue;
      }
      await ctx.db.insert("brands", { name: def.name, slug: def.slug, colors: def.colors });
      out.push(`angelegt: ${def.slug}`);
    }
    return out;
  },
});

// Wer bodycam/bautv sehen darf, darf auch die zugehörige NL-Brand sehen.
export const grantNlBrands = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let patched = 0;
    for (const u of users) {
      const ab = u.allowedBrands ?? [];
      const next = [...ab];
      if (ab.includes("bodycam") && !ab.includes("bodycam-nl")) next.push("bodycam-nl");
      if (ab.includes("bautv") && !ab.includes("bautv-nl")) next.push("bautv-nl");
      if (next.length !== ab.length) {
        await ctx.db.patch(u._id, { allowedBrands: next });
        patched++;
      }
    }
    return `${patched} Nutzer aktualisiert`;
  },
});

const MIGRATABLE_TABLES = v.union(
  v.literal("adsCampaigns"),
  v.literal("gadsCampaignStats"),
  v.literal("gadsAdGroups"),
  v.literal("gadsKeywords"),
  v.literal("serankingDaily"),
  v.literal("serankingKeywords"),
  v.literal("serankingCompetitors"),
  v.literal("serankingBacklinks"),
);

// Ein Batch: prüft numItems Zeilen, hängt NL-Zeilen an die NL-Brand um.
export const reassignNlBatch = internalMutation({
  args: { table: MIGRATABLE_TABLES, cursor: v.optional(v.string()) },
  handler: async (ctx, { table, cursor }) => {
    const brandIdBySlug: Record<string, string> = {};
    for (const b of await ctx.db.query("brands").collect()) brandIdBySlug[b.slug] = b._id;
    const oldToNew: Record<string, string | undefined> = {
      [brandIdBySlug["bodycam"]]: brandIdBySlug["bodycam-nl"],
      [brandIdBySlug["bautv"]]: brandIdBySlug["bautv-nl"],
    };

    const page = await ctx.db
      .query(table)
      .paginate({ cursor: cursor ?? null, numItems: 500 });

    let moved = 0;
    for (const doc of page.page) {
      const d = doc as any;
      let target: string | undefined;
      if (table === "adsCampaigns" || table.startsWith("gads")) {
        // Nur Zeilen, die noch auf bodycam/bautv zeigen UND eine NL-Kampagne sind.
        const name: string = d.campaignName ?? d.campaign ?? "";
        target = isNlCampaign(name) ? oldToNew[d.brandId] : undefined;
      } else {
        // SE-Ranking-Tabellen: Zuordnung über siteId bzw. domain.
        const slug =
          d.siteId !== undefined ? NL_SITE_TO_SLUG[d.siteId] : NL_DOMAIN_TO_SLUG[d.domain];
        target = slug ? brandIdBySlug[slug] : undefined;
      }
      if (!target || d.brandId === target) continue;
      await ctx.db.patch(doc._id, { brandId: target as any });
      moved++;
    }
    return { moved, cursor: page.continueCursor, done: page.isDone };
  },
});

// Komplette NL-Migration: Brands anlegen, Rechte erweitern, Daten umhängen.
export const runNlMigration = internalAction({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const out: string[] = [];
    const brandRes: string[] = await ctx.runMutation(internal.migrations.ensureNlBrands, {});
    out.push(...brandRes);
    out.push(await ctx.runMutation(internal.migrations.grantNlBrands, {}));

    const tables = [
      "adsCampaigns",
      "gadsCampaignStats",
      "gadsAdGroups",
      "gadsKeywords",
      "serankingDaily",
      "serankingKeywords",
      "serankingCompetitors",
      "serankingBacklinks",
    ] as const;

    for (const table of tables) {
      let cursor: string | undefined;
      let moved = 0;
      for (;;) {
        const res: { moved: number; cursor: string; done: boolean } = await ctx.runMutation(
          internal.migrations.reassignNlBatch,
          { table, cursor },
        );
        moved += res.moved;
        if (res.done) break;
        cursor = res.cursor;
      }
      out.push(`${table}: ${moved} Zeilen auf NL-Brand umgehängt`);
    }
    return out;
  },
});
