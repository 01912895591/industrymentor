import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Send,
  Clock3,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderKanban,
} from "lucide-react";
import type { ProjectSubmissionWithDetails } from "@/types/projects";

interface ProjectSubmissionStatsHeaderProps {
  submissions: ProjectSubmissionWithDetails[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProjectSubmissionStatsHeader({
  submissions,
  isLoading,
  onRefresh,
}: ProjectSubmissionStatsHeaderProps) {
  const pendingCount = submissions.filter((s) => s.status === "submitted").length;
  const inReviewCount = submissions.filter((s) => s.status === "in_review").length;
  const revisionCount = submissions.filter((s) => s.status === "revision_required").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;

  const stats = [
    {
      title: "Total Submissions",
      value: submissions.length,
      subtitle: "All Time",
      icon: Send,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Needs Review",
      value: pendingCount,
      subtitle: "Pending Initial Review",
      icon: Clock3,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "In Review",
      value: inReviewCount,
      subtitle: "Active Evaluations",
      icon: Eye,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Revision Required",
      value: revisionCount,
      subtitle: "Awaiting Resubmission",
      icon: AlertCircle,
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    },
    {
      title: "Approved",
      value: approvedCount,
      subtitle: `${submissions.length > 0 ? Math.round((approvedCount / submissions.length) * 100) : 0}% Verified`,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Project Submissions
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              Evaluation CMS
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review student deliverables, provide qualitative mentor feedback, and verify practical project outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-9 gap-1.5 border border-border/60"
          >
            <Link to="/admin/projects">
              <FolderKanban className="h-3.5 w-3.5 text-primary" />
              <span>Projects Catalog</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-xl overflow-hidden shadow-sm"
          >
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] font-medium text-muted-foreground truncate block">
                  {stat.title}
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <p className="text-[10px] text-muted-foreground/80 truncate">
                  {stat.subtitle}
                </p>
              </div>

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
