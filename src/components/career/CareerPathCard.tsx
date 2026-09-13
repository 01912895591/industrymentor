import { LucideIcon, ArrowRight, BookOpen, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CareerPathItem {
  id: string;
  title: string;
  domain: string;
  icon: LucideIcon;
  description: string;
  practicalScope: string;
  skills: string[];
  courseCount: number;
  mentorCount: number;
}

interface CareerPathCardProps {
  pathway: CareerPathItem;
  isSelected?: boolean;
  onSelect?: (pathwayId: string) => void;
}

export function CareerPathCard({ pathway, isSelected = false, onSelect }: CareerPathCardProps) {
  const IconComponent = pathway.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border p-6 sm:p-7 transition-all duration-300 backdrop-blur-xl shadow-elev text-left",
        isSelected
          ? "border-primary bg-card/80 ring-1 ring-primary shadow-glow"
          : "border-border/60 bg-card/30 hover:border-border-active hover:bg-card/50 hover:shadow-lg"
      )}
    >
      <div className="space-y-4">
        {/* Top Meta Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-sm transition-transform duration-300 group-hover:scale-105">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 border-primary/30 text-primary bg-primary/5"
          >
            {pathway.domain}
          </Badge>
        </div>

        {/* Title & Practical Scope */}
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {pathway.title}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {pathway.description}
          </p>
        </div>

        {/* Practical Operational Focus */}
        <div className="rounded-2xl border border-border/40 bg-surface-2/40 p-3.5 space-y-1.5">
          <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Factory Floor Core Agenda:
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {pathway.practicalScope}
          </p>
        </div>

        {/* Verified Skills Grid */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Verified Competencies:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pathway.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-secondary/80 border border-border/60 text-secondary-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Verified Connections & Action CTA */}
      <div className="mt-6 pt-5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5" title={`${pathway.courseCount} Verified Course(s)`}>
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>
              {pathway.courseCount} {pathway.courseCount === 1 ? "Course" : "Courses"}
            </span>
          </div>
          <div className="flex items-center gap-1.5" title={`${pathway.mentorCount} Senior Practitioner Mentor(s)`}>
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>
              {pathway.mentorCount} {pathway.mentorCount === 1 ? "Mentor" : "Mentors"}
            </span>
          </div>
        </div>

        <Button
          variant={isSelected ? "cta" : "outline"}
          size="sm"
          onClick={() => onSelect?.(pathway.id)}
          className="w-full sm:w-auto text-xs font-bold gap-1.5 h-9"
        >
          {isSelected ? "Active Path" : "Explore Path"}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
