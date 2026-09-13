import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Globe,
  FolderKanban,
  Award,
  Sparkles,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { usePublicPortfolio } from "@/hooks/usePortfolio";
import { PublicPortfolioHero } from "@/components/portfolio/PublicPortfolioHero";
import { PublicProjectCard } from "@/components/portfolio/PublicProjectCard";
import { PublicCertificateCard } from "@/components/portfolio/PublicCertificateCard";
import { SEOHead } from "@/components/seo/SEOHead";

export default function PublicPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = usePublicPortfolio(slug);

  const portfolio = data?.portfolio;
  const isPrivate = data?.isPrivate;
  const notFound = data?.notFound;
  const isOwner = data?.isOwner;

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (notFound || !data || isError) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center px-4">
        <SEOHead
          title="Portfolio Not Found — IndustryMentor"
          noindex={true}
        />
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Globe className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Portfolio Not Found
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We couldn't find an IndustryMentor portfolio matching the URL <code>/portfolio/{slug}</code>.
          </p>
          <div className="pt-2">
            <Button size="sm" asChild className="text-xs font-bold gap-1.5">
              <Link to="/">
                <span>Back to Homepage</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Private Portfolio State (when visitor is NOT owner)
  if (isPrivate) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center px-4">
        <SEOHead
          title="Private Portfolio — IndustryMentor"
          noindex={true}
        />
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            This Portfolio is Private
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The owner of this IndustryMentor portfolio has kept their achievements private. Only the portfolio owner can view this content.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="outline" asChild className="text-xs font-semibold">
              <Link to="/">Explore IndustryMentor</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  // Filter showcase items
  const projectItems = portfolio.items.filter((i) => i.submission);
  const featuredProjects = projectItems.filter((i) => i.is_featured);
  const standardProjects = projectItems.filter((i) => !i.is_featured);
  const certificateItems = portfolio.items.filter((i) => i.certificate);

  const nameOrHeadline =
    portfolio.student?.full_name || portfolio.headline || "Industry Professional";

  return (
    <div className="min-h-screen py-10 sm:py-16">
      <SEOHead
        title={`${nameOrHeadline} | IndustryMentor`}
        description={
          portfolio.bio ||
          portfolio.headline ||
          `Professional industry portfolio and verified deliverables of ${nameOrHeadline} on IndustryMentor.`
        }
        canonicalUrl={`https://industrymentor.net/portfolio/${slug}`}
        ogType="profile"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: portfolio.student?.full_name || portfolio.headline,
          jobTitle: portfolio.headline || undefined,
          description: portfolio.bio || undefined,
          sameAs: portfolio.linkedin_url ? [portfolio.linkedin_url] : undefined,
          worksFor: {
            "@type": "Organization",
            name: "IndustryMentor",
            url: "https://industrymentor.net",
          },
        }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-12">
        {/* Hero & Profile Header */}
        <PublicPortfolioHero portfolio={portfolio} isOwner={isOwner} />

        {/* Target Career Track Highlight (if assigned) */}
        {portfolio.career_path && (
          <section aria-label="Career Track Focus" className="rounded-2xl border border-border/60 bg-card/30 p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Specialized Industry Track
                  </span>
                  <h3 className="text-base font-bold text-foreground mt-0.5">
                    {portfolio.career_path.title}
                  </h3>
                </div>
              </div>

              <Badge variant="outline" className="text-xs bg-muted/60 self-start sm:self-center">
                {portfolio.career_path.domain}
              </Badge>
            </div>
          </section>
        )}

        {/* Featured Projects Section */}
        {featuredProjects.length > 0 && (
          <section aria-label="Featured Projects" className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Featured Industry Projects
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featuredProjects.map((item) => (
                <PublicProjectCard key={item.id} item={item} isFeatured={true} />
              ))}
            </div>
          </section>
        )}

        {/* All Approved Projects Section */}
        {standardProjects.length > 0 && (
          <section aria-label="Practical Projects" className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Practical Industry Deliverables ({standardProjects.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {standardProjects.map((item) => (
                <PublicProjectCard key={item.id} item={item} isFeatured={false} />
              ))}
            </div>
          </section>
        )}

        {/* Verified Certificates Section */}
        {certificateItems.length > 0 && (
          <section aria-label="Verified Credentials" className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                Verified Industry Credentials ({certificateItems.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {certificateItems.map((item) => (
                <PublicCertificateCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* Empty Achievements Fallback */}
        {projectItems.length === 0 && certificateItems.length === 0 && (
          <div className="p-8 rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center space-y-2">
            <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-bold text-foreground">
              Profile In Progress
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              This learner is currently developing practical solutions for industrial challenges. Verified deliverables and credentials will appear here once approved.
            </p>
          </div>
        )}

        {/* Professional Footer CTA */}
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/40 to-primary/5 p-8 text-center space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Master Practical Skills for the Apparel & Textile Industry
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            IndustryMentor delivers practitioner-led mentorship, real factory projects, and verified credentials for ambitious professionals.
          </p>
          <Button size="sm" asChild className="h-9 text-xs font-bold gap-2">
            <Link to="/courses">
              <span>Explore Programs & Certifications</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
