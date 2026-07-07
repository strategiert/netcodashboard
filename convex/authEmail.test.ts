import test from "node:test";
import assert from "node:assert/strict";

import { buildMagicLinkConfirmUrl, buildMagicLinkEmail } from "./authEmail";

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
