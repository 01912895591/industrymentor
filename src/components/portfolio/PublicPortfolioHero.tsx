import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Linkedin,
  Share2,
  Check,
  Copy,
  ShieldCheck,
  Globe,
  Lock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";
import type { PortfolioWithDetails } from "@/types/portfolio";

interface PublicPortfolioHeroProps {
  portfolio: PortfolioWithDetails;
  isOwner?: boolean;
}

export function PublicPortfolioHero({ portfolio, isOwner }: PublicPortfolioHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Portfolio link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const displayName =
    portfolio.student?.full_name || portfolio.headline || "Industry Professional";

  const hasValidLinkedIn = portfolio.linkedin_url ? isValidHttpsUrl(portfolio.linkedin_url) : false;

  return (
    <div className="space-y-4">
      {/* Private Preview Banner if owner is viewing private profile */}
      {isOwner && !portfolio.is_public && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs text-amber-400">
          <div className="flex items-center gap-2 font-medium">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              <strong>Private Preview:</strong> This portfolio is currently Private. Only you can view it. Switch visibility to Public in your dashboard when ready.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-7 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/20 shrink-0"
          >
            <a href="/portfolio">Edit Settings</a>
          </Button>
        </div>
      )}

      {/* Main Hero Card */}
      <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Status & Career Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold gap-1.5 px-3 py-1"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Industry Portfolio</span>
              </Badge>

              {portfolio.career_path && (
                <Badge
                  variant="outline"
                  className="bg-muted text-foreground border-border/60 text-xs font-medium px-2.5 py-0.5"
                >
                  {portfolio.career_path.title}
                </Badge>
              )}
            </div>

            {/* Display Name / Headline */}
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {displayName}
              </h1>
              {portfolio.headline && portfolio.student?.full_name && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium leading-relaxed">
                  {portfolio.headline}
                </p>
              )}
            </div>

            {/* Location & Meta */}
            {portfolio.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{portfolio.location}</span>
              </div>
            )}
          </div>

          {/* Social & Share Actions */}
          <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
            {hasValidLinkedIn && portfolio.linkedin_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-10 text-xs font-semibold gap-2 border-border/60 hover:bg-muted"
              >
                <a
                  href={portfolio.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-4 w-4 text-blue-400" />
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-10 text-xs font-semibold gap-2 border-border/60 hover:bg-muted"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Share2 className="h-4 w-4 text-primary" />
              )}
              <span>{copied ? "Link Copied" : "Share Profile"}</span>
            </Button>
          </div>
        </div>

        {/* Bio */}
        {portfolio.bio && (
          <div className="mt-6 pt-6 border-t border-border/40 max-w-3xl">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Professional Summary
            </h3>
            <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {portfolio.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
