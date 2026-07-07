import test from "node:test";
import assert from "node:assert/strict";

import { buildBodycamMagicLinkRelayRequest, buildMagicLinkConfirmUrl, buildMagicLinkEmail } from "./authEmail";

test("buildMagicLinkConfirmUrl keeps the one-time code out of the request URL", () => {
  const magicUrl = "https://netcodashboard.vercel.app/?code=secret-code&redirectTo=%2Fmicrovista%2Freport";

  const confirmUrl = buildMagicLinkConfirmUrl(magicUrl, "https://netcodashboard.vercel.app");
  const parsed = new URL(confirmUrl);

  assert.equal(parsed.origin, "https://netcodashboard.vercel.app");
  assert.equal(parsed.pathname, "/auth/confirm");
  assert.equal(parsed.search, "");
  assert.match(parsed.hash, /^#url=/);
  assert.equal(new URLSearchParams(parsed.hash.slice(1)).get("url"), magicUrl);
});

test("buildMagicLinkEmail only exposes the scanner-safe confirmation URL", () => {
  const magicUrl = "https://netcodashboard.vercel.app/?code=secret-code";
  const confirmUrl = buildMagicLinkConfirmUrl(magicUrl, "https://netcodashboard.vercel.app");

  const email = buildMagicLinkEmail({
    confirmUrl,
    host: "netcodashboard.vercel.app",
  });

  assert.match(email.html, /Anmeldung bestaetigen/);
  assert.match(email.text, /Anmeldung bestaetigen/);
  assert.match(email.html, /\/auth\/confirm#url=/);
  assert.match(email.text, /\/auth\/confirm#url=/);
  assert.doesNotMatch(email.html, /\?code=secret-code/);
  assert.doesNotMatch(email.text, /\?code=secret-code/);
});

test("buildBodycamMagicLinkRelayRequest sends the scanner-safe confirmation URL", () => {
  const magicUrl = "https://netcodashboard.vercel.app/?code=secret-code";

  const request = buildBodycamMagicLinkRelayRequest({
    endpoint: "https://www.netco.de/api/dashboard-login-mail",
    secret: "relay-secret",
    to: "alexa.baumann@netco.de",
    magicUrl,
    siteUrl: "https://netcodashboard.vercel.app",
  });

  assert.equal(request.url, "https://www.netco.de/api/dashboard-login-mail");
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers.Authorization, "Bearer relay-secret");

  const payload = JSON.parse(String(request.init.body));
  assert.equal(payload.to, "alexa.baumann@netco.de");
  assert.equal(payload.host, "netcodashboard.vercel.app");
  assert.match(payload.confirmUrl, /\/auth\/confirm#url=/);
  assert.doesNotMatch(payload.confirmUrl, /\?code=secret-code/);
});
