"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, MessageSquare, Heart, AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { BUYING_CENTER_ROLES, SEGMENTS } from "@/lib/constants";
import { StakeholderForm } from "@/components/forms/stakeholder-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_KEYS = Object.keys(BUYING_CENTER_ROLES) as Array<keyof typeof BUYING_CENTER_ROLES>;

export default function StakeholdersPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const stakeholders = useQuery(
    api.stakeholders.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  const removeStakeholder = useMutation(api.stakeholders.remove);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Doc<"stakeholders"> | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");

  if (!brand || !stakeholders) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-48 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const filteredStakeholders = stakeholders.filter((s) => {
    if (roleFilter !== "all" && s.buyingCenterRole !== roleFilter) return false;
    if (segmentFilter !== "all" && s.segment !== segmentFilter) return false;
    return true;
  });

  const handleDelete = async (id: Id<"stakeholders">) => {
    await removeStakeholder({ id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buying Center</h1>
          <p className="text-muted-foreground">
            {stakeholders.length} Stakeholder für {brand.name}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Stakeholder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuer Stakeholder</DialogTitle>
            </DialogHeader>
            <StakeholderForm
              brandId={brandId!}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Buying-Center-Übersicht */}
      {stakeholders.length > 0 && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {ROLE_KEYS.map((role) => {
            const config = BUYING_CENTER_ROLES[role];
            const members = stakeholders.filter((s) => s.buyingCenterRole === role);
            return (
              <Card key={role} className={`border ${config.borderColor}`}>
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className={`text-sm font-semibold ${config.textColor}`}>
                    {role}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Keine zugeordnet</p>
                  ) : (
                    <ul className="space-y-1">
                      {members.map((m) => (
                        <li key={m._id} className="text-sm truncate" title={m.name}>
                          {m.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filter-Bar */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Rolle filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Rollen</SelectItem>
              {ROLE_KEYS.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Segment filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Segmente</SelectItem>
              {SEGMENTS.map((seg) => (
                <SelectItem key={seg} value={seg}>
                  {seg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card-Grid */}
      {filteredStakeholders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Keine Stakeholder gefunden</p>
            <p className="text-sm text-muted-foreground">
              {stakeholders.length === 0
                ? "Für diese Marke wurden noch keine Stakeholder angelegt."
                : "Kein Stakeholder passt zu den aktuellen Filtern."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStakeholders.map((stakeholder) => {
            const roleConfig = stakeholder.buyingCenterRole
              ? BUYING_CENTER_ROLES[stakeholder.buyingCenterRole as keyof typeof BUYING_CENTER_ROLES]
              : null;

            return (
              <Card key={stakeholder._id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{stakeholder.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {stakeholder.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingStakeholder(stakeholder);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Stakeholder löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{stakeholder.name}&quot; wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(stakeholder._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {roleConfig && stakeholder.buyingCenterRole && (
                      <Badge className={`${roleConfig.color} ${roleConfig.textColor} border-0`}>
                        {stakeholder.buyingCenterRole}
                      </Badge>
                    )}
                    {stakeholder.segment && stakeholder.segment !== "Alle" && (
                      <Badge variant="secondary">{stakeholder.segment}</Badge>
                    )}
                    <Badge variant="outline">{stakeholder.type}</Badge>
                    <Badge variant="secondary">{stakeholder.ageRange} Jahre</Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Pain Points
                      </h4>
                      <ul className="space-y-1">
                        {stakeholder.painPoints.map((pain, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="mt-2 h-1 w-1 rounded-full bg-destructive flex-shrink-0" />
                            {pain}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-500">
                        <Heart className="h-4 w-4" />
                        Gains
                      </h4>
                      <ul className="space-y-1">
                        {stakeholder.gains.map((gain, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="mt-2 h-1 w-1 rounded-full bg-green-500 flex-shrink-0" />
                            {gain}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-500">
                        <MessageSquare className="h-4 w-4" />
                        Bevorzugte Kanäle
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {stakeholder.preferredChannels.map((channel, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {stakeholder.quote && (
                      <div className="mt-4 rounded-lg border-l-4 border-primary bg-muted/50 p-3">
                        <p className="italic text-sm">&quot;{stakeholder.quote}&quot;</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          — {stakeholder.name}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditingStakeholder(null);
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stakeholder bearbeiten</DialogTitle>
          </DialogHeader>
          {editingStakeholder && (
            <StakeholderForm
              brandId={brandId!}
              editingId={editingStakeholder._id}
              defaultValues={editingStakeholder}
              onSuccess={() => {
                setEditDialogOpen(false);
                setEditingStakeholder(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
