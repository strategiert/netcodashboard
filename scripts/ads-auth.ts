// Einmaliges Script zum Generieren des Google Ads Refresh Tokens
// Ausführen: npx tsx --env-file=.env.local scripts/ads-auth.ts

import * as http from "http";
import * as url from "url";

const CLIENT_ID = process.env.GADS_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.GADS_OAUTH_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:8080";
const SCOPE = "https://www.googleapis.com/auth/adwords";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("GADS_OAUTH_CLIENT_ID or GADS_OAUTH_CLIENT_SECRET not set in .env.local");
  process.exit(1);
}

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPE)}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log("\nÖffne diese URL im Browser:\n");
console.log(authUrl);
console.log("\nWarte auf Callback auf http://localhost:8080 ...\n");

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url ?? "", true);
  const code = parsed.query.code as string;
  if (!code) { res.end("Kein Code erhalten."); return; }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI, grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json() as any;

  if (!tokens.refresh_token) {
    console.error("Kein Refresh Token erhalten:", JSON.stringify(tokens));
    res.end("Fehler — kein refresh_token. Schau in die Konsole.");
    server.close();
    return;
  }

  console.log("\n✅ Refresh Token:\n");
  console.log(`GADS_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\nIn .env.local eintragen und dann: npx convex env set GADS_REFRESH_TOKEN <token>\n");
  res.end("✅ Fertig! Schau in die Konsole.");
  server.close();
});

server.listen(8080);
