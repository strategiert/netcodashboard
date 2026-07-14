"use node";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  MODELS, type TP, selectTouchpoints, computeWeights,
} from "../../src/lib/attribution-models";

// Datalake Paket D: Attribution-Engine — nightly Full-Recompute mit Generation-Swap.
// Volumen ist klein (Conversions einstellig/Tag); ein kompletter Neuaufbau je Lauf
// ersetzt die im Design skizzierte Invalidation-Queue (bewusste Vereinfachung, s. Plan).

const LOOKBACK_DAYS_DEFAULT = 90;
const BATCH = 500;
const MODEL_VERSION = "v1";

// "Sessionisierung light" v1: Direct-Pageviews sind Browsing-Intensität, kein
// Marketing-Einfluss — nur akquisitions-relevante Touchpoints gehen in die Modelle
// (UTM-Landungen, Klick-/Mail-/Call-Events). Echte Sessionisierung folgt mit Paket C.
const ACQUISITION_TYPES = new Set([
  "ad_click", "email_click", "nl_click", "call", "meeting", "chat", "fair_contact", "form_start",
]);
function isAcquisitionTouchpoint(t: TP & { type?: string }): boolean {
  return t.channel !== "direct" || ACQUISITION_TYPES.has(t.type ?? "");
}

type BrandResult = {
  slug: string; generation: number; conversions: number; facts: number; deletedOld: number;
};

export const computeAttribution = internalAction({
  args: {
    brandSlug: v.optional(v.string()),
    lookbackDays: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<BrandResult[]> => {
    const lookbackDays = args.lookbackDays ?? LOOKBACK_DAYS_DEFAULT;
    const lookbackMs = lookbackDays * 86_400_000;

    let brands: { brandId: any; slug: string }[] =
      await ctx.runQuery(internal.attribution.listBrandsWithConversions, {});
    if (args.brandSlug) brands = brands.filter((b) => b.slug === args.brandSlug);

    const results: BrandResult[] = [];
    for (const brand of brands) {
      const conversions = await ctx.runQuery(internal.attribution.conversionsForBrand, {
        brandId: brand.brandId,
      });
      const oldGeneration: number = await ctx.runQuery(internal.attribution.getActiveGeneration, {
        brandId: brand.brandId,
      });
      const generation = oldGeneration + 1;

      // Pre-Cleanup: Orphan-Facts eines früher abgebrochenen Laufs derselben
      // Ziel-Generation entfernen, sonst würden sie sich mit unseren mischen.
      for (;;) {
        const res = await ctx.runMutation(internal.attribution.deleteGeneration, {
          brandId: brand.brandId, generation, batch: BATCH,
        });
        if (res.done) break;
      }

      const facts: any[] = [];
      for (const c of conversions) {
        const tps = await ctx.runQuery(internal.attribution.touchpointsFor, {
          brandId: brand.brandId, personId: c.personId, pid: c.pid,
        });
        let selected: (TP & { type?: string; sourceAccount?: string })[] = selectTouchpoints(
          tps
            .filter((t: any) => isAcquisitionTouchpoint(t))
            .map((t: any) => ({ id: t.id, ts: t.ts, type: t.type, channel: t.channel, campaignId: t.campaignId, adgroupId: t.adgroupId, adId: t.adId })),
          c.ts, lookbackMs,
        );

        // gclid-Backstop (Paket B clickViews): wenn kein Touchpoint Ad-Level trägt,
        // liefert der gespeicherte Klick die Kampagnen-/Ad-Zuordnung — mit dem
        // ECHTEN Klickdatum (Mittag UTC als neutraler Tagespunkt), sonst gewinnt
        // der Backstop fälschlich jedes Last-/Time-Decay-Modell.
        if (c.clickIds?.gclid && !selected.some((t) => t.adId)) {
          const cv = await ctx.runQuery(internal.attribution.clickViewByGclid, {
            brandId: brand.brandId, gclid: c.clickIds.gclid,
          });
          if (cv) {
            const clickTs = Math.min(Date.parse(`${cv.date}T12:00:00Z`), c.ts);
            selected = selectTouchpoints(
              [...selected, {
                id: `gclid-backstop`, ts: clickTs, channel: "google",
                campaignId: cv.campaignId, adgroupId: cv.adgroupId, adId: cv.adId,
                sourceAccount: cv.sourceAccount,
              }],
              c.ts, lookbackMs,
            );
          }
        }

        for (const model of MODELS) {
          if (selected.length === 0) {
            // Kein zuordenbarer Touchpoint ≠ "direct"! Ehrlich als unattributed ausweisen
            // (fehlender pid/Klick-Match ist ein Coverage-Problem, keine Direct-Sitzung).
            facts.push(baseFact(brand.brandId, generation, model, c, 1, undefined, "unattributed"));
            continue;
          }
          const weights = computeWeights(model, selected, c.ts);
          const sum = weights.reduce((a, b) => a + b, 0);
          if (Math.abs(sum - 1) > 1e-9) {
            throw new Error(`Σweight=${sum} ≠ 1 (${model}, conversion ${c._id}) — kein Swap.`);
          }
          selected.forEach((t, i) => {
            if (weights[i] === 0) return; // Nullgewichte nicht materialisieren
            facts.push(baseFact(
              brand.brandId, generation, model, c, weights[i],
              t.id === "gclid-backstop" ? undefined : (t.id as any),
              t.channel, t.campaignId, t.adgroupId, t.adId, t.sourceAccount,
            ));
          });
        }
      }

      for (let i = 0; i < facts.length; i += BATCH) {
        await ctx.runMutation(internal.attribution.insertFacts, { facts: facts.slice(i, i + BATCH) });
      }
      // CAS-Swap: schlägt fehl, wenn ein paralleler Lauf inzwischen aktiviert hat.
      await ctx.runMutation(internal.attribution.swapGeneration, {
        brandId: brand.brandId, generation, expectedGeneration: oldGeneration, lookbackDays,
        conversions: conversions.length, facts: facts.length,
      });

      let deletedOld = 0;
      if (oldGeneration > 0) {
        for (;;) {
          const res = await ctx.runMutation(internal.attribution.deleteGeneration, {
            brandId: brand.brandId, generation: oldGeneration, batch: BATCH,
          });
          deletedOld += res.deleted;
          if (res.done) break;
        }
      }

      results.push({ slug: brand.slug, generation, conversions: conversions.length, facts: facts.length, deletedOld });
    }
    return results;
  },
});

function baseFact(
  brandId: any, generation: number, model: string, c: any, weight: number,
  touchpointId: any, channel: string, campaignId?: string, adgroupId?: string, adId?: string,
  sourceAccount?: string,
) {
  return {
    brandId, generation, model,
    conversionId: c._id,
    conversionType: c.type,
    conversionTs: c.ts,
    value: c.value ?? 0,
    currency: c.currency,
    weight,
    modelVersion: MODEL_VERSION,
    touchpointId,
    channel, sourceAccount, campaignId, adgroupId, adId,
  };
}
