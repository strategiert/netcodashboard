"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, ChevronRight } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function JourneysPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const journeys = useQuery(
    api.journeys.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  if (!brand || !journeys) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (journeys.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Journeys</h1>
          <p className="text-muted-foreground">
            Journey Maps für {brand.name}
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Route className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Keine Journeys vorhanden</p>
            <p className="text-sm text-muted-foreground">
              Für diese Marke wurden noch keine Customer Journeys angelegt.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customer Journeys</h1>
        <p className="text-muted-foreground">
          {journeys.length} Journeys für {brand.name}
        </p>
      </div>

      <div className="space-y-4">
        {journeys.map((journey) => (
          <Card key={journey._id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${journey.color || '#3b82f6'}20` }}
                >
                  <Route
                    className="h-6 w-6"
                    style={{ color: journey.color || '#3b82f6' }}
                  />
                </div>
                <div className="flex-1">
                  <CardTitle>{journey.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{journey.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Situation</p>
                  <p className="text-sm">{journey.situation}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
                <span>
                  Klicken Sie auf eine Journey, um die Schritte zu sehen
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Route className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Journey Editor kommt bald</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                In der nächsten Version können Sie Customer Journeys erstellen
                und bearbeiten, Schritte definieren und Content-Pieces
                verknüpfen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
