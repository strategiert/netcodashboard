"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { CurrentUser } from "@/lib/sections";

// undefined = lädt, null = nicht angemeldet, sonst der Nutzer inkl. Rechte.
export function useCurrentUser(): CurrentUser | null | undefined {
  return useQuery(api.users.currentUser) as CurrentUser | null | undefined;
}
