"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Circle, Clock, CheckCircle2 } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

const statusIcons = {
  planned: Circle,
  "in-progress": Clock,
  done: CheckCircle2,
};

const proximityColors: Record<string, string> = {
  "sehr nah": "bg-green-500/20 text-green-400 border-green-500/30",
  nah: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  adjacent: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function FunnelPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const phases = useQuery(
    api.phases.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const content = useQuery(
    api.content.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  if (!brand || !phases || !content) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-40 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Funnel-Übersicht</h1>
        <p className="text-muted-foreground">
          Customer Journey Phasen für {brand.name}
        </p>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => {
          const phaseContent = content.filter((c) => c.phaseId === phase._id);
          const stats = {
            total: phaseContent.length,
            planned: phaseContent.filter((c) => c.status === "planned").length,
            inProgress: phaseContent.filter((c) => c.status === "in-progress")
              .length,
            done: phaseContent.filter((c) => c.status === "done").length,
          };

          return (
            <Card key={phase._id} className="overflow-hidden">
              <CardHeader className="border-b bg-card">
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-2 rounded-full"
                    style={{ backgroundColor: phase.color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">
                        Phase {phase.order}
                      </span>
                      <CardTitle>{phase.name}</CardTitle>
                      <Badge variant="secondary">
                        {phaseContent.length} Content Pieces
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {phase.mindset}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-muted-foreground">
                        {stats.planned}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Geplant
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-amber-500">
                        {stats.inProgress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        In Arbeit
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-500">
                        {stats.done}
                      </div>
                      <div className="text-xs text-muted-foreground">Fertig</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {phaseContent.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Inhalte für diese Phase
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {phaseContent.map((item) => {
                      const StatusIcon = statusIcons[item.status as keyof typeof statusIcons] || Circle;
                      return (
                        <div
                          key={item._id}
                          className="rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {item.priority === "high" && (
                                <Zap className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            <StatusIcon
                              className={`h-4 w-4 ${
                                item.status === "done"
                                  ? "text-green-500"
                                  : item.status === "in-progress"
                                    ? "text-amber-500"
                                    : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <h4 className="mb-1 text-sm font-medium">
                            {item.title}
                          </h4>
                          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">
                              {item.format}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs ${proximityColors[item.proximity] || ""}`}
                            >
                              {item.proximity}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
