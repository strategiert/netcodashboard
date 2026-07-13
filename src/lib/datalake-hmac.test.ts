import { describe, it, expect } from "vitest";
import { signIngest, verifyIngestSignature } from "./datalake-hmac";

const SECRET = "test-secret";

describe("datalake hmac", () => {
  it("accepts a fresh, correctly signed request", async () => {
    const ts = String(Date.now());
    const sig = await signIngest(SECRET, ts, "n1", '{"a":1}');
    expect(await verifyIngestSignature(SECRET, ts, "n1", '{"a":1}', sig)).toEqual({ ok: true });
  });

  it("rejects a wrong signature", async () => {
    const ts = String(Date.now());
    const r = await verifyIngestSignature(SECRET, ts, "n1", '{"a":1}', "00".repeat(32));
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects a stale timestamp (> 5 min)", async () => {
    const ts = String(Date.now() - 6 * 60 * 1000);
    const sig = await signIngest(SECRET, ts, "n1", "{}");
    const r = await verifyIngestSignature(SECRET, ts, "n1", "{}", sig);
    expect(r).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("rejects tampered body", async () => {
    const ts = String(Date.now());
    const sig = await signIngest(SECRET, ts, "n1", '{"a":1}');
    const r = await verifyIngestSignature(SECRET, ts, "n1", '{"a":2}', sig);
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });
});
