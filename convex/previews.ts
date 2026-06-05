import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_HTML_BYTES = 900_000; // Convex-Dokumentlimit ~1 MB — Puffer lassen

function randomSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 20; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const publish = mutation({
  args: {
    title: v.string(),
    html: v.string(),
    agent: v.string(),
    project: v.optional(v.string()),
    slug: v.optional(v.string()), // vorhandenen Slug angeben = Preview aktualisieren
  },
  handler: async (ctx, args) => {
    if (args.html.length > MAX_HTML_BYTES) {
      return { ok: false as const, error: "html_too_large", maxBytes: MAX_HTML_BYTES };
    }
    if (args.slug) {
      const existing = await ctx.db
        .query("previews")
        .withIndex("by_slug", (q) => q.eq("slug", args.slug!))
        .unique();
      if (!existing) return { ok: false as const, error: "slug_not_found" };
      await ctx.db.patch(existing._id, {
        title: args.title,
        html: args.html,
        agent: args.agent,
        project: args.project,
        updatedAt: Date.now(),
      });
      return { ok: true as const, slug: args.slug };
    }
    const slug = randomSlug();
    await ctx.db.insert("previews", {
      slug,
      title: args.title,
      html: args.html,
      agent: args.agent,
      project: args.project,
      updatedAt: Date.now(),
    });
    return { ok: true as const, slug };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("previews")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("previews").collect();
    // Ohne html-Feld (zu groß für Listen)
    return all
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 100)
      .map(({ slug, title, agent, project, updatedAt }) => ({ slug, title, agent, project, updatedAt }));
  },
});
