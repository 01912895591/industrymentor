import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  CheckCircle2,
  Plus,
  Trash2,
  Star,
  ExternalLink,
  ShieldCheck,
  Loader2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useEligibleApprovedProjects,
  useAddProjectToPortfolio,
  useRemovePortfolioItem,
  useToggleFeaturedPortfolioItem,
} from "@/hooks/usePortfolio";
import type { PortfolioWithDetails, PortfolioItemWithDetails } from "@/types/portfolio";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";

interface PortfolioProjectsTabProps {
  portfolio: PortfolioWithDetails;
}

export function PortfolioProjectsTab({ portfolio }: PortfolioProjectsTabProps) {
  const { data: eligibleProjects = [], isLoading: loadingEligible } =
    useEligibleApprovedProjects();

  const addProjectMutation = useAddProjectToPortfolio();
  const removeItemMutation = useRemovePortfolioItem();
  const toggleFeaturedMutation = useToggleFeaturedPortfolioItem();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter items that are project submissions
  const projectItems = portfolio.items.filter((i) => i.project_submission_id && i.submission);
  const addedSubmissionIds = new Set(projectItems.map((i) => i.project_submission_id));

  // Eligible submissions not yet added
  const unaddedEligibleProjects = eligibleProjects.filter(
    (ep) => !addedSubmissionIds.has(ep.id)
  );

  const handleAddProject = async (submissionId: string) => {
    try {
      await addProjectMutation.mutateAsync({
        portfolioId: portfolio.id,
        projectSubmissionId: submissionId,
      });
      toast.success("Project added to portfolio showcase!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add project to portfolio");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItemMutation.mutateAsync({ itemId });
      toast.success("Project removed from portfolio showcase (submission remains approved).");
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove project from portfolio");
    }
  };

  const handleToggleFeatured = async (item: PortfolioItemWithDetails) => {
    try {
      await toggleFeaturedMutation.mutateAsync({
        itemId: item.id,
        isFeatured: !item.is_featured,
      });
      toast.success(
        item.is_featured
          ? "Removed from featured project showcase."
          : "Marked as featured showcase project!"
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update featured status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Showcase Projects in Portfolio */}
      <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span>Featured Project Showcase ({projectItems.length})</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                These approved projects are visible on your public portfolio when visibility is set to Public.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {projectItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center space-y-3">
              <FolderKanban className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-foreground">
                  No Projects in Showcase Yet
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Add your mentor-approved projects from the eligible list below to highlight your practical industrial skills.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {projectItems.map((item) => {
                const sub = item.submission;
                const proj = sub?.project;
                const isFeatured = item.is_featured;
                const isDeleting = confirmDeleteId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-border"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {proj?.title || sub?.title || "Industry Project"}
                        </h4>
                        {isFeatured && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1">
                            <Star className="h-3 w-3 fill-primary" />
                            <span>Featured</span>
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Approved</span>
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {proj?.domain && (
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                            {proj.domain}
                          </span>
                        )}
                        {proj?.difficulty && <span>• {proj.difficulty}</span>}
                        {sub?.deliverable_url && isValidHttpsUrl(sub.deliverable_url) && (
                          <a
                            href={sub.deliverable_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-[10px]"
                          >
                            <span>Deliverable Link</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                      <Button
                        variant={isFeatured ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFeatured(item)}
                        disabled={toggleFeaturedMutation.isPending}
                        className="h-8 text-xs gap-1"
                      >
                        <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-primary text-primary" : ""}`} />
                        <span>{isFeatured ? "Featured" : "Feature"}</span>
                      </Button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removeItemMutation.isPending}
                            className="h-8 text-xs font-semibold"
                          >
                            Confirm Remove
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Eligible Approved Projects to Add */}
      <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Eligible Approved Projects ({unaddedEligibleProjects.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Only project deliverables that have received verified approval from an IndustryMentor reviewer can be added to your portfolio.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {loadingEligible ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Checking eligible approved deliverables...
            </div>
          ) : unaddedEligibleProjects.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-muted/10 p-6 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                {eligibleProjects.length === 0
                  ? "You don't have any approved project submissions yet. Complete projects in the directory and submit your deliverables for mentor review!"
                  : "All of your approved projects are currently featured in your portfolio!"}
              </p>
              {eligibleProjects.length === 0 && (
                <Button size="sm" asChild className="text-xs font-bold gap-1.5 h-8">
                  <Link to="/projects">
                    <span>Explore Industry Projects</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {unaddedEligibleProjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-border/50 bg-background/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {sub.project?.title || sub.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {sub.project?.domain && (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                          {sub.project.domain}
                        </span>
                      )}
                      <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Approved by Mentor
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddProject(sub.id)}
                    disabled={addProjectMutation.isPending}
                    className="h-8 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Showcase</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
