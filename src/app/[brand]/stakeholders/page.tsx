"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MessageSquare, Heart, AlertTriangle } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export default function StakeholdersPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const stakeholders = useQuery(
    api.stakeholders.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  if (!brand || !stakeholders) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-48 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (stakeholders.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stakeholder</h1>
          <p className="text-muted-foreground">
            Personas und Stakeholder für {brand.name}
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Keine Stakeholder vorhanden</p>
            <p className="text-sm text-muted-foreground">
              Für diese Marke wurden noch keine Stakeholder angelegt.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stakeholder</h1>
        <p className="text-muted-foreground">
          {stakeholders.length} Personas für {brand.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stakeholders.map((stakeholder) => (
          <Card key={stakeholder._id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{stakeholder.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {stakeholder.role}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="outline">{stakeholder.type}</Badge>
                <Badge variant="secondary">{stakeholder.ageRange} Jahre</Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Pain Points
                  </h4>
                  <ul className="space-y-1">
                    {stakeholder.painPoints.map((pain, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="mt-2 h-1 w-1 rounded-full bg-destructive flex-shrink-0" />
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-500">
                    <Heart className="h-4 w-4" />
                    Gains
                  </h4>
                  <ul className="space-y-1">
                    {stakeholder.gains.map((gain, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="mt-2 h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                        {gain}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-500">
                    <MessageSquare className="h-4 w-4" />
                    Bevorzugte Kanäle
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {stakeholder.preferredChannels.map((channel, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                {stakeholder.quote && (
                  <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/50 p-3">
                    <p className="italic text-sm">&quot;{stakeholder.quote}&quot;</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      — {stakeholder.name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
