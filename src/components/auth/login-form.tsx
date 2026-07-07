"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn("resend", { email });
      setSent(true);
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
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
              Wir haben dir einen Anmelde-Link an <strong className="text-foreground">{email}</strong> geschickt.
              Öffne die Mail und bestätige die Anmeldung über den Button.
            </p>
            <p className="text-xs text-muted-foreground">
              Keine Mail bekommen? Spam-Ordner prüfen oder{" "}
              <button className="text-primary hover:underline" onClick={() => { setSent(false); setError(null); }}>
                erneut senden
              </button>.
            </p>
          </>
        ) : (
          <>
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
