import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const STATUS_VALUES = ["In Arbeit", "Fertig", "Blockiert", "Backlog"];

export const list = query({
  args: { project: v.optional(v.string()) },
  handler: async (ctx, { project }) => {
    const all = await ctx.db.query("teamTasks").order("desc").collect();
    const filtered = project ? all.filter((t) => t.project === project) : all;
    // Neueste zuerst nach updatedAt
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 200);
  },
});

export const create = mutation({
  args: {
    agent: v.string(),
    title: v.string(),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    project: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const status = args.status && STATUS_VALUES.includes(args.status) ? args.status : "In Arbeit";
    const id = await ctx.db.insert("teamTasks", {
      agent: args.agent,
      title: args.title,
      status,
      notes: args.notes,
      project: args.project,
      updatedAt: Date.now(),
    });
    return { id };
  },
});

export const update = mutation({
  args: {
    id: v.id("teamTasks"),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, notes, title }) => {
    const existing = await ctx.db.get(id);
    if (!existing) return { ok: false, error: "not_found" };
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (status !== undefined) {
      if (!STATUS_VALUES.includes(status)) return { ok: false, error: "invalid_status" };
      patch.status = status;
    }
    if (notes !== undefined) patch.notes = notes;
    if (title !== undefined) patch.title = title;
    await ctx.db.patch(id, patch);
    return { ok: true };
  },
});
