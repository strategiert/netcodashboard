"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { BarChart2, Users, LogOut } from "lucide-react";

// Globale Kopfzeile über allem: Marken-/Bereichsnavigation liegt in der Sidebar,
// hier nur App-Identität, Admin-Links und Abmelden.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const me = useCurrentUser();
  const { signOut } = useAuthActions();

  // Agent-Board unangetastet lassen (eigener Schutz, kein App-Chrome).
  if (pathname?.startsWith("/intern")) return <>{children}</>;

  return (
    <>
      <div className="border-b px-4 py-2 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-4">
          <span className="font-semibold">NetCo Marketing</span>
          {me?.isAdmin && (
            <>
              <Link href="/kpis" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <BarChart2 className="h-4 w-4" />
                Executive Overview
              </Link>
              <Link href="/admin/users" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Users className="h-4 w-4" />
                Nutzerverwaltung
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {me && (
            <span className="text-muted-foreground">
              {me.name || me.email}
              {me.isAdmin && <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Admin</span>}
            </span>
          )}
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
