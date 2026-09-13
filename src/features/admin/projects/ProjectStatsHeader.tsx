import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  CheckCircle2,
  FileEdit,
  Send,
  Plus,
  RefreshCw,
} from "lucide-react";
import type { ProjectWithRelations } from "@/types/projects";

interface ProjectStatsHeaderProps {
  projects: ProjectWithRelations[];
  totalSubmissions: number;
  isLoading: boolean;
  onRefresh: () => void;
  onCreateClick: () => void;
}

export function ProjectStatsHeader({
  projects,
  totalSubmissions,
  isLoading,
  onRefresh,
  onCreateClick,
}: ProjectStatsHeaderProps) {
  const publishedCount = projects.filter((p) => p.is_published).length;
  const draftCount = projects.filter((p) => !p.is_published).length;

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      subtitle: "Master Catalog",
      icon: FolderKanban,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Published",
      value: publishedCount,
      subtitle: `${projects.length > 0 ? Math.round((publishedCount / projects.length) * 100) : 0}% Active`,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Drafts",
      value: draftCount,
      subtitle: "In Authoring",
      icon: FileEdit,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Submissions",
      value: totalSubmissions,
      subtitle: "Student Submissions",
      icon: Send,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Projects
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
              Phase 7 CMS
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage practical industry projects for IndustryMentor learners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 gap-1.5 border-border/60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={onCreateClick}
            size="sm"
            className="h-9 gap-1.5 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, idx) => (
          <Card
            key={idx}
            className="bg-card/40 backdrop-blur-xl border-border/50 shadow-sm hover:border-border/80 transition-all duration-200"
          >
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/80">
                  {stat.subtitle}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border ${stat.color}`}
              >
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
