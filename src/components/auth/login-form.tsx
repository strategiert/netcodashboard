"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// So lange sperren wir "erneut senden", damit Nutzer nicht mehrere Links
// hintereinander anfordern. Jeder neue Link macht den vorherigen ungültig —
// wer dann den älteren Link aus einer früheren Mail klickt, landet wieder hier.
const RESEND_COOLDOWN_S = 45;

// Nur als "gerade fehlgeschlagen" werten, wenn der Bestätigungs-Klick nicht lange
// her ist. Sonst würde ein alter Marker beim nächsten Logout einen Fehlhinweis zeigen.
const STALE_ATTEMPT_MAX_AGE_MS = 3 * 60 * 1000;

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [linkFailed, setLinkFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Wir landen hier (Login-Formular = nicht eingeloggt). Falls kurz zuvor ein
  // Bestätigungs-Link geöffnet wurde, hat die Anmeldung nicht geklappt — meist
  // ein veralteter Link. Das erklären wir, statt den Nutzer stumm zurückzuwerfen.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("netco_login_attempt");
      if (raw) {
        sessionStorage.removeItem("netco_login_attempt");
        if (Date.now() - Number(raw) < STALE_ATTEMPT_MAX_AGE_MS) {
          setLinkFailed(true);
        }
      }
    } catch {
      // sessionStorage nicht verfügbar — dann kein Hinweis.
    }
  }, []);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLinkFailed(false);
    setBusy(true);
    try {
      await signIn("resend", { email });
      setSent(true);
      startCooldown();
    } catch {
      setError("Konnte den Link nicht senden. Bitte E-Mail prüfen und erneut versuchen.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold">NetCo Marketing</h1>

        {sent ? (
          <>
            <p className="mt-1 mb-3 text-sm text-muted-foreground">
              Wir haben dir einen Anmelde-Link an <strong className="text-foreground">{email}</strong> geschickt.
              Öffne die Mail und bestätige die Anmeldung über den Button.
            </p>
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              <strong>Wichtig:</strong> Öffne immer den <strong>zuletzt erhaltenen</strong> Link.
              Sobald du erneut sendest, werden alle älteren Links ungültig. Die Mail kann ein bis zwei
              Minuten brauchen — bitte kurz warten, bevor du erneut sendest.
            </div>
            <p className="text-xs text-muted-foreground">
              Keine Mail bekommen? Spam-Ordner prüfen
              {cooldown > 0 ? (
                <> oder in {cooldown}s erneut senden.</>
              ) : (
                <>
                  {" "}oder{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      setSent(false);
                      setError(null);
                      setLinkFailed(false);
                    }}
                  >
                    erneut senden
                  </button>
                  .
                </>
              )}
            </p>
          </>
        ) : (
          <>
            {linkFailed && (
              <div className="mt-3 mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                Der geöffnete Anmelde-Link war nicht mehr gültig — meist, weil zwischendurch ein neuer
                Link angefordert wurde. Fordere hier einen neuen an und öffne dann die <strong>zuletzt</strong>{" "}
                erhaltene Mail.
              </div>
            )}
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              E-Mail eingeben — du bekommst einen Anmelde-Link. Kein Passwort nötig.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="name@netco.de" />
              </div>
              {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Sende Link…" : "Anmelde-Link senden"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
