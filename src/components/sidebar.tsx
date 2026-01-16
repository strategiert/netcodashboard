"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Filter,
  FileText,
  Users,
  Route,
  Search,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funnel", label: "Funnel", icon: Filter },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/stakeholders", label: "Stakeholder", icon: Users },
  { href: "/journeys", label: "Journeys", icon: Route },
  { href: "/seo", label: "SEO Cluster", icon: Search },
];

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const brand = params.brand as string;

  if (!brand) return null;

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const href = `/${brand}${item.href}`;
          const isActive = pathname === href || (item.href === "" && pathname === `/${brand}`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Einstellungen
        </Link>
      </div>
    </aside>
  );
}
