"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

type LeadRow = {
  brand: string; kw: number; date: string; company: string;
  contactChannel: string | null; leadType: string;
  description: string | null; offerMade: boolean;
  orderReceived: boolean; newCustomer: boolean;
  status: string | null;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const data = require("../data/bautvLeads.json") as { brand: string; leads: LeadRow[] };

const BATCH = 400;

export const seedBautvLeads = action({
  args: { offset: v.optional(v.number()) },
  handler: async (ctx, { offset = 0 }): Promise<string> => {
    const brands = await ctx.runQuery(api.brands.list);
    const brand = (brands as any[]).find((b) => b.slug === data.brand);
    if (!brand) throw new Error(`Brand '${data.brand}' not found`);

    const slice = data.leads.slice(offset, offset + BATCH);
    for (const lead of slice) {
      await ctx.runMutation(api.reports.upsertCrmLead, {
        brandId: brand._id,
        kw: lead.kw,
        date: lead.date,
        company: lead.company,
        contactChannel: lead.contactChannel ?? undefined,
        leadType: lead.leadType,
        description: lead.description ?? undefined,
        offerMade: lead.offerMade,
        orderReceived: lead.orderReceived,
        newCustomer: lead.newCustomer,
        status: lead.status ?? undefined,
      });
    }
    const next = offset + BATCH;
    const total = data.leads.length;
    return `Batch ${offset}–${Math.min(next, total)} / ${total} done${next < total ? ` | next offset: ${next}` : " | COMPLETE"}`;
  },
});
