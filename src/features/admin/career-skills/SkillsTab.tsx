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
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Compass,
  Briefcase,
  BookOpen,
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type {
  SkillRow,
  CareerPathSkillRow,
  SkillCourseRow,
  SkillMentorRow,
  SkillLibraryItemRow,
} from "@/hooks/useCareer";
import { SkillDialog } from "./SkillDialog";

interface SkillsTabProps {
  skills: SkillRow[];
  careerPathSkills: CareerPathSkillRow[];
  skillCourses: SkillCourseRow[];
  skillMentors: SkillMentorRow[];
  skillLibraryItems: SkillLibraryItemRow[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectSkillForCourses?: (skillId: string) => void;
  onSelectSkillForMentors?: (skillId: string) => void;
  onSelectSkillForLibrary?: (skillId: string) => void;
}

export function SkillsTab({
  skills,
  careerPathSkills,
  skillCourses,
  skillMentors,
  skillLibraryItems,
  isLoading,
  onRefresh,
  onSelectSkillForCourses,
  onSelectSkillForMentors,
  onSelectSkillForLibrary,
}: SkillsTabProps) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillRow | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<SkillRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busySkillId, setBusySkillId] = useState<string | null>(null);

  // Distinct domains
  const domains = useMemo(() => {
    const set = new Set(skills.map((s) => s.domain).filter(Boolean));
    return Array.from(set).sort();
  }, [skills]);

  // Filtered skills
  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.domain.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        (s.practical_application && s.practical_application.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;
      if (domainFilter !== "all" && s.domain !== domainFilter) return false;
      if (difficultyFilter !== "all" && s.difficulty !== difficultyFilter) return false;
      if (statusFilter === "published" && !s.is_published) return false;
      if (statusFilter === "draft" && s.is_published) return false;
      return true;
    });
  }, [skills, search, domainFilter, difficultyFilter, statusFilter]);

  const handleCreate = () => {
    setSelectedSkill(null);
    setDialogOpen(true);
  };

  const handleEdit = (skill: SkillRow) => {
    setSelectedSkill(skill);
    setDialogOpen(true);
  };

  const handleTogglePublish = async (skill: SkillRow) => {
    setBusySkillId(skill.id);
    try {
      const nextStatus = !skill.is_published;
      const { error } = await supabase
        .from("skills")
        .update({ is_published: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", skill.id);

      if (error) throw error;
      toast({
        title: nextStatus ? "Skill Published" : "Skill Set to Draft",
        description: `"${skill.title}" is now ${nextStatus ? "visible to students" : "hidden from students"}.`,
      });
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update publish state.",
        variant: "destructive",
      });
    } finally {
      setBusySkillId(null);
    }
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("skills").delete().eq("id", skillToDelete.id);
      if (error) throw error;

      toast({
        title: "Skill Deleted",
        description: `"${skillToDelete.title}" and its associated junction mappings have been removed.`,
      });
      setDeleteDialogOpen(false);
      setSkillToDelete(null);
      onRefresh();
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete skill.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Foundational":
        return <Badge variant="info" className="text-[10px]">Foundational</Badge>;
      case "Intermediate":
        return <Badge variant="warning" className="text-[10px]">Intermediate</Badge>;
      case "Advanced":
        return <Badge variant="default" className="text-[10px] bg-purple-500/15 text-purple-400 border-purple-500/20">Advanced</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{difficulty}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2 w-full">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills, topics, application..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Domain filter */}
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains ({skills.length})</SelectItem>
                {domains.map((dom) => (
                  <SelectItem key={dom} value={dom}>
                    {dom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty filter */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Foundational">Foundational</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            {/* Status toggle buttons */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/40">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "published" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2 text-emerald-400"
                onClick={() => setStatusFilter("published")}
              >
                Published
              </Button>
              <Button
                variant={statusFilter === "draft" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs px-2 text-amber-400"
                onClick={() => setStatusFilter("draft")}
              >
                Draft
              </Button>
            </div>
          </div>

          <Button onClick={handleCreate} className="w-full lg:w-auto gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Skill
          </Button>
        </CardContent>
      </Card>

      {/* Skills Table */}
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Skill & Domain</TableHead>
                <TableHead className="hidden md:table-cell">URL Slug</TableHead>
                <TableHead className="text-center">Difficulty</TableHead>
                <TableHead className="text-center">Associated Links</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSkills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {search || domainFilter !== "all" || difficultyFilter !== "all" || statusFilter !== "all"
                      ? "No skills match your active search filters."
                      : "No skills created yet. Click 'Add Skill' to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSkills.map((skill) => {
                  const pathsCount = careerPathSkills.filter((cps) => cps.skill_id === skill.id).length;
                  const coursesCount = skillCourses.filter((sc) => sc.skill_id === skill.id).length;
                  const mentorsCount = skillMentors.filter((sm) => sm.skill_id === skill.id).length;
                  const libraryCount = skillLibraryItems.filter((sli) => sli.skill_id === skill.id).length;
                  const isBusy = busySkillId === skill.id;

                  return (
                    <TableRow key={skill.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          <Compass className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{skill.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[11px] font-normal py-0">
                            {skill.domain}
                          </Badge>
                          {skill.practical_application && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-sm" title={skill.practical_application}>
                              {skill.practical_application}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                          {skill.slug}
                        </code>
                      </TableCell>

                      <TableCell className="text-center">
                        {getDifficultyBadge(skill.difficulty)}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                          <span
                            className="inline-flex items-center gap-1 text-[11px] bg-muted/60 px-1.5 py-0.5 rounded text-muted-foreground"
                            title={`${pathsCount} Career Pathways attach this skill`}
                          >
                            <Briefcase className="h-3 w-3 text-blue-400" />
                            {pathsCount}
                          </span>
                          <button
                            onClick={() => onSelectSkillForCourses?.(skill.id)}
                            className="inline-flex items-center gap-1 text-[11px] bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Manage linked courses"
                          >
                            <BookOpen className="h-3 w-3 text-amber-400" />
                            {coursesCount}
                          </button>
                          <button
                            onClick={() => onSelectSkillForMentors?.(skill.id)}
                            className="inline-flex items-center gap-1 text-[11px] bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Manage linked mentors"
                          >
                            <Users className="h-3 w-3 text-cyan-400" />
                            {mentorsCount}
                          </button>
                          <button
                            onClick={() => onSelectSkillForLibrary?.(skill.id)}
                            className="inline-flex items-center gap-1 text-[11px] bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Manage linked library items"
                          >
                            <FileText className="h-3 w-3 text-rose-400" />
                            {libraryCount}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleTogglePublish(skill)}
                          className="h-7 px-2 hover:bg-transparent"
                        >
                          {skill.is_published ? (
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
                            onClick={() => handleEdit(skill)}
                            title="Edit skill"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setSkillToDelete(skill);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete skill"
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
      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        skill={selectedSkill}
        existingSkills={skills}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-background max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Delete Competency Skill?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to delete{" "}
                <strong className="text-foreground">"{skillToDelete?.title}"</strong>?
              </p>
              <p className="bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20 text-xs">
                <strong>Warning:</strong> The database enforces <code>ON DELETE CASCADE</code>.
                Deleting this skill will remove all associations linking it to career paths,
                courses, mentors, and library resources.
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
              Delete Skill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
