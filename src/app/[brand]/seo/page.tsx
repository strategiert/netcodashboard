"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Globe, Search } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

const proximityColors: Record<string, string> = {
  "sehr nah": "bg-green-500/20 text-green-400 border-green-500/30",
  nah: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  adjacent: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function SeoPage() {
  const params = useParams();
  const brandSlug = params.brand as string;
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const clusters = useQuery(
    api.seoClusters.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  if (!brand || !clusters) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Cluster</h1>
          <p className="text-muted-foreground">
            Content-Cluster für {brand.name}
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Keine SEO Cluster vorhanden</p>
            <p className="text-sm text-muted-foreground">
              Für diese Marke wurden noch keine SEO Cluster angelegt.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Cluster</h1>
        <p className="text-muted-foreground">
          {clusters.length} Content-Cluster für {brand.name}
        </p>
      </div>

      <div className="space-y-4">
        {clusters.map((cluster) => {
          const isExpanded = expandedCluster === cluster._id;

          return (
            <Card key={cluster._id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() =>
                  setExpandedCluster(isExpanded ? null : cluster._id)
                }
              >
                <CardHeader className="hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted font-bold text-lg">
                      {cluster.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{cluster.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={proximityColors[cluster.proximity] || ""}
                        >
                          {cluster.proximity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cluster.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {cluster.topics.length} Themen
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>

              {isExpanded && (
                <CardContent className="border-t pt-4">
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {cluster.topics.map((topic, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg bg-muted/50 p-3"
                      >
                        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{topic}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Über SEO Cluster</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                SEO Cluster gruppieren thematisch verwandte Inhalte, um die
                Sichtbarkeit in Suchmaschinen zu verbessern. Die Nähe zum
                Produkt bestimmt, wie direkt der Content mit dem Angebot
                verknüpft ist.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
