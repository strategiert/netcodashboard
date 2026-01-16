"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
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
  Plus,
  Search,
  Zap,
  Circle,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { ContentForm } from "@/components/forms/content-form";

const statusConfig = {
  planned: { label: "Geplant", icon: Circle, color: "text-slate-400" },
  "in-progress": { label: "In Arbeit", icon: Clock, color: "text-amber-400" },
  done: { label: "Fertig", icon: CheckCircle2, color: "text-green-400" },
};

const proximityColors: Record<string, string> = {
  "sehr nah": "bg-green-500/20 text-green-400 border-green-500/30",
  nah: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  adjacent: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function ContentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const brandSlug = params.brand as string;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const brand = useQuery(api.brands.getBySlug, { slug: brandSlug });
  const brandId = brand?._id;

  const phases = useQuery(
    api.phases.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );
  const content = useQuery(
    api.content.listByBrand,
    brandId ? { brandId: brandId as Id<"brands"> } : "skip"
  );

  const deleteContent = useMutation(api.content.remove);
  const updateStatus = useMutation(api.content.updateStatus);

  if (!brand || !phases || !content) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <Card>
          <CardContent className="p-6">
            <div className="h-96 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    const matchesPhase =
      phaseFilter === "all" || item.phaseId === phaseFilter;

    return matchesSearch && matchesStatus && matchesPhase;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteContent({ id: id as Id<"contentPieces"> });
      toast.success("Content gelöscht");
      setDeleteConfirm(null);
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus({ id: id as Id<"contentPieces">, status });
      toast.success("Status aktualisiert");
    } catch {
      toast.error("Fehler beim Aktualisieren");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          <p className="text-muted-foreground">
            {content.length} Content Pieces für {brand.name}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuen Content erstellen</DialogTitle>
            </DialogHeader>
            <ContentForm
              brandId={brandId as Id<"brands">}
              phases={phases}
              onSuccess={() => {
                setIsCreateOpen(false);
                toast.success("Content erstellt");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="planned">Geplant</SelectItem>
                <SelectItem value="in-progress">In Arbeit</SelectItem>
                <SelectItem value="done">Fertig</SelectItem>
              </SelectContent>
            </Select>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Phasen</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase._id} value={phase._id}>
                    {phase.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Nähe</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContent.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Keine Inhalte gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredContent.map((item) => {
                  const phase = phases.find((p) => p._id === item.phaseId);
                  const status = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.planned;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        {item.priority === "high" && (
                          <Zap className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={proximityColors[item.proximity] || ""}
                        >
                          {item.proximity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: phase?.color,
                            color: phase?.color,
                          }}
                        >
                          {phase?.shortName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value) =>
                            handleStatusChange(item._id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>
                              <div
                                className={`flex items-center gap-2 ${status.color}`}
                              >
                                <StatusIcon className="h-4 w-4" />
                                {status.label}
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">
                              <div className="flex items-center gap-2">
                                <Circle className="h-4 w-4 text-slate-400" />
                                Geplant
                              </div>
                            </SelectItem>
                            <SelectItem value="in-progress">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-400" />
                                In Arbeit
                              </div>
                            </SelectItem>
                            <SelectItem value="done">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400" />
                                Fertig
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog
                            open={editingContent === item._id}
                            onOpenChange={(open) =>
                              setEditingContent(open ? item._id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Content bearbeiten</DialogTitle>
                              </DialogHeader>
                              <ContentForm
                                brandId={brandId as Id<"brands">}
                                phases={phases}
                                editingId={item._id as Id<"contentPieces">}
                                defaultValues={item}
                                onSuccess={() => {
                                  setEditingContent(null);
                                  toast.success("Content aktualisiert");
                                }}
                              />
                            </DialogContent>
                          </Dialog>

                          <Dialog
                            open={deleteConfirm === item._id}
                            onOpenChange={(open) =>
                              setDeleteConfirm(open ? item._id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Content löschen?</DialogTitle>
                              </DialogHeader>
                              <p className="text-muted-foreground">
                                Möchten Sie &quot;{item.title}&quot; wirklich löschen?
                                Diese Aktion kann nicht rückgängig gemacht
                                werden.
                              </p>
                              <div className="flex justify-end gap-2 mt-4">
                                <Button
                                  variant="outline"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  Abbrechen
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(item._id)}
                                >
                                  Löschen
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
