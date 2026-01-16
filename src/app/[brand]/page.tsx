"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const stats = useQuery(
    api.content.getStats,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const phases = useQuery(
    api.phases.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const content = useQuery(
    api.content.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  if (!brand || !stats || !phases || !content) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const priorityContent = content.filter((c) => c.priority === "high");
  const recentInProgress = content
    .filter((c) => c.status === "in-progress")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht für {brand.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Content Pieces</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Priorität</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {stats.priority}
            </div>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Geplant</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planned}</div>
            <p className="text-xs text-muted-foreground">Noch offen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Arbeit</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {stats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">Aktuell aktiv</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fertig</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.done}</div>
            <p className="text-xs text-muted-foreground">Abgeschlossen</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Priority Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              High Priority Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorityContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keine priorisierten Inhalte
              </p>
            ) : (
              <div className="space-y-3">
                {priorityContent.slice(0, 5).map((item) => {
                  const phase = phases.find((p) => p._id === item.phaseId);
                  return (
                    <div
                      key={item._id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {phase?.shortName} • {item.format}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          item.status === "in-progress"
                            ? "bg-amber-500/20 text-amber-500"
                            : item.status === "done"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status === "in-progress"
                          ? "In Arbeit"
                          : item.status === "done"
                            ? "Fertig"
                            : "Geplant"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Phasen-Übersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {phases.map((phase) => {
                const phaseContent = content.filter(
                  (c) => c.phaseId === phase._id
                );
                const doneCount = phaseContent.filter(
                  (c) => c.status === "done"
                ).length;
                const percentage =
                  phaseContent.length > 0
                    ? Math.round((doneCount / phaseContent.length) * 100)
                    : 0;

                return (
                  <div key={phase._id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{phase.shortName}</span>
                      <span className="text-muted-foreground">
                        {doneCount}/{phaseContent.length}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: phase.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/${brandSlug}/funnel`}>
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Funnel-Übersicht</h3>
                <p className="text-sm text-muted-foreground">
                  Phasen und Content visualisieren
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${brandSlug}/content`}>
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Content verwalten</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.total} Pieces bearbeiten
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${brandSlug}/content?status=in-progress`}>
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-amber-500/10 p-3">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold">In Arbeit</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.inProgress} Pieces in Bearbeitung
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
