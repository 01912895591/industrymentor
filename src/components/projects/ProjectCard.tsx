import { Link } from "react-router-dom";
import { Clock, ArrowRight, Star, Briefcase, ChevronRight, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProjectWithRelations } from "@/types/projects";

interface ProjectCardProps {
  project: ProjectWithRelations;
}

export function ProjectCard({ project }: ProjectCardProps) {
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

  const primarySkills = (project.skills || []).filter((s) => s.is_primary);
  const otherSkills = (project.skills || []).filter((s) => !s.is_primary);
  const primaryCareerPath = project.career_paths && project.career_paths.length > 0 ? project.career_paths[0] : null;

  return (
    <Card className="flex flex-col h-full bg-card/40 backdrop-blur-xl border border-border/60 hover:border-primary/50 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-elev group">
      <CardContent className="p-6 flex flex-col flex-1">
        {/* Top Badges: Domain & Difficulty */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {project.domain ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Briefcase className="h-3 w-3" />
              {project.domain}
            </span>
          ) : (
            <span />
          )}

          {project.difficulty && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyVariant(
                project.difficulty
              )}`}
            >
              {project.difficulty}
            </span>
          )}
        </div>

        {/* Project Title */}
        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
          <Link to={`/projects/${project.slug}`} className="focus:outline-none focus:underline">
            {project.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
          {project.short_description}
        </p>

        {/* Associated Career Path */}
        {primaryCareerPath && (
          <div className="mb-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Layers className="h-3.5 w-3.5 text-primary/80" />
              Track:{" "}
              <Link
                to="/career"
                className="text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                {primaryCareerPath.title}
              </Link>
            </span>
          </div>
        )}

        {/* Primary Skills */}
        {primarySkills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {primarySkills.slice(0, 3).map((skill) => (
                <span
                  key={skill.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                >
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  {skill.title}
                </span>
              ))}
              {primarySkills.length > 3 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] text-muted-foreground bg-muted/40 border border-border/40">
                  +{primarySkills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Card Footer: Estimated Hours & View Project CTA */}
        <div className="pt-4 mt-auto border-t border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>
              {project.estimated_hours ? `${project.estimated_hours} hrs estimated` : "Self-paced"}
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs font-semibold gap-1 text-primary hover:text-primary-foreground hover:bg-primary transition-all group/btn"
            asChild
          >
            <Link to={`/projects/${project.slug}`}>
              <span>View Project</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
