"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { BrandSelector } from "@/components/brand-selector";
import { Camera, HardHat, Microscope } from "lucide-react";
import { useParams } from "next/navigation";

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

export default function BrandLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const brand = params.brand as string;

  return (
    <div className="flex h-screen flex-col">
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
          <BrandSelector />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
