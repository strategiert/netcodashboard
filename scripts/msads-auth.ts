// Einmaliges Script zum Generieren des Microsoft Ads Refresh Tokens
// Ausführen: npm run msads:auth  (bzw. npx tsx --env-file=.env.local scripts/msads-auth.ts)
// Liest MS_ADS_CLIENT_ID/MS_ADS_CLIENT_SECRET aus .env.local, Fallback: C:\Users\karent\.env

import * as http from "http";
import * as url from "url";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

function loadFallbackEnv(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const envPath = path.join(os.homedir(), ".env");
    const line = fs.readFileSync(envPath, "utf8").split(/\r?\n/)
      .find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
  } catch {
    return undefined;
  }
}

const CLIENT_ID = loadFallbackEnv("MS_ADS_CLIENT_ID");
const CLIENT_SECRET = loadFallbackEnv("MS_ADS_CLIENT_SECRET");
const REDIRECT_URI = "http://localhost:31544";
const SCOPE = "https://ads.microsoft.com/msads.manage offline_access";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("MS_ADS_CLIENT_ID oder MS_ADS_CLIENT_SECRET fehlt (.env.local oder ~/.env)");
  process.exit(1);
}

const authUrl =
  `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `response_mode=query&` +
  `scope=${encodeURIComponent(SCOPE)}&` +
  `prompt=select_account`;

console.log("\nÖffne diese URL im Browser und melde dich mit dem MICROSOFT-ADS-Konto an:\n");
console.log(authUrl);
console.log("\nWarte auf Callback auf http://localhost:31544 ...\n");

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url ?? "", true);
  const code = parsed.query.code as string;
  if (!code) {
    const err = parsed.query.error_description ?? parsed.query.error ?? "Kein Code erhalten.";
    res.end(`Fehler: ${err}`);
    return;
  }

  const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI, grant_type: "authorization_code",
      scope: SCOPE,
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
  console.log(`MS_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\nIn .env.local eintragen und dann: npx convex env set MS_ADS_REFRESH_TOKEN <token>\n");
  res.end("✅ Fertig! Schau in die Konsole.");
  server.close();
});

server.listen(31544);
