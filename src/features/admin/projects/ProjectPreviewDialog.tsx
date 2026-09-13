import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Briefcase,
  Layers,
  Star,
  CheckCircle2,
  FileText,
  ExternalLink,
  Pencil,
  Sparkles,
  Award,
} from "lucide-react";
import type { ProjectWithRelations } from "@/types/projects";

interface ProjectPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations | null;
  onEditClick?: () => void;
}

export function ProjectPreviewDialog({
  open,
  onOpenChange,
  project,
  onEditClick,
}: ProjectPreviewDialogProps) {
  if (!project) return null;

  const difficultyColors = {
    Foundational: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    Advanced: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/60">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 bg-card/40">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {project.domain && (
                <Badge variant="outline" className="text-xs bg-muted/40 font-medium">
                  {project.domain}
                </Badge>
              )}
              {project.difficulty && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    difficultyColors[project.difficulty] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {project.difficulty}
                </span>
              )}
              {project.estimated_hours && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                  <Clock className="h-3 w-3" />
                  {project.estimated_hours} Hours
                </span>
              )}
              <Badge variant={project.is_published ? "success" : "secondary"} className="text-xs">
                {project.is_published ? "Published" : "Draft"}
              </Badge>
            </div>

            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {project.title}
              </DialogTitle>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Slug: /projects/{project.slug}
              </p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {project.short_description}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Mapped Career Paths & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  Target Career Roadmaps
                </div>
                {project.career_paths && project.career_paths.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {project.career_paths.map((cp) => (
                      <Badge
                        key={cp.id}
                        variant="secondary"
                        className="text-xs font-medium bg-primary/10 text-foreground border-primary/20"
                      >
                        {cp.title}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No career paths linked.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/40">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Practiced Competencies
                </div>
                {project.skills && project.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {project.skills.map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                          s.is_primary
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300 font-semibold"
                            : "bg-muted/40 border-border/40 text-muted-foreground"
                        }`}
                      >
                        {s.is_primary && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />}
                        {s.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No skills tagged.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Brief / Scenario */}
          {project.detailed_brief && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Industry Business Brief & Problem Statement
              </h3>
              <div className="rounded-xl border border-border/50 bg-card/40 p-4 sm:p-5 text-sm leading-relaxed text-foreground whitespace-pre-line font-sans">
                {project.detailed_brief}
              </div>
            </div>
          )}

          {/* Step-by-Step Instructions */}
          {project.instructions && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Execution Steps & Instructions
              </h3>
              <div className="rounded-xl border border-border/40 bg-muted/10 p-4 sm:p-5 text-sm leading-relaxed text-foreground whitespace-pre-line font-mono text-xs">
                {project.instructions}
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          {project.learning_objectives && project.learning_objectives.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Key Learning Objectives
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.learning_objectives.map((obj, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-3 rounded-lg border border-border/40 bg-card/30 text-xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                      ✓
                    </span>
                    <span className="leading-snug text-foreground">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverables Checklist */}
          {project.deliverables && project.deliverables.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Award className="h-4 w-4" />
                Required Deliverables
              </h3>
              <div className="space-y-2.5">
                {project.deliverables.map((del, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-border/50 bg-card/40 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground text-sm flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 text-primary font-bold text-[10px]">
                          {i + 1}
                        </span>
                        {del.title}
                      </span>
                      {del.format && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {del.format}
                        </Badge>
                      )}
                    </div>
                    {del.description && (
                      <p className="text-muted-foreground pl-7 leading-relaxed">
                        {del.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Rubric */}
          {project.evaluation_criteria && project.evaluation_criteria.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400" />
                Assessment Rubric & Evaluation Dimensions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.evaluation_criteria.map((crit, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{crit.criterion}</span>
                      {crit.weight && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                          {crit.weight}
                        </Badge>
                      )}
                    </div>
                    {crit.description && (
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        {crit.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mentor Guidance Banner */}
          {project.mentor_guidance && (
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Industry Mentor Practical Advice
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground pl-9 whitespace-pre-line">
                {project.mentor_guidance}
              </p>
            </div>
          )}

          {/* Reference Resources */}
          {project.resources && project.resources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Toolkits & Reference Materials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.resources.map((res, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{res.title}</p>
                      {res.notes && <p className="text-[11px] text-muted-foreground">{res.notes}</p>}
                    </div>
                    {res.url ? (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        {res.type || "Asset"}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-card/60 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-border/60"
          >
            Close Preview
          </Button>

          {onEditClick && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEditClick();
              }}
              className="gap-1.5 font-semibold"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
