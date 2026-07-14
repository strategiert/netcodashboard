"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { GoogleAuth } from "google-auth-library";

// Indexierungs-Monitoring: wöchentliche Stichprobe aus der Sitemap gegen die
// GSC-URL-Inspection-API (Quota 2.000/Tag/Property — wir nutzen 25/Woche).
// Anlass: bouwtvplus.nl-301-Migration + Neuindexierung bautvplus.com —
// ersetzt das manuelle "GSC-Coverage 2–4 Wochen beobachten".

const SITEMAPS: Record<string, { property: string; sitemap: string }> = {
  bautv: {
    property: process.env.GSC_PROPERTY_BAUTV ?? "",
    sitemap: "https://bautvplus.com/sitemap-index.xml",
  },
  // weitere Brands ergänzbar, sobald gewünscht
};

const SAMPLE_SIZE = 25;

async function gscToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: JSON.parse(process.env.GSC_SERVICE_ACCOUNT_JSON!),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const token = await (await auth.getClient()).getAccessToken();
  return token.token!;
}

/** Sitemap(-Index) laden und alle <loc>-URLs einsammeln (eine Ebene tief). */
async function sitemapUrls(url: string): Promise<string[]> {
  const xml = await (await fetch(url)).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (xml.includes("<sitemapindex")) {
    const nested: string[] = [];
    for (const child of locs) {
      const childXml = await (await fetch(child)).text();
      nested.push(...[...childXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }
    return nested;
  }
  return locs;
}

export const syncIndexCoverage = internalAction({
  args: { brandSlug: v.optional(v.string()) },
  handler: async (ctx, args): Promise<Record<string, unknown>[]> => {
    const token = await gscToken();
    const out: Record<string, unknown>[] = [];
    const date = new Date().toISOString().slice(0, 10);

    for (const [slug, cfg] of Object.entries(SITEMAPS)) {
      if (args.brandSlug && args.brandSlug !== slug) continue;
      if (!cfg.property) continue;

      const all = (await sitemapUrls(cfg.sitemap)).filter((u) => u.startsWith("http"));
      // Rotierende, deterministische Stichprobe: Wochennummer als Offset,
      // damit über die Wochen die ganze Sitemap durchlaufen wird.
      const week = Math.floor(Date.now() / (7 * 86_400_000));
      const sample: string[] = [];
      for (let i = 0; i < Math.min(SAMPLE_SIZE, all.length); i++) {
        sample.push(all[(week * SAMPLE_SIZE + i) % all.length]);
      }

      let indexed = 0;
      const failures: { url: string; verdict: string; coverageState: string }[] = [];
      for (const url of sample) {
        const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inspectionUrl: url, siteUrl: cfg.property }),
        });
        if (!res.ok) throw new Error(`Inspection ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const data = await res.json() as any;
        const idx = data.inspectionResult?.indexStatusResult;
        if (idx?.verdict === "PASS") indexed++;
        else failures.push({
          url,
          verdict: idx?.verdict ?? "UNKNOWN",
          coverageState: idx?.coverageState ?? "",
        });
      }

      await ctx.runMutation(internal.gscExtras.upsertIndexCoverage, {
        brandSlug: slug, date,
        inspected: sample.length, indexed, notIndexed: failures.length,
        failures: JSON.stringify(failures),
      });
      out.push({ slug, sitemapUrls: all.length, inspected: sample.length, indexed, notIndexed: failures.length });
    }
    return out;
  },
});
