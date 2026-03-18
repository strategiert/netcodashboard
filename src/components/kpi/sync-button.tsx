"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type SyncResult = { source: string; status: "ok" | "error"; message: string };

export function SyncButton() {
  const syncGSC = useAction(api.actions.syncGSC.syncGSC);
  const syncPubler = useAction(api.actions.syncPubler.syncPubler);
  const syncPublerAccounts = useAction(api.actions.syncPublerAccounts.syncPublerAccounts);
  const syncPublerPosts = useAction(api.actions.syncPublerPosts.syncPublerPosts);

  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResults(null);
    const out: SyncResult[] = [];

    try {
      const gscRes = await syncGSC();
      for (const line of gscRes) {
        out.push({ source: "GSC", status: line.startsWith("OK") ? "ok" : "error", message: line });
      }
    } catch (e: any) {
      out.push({ source: "GSC", status: "error", message: e.message });
    }

    try {
      const pubRes = await syncPubler();
      for (const line of pubRes) {
        out.push({ source: "Publer", status: line.startsWith("OK") ? "ok" : "error", message: line });
      }
    } catch (e: any) {
      out.push({ source: "Publer", status: "error", message: e.message });
    }

    try {
      const accRes = await syncPublerAccounts();
      for (const line of accRes) {
        out.push({ source: "Publer Accounts", status: line.includes("error") ? "error" : "ok", message: line });
      }
    } catch (e: any) {
      out.push({ source: "Publer Accounts", status: "error", message: e.message });
    }

    try {
      const postRes = await syncPublerPosts({ days: 7 });
      for (const line of postRes) {
        out.push({ source: "Publer Posts", status: "ok", message: line });
      }
    } catch (e: any) {
      out.push({ source: "Publer Posts", status: "error", message: e.message });
    }

    setResults(out);
    setSyncing(false);
  }

  const hasErrors = results?.some(r => r.status === "error");

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <>
            <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Synchronisiere…
          </>
        ) : (
          <>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            GSC & Publer aktualisieren
          </>
        )}
      </Button>

      {results && (
        <div className={`rounded-md border p-3 text-xs space-y-1 ${hasErrors ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-500/5"}`}>
          {results.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <span>{r.status === "ok" ? "✓" : "✗"}</span>
              <span className="text-muted-foreground">{r.source}:</span>
              <span className={r.status === "error" ? "text-destructive" : ""}>{r.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
