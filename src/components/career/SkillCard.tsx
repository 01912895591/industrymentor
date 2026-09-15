import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, ArrowUpRight, Sparkles, FileText } from "lucide-react";

export interface SkillItem {
  id: string;
  name: string;
  domain: string;
  domainId: string;
  context: string;
  courseId?: string;
  courseTitle?: string;
  mentorId?: string;
  mentorName?: string;
  libraryTitle?: string;
}

interface SkillCardProps {
  skill: SkillItem;
}

export function SkillCard({ skill }: SkillCardProps) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card/30 p-5 sm:p-6 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-border-active hover:bg-card/50 transition-all duration-200 flex flex-col justify-between text-left">
      <div className="space-y-3.5">
        {/* Domain Badge & Icon */}
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] font-mono tracking-wider px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 uppercase"
          >
            {skill.domain}
          </Badge>
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-primary">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Skill Name */}
        <div>
          <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {skill.name}
          </h4>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {skill.context}
          </p>
        </div>

        {/* Real Connected Relationships */}
        <div className="pt-2 space-y-2 text-xs border-t border-border/40">
          {skill.courseTitle && skill.courseId && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-foreground/80 block">Curriculum Connection:</span>
                <Link
                  to={`/courses/${skill.courseId}`}
                  className="text-xs text-primary hover:underline font-medium line-clamp-1"
                >
                  {skill.courseTitle}
                </Link>
              </div>
            </div>
          )}

          {skill.mentorName && skill.mentorId && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-foreground/80 block">Expert Practitioner:</span>
                <Link
                  to={`/mentors/${skill.mentorId}`}
                  className="text-xs text-primary hover:underline font-medium line-clamp-1"
                >
                  {skill.mentorName}
                </Link>
              </div>
            </div>
          )}

          {skill.libraryTitle && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-semibold text-foreground/80 block">Standard Library Reference:</span>
                <span className="text-xs text-foreground/90 font-medium line-clamp-1">
                  {skill.libraryTitle}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-border/40">
        {skill.courseId ? (
          <Button variant="outline" size="sm" asChild className="w-full text-xs font-semibold h-8 gap-1.5 justify-between">
            <Link to={`/courses/${skill.courseId}`}>
              <span>Learn in Course</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            </Link>
          </Button>
        ) : skill.mentorId ? (
          <Button variant="outline" size="sm" asChild className="w-full text-xs font-semibold h-8 gap-1.5 justify-between">
            <Link to={`/mentors/${skill.mentorId}`}>
              <span>Consult Mentor</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild className="w-full text-xs text-muted-foreground h-8 justify-between">
            <Link to="/courses">
              <span>Explore Curriculum</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
