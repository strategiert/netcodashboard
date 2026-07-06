"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
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
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_CONVEX_URL</code> ist nicht gesetzt.
          </p>
        </div>
      </div>
    );
  }

  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
