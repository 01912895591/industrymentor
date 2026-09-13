import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Briefcase,
  Clock,
  Layers,
  Star,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Eye,
  ExternalLink,
  Send,
  RotateCcw,
  Sparkles,
  FileText,
  Target,
  Award,
  BookOpen,
  ShieldCheck,
  Check,
  Pencil,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { SEOHead } from "@/components/seo/SEOHead";
import { usePublishedProjectBySlug } from "@/hooks/useProjects";
import {
  useProjectSubmission,
  useSubmitProject,
  useResubmitProject,
} from "@/hooks/useProjectSubmission";
import NotFound from "@/pages/NotFound";
import type { ProjectSubmissionFormData, ProjectSubmissionStatus } from "@/types/projects";

export function isValidHttpsUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Strictly enforce HTTPS and reject unsafe protocols
  if (/^(javascript|data|file|http):/i.test(trimmed) && !/^https:/i.test(trimmed)) {
    return false;
  }
  return /^https:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed);
}

export default function ProjectWorkspace() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch published project
  const { data: project, isLoading: projectLoading, isError: projectError } = usePublishedProjectBySlug(slug);

  // Fetch current user's submission
  const {
    data: submission,
    isLoading: submissionLoading,
    refetch: refetchSubmission,
  } = useProjectSubmission(project?.id);

  // Mutations
  const submitMutation = useSubmitProject();
  const resubmitMutation = useResubmitProject();

  // Form State
  const [title, setTitle] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Initialize form when submission data loads or changes
  useEffect(() => {
    if (submission) {
      setTitle(submission.title || "");
      setSubmissionNotes(submission.submission_notes || "");
      setDeliverableUrl(submission.deliverable_url || "");
    } else {
      setTitle(project ? `${project.title} - Final Solution` : "");
      setSubmissionNotes("");
      setDeliverableUrl("");
    }
    setErrors({});
    setIsEditingExisting(false);
  }, [submission, project]);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      errs.title = "Submission title is required";
    } else if (cleanTitle.length < 3) {
      errs.title = "Submission title must be at least 3 characters";
    } else if (cleanTitle.length > 150) {
      errs.title = "Submission title must not exceed 150 characters";
    }

    const cleanUrl = deliverableUrl.trim();
    if (!cleanUrl) {
      errs.deliverableUrl = "Deliverable URL is required";
    } else if (!cleanUrl.startsWith("https://")) {
      errs.deliverableUrl = "Deliverable URL must begin with secure https://";
    } else if (!isValidHttpsUrl(cleanUrl)) {
      errs.deliverableUrl = "Please provide a valid, safe HTTPS link (e.g. Google Drive, GitHub, Figma)";
    }

    if (submissionNotes.length > 2000) {
      errs.submissionNotes = "Notes cannot exceed 2,000 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !validateForm()) return;

    const formData: ProjectSubmissionFormData = {
      title: title.trim(),
      submission_notes: submissionNotes.trim(),
      deliverable_url: deliverableUrl.trim(),
    };

    try {
      if (submission) {
        // Resubmit / update existing record
        await resubmitMutation.mutateAsync({
          submissionId: submission.id,
          projectId: project.id,
          form: formData,
        });
        toast.success("Project resubmitted successfully! Your work is now under review.");
        setIsEditingExisting(false);
      } else {
        // Create initial submission
        await submitMutation.mutateAsync({
          projectId: project.id,
          form: formData,
        });
        toast.success("Project submitted successfully! Your mentor will review your deliverable.");
      }
      refetchSubmission();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit project. Please try again.");
    }
  };

  // Loading state
  if (projectLoading || submissionLoading) {
    return (
      <div className="min-h-screen py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <Skeleton className="h-5 w-48 rounded-md" />
          <div className="space-y-4 max-w-3xl">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-md" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            <div className="lg:col-span-7 space-y-6">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found or error: gracefully show NotFound page
  if (projectError || !project) {
    return <NotFound />;
  }

  const isSaving = submitMutation.isPending || resubmitMutation.isPending;
  const currentStatus: ProjectSubmissionStatus | "not_submitted" = submission ? submission.status : "not_submitted";

  const renderStatusBadge = () => {
    switch (currentStatus) {
      case "submitted":
        return (
          <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/30 gap-1.5 px-3 py-1 text-xs">
            <Clock3 className="h-3.5 w-3.5" />
            Submitted
          </Badge>
        );
      case "in_review":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1.5 px-3 py-1 text-xs">
            <Eye className="h-3.5 w-3.5" />
            Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </Badge>
        );
      case "revision_required":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 gap-1.5 px-3 py-1 text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            Revision Required
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Not Submitted
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <SEOHead
        title={project ? `Workspace: ${project.title} — IndustryMentor` : "Student Project Workspace — IndustryMentor"}
        noindex={true}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            </li>
            <li>
              <Link to="/projects" className="hover:text-foreground transition-colors">
                Projects
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            </li>
            <li>
              <Link to={`/projects/${project.slug}`} className="hover:text-foreground transition-colors truncate max-w-[160px] sm:max-w-xs">
                {project.title}
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            </li>
            <li className="text-foreground font-semibold">Workspace</li>
          </ol>
        </nav>

        {/* Section A: Project Header */}
        <header className="mb-10 sm:mb-12 border-b border-border/50 pb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                  <Briefcase className="h-3 w-3" />
                  Student Workspace
                </span>
                {project.domain && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {project.domain}
                  </span>
                )}
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {project.difficulty || "Intermediate"}
                </span>
                {project.estimated_hours && (
                  <>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {project.estimated_hours} Hours
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                {project.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-3xl leading-relaxed">
                {project.short_description}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              <Button variant="outline" size="sm" asChild className="border-border/70 text-xs gap-1.5">
                <Link to={`/projects/${project.slug}`}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  View Project Details
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Two-Column Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Section B: Project Brief & Reference Guide (Left Column - 7 cols) */}
          <section aria-label="Project Brief" className="lg:col-span-7 space-y-8">
            {/* The Industry Problem */}
            {project.detailed_brief && (
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                    <Target className="h-4 w-4" />
                    Background Context
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    The Industry Problem
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 prose prose-invert max-w-none text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {project.detailed_brief}
                </CardContent>
              </Card>
            )}

            {/* Learning Objectives */}
            {project.learning_objectives && project.learning_objectives.length > 0 && (
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                    <BookOpen className="h-4 w-4" />
                    Core Competencies
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Learning Objectives
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2.5">
                    {project.learning_objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5 leading-relaxed">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Required Deliverables */}
            {project.deliverables && project.deliverables.length > 0 && (
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                    <Award className="h-4 w-4" />
                    Required Outputs
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Expected Deliverables
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  {project.deliverables.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">{item.title}</span>
                        {item.format && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40">
                            {item.format}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Step-by-Step Instructions */}
            {project.instructions && (
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                    <FileText className="h-4 w-4" />
                    Methodology
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Instructions & Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 prose prose-invert max-w-none text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {project.instructions}
                </CardContent>
              </Card>
            )}

            {/* Evaluation Criteria */}
            {project.evaluation_criteria && project.evaluation_criteria.length > 0 && (
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                    <CheckCircle2 className="h-4 w-4" />
                    Review Standards
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Evaluation Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/40">
                  {project.evaluation_criteria.map((crit, idx) => (
                    <div key={idx} className={`${idx === 0 ? "pb-3" : "py-3"} space-y-1`}>
                      <span className="font-semibold text-xs sm:text-sm text-foreground block">
                        {crit.criterion}
                      </span>
                      {crit.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{crit.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Mentor Guidance */}
            {project.mentor_guidance && (
              <Card className="bg-primary/5 border border-primary/30 rounded-2xl p-6 shadow-sm">
                <CardContent className="p-0 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wide">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Practitioner Guidance</span>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap italic">
                    "{project.mentor_guidance}"
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Reference Resources */}
            {project.resources && project.resources.length > 0 && (
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-3">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                    <Layers className="h-4 w-4" />
                    Starter Assets
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    Project Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2.5">
                  {project.resources.map((res, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="font-semibold text-foreground truncate block">{res.title}</span>
                        {res.notes && <span className="text-muted-foreground line-clamp-1">{res.notes}</span>}
                      </div>
                      {res.url && isValidHttpsUrl(res.url) && (
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </section>

          {/* Section C: Workspace Submission Panel (Right Column - 5 cols) */}
          <aside aria-label="Submission Workspace" className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Main Submission Card */}
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-4 border-b border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold text-foreground">
                      Project Submission
                    </CardTitle>
                    {renderStatusBadge()}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Submit your solution deliverable for mentor evaluation.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0 pt-5 space-y-5">
                  {/* Case 1: Status = APPROVED */}
                  {currentStatus === "approved" && submission && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Project Approved & Verified!</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Your solution for this industry project has been evaluated and approved by an IndustryMentor reviewer.
                        </p>
                        {submission.reviewed_at && (
                          <p className="text-[11px] text-muted-foreground/80">
                            Approved on:{" "}
                            {new Date(submission.reviewed_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>

                      {/* Admin Feedback Display */}
                      {submission.admin_feedback && (
                        <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-1.5 text-xs">
                          <span className="font-bold text-foreground block">Reviewer Feedback:</span>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                            "{submission.admin_feedback}"
                          </p>
                        </div>
                      )}

                      {/* Submission Summary (Read-Only) */}
                      <div className="space-y-3 pt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Submission Title</span>
                          <span className="font-semibold text-foreground">{submission.title}</span>
                        </div>

                        {submission.deliverable_url && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Deliverable URL</span>
                            <a
                              href={submission.deliverable_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline break-all mt-0.5"
                            >
                              <span>Open Verified Deliverable</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {submission.submission_notes && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Student Notes</span>
                            <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                              {submission.submission_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Case 2: Status = IN_REVIEW */}
                  {currentStatus === "in_review" && submission && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                          <Eye className="h-4 w-4" />
                          <span>Evaluation in Progress</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Your submission is currently being reviewed by an industry practitioner.
                          You will receive structured feedback and evaluation results here once complete.
                        </p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Submitted on:{" "}
                          {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Submission Read-Only Details */}
                      <div className="space-y-3 pt-1 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Submission Title</span>
                          <span className="font-semibold text-foreground">{submission.title}</span>
                        </div>

                        {submission.deliverable_url && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Submitted Deliverable</span>
                            <a
                              href={submission.deliverable_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline break-all mt-0.5"
                            >
                              <span>View Submitted Link</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {submission.submission_notes && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Submission Notes</span>
                            <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                              {submission.submission_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Case 3: Status = SUBMITTED (Pending review) */}
                  {currentStatus === "submitted" && submission && !isEditingExisting && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                          <Check className="h-4 w-4" />
                          <span>Deliverable Submitted</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          Your project deliverable has been queued for review. You may update your submission
                          information while it is waiting in the review queue.
                        </p>
                        <p className="text-[11px] text-muted-foreground/80">
                          Submitted on:{" "}
                          {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Submission Details */}
                      <div className="space-y-3 pt-1 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Submission Title</span>
                          <span className="font-semibold text-foreground">{submission.title}</span>
                        </div>

                        {submission.deliverable_url && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Deliverable URL</span>
                            <a
                              href={submission.deliverable_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline break-all mt-0.5"
                            >
                              <span>Test Deliverable Link</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {submission.submission_notes && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Submission Notes</span>
                            <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">
                              {submission.submission_notes}
                            </p>
                          </div>
                        )}

                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingExisting(true)}
                            className="w-full text-xs gap-1.5 border-border/70"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit / Update Deliverable
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Case 4: Status = REVISION_REQUIRED OR Not Submitted OR Editing Existing */}
                  {(currentStatus === "not_submitted" ||
                    currentStatus === "revision_required" ||
                    (currentStatus === "submitted" && isEditingExisting)) && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Prominent Revision Alert */}
                      {currentStatus === "revision_required" && submission && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 text-destructive-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="text-xs font-bold text-destructive">
                            Revision Required by Reviewer
                          </AlertTitle>
                          <AlertDescription className="text-xs mt-1 space-y-2">
                            <p>
                              Your reviewer has requested modifications before this deliverable can be approved.
                              Please address the feedback below and resubmit your updated deliverable.
                            </p>
                            {submission.admin_feedback && (
                              <div className="mt-2 p-2.5 rounded-lg bg-background/50 border border-destructive/20 text-foreground font-medium whitespace-pre-wrap">
                                "{submission.admin_feedback}"
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Title Field */}
                      <div className="space-y-1.5">
                        <Label htmlFor="sub-title" className="text-xs font-semibold text-foreground">
                          Submission Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="sub-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., TNA Critical Path & Buffer Calculation"
                          className={`h-9 text-xs bg-background/50 ${errors.title ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          disabled={isSaving}
                        />
                        {errors.title ? (
                          <p className="text-[11px] text-destructive">{errors.title}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">
                            A clear title identifying your deliverable output.
                          </p>
                        )}
                      </div>

                      {/* Deliverable URL Field */}
                      <div className="space-y-1.5">
                        <Label htmlFor="sub-url" className="text-xs font-semibold text-foreground">
                          Deliverable URL <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="sub-url"
                          type="url"
                          value={deliverableUrl}
                          onChange={(e) => setDeliverableUrl(e.target.value)}
                          placeholder="https://drive.google.com/... or https://github.com/..."
                          className={`h-9 text-xs bg-background/50 ${errors.deliverableUrl ? "border-destructive focus-visible:ring-destructive" : ""}`}
                          disabled={isSaving}
                        />
                        {errors.deliverableUrl ? (
                          <p className="text-[11px] text-destructive">{errors.deliverableUrl}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">
                            Must be a secure <strong>https://</strong> link. Ensure permissions are set to "Anyone with the link can view".
                          </p>
                        )}
                      </div>

                      {/* Submission Notes Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sub-notes" className="text-xs font-semibold text-foreground">
                            Submission Notes / Summary
                          </Label>
                          <span className="text-[10px] text-muted-foreground">
                            {submissionNotes.length}/2000
                          </span>
                        </div>
                        <Textarea
                          id="sub-notes"
                          rows={4}
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          placeholder="Highlight key assumptions, methodology notes, or specific areas you would like the reviewer to evaluate..."
                          className={`text-xs bg-background/50 resize-none ${errors.submissionNotes ? "border-destructive" : ""}`}
                          disabled={isSaving}
                        />
                        {errors.submissionNotes ? (
                          <p className="text-[11px] text-destructive">{errors.submissionNotes}</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">
                            Optional notes describing your approach and results.
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 space-y-2">
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="w-full text-xs font-semibold h-10 gap-2 shadow-sm"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Saving Deliverable...</span>
                            </>
                          ) : currentStatus === "revision_required" ? (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              <span>Resubmit Project</span>
                            </>
                          ) : currentStatus === "submitted" && isEditingExisting ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Update Submission</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              <span>Submit Project</span>
                            </>
                          )}
                        </Button>

                        {isEditingExisting && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingExisting(false)}
                            className="w-full text-xs text-muted-foreground"
                          >
                            Cancel Editing
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Workspace Best Practices Card */}
              <Card className="bg-card/25 border border-border/50 rounded-2xl p-5 text-xs text-muted-foreground space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Info className="h-4 w-4 text-primary" />
                  <span>Submission Best Practices</span>
                </div>
                <ul className="space-y-1.5 text-[11px] leading-relaxed">
                  <li>• Ensure spreadsheets contain functioning formulas (e.g. SMV, pitch times, consumption).</li>
                  <li>• For cloud files (Google Drive, OneDrive), verify share permissions are set to public view.</li>
                  <li>• Detailed practitioner evaluations are typically returned within 3 business days.</li>
                </ul>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
