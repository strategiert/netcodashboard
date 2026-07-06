"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";

// Blockt eine ganze Seite für Nicht-Admins (client-seitig).
export function AdminOnly({ children }: { children: ReactNode }) {
  const me = useCurrentUser();
  if (me === undefined) return <div className="p-6 text-sm text-muted-foreground">Lädt…</div>;
  if (!me?.isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
        <p className="text-sm text-muted-foreground">Dieser Bereich ist nur für Admins.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-primary hover:underline">Zur Startseite</Link>
      </div>
    );
  }
  return <>{children}</>;
}
