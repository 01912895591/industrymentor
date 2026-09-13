import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  User,
  Briefcase,
  Layers,
  FileText,
  Star,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";
import { SubmissionTimeline } from "./SubmissionTimeline";
import { SubmissionArtifactCard } from "./SubmissionArtifactCard";
import {
  useStartReviewSubmission,
  useApproveSubmission,
  useRequestRevisionSubmission,
  useLinkToPortfolio,
} from "@/hooks/useAdminProjectSubmissions";
import type { ProjectSubmissionWithDetails } from "@/types/projects";

interface ProjectSubmissionReviewDialogProps {
  submission: ProjectSubmissionWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectSubmissionReviewDialog({
  submission,
  open,
  onOpenChange,
}: ProjectSubmissionReviewDialogProps) {
  if (!submission) return null;

  // Mutations
  const startReviewMutation = useStartReviewSubmission();
  const approveMutation = useApproveSubmission();
  const revisionMutation = useRequestRevisionSubmission();
  const linkPortfolioMutation = useLinkToPortfolio();

  // Local Form State
  const [approvalFeedback, setApprovalFeedback] = useState("");
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [activeActionTab, setActiveActionTab] = useState<"approve" | "revision">("approve");

  // Handlers
  const handleStartReview = async () => {
    try {
      await startReviewMutation.mutateAsync({ submissionId: submission.id });
      toast.success("Review initiated. Submission status changed to 'In Review'.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start review");
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        submissionId: submission.id,
        adminFeedback: approvalFeedback,
      });
      toast.success("Submission approved successfully!");
      setApprovalFeedback("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve submission");
    }
  };

  const handleRequestRevision = async () => {
    const trimmed = revisionFeedback.trim();
    if (trimmed.length < 10) {
      toast.error("Revision feedback must be at least 10 characters long.");
      return;
    }

    try {
      await revisionMutation.mutateAsync({
        submissionId: submission.id,
        adminFeedback: trimmed,
      });
      toast.success("Revision requested. The student has been notified to resubmit.");
      setRevisionFeedback("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to request revision");
    }
  };

  const handleLinkPortfolio = async () => {
    try {
      await linkPortfolioMutation.mutateAsync({
        submissionId: submission.id,
        studentUserId: submission.user_id,
      });
      toast.success("Approved project successfully linked to student portfolio showcase.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to link to portfolio");
    }
  };

  const isBusy =
    startReviewMutation.isPending ||
    approveMutation.isPending ||
    revisionMutation.isPending ||
    linkPortfolioMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-border/70 p-6">
        <DialogHeader className="space-y-3 pb-4 border-b border-border/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Submission Evaluation
              </span>
              <SubmissionStatusBadge status={submission.status} />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>
                Student:{" "}
                <strong className="text-foreground">
                  {submission.student?.full_name || "Enrolled Student"}
                </strong>{" "}
                <code className="text-[10px] text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded">
                  {submission.user_id.substring(0, 8)}
                </code>
              </span>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {submission.project?.title || "Industry Project Review"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Evaluate deliverable accuracy against industry benchmarks and learning objectives.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left / Upper Column: Project Specifications & Brief (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Student Deliverable Artifact Card */}
            <SubmissionArtifactCard
              title={submission.title}
              deliverableUrl={submission.deliverable_url}
              notes={submission.submission_notes}
            />

            {/* Project Details Tabs */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span>Project Reference Rubric</span>
                </h4>
                {submission.project?.domain && (
                  <Badge variant="outline" className="text-[10px]">
                    {submission.project.domain}
                  </Badge>
                )}
              </div>

              <Tabs defaultValue="rubric" className="w-full">
                <TabsList className="grid grid-cols-3 h-8 text-xs bg-background/50">
                  <TabsTrigger value="rubric" className="text-xs">
                    Rubric & Deliverables
                  </TabsTrigger>
                  <TabsTrigger value="brief" className="text-xs">
                    Brief & Objectives
                  </TabsTrigger>
                  <TabsTrigger value="guidance" className="text-xs">
                    Guidance & Instructions
                  </TabsTrigger>
                </TabsList>

                {/* Rubric Tab */}
                <TabsContent value="rubric" className="space-y-4 pt-3 text-xs">
                  {submission.project?.evaluation_criteria && submission.project.evaluation_criteria.length > 0 ? (
                    <div className="space-y-2">
                      <span className="font-semibold text-foreground block text-[11px]">
                        Evaluation Criteria & Benchmarks:
                      </span>
                      <div className="space-y-2">
                        {submission.project.evaluation_criteria.map((ec, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border border-border/50 bg-background/60 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 font-medium text-foreground">
                              <span>{ec.criterion}</span>
                              {ec.weight && (
                                <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                                  {ec.weight}
                                </span>
                              )}
                            </div>
                            {ec.description && (
                              <p className="text-[11px] text-muted-foreground">
                                {ec.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs italic">
                      Standard industry rubric criteria apply.
                    </p>
                  )}

                  {submission.project?.deliverables && submission.project.deliverables.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <span className="font-semibold text-foreground block text-[11px]">
                        Required Deliverables Checklist:
                      </span>
                      <ul className="space-y-1.5 text-muted-foreground">
                        {submission.project.deliverables.map((d, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-foreground">{d.title}</strong>
                              {d.format ? ` (${d.format})` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Brief Tab */}
                <TabsContent value="brief" className="space-y-3 pt-3 text-xs">
                  <div>
                    <span className="font-semibold text-foreground block text-[11px]">
                      Industry Challenge Summary:
                    </span>
                    <p className="text-muted-foreground leading-relaxed mt-1">
                      {submission.project?.detailed_brief ||
                        submission.project?.short_description ||
                        "Practical industry challenge brief."}
                    </p>
                  </div>

                  {submission.project?.learning_objectives && submission.project.learning_objectives.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <span className="font-semibold text-foreground block text-[11px]">
                        Targeted Practical Competencies:
                      </span>
                      <ul className="space-y-1 text-muted-foreground">
                        {submission.project.learning_objectives.map((obj, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                {/* Guidance Tab */}
                <TabsContent value="guidance" className="space-y-3 pt-3 text-xs">
                  {submission.project?.instructions && (
                    <div>
                      <span className="font-semibold text-foreground block text-[11px]">
                        Step-by-Step Instructions:
                      </span>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mt-1">
                        {submission.project.instructions}
                      </p>
                    </div>
                  )}

                  {submission.project?.mentor_guidance && (
                    <div className="pt-2 border-t border-border/40">
                      <span className="font-semibold text-primary block text-[11px]">
                        Practitioner Mentor Advice:
                      </span>
                      <p className="text-muted-foreground italic leading-relaxed mt-1">
                        "{submission.project.mentor_guidance}"
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column: Review Controls & Lifecycle Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Timeline */}
            <SubmissionTimeline submission={submission} />

            {/* Action State 1: Submitted (Pending Initial Review) */}
            {submission.status === "submitted" && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <Clock className="h-4 w-4" />
                  <span>Submission Awaiting Review</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Assign this submission to yourself to begin reviewing the deliverable against rubric criteria.
                </p>
                <Button
                  onClick={handleStartReview}
                  disabled={isBusy}
                  className="w-full text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {startReviewMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  <span>Start Review</span>
                </Button>
              </div>
            )}

            {/* Action State 2: In Review (Approve or Request Revision) */}
            {submission.status === "in_review" && (
              <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <span className="text-xs font-bold text-foreground">
                    Review Decision
                  </span>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">
                    Active Evaluation
                  </Badge>
                </div>

                <Tabs
                  value={activeActionTab}
                  onValueChange={(val) => setActiveActionTab(val as any)}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 h-8 text-xs bg-background/60">
                    <TabsTrigger value="approve" className="text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Approve</span>
                    </TabsTrigger>
                    <TabsTrigger value="revision" className="text-xs gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-400" />
                      <span>Request Revision</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Approve Tab */}
                  <TabsContent value="approve" className="space-y-3 pt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Confirming approval permanently marks this project deliverable as verified and completes the learning milestone.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Reviewer Comments (Optional):
                      </label>
                      <Textarea
                        placeholder="Add positive remarks or feedback for the student..."
                        value={approvalFeedback}
                        onChange={(e) => setApprovalFeedback(e.target.value)}
                        rows={3}
                        className="text-xs bg-background/50"
                      />
                    </div>

                    <Button
                      onClick={handleApprove}
                      disabled={isBusy}
                      className="w-full text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Confirm & Approve Project</span>
                    </Button>
                  </TabsContent>

                  {/* Request Revision Tab */}
                  <TabsContent value="revision" className="space-y-3 pt-3">
                    <Alert className="border-amber-500/30 bg-amber-500/10 py-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      <AlertTitle className="text-xs font-semibold text-amber-400">
                        Detailed Guidance Required
                      </AlertTitle>
                      <AlertDescription className="text-[11px] text-muted-foreground">
                        Provide clear feedback outlining what the student must adjust in their deliverable before resubmitting.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="font-semibold text-muted-foreground">
                          Revision Instructions (Required, min 10 chars):
                        </label>
                        <span
                          className={`font-mono text-[10px] ${
                            revisionFeedback.trim().length >= 10
                              ? "text-emerald-400"
                              : "text-amber-400"
                          }`}
                        >
                          {revisionFeedback.trim().length}/10 chars
                        </span>
                      </div>
                      <Textarea
                        placeholder="e.g., Column G lead times require 3-day lab-dip buffer days as detailed in factory instructions..."
                        value={revisionFeedback}
                        onChange={(e) => setRevisionFeedback(e.target.value)}
                        rows={4}
                        className="text-xs bg-background/50"
                      />
                    </div>

                    <Button
                      onClick={handleRequestRevision}
                      disabled={isBusy || revisionFeedback.trim().length < 10}
                      className="w-full text-xs font-semibold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {revisionMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      <span>Send Revision Request</span>
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Action State 3: Approved */}
            {submission.status === "approved" && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Project Outcome Verified & Approved</span>
                </div>

                {submission.admin_feedback && (
                  <div className="rounded-lg bg-background/60 border border-border/50 p-3 text-xs space-y-1">
                    <span className="font-semibold text-muted-foreground text-[11px] block">
                      Reviewer Feedback Provided:
                    </span>
                    <p className="text-foreground italic leading-relaxed">
                      "{submission.admin_feedback}"
                    </p>
                  </div>
                )}

                {/* Portfolio Foundation Showcase Integration */}
                <div className="pt-2 border-t border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Student Portfolio Showcase</span>
                    </span>
                    {submission.portfolio_item ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] gap-1">
                        <Star className="h-3 w-3 fill-primary" />
                        <span>Featured</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Not Linked
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {submission.portfolio_item
                      ? "This approved project is linked in the student's portfolio showcase."
                      : "Approved projects can be linked to the student's private portfolio showcase (remains private until student publishes)."}
                  </p>

                  {!submission.portfolio_item && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLinkPortfolio}
                      disabled={isBusy}
                      className="w-full text-xs font-semibold gap-1.5 h-8 border-primary/40 hover:bg-primary/10"
                    >
                      {linkPortfolioMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Star className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span>Feature in Student Portfolio Showcase</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Action State 4: Revision Required */}
            {submission.status === "revision_required" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Awaiting Student Resubmission</span>
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  A revision request was sent to the student. Once they deliver the updated work via their workspace, this card will automatically reset to 'Submitted' for re-evaluation.
                </p>

                {submission.admin_feedback && (
                  <div className="rounded-lg bg-background/60 border border-border/50 p-3 space-y-1">
                    <span className="font-semibold text-muted-foreground text-[11px] block">
                      Active Revision Request:
                    </span>
                    <p className="text-foreground italic leading-relaxed">
                      "{submission.admin_feedback}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
