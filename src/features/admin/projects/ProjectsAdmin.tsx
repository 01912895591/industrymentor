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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import {
  FolderKanban,
  Search,
  Plus,
  Pencil,
  Eye,
  Copy,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  Filter,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import type { ProjectWithRelations, ProjectDifficulty } from "@/types/projects";
import {
  useAdminProjects,
  useProjectSubmissionsSummary,
  useToggleProjectPublish,
  useDuplicateProject,
  useDeleteProject,
} from "@/hooks/useAdminProjects";
import { useCareerPaths, useSkills } from "@/hooks/useCareer";
import { ProjectStatsHeader } from "./ProjectStatsHeader";
import { ProjectEditorDialog } from "./ProjectEditorDialog";
import { ProjectPreviewDialog } from "./ProjectPreviewDialog";

type SortOption = "order_index" | "newest" | "oldest" | "title_asc" | "title_desc";

export function ProjectsAdmin() {
  // Data queries
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isRefetching,
    refetch,
  } = useAdminProjects();

  const { data: subSummary } = useProjectSubmissionsSummary();
  const { data: careerPaths = [] } = useCareerPaths();
  const { data: skills = [] } = useSkills();

  // Mutations
  const togglePublishMutation = useToggleProjectPublish();
  const duplicateMutation = useDuplicateProject();
  const deleteMutation = useDeleteProject();

  // Dialog states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithRelations | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProject, setPreviewProject] = useState<ProjectWithRelations | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectWithRelations | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [careerPathFilter, setCareerPathFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("order_index");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract distinct domains from existing projects
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.domain) set.add(p.domain);
    }
    return Array.from(set).sort();
  }, [projects]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects
      .filter((p) => {
        // Search
        if (query) {
          const matchTitle = p.title.toLowerCase().includes(query);
          const matchSlug = p.slug.toLowerCase().includes(query);
          const matchDomain = (p.domain || "").toLowerCase().includes(query);
          if (!matchTitle && !matchSlug && !matchDomain) return false;
        }

        // Status
        if (statusFilter === "published" && !p.is_published) return false;
        if (statusFilter === "draft" && p.is_published) return false;

        // Difficulty
        if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;

        // Domain
        if (domainFilter !== "all" && p.domain !== domainFilter) return false;

        // Career Path
        if (careerPathFilter !== "all") {
          const hasCp = (p.career_paths || []).some((cp) => cp.id === careerPathFilter);
          if (!hasCp) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "order_index":
            return a.order_index - b.order_index;
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "title_asc":
            return a.title.localeCompare(b.title);
          case "title_desc":
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
  }, [
    projects,
    search,
    statusFilter,
    difficultyFilter,
    domainFilter,
    careerPathFilter,
    sortBy,
  ]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  // Reset pagination if filters change and page is out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleCreate = () => {
    setEditingProject(null);
    setEditorOpen(true);
  };

  const handleEdit = (proj: ProjectWithRelations) => {
    setEditingProject(proj);
    setEditorOpen(true);
  };

  const handlePreview = (proj: ProjectWithRelations) => {
    setPreviewProject(proj);
    setPreviewOpen(true);
  };

  const handleTogglePublish = async (proj: ProjectWithRelations) => {
    try {
      await togglePublishMutation.mutateAsync({
        id: proj.id,
        isPublished: !proj.is_published,
      });
      toast({
        title: proj.is_published ? "Project Unpublished" : "Project Published",
        description: `"${proj.title}" is now ${!proj.is_published ? "published" : "in draft"}`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to update publish state",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (proj: ProjectWithRelations) => {
    try {
      await duplicateMutation.mutateAsync(proj);
      toast({
        title: "Project Duplicated",
        description: `Created a draft copy of "${proj.title}"`,
      });
    } catch (err: any) {
      toast({
        title: "Duplication failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = (proj: ProjectWithRelations) => {
    setProjectToDelete(proj);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteMutation.mutateAsync(projectToDelete.id);
      toast({
        title: "Project Deleted",
        description: `"${projectToDelete.title}" was permanently removed`,
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDifficultyFilter("all");
    setDomainFilter("all");
    setCareerPathFilter("all");
    setSortBy("order_index");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    difficultyFilter !== "all" ||
    domainFilter !== "all" ||
    careerPathFilter !== "all" ||
    sortBy !== "order_index";

  const difficultyVariant = (difficulty: string | null) => {
    switch (difficulty) {
      case "Foundational":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Intermediate":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "Advanced":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Stats Cards */}
      <ProjectStatsHeader
        projects={projects}
        totalSubmissions={subSummary?.totalSubmissions || 0}
        isLoading={projectsLoading || isRefetching}
        onRefresh={() => refetch()}
        onCreateClick={handleCreate}
      />

      {/* Toolbar: Search, Filters & Sorting */}
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search title, slug, domain..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onValueChange={(val: any) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Status: All
                  </SelectItem>
                  <SelectItem value="published" className="text-xs">
                    Published Only
                  </SelectItem>
                  <SelectItem value="draft" className="text-xs">
                    Drafts Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <Select
                value={difficultyFilter}
                onValueChange={(val) => {
                  setDifficultyFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Difficulty: All
                  </SelectItem>
                  <SelectItem value="Foundational" className="text-xs">
                    Foundational
                  </SelectItem>
                  <SelectItem value="Intermediate" className="text-xs">
                    Intermediate
                  </SelectItem>
                  <SelectItem value="Advanced" className="text-xs">
                    Advanced
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Career Path Filter */}
            <div>
              <Select
                value={careerPathFilter}
                onValueChange={(val) => {
                  setCareerPathFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Career Path" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Path: All Pathways
                  </SelectItem>
                  {careerPaths.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id} className="text-xs">
                      {cp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Selector */}
            <div>
              <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_index" className="text-xs">
                    Sort: Display Order
                  </SelectItem>
                  <SelectItem value="newest" className="text-xs">
                    Sort: Newest First
                  </SelectItem>
                  <SelectItem value="oldest" className="text-xs">
                    Sort: Oldest First
                  </SelectItem>
                  <SelectItem value="title_asc" className="text-xs">
                    Sort: Title (A-Z)
                  </SelectItem>
                  <SelectItem value="title_desc" className="text-xs">
                    Sort: Title (Z-A)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sub-toolbar: Active filters & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30 text-xs">
            <div className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span>{" "}
              of <span className="font-semibold text-foreground">{projects.length}</span> projects
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
        {projectsLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 border border-border/60">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No projects found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "No projects match the active search and filter criteria. Try resetting filters."
                  : "No practical industry projects have been created yet. Get started by clicking 'Create Project'."}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                Clear Filters
              </Button>
            ) : (
              <Button onClick={handleCreate} size="sm" className="text-xs gap-1.5 font-semibold">
                <Plus className="h-3.5 w-3.5" />
                Create First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="w-14 text-xs font-semibold">Order</TableHead>
                  <TableHead className="min-w-[260px] text-xs font-semibold">Project</TableHead>
                  <TableHead className="text-xs font-semibold">Domain</TableHead>
                  <TableHead className="text-xs font-semibold">Difficulty</TableHead>
                  <TableHead className="min-w-[160px] text-xs font-semibold">Career Paths</TableHead>
                  <TableHead className="min-w-[180px] text-xs font-semibold">Skills</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Submissions</TableHead>
                  <TableHead className="w-24 text-right text-xs font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.map((p) => {
                  return (
                    <TableRow
                      key={p.id}
                      className="border-border/40 hover:bg-muted/20 transition-colors"
                    >
                      {/* Order */}
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{p.order_index}
                      </TableCell>

                      {/* Project Title & Slug */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handlePreview(p)}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors text-left line-clamp-1"
                          >
                            {p.title}
                          </button>
                          <p className="text-[11px] font-mono text-muted-foreground line-clamp-1">
                            {p.slug}
                          </p>
                        </div>
                      </TableCell>

                      {/* Domain */}
                      <TableCell>
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {p.domain || "—"}
                        </span>
                      </TableCell>

                      {/* Difficulty */}
                      <TableCell>
                        {p.difficulty ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${difficultyVariant(
                              p.difficulty
                            )}`}
                          >
                            {p.difficulty}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Career Paths */}
                      <TableCell>
                        {p.career_paths && p.career_paths.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.career_paths.map((cp) => (
                              <Badge
                                key={cp.id}
                                variant="outline"
                                className="text-[10px] bg-primary/10 border-primary/20 text-foreground py-0"
                              >
                                {cp.title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </TableCell>

                      {/* Skills */}
                      <TableCell>
                        {p.skills && p.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.skills.map((s) => (
                              <span
                                key={s.id}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] border ${
                                  s.is_primary
                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-300 font-semibold"
                                    : "bg-muted/40 border-border/40 text-muted-foreground"
                                }`}
                              >
                                {s.is_primary && (
                                  <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                                )}
                                {s.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(p)}
                          className="group inline-flex items-center gap-1.5 focus:outline-none"
                          title="Click to toggle publish status"
                        >
                          <Badge
                            variant={p.is_published ? "success" : "secondary"}
                            className="text-[11px] cursor-pointer group-hover:opacity-80 transition-opacity"
                          >
                            {p.is_published ? "Published" : "Draft"}
                          </Badge>
                        </button>
                      </TableCell>

                      {/* Submissions */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                          {p.submissions_count || 0}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              aria-label={`Actions for ${p.title}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 text-xs">
                            <DropdownMenuItem
                              onClick={() => handlePreview(p)}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview Brief
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(p)}
                              className="gap-2 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(p)}
                              className="gap-2 cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5" /> Duplicate Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(p)}
                              className="gap-2 cursor-pointer"
                            >
                              {p.is_published ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 text-amber-400" /> Unpublish
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteRequest(p)}
                              className="gap-2 text-destructive cursor-pointer focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProjects.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-border/40 bg-card/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows per page:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">
                    5
                  </SelectItem>
                  <SelectItem value="10" className="text-xs">
                    10
                  </SelectItem>
                  <SelectItem value="20" className="text-xs">
                    20
                  </SelectItem>
                  <SelectItem value="50" className="text-xs">
                    50
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-border/60"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-border/60"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project Editor Dialog */}
      <ProjectEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        project={editingProject}
        existingProjects={projects}
        careerPaths={careerPaths}
        skills={skills}
        onSuccess={() => refetch()}
      />

      {/* Project Preview Dialog */}
      <ProjectPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        project={previewProject}
        onEditClick={() => {
          if (previewProject) {
            handleEdit(previewProject);
          }
        }}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/60">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-xs text-muted-foreground">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-foreground">
                  &quot;{projectToDelete?.title}&quot;
                </span>
                ?
              </p>
              <p className="text-[11px] text-destructive/80">
                This action cannot be undone. All career path and skill mappings linked to this
                project will also be removed. If students have active submissions, deletion will be
                blocked.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs border-border/60">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default ProjectsAdmin;
