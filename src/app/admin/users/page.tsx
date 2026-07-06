"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MEMBER_SECTIONS } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type Row = {
  _id: string;
  email: string | null;
  name: string | null;
  role: string;
  approved: boolean;
  allowedSections: string[];
  allowedBrands: string[];
  pending: boolean;
};

function Chip({ active, disabled, onClick, children }: {
  active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        disabled
          ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground"
          : active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary/50"
      )}
    >
      {children}
    </button>
  );
}

export default function AdminUsersPage() {
  const me = useCurrentUser();
  const users = useQuery(api.users.listUsers, me?.isAdmin ? {} : "skip") as Row[] | undefined;
  const brands = useQuery(api.brands.list);
  const setPermissions = useMutation(api.users.setPermissions);
  const createMember = useMutation(api.users.createMember);
  const deleteUser = useMutation(api.users.deleteUser);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  if (me === undefined) return <div className="p-6 text-sm text-muted-foreground">Lädt…</div>;
  if (!me?.isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-2">Kein Zugriff</h1>
        <p className="text-sm text-muted-foreground">Die Nutzerverwaltung ist nur für Admins.</p>
        <Link href="/" className="mt-3 inline-block text-sm text-primary hover:underline">Zur Startseite</Link>
      </div>
    );
  }

  async function patch(userId: string, data: Record<string, unknown>) {
    await setPermissions({ userId: userId as never, ...data });
  }

  function toggle(list: string[], key: string): string[] {
    return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      await createMember({ email: newEmail, name: newName || undefined });
      setNewEmail("");
      setNewName("");
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Fehlgeschlagen");
    }
    setAdding(false);
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Nutzerverwaltung</h1>
        <p className="text-sm text-muted-foreground">
          Freischalten und festlegen, welche Marken und Bereiche jeder Nutzer sehen darf.
          Admins sehen automatisch alles.
        </p>
      </div>

      {/* Mitarbeiter vormerken */}
      <form onSubmit={addMember} className="rounded-lg border bg-card p-4">
        <div className="mb-1 text-sm font-medium">Mitarbeiter vormerken</div>
        <p className="mb-3 text-xs text-muted-foreground">
          Legt einen Platzhalter an. Der Mitarbeiter registriert sich selbst mit dieser E-Mail
          (Passwort wählt er dabei) und übernimmt die hier eingestellten Rechte automatisch.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs text-muted-foreground">E-Mail</label>
            <Input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@netco.de" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs text-muted-foreground">Name (optional)</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Vor- und Nachname" />
          </div>
          <Button type="submit" disabled={adding}>{adding ? "…" : "Vormerken"}</Button>
        </div>
        {addError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">{addError}</p>}
      </form>

      {users === undefined ? (
        <p className="text-sm text-muted-foreground">Lädt Nutzer…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Nutzer registriert.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const isAdmin = u.role === "admin";
            const isSelf = u._id === me._id;
            return (
              <div key={u._id} className="rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.name || "—"}</span>
                      {u.pending && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs text-amber-700 dark:text-amber-500">
                          Noch nicht registriert
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Rolle */}
                    <select
                      value={u.role}
                      disabled={isSelf}
                      onChange={(e) => patch(u._id, { role: e.target.value })}
                      className="rounded-md border bg-card px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="member">Mitarbeiter</option>
                      <option value="admin">Admin</option>
                    </select>
                    {/* Freischaltung */}
                    <button
                      type="button"
                      disabled={isAdmin}
                      onClick={() => patch(u._id, { approved: !u.approved })}
                      className={cn(
                        "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                        isAdmin
                          ? "bg-green-500/15 text-green-700 dark:text-green-500 cursor-default"
                          : u.approved
                            ? "bg-green-500/15 text-green-700 dark:text-green-500 hover:bg-green-500/25"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-500 hover:bg-amber-500/25"
                      )}
                    >
                      {isAdmin ? "Admin (frei)" : u.approved ? "Freigeschaltet" : "Gesperrt"}
                    </button>
                    {/* Löschen */}
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => { if (confirm(`${u.email} wirklich löschen?`)) deleteUser({ userId: u._id as never }); }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!isAdmin && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1.5 text-xs font-medium text-muted-foreground">Marken</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(brands ?? []).map((b) => (
                          <Chip key={b.slug} active={u.allowedBrands.includes(b.slug)}
                            onClick={() => patch(u._id, { allowedBrands: toggle(u.allowedBrands, b.slug) })}>
                            {b.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 text-xs font-medium text-muted-foreground">Bereiche</div>
                      <div className="flex flex-wrap gap-1.5">
                        {MEMBER_SECTIONS.map((s) => (
                          <Chip key={s.key} active={u.allowedSections.includes(s.key)}
                            onClick={() => patch(u._id, { allowedSections: toggle(u.allowedSections, s.key) })}>
                            {s.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
