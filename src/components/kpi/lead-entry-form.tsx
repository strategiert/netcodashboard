"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function LeadEntryForm({ brandId }: { brandId: Id<"brands"> }) {
  const upsert = useMutation(api.kpi.upsertSnapshot);
  const [count, setCount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(count);
    if (isNaN(n) || n < 0) return;
    setSaving(true);
    try {
      await upsert({ brandId, date: today, source: "manual", leadsCount: n, leadsNote: note || undefined });
      toast.success("Anfragen gespeichert");
      setCount(""); setNote("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Anfragen heute eintragen</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Anzahl</label>
            <Input type="number" min="0" placeholder="0" value={count}
              onChange={(e) => setCount(e.target.value)} className="w-24" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Notiz (optional)</label>
            <Input placeholder="z.B. 2 Bodycam, 1 Microvista" value={note}
              onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" size="sm" disabled={saving || !count}>
            {saving ? "Speichert…" : "Speichern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
