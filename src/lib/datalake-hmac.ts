// HMAC-Transportsicherung für den Datalake-Ingest (Website → Convex).
// Basisstring `${ts}.${nonce}.${body}`, HMAC-SHA-256, hex. Fenster ±5 Minuten.
const WINDOW_MS = 300_000;

async function hmacHex(secret: string, base: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signIngest(secret: string, ts: string, nonce: string, body: string): Promise<string> {
  return hmacHex(secret, `${ts}.${nonce}.${body}`);
}

export async function verifyIngestSignature(
  secret: string, ts: string, nonce: string, body: string, sigHex: string,
  nowMs: number = Date.now(),
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const t = Number(ts);
  if (!Number.isFinite(t) || Math.abs(nowMs - t) > WINDOW_MS) return { ok: false, reason: "stale_timestamp" };
  const expected = await signIngest(secret, ts, nonce, body);
  if (expected.length !== sigHex.length) return { ok: false, reason: "bad_signature" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sigHex.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, reason: "bad_signature" };
}
