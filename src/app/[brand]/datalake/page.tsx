"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function shortDay(d: string) {
  return d.slice(8) + "." + d.slice(5, 7); // TT.MM
}

export default function DatalakePage() {
  const params = useParams();
  const brandSlug = params.brand as string;
  const data = useQuery(api.datalake.overview, { brandSlug, days: 14 });

  if (data === undefined) {
    return <div className="p-6 text-sm text-muted-foreground">Lade Datalake …</div>;
  }
  if (!data.found) {
    return <div className="p-6 text-sm text-muted-foreground">Keine Marke „{brandSlug}“ gefunden.</div>;
  }

  const maxDaily = Math.max(1, ...data.daily.map((d) => d.pageviews + d.otherTouch));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Datalake</h1>
        <Badge variant="outline">Paket A · Rohdaten-Sammlung</Badge>
      </div>
      <p className="text-sm text-muted-foreground -mt-3">
        Consentierte Web-Ereignisse und Anfragen der letzten {data.days} Tage, signiert und gehasht in unserer eigenen
        Convex-Datenbank. Attribution &amp; Journey-Auswertung folgen (Paket C/D) — dies ist die reine Eingangs-Sicht.
      </p>

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Personen", value: data.totals.persons },
          { label: "Touchpoints", value: data.totals.touchpoints },
          { label: "Conversions", value: data.totals.conversions },
          { label: "Leads", value: data.totals.leads },
        ].map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{k.value.toLocaleString("de-DE")}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Tagesverlauf */}
      <Card>
        <CardHeader><CardTitle>Touchpoints je Tag ({data.days} Tage)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {data.daily.map((d) => {
              const total = d.pageviews + d.otherTouch;
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${total} Touchpoints, ${d.leads} Leads`}>
                  <div className="w-full rounded-t bg-primary/80" style={{ height: `${(total / maxDaily) * 130}px` }} />
                  <span className="text-[10px] text-muted-foreground">{shortDay(d.date)}</span>
                  {d.leads > 0 && <span className="text-[10px] font-bold text-primary">{d.leads}L</span>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top-Kampagnen */}
        <Card>
          <CardHeader><CardTitle>Top-Kampagnen (nach Touchpoints)</CardTitle></CardHeader>
          <CardContent>
            {data.topCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Kampagnen-Daten (Ad-Klicks mit Kampagnen-ID).</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.topCampaigns.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-1.5 font-mono text-xs">{c.id}</td>
                      <td className="py-1.5 text-right font-semibold">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Kanäle */}
        <Card>
          <CardHeader><CardTitle>Kanäle</CardTitle></CardHeader>
          <CardContent>
            {data.channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Daten.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {data.channels.map((c) => (
                    <tr key={c.channel} className="border-b last:border-0">
                      <td className="py-1.5">{c.channel}</td>
                      <td className="py-1.5 text-right font-semibold">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Jüngste Leads */}
      <Card>
        <CardHeader><CardTitle>Jüngste Leads</CardTitle></CardHeader>
        <CardContent>
          {data.recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Leads erfasst.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-1.5 font-medium">Zeit</th>
                  <th className="py-1.5 font-medium">Wert</th>
                  <th className="py-1.5 font-medium">Klick-Kennung</th>
                  <th className="py-1.5 font-medium">pid</th>
                </tr>
              </thead>
              <tbody>
                {data.recentLeads.map((l, i) => {
                  const click = l.gclid ? `gclid:${l.gclid}` : l.msclkid ? `msclkid:${l.msclkid}` : l.fbclid ? `fbclid:${l.fbclid}` : "—";
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5">{fmtDate(l.ts)}</td>
                      <td className="py-1.5">{l.value ? `${l.value} ${l.currency}` : "—"}</td>
                      <td className="py-1.5 font-mono text-xs max-w-[220px] truncate" title={click}>{click}</td>
                      <td className="py-1.5 font-mono text-xs">{l.pid ? l.pid.slice(0, 12) + "…" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
