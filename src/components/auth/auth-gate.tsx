"use client";

import { Authenticated, Unauthenticated, AuthLoading, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { api } from "../../../convex/_generated/api";
import { LoginForm } from "./login-form";
import { Button } from "@/components/ui/button";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
      </div>
    </div>
  );
}

// Freigeschaltet? Sonst Hinweis + Logout.
function ApprovedGate({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  if (me === undefined) return <Spinner />;

  if (!me || !me.approved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold">Konto wartet auf Freischaltung</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dein Konto ist angelegt, aber noch nicht freigeschaltet. Der Admin muss dich freigeben
            und deine Bereiche festlegen. Danach hier erneut anmelden.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => void signOut()}>
            Abmelden
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // /intern/* (Agent-Board) hat einen eigenen Key-Schutz für Team-Agenten — nicht Login-gaten.
  if (pathname?.startsWith("/intern")) return <>{children}</>;

  return (
    <>
      <AuthLoading><Spinner /></AuthLoading>
      <Unauthenticated><LoginForm /></Unauthenticated>
      <Authenticated><ApprovedGate>{children}</ApprovedGate></Authenticated>
    </>
  );
}
