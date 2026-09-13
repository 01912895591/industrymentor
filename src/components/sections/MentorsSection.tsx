
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MentorCard, type Mentor } from "@/components/mentors/MentorCard";

export function MentorsSection() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMentors() {
      try {
        const { data, error } = await (supabase
          .from("mentors" as any) as any)
          .select("id, name, title, bio, initials, tags, linkedin_url, image_path, created_at")
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

  return (
    <section id="mentors" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6">
      <header className="text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
          VERIFIED INDUSTRY PRACTITIONERS
        </div>
        <h2 className="text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight text-foreground">
          Meet Our <span className="text-primary">Expert Mentors</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm xs:text-base text-muted-foreground">
          Learn directly from active factory general managers, industrial engineering heads, and quality specialists across Tier-1 garment manufacturing.
        </p>
      </header>

      {mentors.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-border/60 bg-card/30 p-8 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            Our network of textile and industrial engineering mentors is expanding. New verified profiles are being added.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Button variant="soft" size="lg" asChild>
          <Link to="/mentors">
            Explore All Mentors
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
