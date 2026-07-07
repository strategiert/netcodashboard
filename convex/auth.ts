import Resend from "@auth/core/providers/resend";
import { convexAuth } from "@convex-dev/auth/server";
import { sendOtpVerificationRequest } from "./authEmail";

// 6-stelliger numerischer Einmalcode. crypto.getRandomValues ist in der Convex-
// Runtime verfügbar. Rejection-Sampling vermeidet Modulo-Bias.
function generateOtpCode(): string {
  const max = 1_000_000;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let n = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return String(n % max).padStart(6, "0");
}

// Login per Einmalcode (OTP, passwortlos). Der Nutzer gibt seine E-Mail ein,
// bekommt einen 6-stelligen Code und tippt ihn im selben (wartenden) Tab ein.
// Dadurch authentifiziert sich immer der anfordernde Browser — kein Problem mit
// Links, die im falschen Browser geöffnet oder durch einen neueren ungültig werden.
// Versand läuft über den Bodycam-Relay (Absender login@netco-bodycam.com, kommt
// durch den Firmen-Mailfilter). from unten greift nur im lokalen Direkt-Fallback.
//
// Freischaltung: Self-Login legt beim ersten Mal ein Konto an, das standardmäßig
// NICHT freigeschaltet ist (approved=false). Admin-E-Mails (Convex-Env ADMIN_EMAILS)
// werden sofort admin+approved. Vom Admin vorgemerkte Konten übernehmen ihre
// vorkonfigurierten Rechte automatisch.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Resend({
      from: "NetCo Login <login@netco-bodycam.com>",
      maxAge: 60 * 15,
      generateVerificationToken: async () => generateOtpCode(),
      sendVerificationRequest: sendOtpVerificationRequest,
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
