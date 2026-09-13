import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Compass,
  Layers,
  BookOpen,
  Users,
  FileText,
  RefreshCw,
} from "lucide-react";
import type {
  CareerPathRow,
  SkillRow,
  CareerPathSkillRow,
  SkillCourseRow,
  SkillMentorRow,
  SkillLibraryItemRow,
} from "@/hooks/useCareer";

interface CareerStatsHeaderProps {
  careerPaths: CareerPathRow[];
  skills: SkillRow[];
  careerPathSkills: CareerPathSkillRow[];
  skillCourses: SkillCourseRow[];
  skillMentors: SkillMentorRow[];
  skillLibraryItems: SkillLibraryItemRow[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function CareerStatsHeader({
  careerPaths,
  skills,
  careerPathSkills,
  skillCourses,
  skillMentors,
  skillLibraryItems,
  isLoading,
  onRefresh,
}: CareerStatsHeaderProps) {
  const publishedPaths = careerPaths.filter((p) => p.is_published).length;
  const publishedSkills = skills.filter((s) => s.is_published).length;

  const stats = [
    {
      title: "Career Pathways",
      count: careerPaths.length,
      subtitle: `${publishedPaths} Published`,
      icon: Briefcase,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Skills Inventory",
      count: skills.length,
      subtitle: `${publishedSkills} Published`,
      icon: Compass,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Career → Skill Links",
      count: careerPathSkills.length,
      subtitle: "Tiered Mappings",
      icon: Layers,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Skill → Course Links",
      count: skillCourses.length,
      subtitle: "Course Junctions",
      icon: BookOpen,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Skill → Mentor Links",
      count: skillMentors.length,
      subtitle: "Faculty Attribution",
      icon: Users,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Skill → Library Links",
      count: skillLibraryItems.length,
      subtitle: "Handbook Resources",
      icon: FileText,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Career & Skills CMS
            </h1>
            <Badge variant="success" className="text-xs">
              Live Database Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vocational pathways, industrial competencies, curriculum progression, and resource junctions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2 self-start sm:self-auto border-border/60 hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm hover:border-border transition-colors">
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground truncate" title={stat.title}>
                  {stat.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${stat.color}`}>
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black tracking-tight text-foreground">
                  {isLoading ? "—" : stat.count}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                  {stat.subtitle}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
