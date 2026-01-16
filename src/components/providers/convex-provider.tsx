"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Convex features will not work.");
      return null;
    }
    return new ConvexReactClient(url);
  }, []);

  if (!convex) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold">Convex nicht konfiguriert</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Bitte konfigurieren Sie Convex, um die App zu nutzen:
          </p>
          <ol className="mb-4 text-left text-sm text-muted-foreground">
            <li className="mb-2">1. Führen Sie <code className="rounded bg-muted px-1">npx convex dev</code> aus</li>
            <li className="mb-2">2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes</li>
            <li>3. Die <code className="rounded bg-muted px-1">.env.local</code> Datei wird automatisch erstellt</li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Starten Sie danach die App neu mit <code className="rounded bg-muted px-1">npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
