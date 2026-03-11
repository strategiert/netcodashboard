"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Id, Doc } from "../../../convex/_generated/dataModel";

interface JourneyStepFormProps {
  journeyId: Id<"journeys">;
  phases: Doc<"phases">[];
  contentPieces: Doc<"contentPieces">[];
  editingId?: Id<"journeySteps">;
  defaultValues?: Partial<Doc<"journeySteps">>;
  onSuccess?: () => void;
  nextOrder: number;
}

export function JourneyStepForm({
  journeyId,
  phases,
  contentPieces,
  editingId,
  defaultValues,
  onSuccess,
  nextOrder,
}: JourneyStepFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [phaseId, setPhaseId] = useState(
    defaultValues?.phaseId?.toString() || phases[0]?._id?.toString() || ""
  );
  const [order, setOrder] = useState(defaultValues?.order ?? nextOrder);
  const [trigger, setTrigger] = useState(defaultValues?.trigger || "");
  const [searchQuery, setSearchQuery] = useState(
    defaultValues?.searchQuery || ""
  );
  const [contentIds, setContentIds] = useState<string[]>(
    defaultValues?.contentIds?.map((id) => id.toString()) || []
  );
  const [insight, setInsight] = useState(defaultValues?.insight || "");

  const createStep = useMutation(api.journeys.createStep);
  const updateStep = useMutation(api.journeys.updateStep);

  // Content Pieces gefiltert nach gewählter Phase
  const filteredContent = useMemo(() => {
    if (!phaseId) return contentPieces;
    return contentPieces.filter((cp) => cp.phaseId?.toString() === phaseId);
  }, [contentPieces, phaseId]);

  const toggleContentId = (id: string) => {
    setContentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const typedContentIds = contentIds.map(
        (id) => id as Id<"contentPieces">
      );

      if (editingId) {
        await updateStep({
          id: editingId,
          phaseId: phaseId as Id<"phases">,
          order,
          trigger,
          searchQuery: searchQuery || undefined,
          contentIds: typedContentIds,
          insight,
        });
      } else {
        await createStep({
          journeyId,
          phaseId: phaseId as Id<"phases">,
          order,
          trigger,
          searchQuery: searchQuery || undefined,
          contentIds: typedContentIds,
          insight,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving step:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phaseId">Phase *</Label>
          <Select value={phaseId} onValueChange={setPhaseId}>
            <SelectTrigger>
              <SelectValue placeholder="Phase wählen" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((phase) => (
                <SelectItem key={phase._id} value={phase._id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: phase.color }}
                    />
                    {phase.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Reihenfolge</Label>
          <Input
            id="order"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            min={0}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="trigger">Trigger *</Label>
          <Textarea
            id="trigger"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Was löst diesen Schritt aus?"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="searchQuery">Suchbegriff</Label>
          <Input
            id="searchQuery"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Optionaler Suchbegriff"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Verknüpfte Content-Pieces</Label>
          {filteredContent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine Content-Pieces für diese Phase vorhanden.
            </p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {filteredContent.map((cp) => (
                <label
                  key={cp._id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={contentIds.includes(cp._id.toString())}
                    onChange={() => toggleContentId(cp._id.toString())}
                    className="rounded border-input"
                  />
                  <span className="flex-1 text-sm">{cp.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {cp.format}
                  </Badge>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="insight">Erkenntnis *</Label>
          <Textarea
            id="insight"
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="Was lernen wir daraus?"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Speichern..."
            : editingId
              ? "Aktualisieren"
              : "Erstellen"}
        </Button>
      </div>
    </form>
  );
}
