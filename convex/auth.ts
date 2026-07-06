import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";

// Login per Magic Link (passwortlos). Der Nutzer gibt nur seine E-Mail ein und
// erhält einen Anmelde-Link. Absender-Domain klaus-arent.de ist bei Resend verifiziert
// (netco.de ist es noch nicht — bei Bedarf dort verifizieren für @netco.de-Absender).
//
// Freischaltung: Self-Login legt beim ersten Klick ein Konto an, das standardmäßig
// NICHT freigeschaltet ist (approved=false). Admin-E-Mails (Convex-Env ADMIN_EMAILS)
// werden sofort admin+approved. Vom Admin vorgemerkte Konten übernehmen ihre
// vorkonfigurierten Rechte automatisch.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({ from: "NetCo Dashboard <login@klaus-arent.de>" }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId }) {
      // Nur bei Erst-Anlage Rollen/Rechte initialisieren, spätere Logins nicht überschreiben.
      if (existingUserId) return;
      const user = await ctx.db.get(userId);
      const email = (user?.email ?? "").toLowerCase();
      const adminEmails = (process.env.ADMIN_EMAILS ?? "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const isAdmin = email !== "" && adminEmails.includes(email);

      // Vom Admin vorgemerktes Konto mit gleicher E-Mail? Dann dessen Vorkonfiguration
      // (Rechte/Freischaltung) übernehmen und den Platzhalter-Datensatz entfernen.
      const all = await ctx.db.query("users").collect();
      const pre = all.find(
        (u) => u._id !== userId && u.pending === true && (u.email ?? "").toLowerCase() === email,
      );

      if (pre && !isAdmin) {
        await ctx.db.patch(userId, {
          role: pre.role ?? "member",
          approved: pre.approved ?? false,
          allowedSections: pre.allowedSections ?? [],
          allowedBrands: pre.allowedBrands ?? [],
          name: user?.name ?? pre.name,
        });
        await ctx.db.delete(pre._id);
        return;
      }

      await ctx.db.patch(userId, {
        role: isAdmin ? "admin" : "member",
        approved: isAdmin,
        allowedSections: [],
        allowedBrands: [],
      });
      if (pre) await ctx.db.delete(pre._id); // Admin-E-Mail war vorgemerkt → Platzhalter weg
    },
  },
});
