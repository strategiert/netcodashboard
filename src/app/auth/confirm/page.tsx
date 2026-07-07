"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function readMagicUrl() {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const target = new URLSearchParams(hash).get("url");
  if (!target) return null;

  try {
    const targetUrl = new URL(target);
    if (targetUrl.origin !== window.location.origin) return null;
    return targetUrl.toString();
  } catch {
    return null;
  }
}

export default function ConfirmLoginPage() {
  const [magicUrl, setMagicUrl] = useState<string | null>(null);

  useEffect(() => {
    setMagicUrl(readMagicUrl());
  }, []);

  function confirmLogin() {
    if (magicUrl) {
      // Marker: falls die Verifizierung fehlschlägt (z.B. veralteter Link, weil
      // zwischenzeitlich ein neuer angefordert wurde), landet der Nutzer wieder
      // auf dem Login. Das Login-Formular liest diesen Marker und erklärt dann,
      // warum es nicht geklappt hat, statt stumm zurückzuspringen.
      try {
        sessionStorage.setItem("netco_login_attempt", String(Date.now()));
      } catch {
        // sessionStorage kann in manchen Kontexten blockiert sein — dann ohne Marker.
      }
      window.location.assign(magicUrl);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-bold">NetCo Marketing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bestaetige deine Anmeldung. Danach bist du im Dashboard eingeloggt.
        </p>

        {magicUrl ? (
          <Button className="mt-5 w-full" onClick={confirmLogin}>
            Jetzt einloggen
          </Button>
        ) : (
          <p className="mt-5 text-sm text-red-600 dark:text-red-500">
            Dieser Anmelde-Link ist unvollstaendig oder gehoert nicht zu dieser App.
          </p>
        )}
      </div>
    </div>
  );
}
