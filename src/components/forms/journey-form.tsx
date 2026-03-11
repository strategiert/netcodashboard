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
import { BUYING_CENTER_ROLES } from "@/lib/constants";

interface JourneyFormProps {
  brandId: Id<"brands">;
  stakeholders: Doc<"stakeholders">[];
  editingId?: Id<"journeys">;
  defaultValues?: Partial<Doc<"journeys">>;
  onSuccess?: () => void;
}

export function JourneyForm({
  brandId,
  stakeholders,
  editingId,
  defaultValues,
  onSuccess,
}: JourneyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(defaultValues?.name || "");
  const [role, setRole] = useState(defaultValues?.role || "");
  const [situation, setSituation] = useState(defaultValues?.situation || "");
  const [stakeholderId, setStakeholderId] = useState(
    defaultValues?.stakeholderId?.toString() || ""
  );
  const [icon, setIcon] = useState(defaultValues?.icon || "🎯");
  const [color, setColor] = useState(defaultValues?.color || "#3b82f6");

  const createJourney = useMutation(api.journeys.create);
  const updateJourney = useMutation(api.journeys.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const sharedArgs = {
        name,
        role,
        situation,
        icon,
        color,
        ...(stakeholderId
          ? { stakeholderId: stakeholderId as Id<"stakeholders"> }
          : {}),
      };

      if (editingId) {
        await updateJourney({ id: editingId, ...sharedArgs });
      } else {
        await createJourney({ brandId, ...sharedArgs });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving journey:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. ÖPNV-Entscheider nach Vorfall"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="role">Rolle *</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="z.B. GF Verkehrsunternehmen"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="situation">Situation *</Label>
          <Input
            id="situation"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="z.B. Gewaltzwischenfall in der Presse"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="stakeholder">Stakeholder</Label>
          <Select value={stakeholderId} onValueChange={setStakeholderId}>
            <SelectTrigger>
              <SelectValue placeholder="Stakeholder wählen (optional)" />
            </SelectTrigger>
            <SelectContent>
              {stakeholders.map((s) => {
                const roleConfig =
                  s.buyingCenterRole &&
                  BUYING_CENTER_ROLES[
                    s.buyingCenterRole as keyof typeof BUYING_CENTER_ROLES
                  ];
                return (
                  <SelectItem key={s._id} value={s._id}>
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      {s.buyingCenterRole && roleConfig && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${roleConfig.color} ${roleConfig.textColor}`}
                        >
                          {s.buyingCenterRole}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Icon</Label>
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎯"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Farbe</Label>
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
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
