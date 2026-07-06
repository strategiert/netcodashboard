"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn("password", { email, password, name, flow });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Convex-Auth-Fehler sind technisch — für die GF freundlich übersetzen.
      if (/InvalidSecret|InvalidAccountId/i.test(msg)) {
        setError("E-Mail oder Passwort falsch.");
      } else if (/already exists|account.*exists/i.test(msg)) {
        setError("Für diese E-Mail existiert bereits ein Konto. Bitte anmelden.");
      } else if (flow === "signUp" && /password/i.test(msg)) {
        setError("Passwort zu schwach — mind. 8 Zeichen verwenden.");
      } else {
        setError("Fehlgeschlagen. Bitte Eingaben prüfen.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold">NetCo Marketing</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          {flow === "signIn" ? "Bitte anmelden." : "Konto anlegen. Freischaltung durch den Admin."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {flow === "signUp" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vor- und Nachname" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={flow === "signIn" ? "current-password" : "new-password"} />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Bitte warten…" : flow === "signIn" ? "Anmelden" : "Konto anlegen"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => { setFlow(flow === "signIn" ? "signUp" : "signIn"); setError(null); }}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {flow === "signIn" ? "Noch kein Konto? Registrieren" : "Schon ein Konto? Anmelden"}
        </button>
      </div>
    </div>
  );
}
