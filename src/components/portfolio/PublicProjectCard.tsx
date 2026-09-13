import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Star,
  FolderKanban,
} from "lucide-react";
import type { PortfolioItemWithDetails } from "@/types/portfolio";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";

interface PublicProjectCardProps {
  item: PortfolioItemWithDetails;
  isFeatured?: boolean;
}

export function PublicProjectCard({ item, isFeatured }: PublicProjectCardProps) {
  const sub = item.submission;
  const proj = sub?.project;

  const deliverableUrl = sub?.deliverable_url;
  const hasValidHttps = deliverableUrl ? isValidHttpsUrl(deliverableUrl) : false;

  const difficultyVariant = (difficulty?: string | null) => {
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

  return (
    <Card
      className={`rounded-2xl border bg-card/40 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-md flex flex-col justify-between ${
        isFeatured
          ? "border-primary/40 ring-1 ring-primary/20 shadow-glow"
          : "border-border/60"
      }`}
    >
      <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {proj?.domain && (
                <Badge variant="outline" className="text-[10px] bg-muted/60">
                  {proj.domain}
                </Badge>
              )}
              {proj?.difficulty && (
                <Badge
                  variant="outline"
                  className={`text-[10px] ${difficultyVariant(proj.difficulty)}`}
                >
                  {proj.difficulty}
                </Badge>
              )}
            </div>

            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold gap-1 shrink-0"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified Outcome</span>
            </Badge>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight leading-snug">
              {proj?.title || sub?.title || "Industry Project"}
            </h3>
            {isFeatured && (
              <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold mt-0.5">
                <Star className="h-2.5 w-2.5 fill-primary" />
                <span>Featured Project</span>
              </span>
            )}
          </div>

          {/* Short Description */}
          {proj?.short_description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {proj.short_description}
            </p>
          )}
        </div>

        {/* Deliverable Link CTA */}
        {hasValidHttps && (
          <div className="pt-3 border-t border-border/40">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="w-full text-xs font-semibold gap-1.5 h-8 border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
            >
              <a
                href={deliverableUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>View Solution Deliverable</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
