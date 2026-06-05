import { notFound } from "next/navigation";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

// Versteckter Bereich: kein Nav-Link, noindex, nur mit ?key=TEAM_BOARD_API_KEY erreichbar.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent-Board",
  robots: { index: false, follow: false },
};

const STATUS_COLORS: Record<string, string> = {
  "In Arbeit": "bg-blue-100 text-blue-800",
  Fertig: "bg-green-100 text-green-800",
  Blockiert: "bg-red-100 text-red-800",
  Backlog: "bg-gray-100 text-gray-700",
};

export default async function AgentBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const expected = process.env.TEAM_BOARD_API_KEY;
  if (!expected || key !== expected) notFound();

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const tasks = await convex.query(api.teamBoard.list, {});

  return (
    <div className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 text-2xl font-bold">Agent-Board</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Status-Updates der Claude-Code-Instanzen im Marketing-Team. Neueste zuerst.
      </p>
      {tasks.length === 0 ? (
        <p className="text-muted-foreground">Noch keine Einträge.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t._id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{t.title}</span>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {t.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.agent}
                {t.project ? ` · ${t.project}` : ""} ·{" "}
                {new Date(t.updatedAt).toLocaleString("de-DE")}
              </div>
              {t.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{t.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
