import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { CourseCard } from "@/components/courses/CourseCard";


export function FeaturedCoursesSection() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select(
            "id, title, slug, description, price_cents, old_price_cents, cover_image_path, mode, rating, reviews, badge_text, instructor_heading, instructor_subheading, published, created_at"
          )
          .eq("published", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadCourses();
  }, []);

  return (
    <section id="courses" className="scroll-mt-24 py-16 sm:py-24 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(56,189,248,0.15)] backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            PRACTICAL CURRICULUM
          </div>

          <div className="relative">
            {/* Ambient decorative glow behind heading */}
            <div
              className="pointer-events-none absolute left-1/2 -top-6 -translate-x-1/2 -z-10 h-36 w-80 sm:w-[26rem] rounded-full bg-primary/15 blur-3xl opacity-60"
              aria-hidden="true"
            />

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent inline-block">
                Featured
              </span>{" "}
              <span className="hero-gradient-text inline-block">
                Industrial Courses
              </span>
            </h2>
          </div>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Outcome-driven training programs focused on apparel merchandising, industrial engineering, and factory quality standards.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 animate-pulse rounded-lg bg-card/40 border border-border/60" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c.id || c.title} course={c} showEnrollButton={true} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button variant="soft" size="lg" asChild>
            <Link to="/courses">
              View All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
