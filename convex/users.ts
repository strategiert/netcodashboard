import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Aktuell angemeldeter Nutzer inkl. berechneter Rechte.
// Admin sieht alles (approved immer true), Rechte-Listen für Member.
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const isAdmin = user.role === "admin";
    return {
      _id: user._id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role ?? "member",
      isAdmin,
      approved: isAdmin ? true : user.approved ?? false,
      allowedSections: user.allowedSections ?? [],
      allowedBrands: user.allowedBrands ?? [],
    };
  },
});

async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Nicht angemeldet");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Keine Berechtigung (nur Admin)");
  return user;
}

// Alle Nutzer für die Nutzerverwaltung (nur Admin).
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .map((u) => ({
        _id: u._id,
        _creationTime: u._creationTime,
        email: u.email ?? null,
        name: u.name ?? null,
        role: u.role ?? "member",
        approved: u.approved ?? false,
        allowedSections: u.allowedSections ?? [],
        allowedBrands: u.allowedBrands ?? [],
        pending: u.pending ?? false,
      }))
      .sort((a, b) => a._creationTime - b._creationTime);
  },
});

// Mitarbeiter vormerken (nur Admin): legt einen Platzhalter-Datensatz an, den der
// Mitarbeiter bei Selbst-Registrierung mit derselben E-Mail übernimmt.
export const createMember = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, { email, name }) => {
    await requireAdmin(ctx);
    const norm = email.trim().toLowerCase();
    if (!norm.includes("@")) throw new Error("Ungültige E-Mail");
    const all = await ctx.db.query("users").collect();
    if (all.some((u) => (u.email ?? "").toLowerCase() === norm)) {
      throw new Error("Für diese E-Mail existiert bereits ein Eintrag");
    }
    return await ctx.db.insert("users", {
      email: norm,
      name: name?.trim() || undefined,
      role: "member",
      approved: false,
      pending: true,
      allowedSections: [],
      allowedBrands: [],
    });
  },
});

// Nutzer/Vormerkung löschen (nur Admin) inkl. Auth-Verknüpfungen.
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireAdmin(ctx);
    if (userId === admin._id) throw new Error("Eigenes Konto kann nicht gelöscht werden");
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const a of accounts) if (a.userId === userId) await ctx.db.delete(a._id);
    const sessions = await ctx.db.query("authSessions").collect();
    for (const s of sessions) {
      if (s.userId === userId) {
        const rts = await ctx.db.query("authRefreshTokens").collect();
        for (const rt of rts) if (rt.sessionId === s._id) await ctx.db.delete(rt._id);
        await ctx.db.delete(s._id);
      }
    }
    await ctx.db.delete(userId);
  },
});

// Freischaltung + Rechte + Rolle setzen (nur Admin). Alle Felder optional.
export const setPermissions = mutation({
  args: {
    userId: v.id("users"),
    approved: v.optional(v.boolean()),
    role: v.optional(v.string()),
    allowedSections: v.optional(v.array(v.string())),
    allowedBrands: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const { userId, ...rest } = args;
    // Admin darf sich nicht selbst die Admin-Rolle entziehen (sonst evtl. kein Admin mehr).
    if (userId === admin._id && rest.role && rest.role !== "admin") {
      throw new Error("Eigene Admin-Rolle kann nicht entzogen werden");
    }
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(userId, patch);
  },
});
