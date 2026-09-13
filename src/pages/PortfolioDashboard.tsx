import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Briefcase,
  FolderKanban,
  Award,
  Share2,
  ExternalLink,
  Globe,
  Lock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useStudentPortfolio } from "@/hooks/usePortfolio";
import { SEOHead } from "@/components/seo/SEOHead";
import { PortfolioOnboarding } from "@/components/portfolio/PortfolioOnboarding";
import { PortfolioProfileTab } from "@/components/portfolio/PortfolioProfileTab";
import { PortfolioProjectsTab } from "@/components/portfolio/PortfolioProjectsTab";
import { PortfolioCertificatesTab } from "@/components/portfolio/PortfolioCertificatesTab";
import { PortfolioPreviewTab } from "@/components/portfolio/PortfolioPreviewTab";

export default function PortfolioDashboard() {
  const { data: portfolio, isLoading, error } = useStudentPortfolio();

  if (isLoading) {
    return (
      <div className="min-h-screen py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
          <Skeleton className="h-6 w-32 rounded-md" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // If student has no portfolio yet, show onboarding
  if (!portfolio) {
    return <PortfolioOnboarding />;
  }

  const projectCount = portfolio.items.filter((i) => i.project_submission_id).length;
  const certificateCount = portfolio.items.filter((i) => i.certificate_id).length;

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <SEOHead title="My Portfolio | IndustryMentor" noindex={true} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground transition-colors">
            Student Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="font-semibold text-foreground">Industry Portfolio</span>
        </nav>

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {portfolio.student?.full_name || "My Industry Portfolio"}
              </h1>

              <Badge
                variant="outline"
                className={`text-xs font-semibold gap-1.5 px-3 py-1 ${
                  portfolio.is_public
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {portfolio.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>Private</span>
                  </>
                )}
              </Badge>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {portfolio.headline || "Manage your mentor-approved projects, verified certificates, and public profile."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 text-xs font-semibold gap-1.5 border-border/60 hover:bg-muted"
            >
              <Link to={`/portfolio/${portfolio.slug}`} target="_blank" rel="noopener noreferrer">
                <span>View Public Page</span>
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="projects" className="w-full space-y-6">
          <TabsList className="grid grid-cols-4 h-11 p-1 bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl">
            <TabsTrigger value="projects" className="text-xs font-semibold gap-1.5">
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Approved Projects</span>
              <span className="sm:hidden">Projects</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full">
                {projectCount}
              </span>
            </TabsTrigger>

            <TabsTrigger value="certificates" className="text-xs font-semibold gap-1.5">
              <Award className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Verified Certificates</span>
              <span className="sm:hidden">Certs</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full">
                {certificateCount}
              </span>
            </TabsTrigger>

            <TabsTrigger value="profile" className="text-xs font-semibold gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Profile & Privacy</span>
            </TabsTrigger>

            <TabsTrigger value="preview" className="text-xs font-semibold gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview & Share</span>
              <span className="sm:hidden">Share</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <PortfolioProjectsTab portfolio={portfolio} />
          </TabsContent>

          <TabsContent value="certificates">
            <PortfolioCertificatesTab portfolio={portfolio} />
          </TabsContent>

          <TabsContent value="profile">
            <PortfolioProfileTab portfolio={portfolio} />
          </TabsContent>

          <TabsContent value="preview">
            <PortfolioPreviewTab portfolio={portfolio} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
