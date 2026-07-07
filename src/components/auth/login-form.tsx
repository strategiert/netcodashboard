"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Cooldown, bevor ein neuer Code angefordert werden kann.
const RESEND_COOLDOWN_S = 45;

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const submitLock = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_S);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // Schritt 1: Code anfordern. Synchroner Ref-Guard, damit ein Klick nur EINEN
  // Code erzeugt (jeder neue Code macht den vorherigen ungültig).
  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || busy) return;
    submitLock.current = true;
    setError(null);
    setBusy(true);
    try {
      await signIn("resend", { email: email.trim().toLowerCase() });
      setPhase("code");
      startCooldown();
    } catch {
      setError("Konnte den Code nicht senden. Bitte E-Mail prüfen und erneut versuchen.");
    }
    setBusy(false);
    submitLock.current = false;
  }

  // Schritt 2: Code eintippen und verifizieren. Erfolg -> AuthGate rendert das
  // Dashboard (dieser Tab ist eingeloggt).
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (submitLock.current || busy) return;
    submitLock.current = true;
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("resend", { email: email.trim().toLowerCase(), code: code.trim() });
      if (!res?.signingIn) {
        setError("Code ungültig oder abgelaufen. Nutze den zuletzt erhaltenen Code oder fordere einen neuen an.");
      }
    } catch {
      setError("Code ungültig oder abgelaufen. Nutze den zuletzt erhaltenen Code oder fordere einen neuen an.");
    }
    setBusy(false);
    submitLock.current = false;
  }

  async function resend() {
    if (cooldown > 0 || busy) return;
    setError(null);
    setCode("");
    setBusy(true);
    try {
      await signIn("resend", { email: email.trim().toLowerCase() });
      startCooldown();
    } catch {
      setError("Konnte den Code nicht senden. Bitte erneut versuchen.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold">NetCo Marketing</h1>

        {phase === "email" ? (
          <>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              E-Mail eingeben — du bekommst einen 6-stelligen Anmeldecode. Kein Passwort nötig.
            </p>
            <form onSubmit={requestCode} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@netco.de" />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sende Code…" : "Code anfordern"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Wir haben dir einen 6-stelligen Code an <strong className="text-foreground">{email}</strong> geschickt.
              Gib ihn hier ein. Die Mail kann ein bis zwei Minuten brauchen.
            </p>
            <form onSubmit={verifyCode} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">Anmeldecode</Label>
                <Input id="code" inputMode="numeric" autoComplete="one-time-code" required
                  value={code} maxLength={6} placeholder="123456"
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-[0.4em]" />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
                {busy ? "Prüfe…" : "Einloggen"}
              </Button>
            </form>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() => {
                  setPhase("email");
                  setCode("");
                  setError(null);
                }}
              >
                Andere E-Mail
              </button>
              {cooldown > 0 ? (
                <span>Neuer Code in {cooldown}s</span>
              ) : (
                <button type="button" className="text-primary hover:underline" onClick={() => void resend()} disabled={busy}>
                  Code erneut senden
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
