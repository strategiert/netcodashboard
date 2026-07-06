"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { visibleSections, canSeeBrand } from "@/lib/sections";

export default function Home() {
  const router = useRouter();
  const brands = useQuery(api.brands.list);
  const me = useCurrentUser();

  useEffect(() => {
    if (brands === undefined || me === undefined || me === null) return;

    // Erste Marke, die der Nutzer sehen darf (Admin: alle).
    const allowed = brands.filter((b) => canSeeBrand(me, b.slug));
    if (allowed.length === 0) return; // Hinweis unten

    // Erste sichtbare Section (Startseite = Bericht, sofern erlaubt).
    const sections = visibleSections(me);
    if (sections.length === 0) return;
    const start = sections.find((s) => s.key === "report") ?? sections[0];

    router.replace(`/${allowed[0].slug}${start.href}`);
  }, [brands, me, router]);

  const noAccess =
    me && brands !== undefined &&
    (brands.filter((b) => canSeeBrand(me, b.slug)).length === 0 || visibleSections(me).length === 0);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md text-center">
        {noAccess ? (
          <>
            <h1 className="text-xl font-bold mb-2">Noch keine Bereiche freigeschaltet</h1>
            <p className="text-sm text-muted-foreground">
              Dein Konto ist freigeschaltet, aber es wurden dir noch keine Marken oder Bereiche zugewiesen.
              Bitte den Admin, dir Rechte zu geben.
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">Wird geladen…</p>
            <div className="mt-4 h-1 w-48 mx-auto bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-primary animate-pulse rounded-full" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
