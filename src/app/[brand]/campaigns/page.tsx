"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Plus,
  ExternalLink,
  Files,
  ClipboardCopy,
} from "lucide-react";
import { toast } from "sonner";

const campaignStatuses = [
  { value: "draft", label: "Entwurf" },
  { value: "ready", label: "Bereit" },
  { value: "live", label: "Live" },
  { value: "paused", label: "Pausiert" },
  { value: "completed", label: "Abgeschlossen" },
];

const scenarioStatuses = [
  { value: "planned", label: "Geplant" },
  { value: "ready", label: "Bereit" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archiv" },
];

const taskStatuses = [
  { value: "planned", label: "Geplant" },
  { value: "in-progress", label: "In Arbeit" },
  { value: "blocked", label: "Blockiert" },
  { value: "done", label: "Erledigt" },
];

const assetStatuses = [
  { value: "draft", label: "Entwurf" },
  { value: "ready", label: "Bereit" },
  { value: "live", label: "In Nutzung" },
  { value: "archived", label: "Archiv" },
];

const channelOptions = [
  "PR",
  "Blog",
  "Social",
  "Paid",
  "Video",
  "Whitepaper",
  "Ops",
  "Sales",
];

const priorityOptions = ["normal", "high"];

const statusBadgeClass: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  ready: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  live: "bg-green-500/20 text-green-300 border-green-500/30",
  paused: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  planned: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "in-progress": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  blocked: "bg-red-500/20 text-red-300 border-red-500/30",
  done: "bg-green-500/20 text-green-300 border-green-500/30",
  archived: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

type CampaignAsset = {
  _id: Id<"campaignAssets">;
  scenarioId?: Id<"campaignScenarios">;
  title: string;
  category: string;
  filePath: string;
  publicUrl?: string;
  summary?: string;
  owner?: string;
  status: string;
  order: number;
};

const mapAssetCategoryToChannel = (category: string): string => {
  const normalized = category.toLowerCase();
  if (normalized === "pr") return "PR";
  if (normalized === "social") return "Social";
  if (normalized === "video") return "Video";
  if (normalized === "whitepaper") return "Whitepaper";
  if (normalized === "ops") return "Ops";
  if (normalized === "book") return "Content";
  if (normalized === "runbook") return "Ops";
  if (normalized === "content") return "Content";
  return "Content";
};

export default function CampaignsPage() {
  const params = useParams();
  const brandSlug = params.brand as string;

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("");
  const [campaignOwner, setCampaignOwner] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("draft");
  const [campaignPriority, setCampaignPriority] = useState("normal");
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [campaignBudget, setCampaignBudget] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskChannel, setTaskChannel] = useState("PR");
  const [taskOwner, setTaskOwner] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskScenarioId, setTaskScenarioId] = useState("none");
  const [taskStatus, setTaskStatus] = useState("planned");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [taskAssetType, setTaskAssetType] = useState("");
  const [taskNote, setTaskNote] = useState("");

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const campaignList = useQuery(
    api.campaigns.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  const activeCampaignId = useMemo(() => {
    if (!campaignList?.campaigns?.length) return null;
    const selectedStillExists = campaignList.campaigns.some(
      (campaign) => campaign._id === selectedCampaignId
    );
    if (selectedCampaignId && selectedStillExists) {
      return selectedCampaignId;
    }
    return campaignList.campaigns[0]._id;
  }, [campaignList, selectedCampaignId]);

  const campaignDetails = useQuery(
    api.campaigns.getCampaignDetails,
    activeCampaignId
      ? { campaignId: activeCampaignId as Id<"campaigns"> }
      : "skip"
  );

  const createCampaign = useMutation(api.campaigns.createCampaign);
  const updateCampaign = useMutation(api.campaigns.updateCampaign);
  const updateScenario = useMutation(api.campaigns.updateScenario);
  const createTask = useMutation(api.campaigns.createTask);
  const updateTaskStatus = useMutation(api.campaigns.updateTaskStatus);
  const createTemplate = useMutation(api.campaigns.createBodycamSummitTemplate);
  const updateAsset = useMutation(api.campaigns.updateAsset);

  const scenarioLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    campaignDetails?.scenarios.forEach((scenario) => {
      lookup[scenario._id] = scenario.key;
    });
    return lookup;
  }, [campaignDetails]);

  if (!brand || !campaignList) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const handleCreateCampaign = async () => {
    if (!brandId) return;
    if (!campaignName.trim() || !campaignObjective.trim()) {
      toast.error("Name und Ziel sind Pflichtfelder");
      return;
    }

    try {
      const newCampaignId = await createCampaign({
        brandId: brandId as Id<"brands">,
        name: campaignName.trim(),
        objective: campaignObjective.trim(),
        status: campaignStatus,
        priority: campaignPriority === "high" ? "high" : undefined,
        owner: campaignOwner.trim() || undefined,
        startDate: campaignStartDate || undefined,
        endDate: campaignEndDate || undefined,
        budgetTotal: campaignBudget ? Number(campaignBudget) : undefined,
        notes: undefined,
      });

      setSelectedCampaignId(newCampaignId);
      setIsCreateCampaignOpen(false);
      setCampaignName("");
      setCampaignObjective("");
      setCampaignOwner("");
      setCampaignStatus("draft");
      setCampaignPriority("normal");
      setCampaignStartDate("");
      setCampaignEndDate("");
      setCampaignBudget("");

      toast.success("Kampagne erstellt");
    } catch {
      toast.error("Kampagne konnte nicht erstellt werden");
    }
  };

  const handleCreateTask = async () => {
    if (!activeCampaignId || !taskTitle.trim()) {
      toast.error("Titel ist ein Pflichtfeld");
      return;
    }

    try {
      await createTask({
        campaignId: activeCampaignId as Id<"campaigns">,
        scenarioId:
          taskScenarioId === "none"
            ? undefined
            : (taskScenarioId as Id<"campaignScenarios">),
        channel: taskChannel,
        title: taskTitle.trim(),
        owner: taskOwner.trim() || undefined,
        dueDate: taskDueDate || undefined,
        status: taskStatus,
        priority: taskPriority === "high" ? "high" : undefined,
        assetType: taskAssetType.trim() || undefined,
        note: taskNote.trim() || undefined,
        link: undefined,
      });

      setIsCreateTaskOpen(false);
      setTaskTitle("");
      setTaskChannel("PR");
      setTaskOwner("");
      setTaskDueDate("");
      setTaskScenarioId("none");
      setTaskStatus("planned");
      setTaskPriority("normal");
      setTaskAssetType("");
      setTaskNote("");

      toast.success("Task erstellt");
    } catch {
      toast.error("Task konnte nicht erstellt werden");
    }
  };

  const handleTemplateLoad = async () => {
    if (!brandId) return;
    try {
      const campaignId = await createTemplate({ brandId: brandId as Id<"brands"> });
      setSelectedCampaignId(campaignId);
      toast.success("Template und Unterlagen synchronisiert");
    } catch {
      toast.error("Template konnte nicht geladen werden");
    }
  };

  const handleCopyPath = async (filePath: string) => {
    try {
      await navigator.clipboard.writeText(filePath);
      toast.success("Dateipfad kopiert");
    } catch {
      toast.error("Dateipfad konnte nicht kopiert werden");
    }
  };

  const handleCreateTaskFromAsset = async (asset: CampaignAsset) => {
    if (!activeCampaignId) return;
    try {
      await createTask({
        campaignId: activeCampaignId as Id<"campaigns">,
        scenarioId: asset.scenarioId,
        channel: mapAssetCategoryToChannel(asset.category),
        title: `Unterlage umsetzen: ${asset.title}`,
        owner: asset.owner,
        dueDate: undefined,
        status: "planned",
        priority: "high",
        assetType: asset.category,
        note: `Quelle: ${asset.filePath}`,
        link: asset.publicUrl,
      });
      toast.success("Task aus Unterlage erstellt");
    } catch {
      toast.error("Task konnte nicht erstellt werden");
    }
  };

  const selectedCampaign = campaignDetails?.campaign;
  const scenarioCount = campaignDetails?.scenarios.length || 0;
  const taskCount = campaignDetails?.tasks.length || 0;
  const assetCount = campaignDetails?.assets.length || 0;
  const doneCount =
    campaignDetails?.tasks.filter((task) => task.status === "done").length || 0;
  const completion = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampagnensteuerung</h1>
          <p className="text-muted-foreground">
            Szenarien, Aufgaben und Unterlagen für {brand.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {brandSlug === "bodycam" && (
            <Button variant="outline" onClick={handleTemplateLoad}>
              <Megaphone className="mr-2 h-4 w-4" />
              Gipfel-Template syncen
            </Button>
          )}
          <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neue Kampagne
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Kampagne anlegen</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={campaignName}
                    onChange={(event) => setCampaignName(event.target.value)}
                    placeholder="z. B. Sicherheitsgipfel Reaktionskampagne"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Ziel *</label>
                  <Input
                    value={campaignObjective}
                    onChange={(event) => setCampaignObjective(event.target.value)}
                    placeholder="z. B. PR + Performance + Whitepaper synchronisieren"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Owner</label>
                  <Input
                    value={campaignOwner}
                    onChange={(event) => setCampaignOwner(event.target.value)}
                    placeholder="Marketing Lead"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget (EUR)</label>
                  <Input
                    value={campaignBudget}
                    onChange={(event) => setCampaignBudget(event.target.value)}
                    placeholder="120000"
                    type="number"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={campaignStatus} onValueChange={setCampaignStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorität</label>
                  <Select value={campaignPriority} onValueChange={setCampaignPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority === "high" ? "High" : "Normal"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start</label>
                  <Input
                    value={campaignStartDate}
                    onChange={(event) => setCampaignStartDate(event.target.value)}
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ende</label>
                  <Input
                    value={campaignEndDate}
                    onChange={(event) => setCampaignEndDate(event.target.value)}
                    type="date"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateCampaign}>Erstellen</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kampagnen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignList.overview.totalCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktiv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignList.overview.activeCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Live</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {campaignList.overview.liveCampaigns}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offene Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignList.overview.totalOpenTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unterlagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignList.overview.totalAssets || 0}</div>
          </CardContent>
        </Card>
        <Card className={campaignList.overview.totalOverdueTasks > 0 ? "border-red-500/40" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {campaignList.overview.totalOverdueTasks}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[330px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Kampagnenliste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaignList.campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Kampagnen vorhanden.</p>
            ) : (
              campaignList.campaigns.map((campaign) => (
                <button
                  key={campaign._id}
                  type="button"
                  onClick={() => setSelectedCampaignId(campaign._id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    activeCampaignId === campaign._id
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-medium leading-tight">{campaign.name}</p>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass[campaign.status] || ""}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {campaign.objective}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {campaign.doneTasks}/{campaign.taskCount} Tasks
                    </span>
                    <span>{campaign.assetCount || 0} Unterlagen</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {!selectedCampaign || !campaignDetails ? (
          <Card>
            <CardContent className="flex min-h-[360px] items-center justify-center text-muted-foreground">
              Kampagne auswählen oder neu anlegen.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle>{selectedCampaign.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedCampaign.objective}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={selectedCampaign.status}
                      onValueChange={async (value) => {
                        await updateCampaign({
                          id: selectedCampaign._id,
                          status: value,
                        });
                        toast.success("Kampagnenstatus aktualisiert");
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaignStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedCampaign.priority || "normal"}
                      onValueChange={async (value) => {
                        await updateCampaign({
                          id: selectedCampaign._id,
                          priority: value === "high" ? "high" : undefined,
                        });
                        toast.success("Priorität aktualisiert");
                      }}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Zeitraum</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedCampaign.startDate || "-"} bis {selectedCampaign.endDate || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="mt-1 text-sm font-medium">{selectedCampaign.owner || "-"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedCampaign.budgetTotal
                        ? `${selectedCampaign.budgetSpent || 0} / ${selectedCampaign.budgetTotal} EUR`
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Fortschritt</p>
                    <p className="mt-1 text-sm font-medium">
                      {doneCount}/{taskCount} Tasks
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Umsetzungsgrad</span>
                    <span className="font-medium">{completion}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                {selectedCampaign.notes ? (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">
                    <p className="font-medium">Kampagnennotiz</p>
                    <p className="mt-1 text-blue-100/90">{selectedCampaign.notes}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Szenario-Playbook ({scenarioCount})</CardTitle>
              </CardHeader>
              <CardContent>
                {scenarioCount === 0 ? (
                  <p className="text-sm text-muted-foreground">Noch keine Szenarien vorhanden.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {campaignDetails.scenarios.map((scenario) => (
                      <div key={scenario._id} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{scenario.key}</Badge>
                            <h3 className="font-semibold">{scenario.name}</h3>
                          </div>
                          <Select
                            value={scenario.status}
                            onValueChange={async (value) => {
                              await updateScenario({
                                id: scenario._id,
                                status: value,
                              });
                              toast.success(`Szenario ${scenario.key} aktualisiert`);
                            }}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {scenarioStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Trigger:</span> {scenario.trigger}
                          </p>
                          <p>
                            <span className="font-medium">PR:</span> {scenario.pressAngle}
                          </p>
                          <p>
                            <span className="font-medium">Social:</span> {scenario.socialAngle}
                          </p>
                          <p>
                            <span className="font-medium">Ads:</span> {scenario.adAngle}
                          </p>
                        </div>

                        <div className="mt-3 border-t pt-2 text-xs text-muted-foreground">
                          CTA: {scenario.cta}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Unterlagenbibliothek ({assetCount})</CardTitle>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-300">
                    <Files className="mr-1 h-3 w-3" />
                    Einsatzbereit
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {assetCount === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">
                    Noch keine Unterlagen hinterlegt.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unterlage</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Szenario</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignDetails.assets.map((asset) => (
                        <TableRow key={asset._id}>
                          <TableCell>
                            <p className="font-medium">{asset.title}</p>
                            {asset.summary ? (
                              <p className="mt-1 text-xs text-muted-foreground">{asset.summary}</p>
                            ) : null}
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              {asset.filePath}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{asset.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {asset.scenarioId ? (
                              <Badge variant="secondary">
                                {scenarioLookup[asset.scenarioId] || "?"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={asset.status}
                              onValueChange={async (value) => {
                                await updateAsset({
                                  id: asset._id,
                                  status: value,
                                });
                                toast.success("Unterlagenstatus aktualisiert");
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {assetStatuses.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {asset.publicUrl ? (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={asset.publicUrl} target="_blank" rel="noreferrer">
                                    <ExternalLink className="mr-1 h-3 w-3" />
                                    Öffnen
                                  </a>
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyPath(asset.filePath)}
                              >
                                <ClipboardCopy className="mr-1 h-3 w-3" />
                                Pfad
                              </Button>
                              <Button size="sm" onClick={() => handleCreateTaskFromAsset(asset)}>
                                <Plus className="mr-1 h-3 w-3" />
                                Task
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Execution Board ({taskCount} Tasks)</CardTitle>
                  <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Neuer Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Task anlegen</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Titel *</label>
                          <Input
                            value={taskTitle}
                            onChange={(event) => setTaskTitle(event.target.value)}
                            placeholder="z. B. 4 Presse-Statements finalisieren"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Kanal</label>
                          <Select value={taskChannel} onValueChange={setTaskChannel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {channelOptions.map((channel) => (
                                <SelectItem key={channel} value={channel}>
                                  {channel}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Szenario</label>
                          <Select value={taskScenarioId} onValueChange={setTaskScenarioId}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Kein Szenario</SelectItem>
                              {campaignDetails.scenarios.map((scenario) => (
                                <SelectItem key={scenario._id} value={scenario._id}>
                                  {scenario.key} - {scenario.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Owner</label>
                          <Input
                            value={taskOwner}
                            onChange={(event) => setTaskOwner(event.target.value)}
                            placeholder="Team / Person"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Fälligkeit</label>
                          <Input
                            type="date"
                            value={taskDueDate}
                            onChange={(event) => setTaskDueDate(event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select value={taskStatus} onValueChange={setTaskStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {taskStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Priorität</label>
                          <Select value={taskPriority} onValueChange={setTaskPriority}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Asset-Typ</label>
                          <Input
                            value={taskAssetType}
                            onChange={(event) => setTaskAssetType(event.target.value)}
                            placeholder="Pressemitteilung / Video / Ads"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium">Notiz</label>
                          <Input
                            value={taskNote}
                            onChange={(event) => setTaskNote(event.target.value)}
                            placeholder="Freigabe durch Legal bis 11:00"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                          Abbrechen
                        </Button>
                        <Button onClick={handleCreateTask}>Task erstellen</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {taskCount === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">Noch keine Tasks vorhanden.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Kanal</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Szenario</TableHead>
                        <TableHead>Fälligkeit</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignDetails.tasks.map((task) => {
                        const isOverdue =
                          task.dueDate &&
                          task.dueDate < new Date().toISOString().slice(0, 10) &&
                          task.status !== "done";

                        return (
                          <TableRow key={task._id}>
                            <TableCell>
                              <p className="font-medium">{task.title}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {task.assetType ? <span>{task.assetType}</span> : null}
                                {task.priority === "high" ? (
                                  <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                                    High
                                  </Badge>
                                ) : null}
                                {task.link ? (
                                  <a
                                    href={task.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center text-blue-300 hover:underline"
                                  >
                                    <ExternalLink className="mr-1 h-3 w-3" /> Quelle
                                  </a>
                                ) : null}
                              </div>
                              {task.note ? (
                                <p className="mt-1 text-xs text-muted-foreground">{task.note}</p>
                              ) : null}
                            </TableCell>
                            <TableCell>{task.channel}</TableCell>
                            <TableCell>{task.owner || "-"}</TableCell>
                            <TableCell>
                              {task.scenarioId ? (
                                <Badge variant="secondary">
                                  {scenarioLookup[task.scenarioId] || "?"}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className={isOverdue ? "text-red-400" : ""}>
                                  {task.dueDate || "-"}
                                </span>
                                {isOverdue ? (
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={task.status}
                                onValueChange={async (value) => {
                                  await updateTaskStatus({
                                    id: task._id,
                                    status: value,
                                  });
                                  toast.success("Task-Status aktualisiert");
                                }}
                              >
                                <SelectTrigger className="w-[145px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {taskStatuses.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Offene Tasks</p>
                    <p className="font-semibold">{taskCount - doneCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Erledigt</p>
                    <p className="font-semibold">{doneCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Szenarien bereit</p>
                    <p className="font-semibold">
                      {
                        campaignDetails.scenarios.filter(
                          (scenario) => scenario.status === "ready" || scenario.status === "live"
                        ).length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
