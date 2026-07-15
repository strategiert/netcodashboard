import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Section-Rechte-Check für Queries hinter member-vergebbaren Bereichen.
// Section-Keys müssen zu src/lib/sections.ts passen (z. B. "datalake", "attribution").
// Admin darf immer; Member nur wenn approved + Section freigeschaltet.
export async function requireSection(ctx: QueryCtx | MutationCtx, section: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Nicht angemeldet");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Nicht angemeldet");
  if (user.role === "admin") return user;
  if (user.approved && (user.allowedSections ?? []).includes(section)) return user;
  throw new Error(`Keine Berechtigung (Bereich ${section} nicht freigeschaltet)`);
}
