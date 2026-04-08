"use client";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type SyncResult = { source: string; status: "ok" | "skip" | "error"; message: string };

function lineStatus(line: string): "ok" | "skip" | "error" {
  if (line.startsWith("OK") || /\d+ ok/.test(line) || /\d+ posts/.test(line)) return "ok";
  if (line.startsWith("SKIP") || line.includes("SKIP")) return "skip";
  if (line.startsWith("ERROR")) return "error";
  return "ok";
}

export function SyncButton() {
  const syncGSC = useAction(api.actions.syncGSC.syncGSC);
  const syncAds = useAction(api.actions.syncAds.syncAds);
  const fetchWorkspaces = useAction(api.actions.fetchPublerWorkspaces.fetchPublerWorkspaces);
  const syncPubler = useAction(api.actions.syncPubler.syncPubler);
  const syncPublerAccounts = useAction(api.actions.syncPublerAccounts.syncPublerAccounts);
  const syncPublerPosts = useAction(api.actions.syncPublerPosts.syncPublerPosts);

  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResults(null);
    const out: SyncResult[] = [];

    const jobs: { label: string; fn: () => Promise<string[]> }[] = [
      { label: "GSC", fn: () => syncGSC() },
      { label: "Google Ads", fn: () => syncAds() },
      { label: "Publer Workspaces", fn: () => fetchWorkspaces() },
      { label: "Publer", fn: () => syncPubler() },
      { label: "Publer Accounts", fn: () => syncPublerAccounts() },
      { label: "Publer Posts", fn: () => syncPublerPosts({ days: 7 }) },
    ];

    for (const job of jobs) {
      try {
        const lines = await job.fn();
        for (const line of lines) {
          out.push({ source: job.label, status: lineStatus(line), message: line });
        }
      } catch (e: any) {
        out.push({ source: job.label, status: "error", message: e.message });
      }
    }

    setResults(out);
    setSyncing(false);
  }

  // Hide "SKIP" lines (unconfigured brands), only show real results
  const visible = results?.filter(r => r.status !== "skip") ?? [];
  const hasErrors = visible.some(r => r.status === "error");

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
            GSC, Ads & Social aktualisieren
          </>
        )}
      </Button>

      {results && visible.length > 0 && (
        <div className={`rounded-md border p-3 text-xs space-y-1 ${hasErrors ? "border-destructive/50 bg-destructive/5" : "border-green-500/50 bg-green-500/5"}`}>
          {visible.map((r, i) => (
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
