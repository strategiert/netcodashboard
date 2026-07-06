"use client";

import { ReactNode, Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { BrandSelector } from "@/components/brand-selector";
import { GlobalFilterBar } from "@/components/filters/global-filter-bar";
import { Camera, HardHat, Microscope } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SECTIONS, canSeeBrand, canSeeSection } from "@/lib/sections";

const brandIcons: Record<string, React.ReactNode> = {
  bodycam: <Camera className="h-6 w-6" />,
  bautv: <HardHat className="h-6 w-6" />,
  microvista: <Microscope className="h-6 w-6" />,
};

const brandTitles: Record<string, string> = {
  bodycam: "NetCo Body-Cam",
  bautv: "BauTV+",
  microvista: "Microvista",
};

function AccessDenied({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
        <p className="text-sm text-muted-foreground mb-4">{text}</p>
        <Link href="/" className="text-sm text-primary hover:underline">Zur Startseite</Link>
      </div>
    </div>
  );
}

export default function BrandLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const brand = params.brand as string;
  const me = useCurrentUser();

  // Zugriffsprüfung (auch gegen direktes Aufrufen einer URL).
  let denied: string | null = null;
  if (me) {
    if (!canSeeBrand(me, brand)) {
      denied = "Für diese Marke hast du keine Freigabe.";
    } else {
      const subPath = pathname.slice(`/${brand}`.length); // "" | "/report" | …
      const section = SECTIONS.find((s) => s.href === subPath);
      if (section && !canSeeSection(me, section.key)) {
        denied = "Dieser Bereich ist für dich nicht freigeschaltet.";
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-41px)] flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary">
            {brandIcons[brand]}
            <span className="text-lg font-semibold">
              {brandTitles[brand] || "Marketing Workstation"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Suspense><GlobalFilterBar /></Suspense>
          <BrandSelector />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          {me === undefined ? null : denied ? <AccessDenied text={denied} /> : children}
        </main>
      </div>
    </div>
  );
}
