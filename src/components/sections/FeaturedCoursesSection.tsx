import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import courseReact from "@/assets/course-react.jpg";
import courseDesign from "@/assets/course-design.jpg";
import courseData from "@/assets/course-data.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { CourseModulesViewer } from "../ui/CourseModulesViewer";


export function FeaturedCoursesSection() {
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
    <section id="courses" className="scroll-mt-24 py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Featured <span className="text-primary">Courses</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base xs:text-lg text-muted-foreground">
            Hand-picked topics to accelerate your career growth.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((c) => (
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
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{(c.rating || 5.0).toFixed(1)}</span>
                    <span>({c.reviews || 0})</span>
                  </div>
                  <div className="text-primary/90">{c.badge_text || "Professional"}</div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold tracking-tight line-clamp-2">{c.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                </div>

                <div className="h-px bg-border/60" />

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{c.instructor_heading || "Taught by Experts"}</div>
                    <div className="text-xs text-muted-foreground">{c.instructor_subheading || "Industry Professionals"}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    {c.old_price_cents && (
                      <div className="text-sm font-semibold text-red-500/80 line-through decoration-red-500/50">
                        ৳{(c.old_price_cents / 100).toFixed(0)}
                      </div>
                    )}
                    <div className="text-2xl font-black tabular-nums">৳{(c.price_cents / 100).toFixed(0)}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col xs:grid xs:grid-cols-2 gap-3">
                  <div className="w-full">
                    <CourseModulesViewer courseId={c.id} courseTitle={c.title} />
                  </div>
                  <Button variant="hero" className="w-full" asChild>
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
