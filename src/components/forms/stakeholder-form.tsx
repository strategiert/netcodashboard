"use client";

import { useState } from "react";
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
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { SEGMENTS } from "@/lib/constants";

const buyingCenterRoleOptions = [
  "Entscheider",
  "Champion",
  "Beeinflusser",
  "Gatekeeper",
  "Anwender",
];

interface StakeholderFormProps {
  brandId: Id<"brands">;
  editingId?: Id<"stakeholders">;
  defaultValues?: Partial<Doc<"stakeholders">>;
  onSuccess?: () => void;
}

export function StakeholderForm({
  brandId,
  editingId,
  defaultValues,
  onSuccess,
}: StakeholderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(defaultValues?.name || "");
  const [role, setRole] = useState(defaultValues?.role || "");
  const [type, setType] = useState(defaultValues?.type || "");
  const [ageRange, setAgeRange] = useState(defaultValues?.ageRange || "");
  const [buyingCenterRole, setBuyingCenterRole] = useState(
    defaultValues?.buyingCenterRole || "Entscheider"
  );
  const [segment, setSegment] = useState(
    defaultValues?.segment || "Alle"
  );
  const [painPoints, setPainPoints] = useState(
    defaultValues?.painPoints?.join("\n") || ""
  );
  const [gains, setGains] = useState(
    defaultValues?.gains?.join("\n") || ""
  );
  const [preferredChannels, setPreferredChannels] = useState(
    defaultValues?.preferredChannels?.join("\n") || ""
  );
  const [quote, setQuote] = useState(defaultValues?.quote || "");

  const createStakeholder = useMutation(api.stakeholders.create);
  const updateStakeholder = useMutation(api.stakeholders.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const painPointsArray = painPoints.split("\n").filter(Boolean);
    const gainsArray = gains.split("\n").filter(Boolean);
    const channelsArray = preferredChannels.split("\n").filter(Boolean);

    try {
      if (editingId) {
        await updateStakeholder({
          id: editingId,
          name,
          role,
          type,
          ageRange,
          buyingCenterRole,
          segment,
          painPoints: painPointsArray,
          gains: gainsArray,
          preferredChannels: channelsArray,
          quote: quote || undefined,
        });
      } else {
        await createStakeholder({
          brandId,
          name,
          role,
          type,
          ageRange,
          buyingCenterRole,
          segment,
          painPoints: painPointsArray,
          gains: gainsArray,
          preferredChannels: channelsArray,
          quote: quote || undefined,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Thomas Müller"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rolle *</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="z.B. Abteilungsleiter Sicherheit"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Typ *</Label>
          <Input
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="z.B. B2B, Behörde"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ageRange">Altersgruppe *</Label>
          <Input
            id="ageRange"
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            placeholder="z.B. 40-55"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyingCenterRole">Buying-Center-Rolle *</Label>
          <Select value={buyingCenterRole} onValueChange={setBuyingCenterRole}>
            <SelectTrigger>
              <SelectValue placeholder="Rolle wählen" />
            </SelectTrigger>
            <SelectContent>
              {buyingCenterRoleOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment">Segment *</Label>
          <Select value={segment} onValueChange={setSegment}>
            <SelectTrigger>
              <SelectValue placeholder="Segment wählen" />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="painPoints">Pain Points (eine pro Zeile) *</Label>
          <Textarea
            id="painPoints"
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
            placeholder={"Zu hohe Kosten\nKomplexe Beschaffung\nFehlende Transparenz"}
            rows={4}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="gains">Gains (einer pro Zeile) *</Label>
          <Textarea
            id="gains"
            value={gains}
            onChange={(e) => setGains(e.target.value)}
            placeholder={"Rechtssicherheit\nEffizienz\nMitarbeiterschutz"}
            rows={4}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="preferredChannels">Bevorzugte Kanäle (einer pro Zeile) *</Label>
          <Textarea
            id="preferredChannels"
            value={preferredChannels}
            onChange={(e) => setPreferredChannels(e.target.value)}
            placeholder={"LinkedIn\nFachmessen\nWhitepaper"}
            rows={3}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="quote">Zitat (optional)</Label>
          <Input
            id="quote"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="z.B. &laquo;Wir brauchen rechtssichere Dokumentation.&raquo;"
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
