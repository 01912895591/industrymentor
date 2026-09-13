import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
  Layers,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { CareerPathRow, CareerPathSkillRow } from "@/hooks/useCareer";
import { CareerPathDialog } from "./CareerPathDialog";

interface CareerPathsTabProps {
  careerPaths: CareerPathRow[];
  careerPathSkills: CareerPathSkillRow[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPathwayForSkills?: (pathwayId: string) => void;
}

export function CareerPathsTab({
  careerPaths,
  careerPathSkills,
  isLoading,
  onRefresh,
  onSelectPathwayForSkills,
}: CareerPathsTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<CareerPathRow | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pathToDelete, setPathToDelete] = useState<CareerPathRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyPathId, setBusyPathId] = useState<string | null>(null);

  // Filtered and sorted career paths
  const filteredPaths = useMemo(() => {
    return careerPaths
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.domain.toLowerCase().includes(search.toLowerCase()) ||
          p.slug.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;
        if (statusFilter === "published") return p.is_published;
        if (statusFilter === "draft") return !p.is_published;
        return true;
      })
      .sort((a, b) => a.order_index - b.order_index);
  }, [careerPaths, search, statusFilter]);

  const handleCreate = () => {
    setSelectedPath(null);
    setDialogOpen(true);
  };

  const handleEdit = (path: CareerPathRow) => {
    setSelectedPath(path);
    setDialogOpen(true);
  };

  const handleTogglePublish = async (path: CareerPathRow) => {
    setBusyPathId(path.id);
    try {
      const nextStatus = !path.is_published;
      const { error } = await supabase
        .from("career_paths")
        .update({ is_published: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", path.id);

      if (error) throw error;
      toast({
        title: nextStatus ? "Career Path Published" : "Career Path Set to Draft",
        description: `"${path.title}" is now ${nextStatus ? "visible to students" : "hidden from students"}.`,
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update publish state.",
        variant: "destructive",
      });
    } finally {
      setBusyPathId(null);
    }
  };

  const handleMoveOrder = async (path: CareerPathRow, direction: "up" | "down") => {
    const currentIndex = filteredPaths.findIndex((p) => p.id === path.id);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredPaths.length) return;

    const otherPath = filteredPaths[targetIndex];
    setBusyPathId(path.id);

    try {
      // Swap order_index
      const tempOrder = otherPath.order_index;
      await supabase
        .from("career_paths")
        .update({ order_index: otherPath.order_index })
        .eq("id", path.id);
      await supabase
        .from("career_paths")
        .update({ order_index: path.order_index })
        .eq("id", otherPath.id);

      toast({ title: "Order Updated" });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Reorder Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBusyPathId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pathToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("career_paths").delete().eq("id", pathToDelete.id);
      if (error) throw error;

      toast({
        title: "Career Path Deleted",
        description: `"${pathToDelete.title}" and its junction links have been removed.`,
      });
      setDeleteDialogOpen(false);
      setPathToDelete(null);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete career path.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pathways, domains, slugs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setStatusFilter("all")}
              >
                All ({careerPaths.length})
              </Button>
              <Button
                variant={statusFilter === "published" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5 text-emerald-400"
                onClick={() => setStatusFilter("published")}
              >
                Published ({careerPaths.filter((p) => p.is_published).length})
              </Button>
              <Button
                variant={statusFilter === "draft" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2.5 text-amber-400"
                onClick={() => setStatusFilter("draft")}
              >
                Draft ({careerPaths.filter((p) => !p.is_published).length})
              </Button>
            </div>
          </div>

          <Button onClick={handleCreate} className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Add Career Pathway
          </Button>
        </CardContent>
      </Card>

      {/* Pathways Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-16 text-center">Order</TableHead>
                <TableHead>Pathway Title & Domain</TableHead>
                <TableHead className="hidden md:table-cell">URL Slug</TableHead>
                <TableHead className="text-center">Assigned Skills</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPaths.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {search || statusFilter !== "all"
                      ? "No career pathways match your active filters."
                      : "No career pathways defined yet. Click 'Add Career Pathway' to begin."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPaths.map((path, idx) => {
                  const skillCount = careerPathSkills.filter(
                    (cps) => cps.career_path_id === path.id
                  ).length;
                  const isBusy = busyPathId === path.id;

                  return (
                    <TableRow key={path.id} className="hover:bg-muted/20">
                      <TableCell className="text-center font-mono text-xs">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 text-center font-bold text-muted-foreground">
                            {path.order_index}
                          </span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => handleMoveOrder(path, "up")}
                              disabled={idx === 0 || isBusy}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                              title="Move Up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(path, "down")}
                              disabled={idx === filteredPaths.length - 1 || isBusy}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-20 p-0.5"
                              title="Move Down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary shrink-0" />
                          <span>{path.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[11px] font-normal py-0">
                            {path.domain}
                          </Badge>
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                            {path.description}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                          {path.slug}
                        </code>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-semibold gap-1.5"
                          onClick={() => onSelectPathwayForSkills?.(path.id)}
                          title="Manage pathway skills"
                        >
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          <span>{skillCount} skills</span>
                        </Button>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleTogglePublish(path)}
                          className="h-7 px-2 hover:bg-transparent"
                        >
                          {path.is_published ? (
                            <Badge variant="success" className="cursor-pointer gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="cursor-pointer gap-1">
                              <XCircle className="h-3 w-3" />
                              Draft
                            </Badge>
                          )}
                        </Button>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(path)}
                            title="Edit pathway"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setPathToDelete(path);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete pathway"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create / Edit Dialog */}
      <CareerPathDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        careerPath={selectedPath}
        existingPaths={careerPaths}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-background max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Delete Career Pathway?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to delete{" "}
                <strong className="text-foreground">"{pathToDelete?.title}"</strong>?
              </p>
              <p className="bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 text-xs">
                <strong>Warning:</strong> The database enforces <code>ON DELETE CASCADE</code>.
                Deleting this pathway will remove all its curriculum skill assignments. The skills
                themselves, courses, and mentors will remain in the database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Pathway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
