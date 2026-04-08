"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

export function WorkspaceManager({ brandSlug }: { brandSlug: string }) {
  const workspaces = useQuery(api.publer.listWorkspaces);
  const brands = useQuery(api.brands.list);
  const brand = brands?.find(b => b.slug === brandSlug);
  const assignWorkspace = useMutation(api.publer.assignWorkspaceToBrand);
  const fetchWorkspaces = useAction(api.actions.fetchPublerWorkspaces.fetchPublerWorkspaces);
  const [fetching, setFetching] = useState(false);

  if (!workspaces || !brands || !brand) return null;

  const brandMap = Object.fromEntries(brands.map(b => [b._id, b]));

  async function handleFetch() {
    setFetching(true);
    try { await fetchWorkspaces(); } catch { /* ignore */ }
    setFetching(false);
  }

  async function handleAssign(workspaceId: string, newBrandId: Id<"brands"> | undefined) {
    await assignWorkspace({ workspaceId, brandId: newBrandId });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Publer Workspaces</CardTitle>
        <Button variant="outline" size="sm" onClick={handleFetch} disabled={fetching}>
          {fetching ? "Lade…" : "Workspaces abrufen"}
        </Button>
      </CardHeader>
      <CardContent>
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Workspaces gefunden. Klicke &quot;Workspaces abrufen&quot; um sie aus Publer zu laden.
          </p>
        ) : (
          <div className="space-y-3">
            {workspaces.map(ws => {
              const assignedBrand = ws.brandId ? brandMap[ws.brandId] : null;
              const isAssignedHere = ws.brandId === brand._id;

              return (
                <div key={ws._id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{ws.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ws.accountCount ?? 0} Konten · ID: {ws.workspaceId.slice(0, 8)}…
                      {ws.lastSynced && <> · Zuletzt: {ws.lastSynced}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {assignedBrand && (
                      <Badge variant={isAssignedHere ? "default" : "secondary"} className="text-xs">
                        {assignedBrand.name}
                      </Badge>
                    )}
                    {isAssignedHere ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        onClick={() => handleAssign(ws.workspaceId, undefined)}
                      >
                        Entfernen
                      </Button>
                    ) : !assignedBrand ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleAssign(ws.workspaceId, brand._id)}
                      >
                        → {brand.name}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleAssign(ws.workspaceId, brand._id)}
                      >
                        Umziehen → {brand.name}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
