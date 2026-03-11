"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import {
  Route,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import { JourneyForm } from "@/components/forms/journey-form";
import { JourneyStepForm } from "@/components/forms/journey-step-form";
import { BUYING_CENTER_ROLES } from "@/lib/constants";

export default function JourneysPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  // State
  const [expandedJourneyId, setExpandedJourneyId] = useState<
    Id<"journeys"> | null
  >(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Doc<"journeys"> | null>(
    null
  );
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [stepPhaseId, setStepPhaseId] = useState<Id<"phases"> | null>(null);
  const [editingStep, setEditingStep] = useState<Doc<"journeySteps"> | null>(
    null
  );
  const [deleteJourneyId, setDeleteJourneyId] = useState<
    Id<"journeys"> | null
  >(null);
  const [deleteStepId, setDeleteStepId] = useState<
    Id<"journeySteps"> | null
  >(null);

  // Data
  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const journeys = useQuery(
    api.journeys.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const stakeholders = useQuery(
    api.stakeholders.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const phases = useQuery(
    api.phases.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const contentPieces = useQuery(
    api.content.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const expandedJourney = useQuery(
    api.journeys.getWithSteps,
    expandedJourneyId ? { id: expandedJourneyId } : "skip"
  );

  // Mutations
  const removeJourney = useMutation(api.journeys.remove);
  const removeStep = useMutation(api.journeys.removeStep);

  // Loading
  if (!brand || !journeys || !stakeholders || !phases || !contentPieces) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const toggleExpand = (id: Id<"journeys">) => {
    setExpandedJourneyId((prev) => (prev === id ? null : id));
  };

  const handleEditJourney = (journey: Doc<"journeys">) => {
    setEditingJourney(journey);
    setEditDialogOpen(true);
  };

  const handleAddStep = (phaseId: Id<"phases">) => {
    setStepPhaseId(phaseId);
    setEditingStep(null);
    setStepDialogOpen(true);
  };

  const handleEditStep = (step: Doc<"journeySteps">) => {
    setEditingStep(step);
    setStepPhaseId(step.phaseId);
    setStepDialogOpen(true);
  };

  const handleDeleteJourney = async () => {
    if (!deleteJourneyId) return;
    await removeJourney({ id: deleteJourneyId });
    if (expandedJourneyId === deleteJourneyId) {
      setExpandedJourneyId(null);
    }
    setDeleteJourneyId(null);
  };

  const handleDeleteStep = async () => {
    if (!deleteStepId) return;
    await removeStep({ id: deleteStepId });
    setDeleteStepId(null);
  };

  // Steps pro Phase gruppieren
  const getStepsByPhase = (phaseId: Id<"phases">) => {
    if (!expandedJourney?.steps) return [];
    return expandedJourney.steps.filter(
      (s) => s.phaseId.toString() === phaseId.toString()
    );
  };

  // Content-Piece per ID finden
  const getContentPiece = (id: Id<"contentPieces">) => {
    return contentPieces.find((cp) => cp._id.toString() === id.toString());
  };

  // Nächste Order für neue Steps
  const getNextOrder = () => {
    if (!expandedJourney?.steps || expandedJourney.steps.length === 0) return 1;
    return Math.max(...expandedJourney.steps.map((s) => s.order)) + 1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Journeys
          </h1>
          <p className="text-muted-foreground">
            {journeys.length} Journey{journeys.length !== 1 ? "s" : ""} für{" "}
            {brand.name}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Journey
        </Button>
      </div>

      {/* Journey-Liste */}
      {journeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Route className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Keine Journeys vorhanden</p>
            <p className="text-sm text-muted-foreground">
              Erstellen Sie die erste Customer Journey für {brand.name}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journeys.map((journey) => {
            const isExpanded = expandedJourneyId === journey._id;
            const stakeholder = stakeholders.find(
              (s) => s._id.toString() === journey.stakeholderId?.toString()
            );
            const roleConfig =
              stakeholder?.buyingCenterRole &&
              BUYING_CENTER_ROLES[
                stakeholder.buyingCenterRole as keyof typeof BUYING_CENTER_ROLES
              ];

            return (
              <Card key={journey._id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleExpand(journey._id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                      style={{
                        backgroundColor: `${journey.color || "#3b82f6"}20`,
                      }}
                    >
                      {journey.icon || "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {journey.name}
                        </CardTitle>
                        {stakeholder && (
                          <Badge
                            variant="outline"
                            className={
                              roleConfig
                                ? `${roleConfig.color} ${roleConfig.textColor} ${roleConfig.borderColor}`
                                : ""
                            }
                          >
                            {stakeholder.name}
                            {stakeholder.buyingCenterRole &&
                              ` (${stakeholder.buyingCenterRole})`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {journey.role} — {journey.situation}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditJourney(journey);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteJourneyId(journey._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Aufklappbarer Body: Phasen-Timeline */}
                {isExpanded && (
                  <CardContent>
                    {!expandedJourney ? (
                      <div className="h-24 animate-pulse rounded bg-muted" />
                    ) : (
                      <div className="grid grid-cols-5 gap-3">
                        {phases.map((phase) => {
                          const stepsForPhase = getStepsByPhase(phase._id);
                          return (
                            <div key={phase._id} className="space-y-2">
                              {/* Phase-Header */}
                              <div
                                className="rounded-t-md px-3 py-2 text-center text-sm font-semibold text-white"
                                style={{ backgroundColor: phase.color }}
                              >
                                {phase.name}
                              </div>

                              {/* Steps */}
                              <div className="space-y-2">
                                {stepsForPhase.map((step) => (
                                  <div
                                    key={step._id}
                                    className="group relative rounded-md border bg-card p-2.5 text-xs"
                                  >
                                    {/* Step Actions */}
                                    <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                                      <button
                                        className="rounded p-0.5 hover:bg-muted"
                                        onClick={() => handleEditStep(step)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        className="rounded p-0.5 hover:bg-muted"
                                        onClick={() =>
                                          setDeleteStepId(step._id)
                                        }
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>

                                    {/* Trigger */}
                                    <p className="font-medium leading-snug pr-10">
                                      {step.trigger}
                                    </p>

                                    {/* Search Query */}
                                    {step.searchQuery && (
                                      <div className="mt-1.5 flex items-center gap-1 text-muted-foreground">
                                        <Search className="h-3 w-3 flex-shrink-0" />
                                        <code className="truncate font-mono text-[10px]">
                                          {step.searchQuery}
                                        </code>
                                      </div>
                                    )}

                                    {/* Content Badges */}
                                    {step.contentIds &&
                                      step.contentIds.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                          {step.contentIds.map((cId) => {
                                            const cp = getContentPiece(cId);
                                            if (!cp) return null;
                                            return (
                                              <Badge
                                                key={cId}
                                                variant="secondary"
                                                className="text-[10px] leading-tight"
                                              >
                                                {cp.title}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      )}

                                    {/* Insight */}
                                    <p className="mt-1.5 italic text-muted-foreground leading-snug">
                                      {step.insight}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* + Step Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full border border-dashed text-xs text-muted-foreground"
                                onClick={() => handleAddStep(phase._id)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Step
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Neue Journey */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neue Journey erstellen</DialogTitle>
          </DialogHeader>
          <JourneyForm
            brandId={brandId!}
            stakeholders={stakeholders}
            onSuccess={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Journey bearbeiten */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Journey bearbeiten</DialogTitle>
          </DialogHeader>
          {editingJourney && (
            <JourneyForm
              brandId={brandId!}
              stakeholders={stakeholders}
              editingId={editingJourney._id}
              defaultValues={editingJourney}
              onSuccess={() => {
                setEditDialogOpen(false);
                setEditingJourney(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Step erstellen/bearbeiten */}
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStep ? "Step bearbeiten" : "Neuer Step"}
            </DialogTitle>
          </DialogHeader>
          {expandedJourneyId && (
            <JourneyStepForm
              journeyId={expandedJourneyId}
              phases={
                stepPhaseId
                  ? [
                      // Vorausgewählte Phase zuerst
                      ...phases.filter(
                        (p) => p._id.toString() === stepPhaseId.toString()
                      ),
                      ...phases.filter(
                        (p) => p._id.toString() !== stepPhaseId.toString()
                      ),
                    ]
                  : phases
              }
              contentPieces={contentPieces}
              editingId={editingStep?._id}
              defaultValues={
                editingStep
                  ? editingStep
                  : stepPhaseId
                    ? { phaseId: stepPhaseId }
                    : undefined
              }
              nextOrder={getNextOrder()}
              onSuccess={() => {
                setStepDialogOpen(false);
                setEditingStep(null);
                setStepPhaseId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Journey löschen */}
      <AlertDialog
        open={!!deleteJourneyId}
        onOpenChange={(open) => !open && setDeleteJourneyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Journey löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Journey und alle zugehörigen Steps werden unwiderruflich
              gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteJourney}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Step löschen */}
      <AlertDialog
        open={!!deleteStepId}
        onOpenChange={(open) => !open && setDeleteStepId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Step löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Step wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteStep}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
