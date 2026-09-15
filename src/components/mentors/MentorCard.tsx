import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Linkedin, ArrowRight, ShieldCheck } from "lucide-react";

export interface Mentor {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  initials: string | null;
  tags: string[] | null;
  linkedin_url: string | null;
  image_path: string | null;
  created_at?: string;
}

interface MentorCardProps {
  mentor: Mentor;
  className?: string;
}

export function MentorCard({ mentor, className = "" }: MentorCardProps) {
  const initials = mentor.initials || mentor.name.slice(0, 2).toUpperCase() || "IM";

  return (
    <Card
      variant="interactive"
      className={`flex flex-col justify-between text-center p-6 sm:p-7 rounded-xl border-border/60 bg-card/40 hover:bg-card/60 transition-all shadow-sm hover:shadow-md ${className}`}
    >
      <div>
        {/* Mentor Photo / Avatar */}
        <div className="relative mx-auto mb-4 h-24 w-24 shrink-0 overflow-hidden rounded-full border border-border/80 ring-2 ring-primary/20 bg-surface-2 shadow-sm group">
          {mentor.image_path ? (
            <img
              src={mentor.image_path}
              alt={mentor.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10">
              <span className="text-2xl font-black text-primary">{initials}</span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-background border border-border/80 ring-1 ring-primary/30 flex items-center justify-center text-primary" title="Verified Industry Mentor">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Name & Title */}
        <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug line-clamp-1">
          {mentor.name}
        </h3>
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1 line-clamp-1">
          {mentor.title}
        </p>

        {/* Expertise Tags */}
        {mentor.tags && mentor.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3 mb-4">
            {mentor.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] font-mono px-2 py-0.5 bg-secondary/60 text-secondary-foreground"
              >
                {tag}
              </Badge>
            ))}
            {mentor.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0.5 text-muted-foreground"
              >
                +{mentor.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Professional Bio Summary */}
        {mentor.bio && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-6">
            {mentor.bio}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-border/50 flex items-center gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1 font-semibold text-xs h-9 hover:border-primary/50 hover:text-primary">
          <Link to={`/mentors/${mentor.id}`}>
            View Profile
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>

        {mentor.linkedin_url && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-9 px-2.5 text-muted-foreground hover:text-primary"
            title={`${mentor.name} LinkedIn Profile`}
          >
            <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
