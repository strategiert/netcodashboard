export const BRAND_COLORS = {
  bodycam: {
    primary: "#003366",
    secondary: "#ff6600",
    accent: "#1a365d",
  },
  bautv: {
    primary: "#003366",
    secondary: "#ff6600",
    accent: "#004d99",
  },
  microvista: {
    primary: "#0f172a",
    secondary: "#3b82f6",
    accent: "#1e293b",
  },
} as const;

export const STATUS_CONFIG = {
  planned: {
    label: "Geplant",
    color: "bg-slate-500",
    textColor: "text-slate-400",
  },
  "in-progress": {
    label: "In Arbeit",
    color: "bg-amber-500",
    textColor: "text-amber-400",
  },
  done: {
    label: "Fertig",
    color: "bg-green-500",
    textColor: "text-green-400",
  },
} as const;

export const PROXIMITY_CONFIG = {
  "sehr nah": {
    color: "bg-green-500/20",
    textColor: "text-green-400",
    borderColor: "border-green-500/30",
  },
  nah: {
    color: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
  adjacent: {
    color: "bg-amber-500/20",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/30",
  },
  neutral: {
    color: "bg-slate-500/20",
    textColor: "text-slate-400",
    borderColor: "border-slate-500/30",
  },
} as const;

export const NAV_ITEMS = [
  { href: "/[brand]", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/[brand]/funnel", label: "Funnel", icon: "Filter" },
  { href: "/[brand]/content", label: "Content", icon: "FileText" },
  { href: "/[brand]/stakeholders", label: "Stakeholder", icon: "Users" },
  { href: "/[brand]/journeys", label: "Journeys", icon: "Route" },
  { href: "/[brand]/seo", label: "SEO Cluster", icon: "Search" },
] as const;
