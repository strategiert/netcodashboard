import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";

// Selbst-Registrierung: jeder kann ein Konto anlegen, ist aber standardmäßig
// NICHT freigeschaltet (approved=false) und sieht nichts, bis ein Admin ihn
// in der Nutzerverwaltung freischaltet und Rechte vergibt.
// Admin-Konten: E-Mail muss in der Convex-Env ADMIN_EMAILS (kommagetrennt) stehen
// — solche Konten werden sofort als admin + approved angelegt.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      // WICHTIG: role/approved NIE aus params übernehmen (User könnte sie mitschicken).
      // Nur email + optionaler Name aus dem Registrierungsformular.
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string) || undefined,
        };
      },
    }),
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
