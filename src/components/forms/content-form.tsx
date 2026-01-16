"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id, Doc } from "../../../convex/_generated/dataModel";

interface ContentFormProps {
  brandId: Id<"brands">;
  phases: Doc<"phases">[];
  editingId?: Id<"contentPieces">;
  defaultValues?: Partial<Doc<"contentPieces">>;
  onSuccess?: () => void;
}

const formatOptions = [
  "PDF",
  "PDF + Artikel",
  "Video",
  "Online-Tool",
  "Checkliste",
  "Webinar",
  "Demo",
  "Workshop",
  "Poster",
  "Guide",
  "One-Pager",
  "Rechner",
  "Social Media",
  "Ads",
  "Event",
];

const proximityOptions = ["sehr nah", "nah", "adjacent", "neutral"];
const statusOptions = [
  { value: "planned", label: "Geplant" },
  { value: "in-progress", label: "In Arbeit" },
  { value: "done", label: "Fertig" },
];
const priorityOptions = [
  { value: "normal", label: "Normal" },
  { value: "high", label: "High Priority" },
];

export function ContentForm({
  brandId,
  phases,
  editingId,
  defaultValues,
  onSuccess,
}: ContentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [format, setFormat] = useState(defaultValues?.format || "PDF");
  const [description, setDescription] = useState(
    defaultValues?.description || ""
  );
  const [phaseId, setPhaseId] = useState(
    defaultValues?.phaseId?.toString() || phases[0]?._id?.toString() || ""
  );
  const [proximity, setProximity] = useState(
    defaultValues?.proximity || "adjacent"
  );
  const [status, setStatus] = useState(defaultValues?.status || "planned");
  const [priority, setPriority] = useState(defaultValues?.priority || "normal");
  const [goal, setGoal] = useState(defaultValues?.goal || "");

  const createContent = useMutation(api.content.create);
  const updateContent = useMutation(api.content.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingId) {
        await updateContent({
          id: editingId,
          title,
          format,
          description,
          phaseId: phaseId as Id<"phases">,
          proximity,
          status,
          priority: priority === "high" ? "high" : undefined,
          goal: goal || undefined,
        });
      } else {
        await createContent({
          brandId,
          title,
          format,
          description,
          phaseId: phaseId as Id<"phases">,
          proximity,
          status,
          priority: priority === "high" ? "high" : undefined,
          goal: goal || undefined,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Content-Titel"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Beschreibung *</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kurze Beschreibung"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phase">Phase *</Label>
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
                    {phase.shortName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format">Format *</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Format wählen" />
            </SelectTrigger>
            <SelectContent>
              {formatOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proximity">Produkt-Nähe *</Label>
          <Select value={proximity} onValueChange={setProximity}>
            <SelectTrigger>
              <SelectValue placeholder="Nähe wählen" />
            </SelectTrigger>
            <SelectContent>
              {proximityOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status wählen" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorität</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Priorität wählen" />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Ziel</Label>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="z.B. Lead-Generierung"
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
