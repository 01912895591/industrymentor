import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Sparkles,
  FolderKanban,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { PortfolioWithDetails } from "@/types/portfolio";

interface PortfolioPreviewTabProps {
  portfolio: PortfolioWithDetails;
}

export function PortfolioPreviewTab({ portfolio }: PortfolioPreviewTabProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/portfolio/${portfolio.slug}`
      : `/portfolio/${portfolio.slug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Portfolio link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const projectCount = portfolio.items.filter((i) => i.project_submission_id).length;
  const certificateCount = portfolio.items.filter((i) => i.certificate_id).length;

  return (
    <div className="space-y-6">
      <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/40 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" />
                <span>Portfolio Share & Preview</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Share your industry profile with recruiters, hiring managers, and professional networks.
              </CardDescription>
            </div>

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
                  <Globe className="h-3.5 w-3.5" />
                  <span>Public & Shareable</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private Profile</span>
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Share Link Card */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Direct Public URL
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0 p-2.5 rounded-lg bg-background/80 border border-border/60 font-mono text-xs text-foreground truncate select-all">
                {publicUrl}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-9 text-xs font-semibold gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copied ? "Copied Link" : "Copy Link"}</span>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="h-9 text-xs font-semibold gap-1.5"
                >
                  <Link to={`/portfolio/${portfolio.slug}`} target="_blank" rel="noopener noreferrer">
                    <span>View Public Page</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {!portfolio.is_public && (
              <p className="text-[11px] text-amber-400/90 leading-relaxed pt-1">
                Notice: Your portfolio is currently set to <strong>Private</strong>. Only you can view this page while logged in. To allow recruiters or external visitors to see your portfolio, switch visibility to <strong>Public</strong> in the Profile tab.
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-border/50 bg-background/40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Target Career Pathway
              </span>
              <div className="text-sm font-bold text-foreground truncate">
                {portfolio.career_path?.title || "General Professional"}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-background/40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <FolderKanban className="h-3.5 w-3.5 text-primary" />
                <span>Showcased Projects</span>
              </span>
              <div className="text-xl font-bold text-foreground">
                {projectCount}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/50 bg-background/40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" />
                <span>Verified Credentials</span>
              </span>
              <div className="text-xl font-bold text-foreground">
                {certificateCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
