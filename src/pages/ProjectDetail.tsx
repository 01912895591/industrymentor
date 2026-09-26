import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  Briefcase,
  Layers,
  Star,
  Share2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  Award,
  BookOpen,
  Target,
  Sparkles,
  HelpCircle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePublishedProjectBySlug } from "@/hooks/useProjects";
import NotFound from "@/pages/NotFound";
import { SEOHead } from "@/components/seo/SEOHead";

function isValidExternalUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Strictly allow http:// and https://; prevent javascript:, data:, file:
  return /^https?:\/\/[^\s]+$/i.test(trimmed);
}

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const { data: project, isLoading, isError } = usePublishedProjectBySlug(slug);

  const [copied, setCopied] = useState(false);

  const difficultyVariant = (difficulty: string | null) => {
    switch (difficulty) {
      case "Foundational":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Intermediate":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "Advanced":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground border-border/40";
    }
  };

  const handleShare = async () => {
    try {
      const canonicalUrl = `${window.location.origin}/projects/${slug}`;
      await navigator.clipboard.writeText(canonicalUrl);
      setCopied(true);
      toast.success("Project link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleStartProject = () => {
    if (!user) {
      // Unauthenticated: redirect to login preserving intended destination
      navigate("/auth", { state: { from: `/projects/${slug}/workspace` } });
    } else {
      // Authenticated: navigate directly to dedicated project workspace
      navigate(`/projects/${slug}/workspace`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
          <Skeleton className="h-5 w-48 rounded-md" />
          <div className="space-y-4 max-w-3xl">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4 rounded-md" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found or error: gracefully show NotFound page without disclosing unpublished status
  if (isError || !project) {
    return <NotFound />;
  }

  const primarySkills = (project.skills || []).filter((s) => s.is_primary);
  const supportingSkills = (project.skills || []).filter((s) => !s.is_primary);
  const careerPaths = project.career_paths || [];

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <SEOHead
        title={`${project.title} | IndustryMentor`}
        description={
          project.short_description ||
          "Practical industry project and real factory execution challenge with deliverable verification on IndustryMentor."
        }
        canonicalUrl={`https://industrymentor.net/projects/${slug}`}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.short_description || undefined,
            creator: {
              "@type": "Organization",
              name: "IndustryMentor",
              url: "https://industrymentor.net",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://industrymentor.net/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Projects",
                item: "https://industrymentor.net/projects",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: project.title,
                item: `https://industrymentor.net/projects/${slug}`,
              },
            ],
          },
        ]}
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
            <li className="text-foreground font-medium truncate max-w-[240px] sm:max-w-md">
              {project.title}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="mb-10 sm:mb-12 border-b border-border/50 pb-8">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            {project.domain && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                <Briefcase className="h-3.5 w-3.5" />
                {project.domain}
              </span>
            )}

            {project.difficulty && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${difficultyVariant(
                  project.difficulty
                )}`}
              >
                {project.difficulty}
              </span>
            )}

            {project.estimated_hours && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground bg-card/60 border border-border/60">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {project.estimated_hours} Hours Estimated
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight max-w-4xl mb-4">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            {project.short_description}
          </p>

          {/* Action CTAs in Header */}
          <div className="flex flex-wrap items-center gap-3 pt-6">
            <Button
              onClick={handleStartProject}
              size="lg"
              className="font-semibold gap-2 shadow-sm h-11 px-6 text-sm"
            >
              <Briefcase className="h-4 w-4" />
              <span>Start Project</span>
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              size="lg"
              className="gap-2 border-border/70 h-11 px-5 text-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>Share Project</span>
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Two-Column Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Content Column (70%) */}
          <main className="lg:col-span-8 space-y-10">
            {/* 1. The Industry Problem (detailed_brief) */}
            {project.detailed_brief && (
              <section aria-labelledby="problem-heading" className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <Target className="h-4 w-4" />
                  Background & Context
                </div>
                <h2 id="problem-heading" className="text-2xl font-bold tracking-tight text-foreground">
                  The Industry Problem
                </h2>
                <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <CardContent className="p-0 prose prose-invert max-w-none text-muted-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                    {project.detailed_brief}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 2. Learning Objectives (learning_objectives) */}
            {project.learning_objectives && project.learning_objectives.length > 0 && (
              <section aria-labelledby="objectives-heading" className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <BookOpen className="h-4 w-4" />
                  Core Competencies
                </div>
                <h2 id="objectives-heading" className="text-2xl font-bold tracking-tight text-foreground">
                  Learning Objectives
                </h2>
                <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <CardContent className="p-0">
                    <ul className="space-y-3.5">
                      {project.learning_objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-muted-foreground">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 3. Deliverables (deliverables) */}
            {project.deliverables && project.deliverables.length > 0 && (
              <section aria-labelledby="deliverables-heading" className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <Award className="h-4 w-4" />
                  Submission Output
                </div>
                <h2 id="deliverables-heading" className="text-2xl font-bold tracking-tight text-foreground">
                  Expected Deliverables
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.deliverables.map((item, idx) => (
                    <Card
                      key={idx}
                      className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-xl p-5 shadow-sm hover:border-primary/40 transition-colors"
                    >
                      <CardContent className="p-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-foreground">
                            {item.title}
                          </h3>
                          {item.format && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground border border-border/50">
                              {item.format}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Instructions (instructions) */}
            {project.instructions && (
              <section aria-labelledby="instructions-heading" className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <FileText className="h-4 w-4" />
                  Execution Methodology
                </div>
                <h2 id="instructions-heading" className="text-2xl font-bold tracking-tight text-foreground">
                  Project Instructions
                </h2>
                <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <CardContent className="p-0 prose prose-invert max-w-none text-muted-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                    {project.instructions}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 5. Evaluation Criteria (evaluation_criteria) */}
            {project.evaluation_criteria && project.evaluation_criteria.length > 0 && (
              <section aria-labelledby="criteria-heading" className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <CheckCircle2 className="h-4 w-4" />
                  Standards of Quality
                </div>
                <h2 id="criteria-heading" className="text-2xl font-bold tracking-tight text-foreground">
                  Evaluation Criteria
                </h2>
                <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <CardContent className="p-0 divide-y divide-border/40">
                    {project.evaluation_criteria.map((crit, idx) => (
                      <div key={idx} className={`${idx === 0 ? "pb-4" : "py-4"} space-y-1`}>
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-foreground">
                            {crit.criterion}
                          </h3>
                        </div>
                        {crit.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {crit.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 6. Practitioner / Mentor Guidance (mentor_guidance) */}
            {project.mentor_guidance && (
              <section aria-labelledby="guidance-heading" className="space-y-4">
                <Card className="bg-primary/5 border border-primary/30 rounded-2xl p-6 sm:p-7 shadow-sm">
                  <CardContent className="p-0 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wide">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                      <span>Practitioner Advice & Mentor Guidance</span>
                    </div>
                    <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap italic">
                      "{project.mentor_guidance}"
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* 7. Resources & Starter Files (resources) */}
            {project.resources && project.resources.length > 0 && (
              <section aria-labelledby="resources-heading" className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                  <Layers className="h-4 w-4" />
                  Reference Materials
                </div>
                <h2 id="resources-heading" className="text-2xl font-bold tracking-tight text-foreground">
                  Project Resources
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.resources.map((res, idx) => {
                    const hasValidUrl = isValidExternalUrl(res.url);

                    return (
                      <Card
                        key={idx}
                        className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-xl p-5 shadow-sm hover:border-primary/40 transition-colors"
                      >
                        <CardContent className="p-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-sm sm:text-base text-foreground">
                              {res.title}
                            </h3>
                            {res.type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-muted/60 text-muted-foreground border border-border/50">
                                {res.type}
                              </span>
                            )}
                          </div>
                          {res.notes && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {res.notes}
                            </p>
                          )}
                          {hasValidUrl && (
                            <div className="pt-2">
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                <span>Access Resource</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </main>

          {/* Sticky Sidebar (30%) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Project Overview Card */}
              <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-sm">
                <CardHeader className="p-0 pb-4 border-b border-border/40">
                  <CardTitle className="text-base font-bold text-foreground">
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4 space-y-5 text-sm">
                  {/* Difficulty */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Difficulty</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyVariant(
                        project.difficulty
                      )}`}
                    >
                      {project.difficulty || "Intermediate"}
                    </span>
                  </div>

                  {/* Estimated Time */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">Estimated Effort</span>
                    <span className="font-semibold text-foreground text-xs">
                      {project.estimated_hours ? `${project.estimated_hours} Hours` : "Self-paced"}
                    </span>
                  </div>

                  {/* Domain */}
                  {project.domain && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs">Domain Arena</span>
                      <span className="font-medium text-foreground text-xs text-right">
                        {project.domain}
                      </span>
                    </div>
                  )}

                  {/* Career Pathways */}
                  {careerPaths.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <span className="text-muted-foreground text-xs font-medium block">
                        Associated Career Pathway
                      </span>
                      <div className="space-y-1">
                        {careerPaths.map((cp) => (
                          <Link
                            key={cp.id}
                            to="/career"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                          >
                            <Layers className="h-3 w-3 shrink-0" />
                            <span>{cp.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Applied */}
                  {(primarySkills.length > 0 || supportingSkills.length > 0) && (
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <span className="text-muted-foreground text-xs font-medium block">
                        Applied Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {primarySkills.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                          >
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            {s.title}
                          </span>
                        ))}
                        {supportingSkills.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-muted-foreground bg-muted/40 border border-border/40"
                          >
                            {s.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sidebar CTA Buttons */}
                  <div className="space-y-2.5 pt-4 border-t border-border/40">
                    <Button
                      onClick={handleStartProject}
                      className="w-full font-semibold gap-2 shadow-sm"
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>Start Project</span>
                    </Button>

                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="w-full gap-2 border-border/70 text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share Project</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mentorship Advisory Callout */}
              <Card className="bg-card/25 border border-border/50 rounded-2xl p-5 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <span>Need Guidance on this Project?</span>
                </div>
                <p className="leading-relaxed">
                  Connect with industry practitioners who have faced these exact challenges in real
                  export apparel manufacturing facilities.
                </p>
                <div className="pt-1">
                  <Link
                    to="/mentors"
                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Browse Industry Mentors</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
