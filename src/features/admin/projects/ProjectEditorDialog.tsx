import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  AlertCircle,
  FileText,
  ListOrdered,
  Layers,
  Settings2,
  Star,
} from "lucide-react";
import type {
  ProjectWithRelations,
  ProjectFormData,
  ProjectDifficulty,
  ProjectDeliverable,
  ProjectEvaluationCriterion,
  ProjectResource,
} from "@/types/projects";
import { COMMON_PROJECT_DOMAINS } from "@/types/projects";
import {
  ObjectivesEditor,
  DeliverablesEditor,
  EvaluationCriteriaEditor,
  ResourcesEditor,
} from "./RepeatableListEditor";
import { useCreateProject, useUpdateProject } from "@/hooks/useAdminProjects";

interface ProjectEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations | null; // null for Create, ProjectWithRelations for Edit
  existingProjects: ProjectWithRelations[];
  careerPaths: Array<{ id: string; title: string; slug: string; domain: string }>;
  skills: Array<{ id: string; title: string; slug: string; category?: string }>;
  onSuccess: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function ProjectEditorDialog({
  open,
  onOpenChange,
  project,
  existingProjects,
  careerPaths,
  skills,
  onSuccess,
}: ProjectEditorDialogProps) {
  const isEditing = Boolean(project);

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [domain, setDomain] = useState("Merchandising & Sourcing");
  const [customDomain, setCustomDomain] = useState("");
  const [difficulty, setDifficulty] = useState<ProjectDifficulty>("Intermediate");
  const [estimatedHours, setEstimatedHours] = useState<number>(20);
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // Detailed content
  const [detailedBrief, setDetailedBrief] = useState("");
  const [instructions, setInstructions] = useState("");
  const [mentorGuidance, setMentorGuidance] = useState("");

  // Structured rubrics
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<ProjectEvaluationCriterion[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);

  // Relationships
  const [selectedCareerPathIds, setSelectedCareerPathIds] = useState<string[]>([]);
  const [selectedSkillMappings, setSelectedSkillMappings] = useState<
    Array<{ skill_id: string; is_primary: boolean }>
  >([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or initialize on open / project change
  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setSlug(project.slug);
      setShortDescription(project.short_description || "");

      const isCommonDomain = COMMON_PROJECT_DOMAINS.includes(project.domain as any);
      if (isCommonDomain) {
        setDomain(project.domain || "Merchandising & Sourcing");
        setCustomDomain("");
      } else if (project.domain) {
        setDomain("other");
        setCustomDomain(project.domain);
      } else {
        setDomain("Merchandising & Sourcing");
        setCustomDomain("");
      }

      setDifficulty((project.difficulty as ProjectDifficulty) || "Intermediate");
      setEstimatedHours(project.estimated_hours ?? 20);
      setOrderIndex(project.order_index ?? 1);
      setIsPublished(project.is_published);

      setDetailedBrief(project.detailed_brief || "");
      setInstructions(project.instructions || "");
      setMentorGuidance(project.mentor_guidance || "");

      setLearningObjectives(project.learning_objectives || []);
      setDeliverables(project.deliverables || []);
      setEvaluationCriteria(project.evaluation_criteria || []);
      setResources(project.resources || []);

      setSelectedCareerPathIds((project.career_paths || []).map((cp) => cp.id));
      setSelectedSkillMappings(
        (project.skills || []).map((s) => ({
          skill_id: s.id,
          is_primary: s.is_primary,
        }))
      );
    } else {
      setTitle("");
      setSlug("");
      setShortDescription("");
      setDomain("Merchandising & Sourcing");
      setCustomDomain("");
      setDifficulty("Intermediate");
      setEstimatedHours(20);

      const nextOrder =
        existingProjects.length > 0
          ? Math.max(...existingProjects.map((p) => p.order_index)) + 1
          : 1;
      setOrderIndex(nextOrder);
      setIsPublished(false);

      setDetailedBrief("");
      setInstructions("");
      setMentorGuidance("");

      setLearningObjectives([]);
      setDeliverables([]);
      setEvaluationCriteria([]);
      setResources([]);

      setSelectedCareerPathIds([]);
      setSelectedSkillMappings([]);
    }
    setActiveTab("basic");
    setErrors({});
  }, [project, existingProjects, open]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!slug || slug === slugify(title))) {
      setSlug(slugify(val));
    }
  };

  const handleToggleCareerPath = (cpId: string) => {
    setSelectedCareerPathIds((prev) =>
      prev.includes(cpId) ? prev.filter((id) => id !== cpId) : [...prev, cpId]
    );
  };

  const handleToggleSkill = (skillId: string) => {
    setSelectedSkillMappings((prev) => {
      const exists = prev.some((s) => s.skill_id === skillId);
      if (exists) {
        return prev.filter((s) => s.skill_id !== skillId);
      } else {
        return [...prev, { skill_id: skillId, is_primary: prev.length === 0 }];
      }
    });
  };

  const handleToggleSkillPrimary = (skillId: string) => {
    setSelectedSkillMappings((prev) =>
      prev.map((s) => (s.skill_id === skillId ? { ...s, is_primary: !s.is_primary } : s))
    );
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!title.trim()) {
      errs.title = "Project title is required";
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      errs.slug = "Project slug is required";
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cleanSlug)) {
      errs.slug = "Slug must contain only lowercase letters, numbers, and single hyphens";
    } else if (cleanSlug.length < 3 || cleanSlug.length > 100) {
      errs.slug = "Slug must be between 3 and 100 characters";
    } else {
      const isDuplicate = existingProjects.some(
        (p) => p.slug.toLowerCase() === cleanSlug && (!isEditing || p.id !== project?.id)
      );
      if (isDuplicate) {
        errs.slug = "A project with this slug already exists";
      }
    }

    if (!shortDescription.trim()) {
      errs.shortDescription = "Short description is required for summary cards";
    }

    if (domain === "other" && !customDomain.trim()) {
      errs.domain = "Please specify the custom domain name";
    }

    if (estimatedHours < 0) {
      errs.estimatedHours = "Estimated hours must be a positive integer";
    }

    if (orderIndex < 0) {
      errs.orderIndex = "Display order must be 0 or greater";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Auto switch to the tab with errors
      if (errs.title || errs.slug || errs.shortDescription || errs.domain || errs.estimatedHours || errs.orderIndex) {
        setActiveTab("basic");
      }
      return false;
    }
    return true;
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const resolvedDomain = domain === "other" ? customDomain.trim() : domain;

    const formData: ProjectFormData = {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      short_description: shortDescription.trim(),
      domain: resolvedDomain,
      difficulty,
      estimated_hours: Math.max(0, Math.floor(Number(estimatedHours) || 0)),
      order_index: Math.max(0, Math.floor(Number(orderIndex) || 0)),
      is_published: isPublished,
      detailed_brief: detailedBrief.trim(),
      instructions: instructions.trim(),
      mentor_guidance: mentorGuidance.trim(),
      learning_objectives: learningObjectives.filter((o) => o.trim().length > 0),
      deliverables: deliverables.filter((d) => d.title.trim().length > 0),
      evaluation_criteria: evaluationCriteria.filter((c) => c.criterion.trim().length > 0),
      resources: resources.filter((r) => r.title.trim().length > 0),
      career_path_ids: selectedCareerPathIds,
      skill_ids: selectedSkillMappings,
    };

    try {
      if (isEditing && project) {
        await updateMutation.mutateAsync({ id: project.id, form: formData });
        toast({
          title: "Project updated",
          description: `Successfully updated "${formData.title}"`,
        });
      } else {
        await createMutation.mutateAsync(formData);
        toast({
          title: "Project created",
          description: `Successfully created "${formData.title}"`,
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Failed to save project:", err);
      toast({
        title: "Error saving project",
        description: err.message || "An unexpected error occurred while saving the project.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/60">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {isEditing ? `Edit Project: ${project?.title}` : "Create Industry Project"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Author authentic practical briefs, deliverables, and career competencies.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Status:</span>
              <Badge variant={isPublished ? "success" : "secondary"} className="text-xs">
                {isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 pt-3 border-b border-border/30 bg-muted/20">
              <TabsList className="grid grid-cols-4 w-full h-9 bg-card/60 p-0.5">
                <TabsTrigger value="basic" className="text-xs gap-1.5 font-medium">
                  <Settings2 className="h-3.5 w-3.5" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs gap-1.5 font-medium">
                  <FileText className="h-3.5 w-3.5" />
                  Brief & Guidance
                </TabsTrigger>
                <TabsTrigger value="rubric" className="text-xs gap-1.5 font-medium">
                  <ListOrdered className="h-3.5 w-3.5" />
                  Rubric & Deliverables
                </TabsTrigger>
                <TabsTrigger value="mapping" className="text-xs gap-1.5 font-medium">
                  <Layers className="h-3.5 w-3.5" />
                  Career & Skills ({selectedCareerPathIds.length + selectedSkillMappings.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* TAB 1: BASIC INFO */}
              <TabsContent value="basic" className="space-y-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="project-title" className="text-xs font-semibold">
                      Project Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="project-title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Export Garment Production Line Balancing & SMV Optimization"
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.title}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="project-slug" className="text-xs font-semibold">
                      URL Slug <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="project-slug"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="export-garment-line-balancing"
                      className={errors.slug ? "border-destructive font-mono text-xs" : "font-mono text-xs"}
                    />
                    {errors.slug ? (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.slug}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Lowercase letters, numbers, and hyphens only (e.g. tech-pack-creation)
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="project-short-desc" className="text-xs font-semibold">
                    Short Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="project-short-desc"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Concise overview summarizing what students will accomplish in this project..."
                    className={`h-20 text-xs resize-none ${errors.shortDescription ? "border-destructive" : ""}`}
                  />
                  {errors.shortDescription && (
                    <p className="text-[11px] text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.shortDescription}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Industry Domain</Label>
                    <Select value={domain} onValueChange={setDomain}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_PROJECT_DOMAINS.map((d) => (
                          <SelectItem key={d} value={d} className="text-xs">
                            {d}
                          </SelectItem>
                        ))}
                        <SelectItem value="other" className="text-xs font-medium">
                          + Custom Domain...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Difficulty Level</Label>
                    <Select
                      value={difficulty}
                      onValueChange={(val) => setDifficulty(val as ProjectDifficulty)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Foundational" className="text-xs">
                          Foundational (Entry / Associate)
                        </SelectItem>
                        <SelectItem value="Intermediate" className="text-xs">
                          Intermediate (Practitioner)
                        </SelectItem>
                        <SelectItem value="Advanced" className="text-xs">
                          Advanced (Lead / Specialist)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="project-hours" className="text-xs font-semibold">
                      Estimated Hours
                    </Label>
                    <Input
                      id="project-hours"
                      type="number"
                      min={0}
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseInt(e.target.value, 10) || 0)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {domain === "other" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-domain" className="text-xs font-semibold">
                      Custom Domain Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="custom-domain"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="e.g. Denim Washing & Finishing Technology"
                      className={errors.domain ? "border-destructive text-xs" : "text-xs"}
                    />
                    {errors.domain && (
                      <p className="text-[11px] text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.domain}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/30">
                  <div className="space-y-1.5">
                    <Label htmlFor="project-order" className="text-xs font-semibold">
                      Display Order (order_index)
                    </Label>
                    <Input
                      id="project-order"
                      type="number"
                      min={0}
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                      className="text-xs w-36"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Lower numbers appear first in the project directory.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/40 p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="project-published" className="text-xs font-semibold cursor-pointer">
                        Published to Catalog
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        {isPublished ? "Visible to learners in the public directory" : "Draft (hidden from learners)"}
                      </p>
                    </div>
                    <Switch
                      id="project-published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* TAB 2: DETAILED BRIEF & GUIDANCE */}
              <TabsContent value="content" className="space-y-5 m-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="project-brief" className="text-xs font-semibold">
                      Detailed Business Brief & Problem Statement
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Supports Markdown</span>
                  </div>
                  <Textarea
                    id="project-brief"
                    value={detailedBrief}
                    onChange={(e) => setDetailedBrief(e.target.value)}
                    placeholder="Provide a realistic industrial scenario. For example:&#10;'You are the Senior Industrial Engineer at an export garment facility producing 120,000 polo shirts/month. The line currently suffers from an 18% bottleneck at the collar attachment workstation...'"
                    className="h-36 text-xs font-mono resize-y"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Frame the challenge around authentic apparel manufacturing constraints, KPIs, or buyer specifications.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="project-instructions" className="text-xs font-semibold">
                      Step-by-Step Execution Instructions
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Supports Markdown</span>
                  </div>
                  <Textarea
                    id="project-instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Step 1: Download the attached production time study dataset.&#10;Step 2: Calculate individual operation SAMs and efficiency ratings.&#10;Step 3: Propose a revised pitch diagram and worker allocation plan..."
                    className="h-32 text-xs font-mono resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="project-mentor-guidance" className="text-xs font-semibold">
                      Mentor Guidance & Industry Insights
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Faculty Notes</span>
                  </div>
                  <Textarea
                    id="project-mentor-guidance"
                    value={mentorGuidance}
                    onChange={(e) => setMentorGuidance(e.target.value)}
                    placeholder="Tips from industry practitioners. For example:&#10;'In practical production audits, remember that allowance percentages vary between knitted and woven fabrics due to tension relaxation...'"
                    className="h-28 text-xs font-mono resize-y bg-primary/5 border-primary/20"
                  />
                </div>
              </TabsContent>

              {/* TAB 3: RUBRIC & DELIVERABLES */}
              <TabsContent value="rubric" className="space-y-6 m-0">
                <ObjectivesEditor
                  items={learningObjectives}
                  onChange={setLearningObjectives}
                />
                <div className="border-t border-border/40 pt-5">
                  <DeliverablesEditor
                    items={deliverables}
                    onChange={setDeliverables}
                  />
                </div>
                <div className="border-t border-border/40 pt-5">
                  <EvaluationCriteriaEditor
                    items={evaluationCriteria}
                    onChange={setEvaluationCriteria}
                  />
                </div>
                <div className="border-t border-border/40 pt-5">
                  <ResourcesEditor
                    items={resources}
                    onChange={setResources}
                  />
                </div>
              </TabsContent>

              {/* TAB 4: CAREER & SKILLS MAPPING */}
              <TabsContent value="mapping" className="space-y-6 m-0">
                {/* Career Pathways Junction */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold">Mapped Career Pathways</Label>
                      <p className="text-xs text-muted-foreground">
                        Associate this project with official IndustryMentor career roadmaps.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedCareerPathIds.length} Selected
                    </Badge>
                  </div>

                  {careerPaths.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                      No career pathways found in the database.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {careerPaths.map((cp) => {
                        const isSelected = selectedCareerPathIds.includes(cp.id);
                        return (
                          <div
                            key={cp.id}
                            onClick={() => handleToggleCareerPath(cp.id)}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/15 border-primary/40 text-foreground shadow-sm"
                                : "bg-card/40 border-border/40 hover:border-border/80 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleCareerPath(cp.id)}
                              className="mt-0.5"
                            />
                            <div className="space-y-0.5 text-xs">
                              <p className="font-semibold leading-tight text-foreground">
                                {cp.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {cp.domain}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Skills Junction */}
                <div className="space-y-3 border-t border-border/40 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold">Mapped Skills Inventory</Label>
                      <p className="text-xs text-muted-foreground">
                        Tag competencies practiced. Mark high-priority skills with the star as Primary.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {selectedSkillMappings.length} Skills Mapped
                    </Badge>
                  </div>

                  {skills.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                      No skills found in the database.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {skills.map((skill) => {
                        const mapping = selectedSkillMappings.find(
                          (s) => s.skill_id === skill.id
                        );
                        const isSelected = Boolean(mapping);
                        const isPrimary = mapping?.is_primary || false;

                        return (
                          <div
                            key={skill.id}
                            className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/10 border-primary/40 text-foreground shadow-sm"
                                : "bg-card/40 border-border/40 hover:border-border/80 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div
                              onClick={() => handleToggleSkill(skill.id)}
                              className="flex items-center gap-2 flex-1 cursor-pointer"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSkill(skill.id)}
                              />
                              <span className="text-xs font-medium line-clamp-1">
                                {skill.title}
                              </span>
                            </div>

                            {isSelected && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSkillPrimary(skill.id);
                                }}
                                className={`h-6 px-1.5 text-[10px] gap-1 font-semibold ${
                                  isPrimary
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                                title={isPrimary ? "Primary Skill (click to toggle)" : "Click to mark as Primary"}
                              >
                                <Star
                                  className={`h-3 w-3 ${isPrimary ? "fill-amber-400 text-amber-400" : ""}`}
                                />
                                {isPrimary ? "Primary" : "Secondary"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="px-6 py-4 border-t border-border/40 bg-card/60 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="border-border/60"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="font-semibold shadow-sm min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
