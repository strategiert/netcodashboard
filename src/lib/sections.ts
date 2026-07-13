// Zentrale Definition aller Navigations-Bereiche + Rechte-Logik.
// Member sehen nur freigeschaltete, nicht-adminOnly Sections (pro Marke).
// Admin sieht immer alles.

export type SectionKey =
  | "report" | "daily" | "social" | "rankings" | "aiVisibility"  // member-vergebbar
  | "dashboard" | "kpis" | "campaigns" | "funnel"                 // admin-only
  | "content" | "stakeholders" | "journeys" | "seo" | "datalake";

export type Section = {
  key: SectionKey;
  href: string;        // relativer Pfad hinter /[brand]
  label: string;
  icon: string;        // lucide-react Icon-Name
  adminOnly: boolean;  // true = nur Admin sieht/darf es (nicht an Member vergebbar)
};

// Reihenfolge = Reihenfolge in der Sidebar.
export const SECTIONS: Section[] = [
  { key: "report",       href: "/report",       label: "Bericht",      icon: "ClipboardList", adminOnly: false },
  { key: "daily",        href: "/daily",        label: "Tagesreport",  icon: "CalendarDays",  adminOnly: false },
  { key: "social",       href: "/social",       label: "Social",       icon: "Share2",        adminOnly: false },
  { key: "rankings",     href: "/rankings",     label: "Rankings",     icon: "TrendingUp",    adminOnly: false },
  { key: "aiVisibility", href: "/ai-visibility", label: "KI-Analyse",  icon: "Sparkles",      adminOnly: false },
  // Admin-only (für Mitarbeiter komplett unsichtbar):
  { key: "dashboard",    href: "",              label: "Dashboard",    icon: "LayoutDashboard", adminOnly: true },
  { key: "kpis",         href: "/kpis",         label: "KPIs",         icon: "BarChart2",     adminOnly: true },
  { key: "campaigns",    href: "/campaigns",    label: "Kampagnen",    icon: "Megaphone",     adminOnly: true },
  { key: "funnel",       href: "/funnel",       label: "Funnel",       icon: "Filter",        adminOnly: true },
  { key: "content",      href: "/content",      label: "Content",      icon: "FileText",      adminOnly: true },
  { key: "stakeholders", href: "/stakeholders", label: "Stakeholder",  icon: "Users",         adminOnly: true },
  { key: "journeys",     href: "/journeys",     label: "Journeys",     icon: "Route",         adminOnly: true },
  { key: "seo",          href: "/seo",          label: "SEO Cluster",  icon: "Search",        adminOnly: true },
  { key: "datalake",     href: "/datalake",     label: "Datalake",     icon: "Database",      adminOnly: true },
];

// Nur diese Sections kann ein Admin einem Member zuweisen.
export const MEMBER_SECTIONS = SECTIONS.filter((s) => !s.adminOnly);

// Standard-Startseite nach Login.
export const DEFAULT_SECTION = "/report";

export type CurrentUser = {
  _id: string;
  email: string | null;
  name: string | null;
  role: string;
  isAdmin: boolean;
  approved: boolean;
  allowedSections: string[];
  allowedBrands: string[];
};

export function canSeeSection(user: CurrentUser | null | undefined, key: SectionKey): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const section = SECTIONS.find((s) => s.key === key);
  if (!section || section.adminOnly) return false;
  return user.allowedSections.includes(key);
}

export function canSeeBrand(user: CurrentUser | null | undefined, brandSlug: string): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.allowedBrands.includes(brandSlug);
}

// Sections, die ein Nutzer in einer Marke tatsächlich sehen darf (für Sidebar).
export function visibleSections(user: CurrentUser | null | undefined): Section[] {
  if (!user) return [];
  if (user.isAdmin) return SECTIONS;
  return MEMBER_SECTIONS.filter((s) => user.allowedSections.includes(s.key));
}
