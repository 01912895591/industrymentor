
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Linkedin, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Mentor = {
  id: string;
  name: string;
  title: string;
  tags: string[] | null;
  bio: string | null;
  initials: string | null;
  image_path: string | null;
  linkedin_url: string | null;
};

export function MentorsSection() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const { data, error } = await (supabase
          .from("mentors" as any) as any)
          .select("*")
          .order("created_at", { ascending: true })
          .limit(3);

        if (error) throw error;
        if (data && data.length > 0) {
          setMentors(data as Mentor[]);
        }
      } catch (err) {
        console.error("Error fetching mentors:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMentors();
  }, []);

  if (loading) {
    return (
      <section id="mentors" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  const displayMentors = mentors.length > 0 ? mentors : [
    {
      id: "demo-1",
      name: "Sarah Jenkins",
      title: "Senior Software Engineer",
      tags: ["React", "Node.js", "System Design"],
      bio: "10+ years building scalable applications at high-growth teams.",
      initials: "SJ",
      image_path: null,
      linkedin_url: "#"
    },
    {
      id: "demo-2",
      name: "Mike Ross",
      title: "Product Design Lead",
      tags: ["UI/UX", "Design Systems", "Figma"],
      bio: "Award‑winning designer focused on elegant, usable interfaces.",
      initials: "MR",
      image_path: null,
      linkedin_url: "#"
    },
    {
      id: "demo-3",
      name: "Dr. Alan Grant",
      title: "Data Science Director",
      tags: ["Machine Learning", "Python", "AI"],
      bio: "PhD in CS specializing in practical ML for business outcomes.",
      initials: "AG",
      image_path: null,
      linkedin_url: "#"
    },
  ];

  return (
    <section id="mentors" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-12 sm:py-20 lg:py-24 sm:px-6">
      <header className="text-center mb-10 sm:mb-16">
        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight mb-4">
          Meet Our <span className="text-primary italic">Expert Mentors</span>
        </h2>
        <p className="mx-auto max-w-2xl text-sm xs:text-base text-muted-foreground font-medium">
          Learn from industry leaders who have walked the path and are passionate about guiding the next generation of
          professionals.
        </p>
      </header>

      <div className="grid gap-6 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
        {displayMentors.map((m) => (
          <Card key={m.id} className="group relative pt-10 sm:pt-12 text-center overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-primary/10 bg-card/40 shadow-xl hover:shadow-glow transition-all duration-500 hover:-translate-y-2">
            {/* Circular Image - Scaled down */}
            <div className="mx-auto mb-4 sm:mb-6 relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-full border-4 border-primary/10 bg-muted shadow-2xl transition-transform duration-500 group-hover:scale-105">
              {m.image_path ? (
                <img
                  src={m.image_path}
                  alt={m.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-black text-primary/20">{m.initials}</span>
                </div>
              )}

              {/* Subtle shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            {/* Content Area */}
            <div className="px-4 pb-8 sm:px-6 sm:pb-10">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">{m.name}</h3>
                <p className="text-primary font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1">{m.title}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 mb-4 sm:mb-6">
                {m.tags?.map((t) => (
                  <Badge key={t} variant="outline" className="rounded-full px-2 py-0 sm:px-3 border-primary/30 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary">
                    {t}
                  </Badge>
                ))}
              </div>

              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-6 font-medium">
                {m.bio}
              </p>

              <Button variant="hero" size="sm" className="rounded-xl gap-2 px-5 sm:px-6 shadow-md hover:shadow-glow transition-all" asChild>
                <a href={m.linkedin_url || "#"} target="_blank" rel="noopener noreferrer" onClick={(e) => !m.linkedin_url && e.preventDefault()}>
                  <Linkedin className="h-3.5 w-3.5" />
                  Connect
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-20 flex justify-center">
        <Button variant="soft" size="lg" className="rounded-xl group" asChild>
          <Link to="/mentors">
            Meet All Mentors
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
