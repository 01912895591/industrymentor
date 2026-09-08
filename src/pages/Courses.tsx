
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { CourseModulesViewer } from "@/components/ui/CourseModulesViewer";
import courseReact from "@/assets/course-react.jpg";

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
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
    <div className="min-h-screen pt-16 pb-12 sm:pt-24 sm:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="text-2xl xs:text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            All <span className="text-primary">Courses</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm xs:text-base sm:text-lg text-muted-foreground">
            Explore our comprehensive catalog of industry-focused courses.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[400px] animate-pulse rounded-3xl bg-muted/20" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article
                key={c.title}
                className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/25 shadow-elev transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative">
                  <img
                    src={c.cover_image_path || courseReact}
                    alt={`Course cover image for ${c.title}`}
                    className="aspect-[3/2] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <div className="rounded-full bg-background/55 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
                      COURSE
                    </div>
                    {c.mode && (
                      <div className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold text-primary backdrop-blur uppercase">
                        {c.mode}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between text-[10px] sm:text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground sm:gap-2">
                      <Star className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
                      <span className="font-medium text-foreground">{(c.rating || 5.0).toFixed(1)}</span>
                      <span>({c.reviews || 0})</span>
                    </div>
                    <div className="text-primary/90">{c.badge_text || "Professional"}</div>
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight line-clamp-2 sm:text-xl">{c.title}</h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">{c.description}</p>
                  </div>

                  <div className="h-px bg-border/60" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold sm:text-sm">{c.instructor_heading || "Taught by Experts"}</div>
                      <div className="text-[10px] text-muted-foreground sm:text-xs">{c.instructor_subheading || "Industry Professionals"}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {c.old_price_cents && (
                        <div className="text-[12px] font-semibold text-red-500/80 line-through decoration-red-500/50 sm:text-sm">
                          ৳{(c.old_price_cents / 100).toFixed(0)}
                        </div>
                      )}
                      <div className="text-xl font-black tabular-nums sm:text-2xl">৳{(c.price_cents / 100).toFixed(0)}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col xs:grid xs:grid-cols-2 gap-3">
                    <div className="w-full">
                      <CourseModulesViewer courseId={c.id} courseTitle={c.title} />
                    </div>
                    <Button variant="hero" className="w-full px-2 text-[10px] sm:px-4 sm:text-sm" asChild>
                      <Link to={`/enroll/${c.id}`}>Enroll Now</Link>
                    </Button>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -inset-10 bg-gradient-brand opacity-15 blur-2xl" />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
