"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import { visibleSections } from "@/lib/sections";
import {
  LayoutDashboard, Filter, FileText, Users, Route, Search, Settings,
  Megaphone, BarChart2, Share2, ClipboardList, TrendingUp, CalendarDays,
  Sparkles, Database, GitBranch, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Filter, FileText, Users, Route, Search,
  Megaphone, BarChart2, Share2, ClipboardList, TrendingUp, CalendarDays,
  Sparkles, Database, GitBranch,
};

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const brand = params.brand as string;
  const me = useCurrentUser();

  if (!brand) return null;

  const sections = visibleSections(me);

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <nav className="flex-1 space-y-1 p-4">
        {sections.map((item) => {
          const href = `/${brand}${item.href}`;
          const isActive = pathname === href || (item.href === "" && pathname === `/${brand}`);
          const Icon = ICONS[item.icon] ?? LayoutDashboard;

          return (
            <Link
              key={item.key}
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
      {me?.isAdmin && (
        <div className="border-t p-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-4 w-4" />
            Einstellungen
          </Link>
        </div>
      )}
    </aside>
  );
}
