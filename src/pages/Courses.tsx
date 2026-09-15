import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CourseCard, type CourseData } from "@/components/courses/CourseCard";
import { formatCourseTitle } from "@/lib/formatTitle";
import { SEOHead } from "@/components/seo/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  BookOpen,
  AlertCircle,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";

export default function Courses() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("courses")
        .select(
          "id, title, slug, description, price_cents, old_price_cents, cover_image_path, mode, rating, reviews, badge_text, instructor_heading, instructor_subheading, published, created_at"
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setCourses((data || []) as CourseData[]);
    } catch (err: any) {
      console.error("Failed to load courses:", err);
      setError("Failed to load course catalog. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  // Compute unique filter options from actual data
  const availableModes = useMemo(() => {
    const modes = new Set<string>();
    (courses || []).forEach((c) => {
      if (c?.mode) modes.add(c.mode);
    });
    return Array.from(modes);
  }, [courses]);

  const availableLevels = useMemo(() => {
    const levels = new Set<string>();
    (courses || []).forEach((c) => {
      if (c?.badge_text) levels.add(c.badge_text);
    });
    return Array.from(levels);
  }, [courses]);

  // Filtered & Sorted courses
  const filteredCourses = useMemo(() => {
    return (courses || [])
      .filter((c) => {
        if (!c) return false;

        // Search query check
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleStr = c.title || "";
          const matchesTitle = titleStr.toLowerCase().includes(q) || formatCourseTitle(titleStr).toLowerCase().includes(q);
          const matchesDesc = c.description?.toLowerCase().includes(q) ?? false;
          const matchesInstructor =
            (c.instructor_heading?.toLowerCase().includes(q) ?? false) ||
            (c.instructor_subheading?.toLowerCase().includes(q) ?? false);
          const matchesBadge = c.badge_text?.toLowerCase().includes(q) ?? false;
          if (!matchesTitle && !matchesDesc && !matchesInstructor && !matchesBadge) {
            return false;
          }
        }

        // Mode filter
        if (selectedMode !== "all" && c.mode?.toLowerCase() !== selectedMode.toLowerCase()) {
          return false;
        }

        // Level filter
        if (selectedLevel !== "all" && c.badge_text?.toLowerCase() !== selectedLevel.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a?.price_cents) || 0;
        const priceB = Number(b?.price_cents) || 0;
        if (sortBy === "price-asc") {
          return priceA - priceB;
        }
        if (sortBy === "price-desc") {
          return priceB - priceA;
        }
        return 0; // Default creation order preserved
      });
  }, [courses, searchQuery, selectedMode, selectedLevel, sortBy]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMode("all");
    setSelectedLevel("all");
    setSortBy("default");
  };

  const isFiltered = searchQuery !== "" || selectedMode !== "all" || selectedLevel !== "all" || sortBy !== "default";

  return (
    <div className="min-h-screen py-12 sm:py-16">
      <SEOHead
        title="IndustryMentor Courses | Practical Industry Learning"
        description="Outcome-driven training programs focused on apparel merchandising, industrial engineering, and factory quality standards."
        canonicalUrl="https://industrymentor.net/courses"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Page Header */}
        <header className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
            PRACTICAL INDUSTRY CURRICULUM
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Build Skills That Work in the <span className="text-primary">Real Industry</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
            Direct training from factory heads, industrial engineers, and quality specialists. Master garment merchandising, production efficiency, and floor execution with verified credentials.
          </p>
        </header>

        {/* Discovery Control Bar: Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            
            {/* Search Input */}
            <div className="relative sm:col-span-6 lg:col-span-5">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses by topic, mentor, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 bg-card/60 border-border/70 text-foreground placeholder:text-muted-foreground/60 h-10 rounded-lg focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mode Filter */}
            {availableModes.length > 0 && (
              <div className="sm:col-span-3 lg:col-span-3">
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border/70 bg-card/60 px-3 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Filter by delivery mode"
                >
                  <option value="all">All Delivery Modes</option>
                  {availableModes.map((m) => (
                    <option key={m} value={m}>
                      {m.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Sort Filter */}
            <div className="sm:col-span-3 lg:col-span-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 w-full rounded-lg border border-border/70 bg-card/60 px-3 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Sort courses"
              >
                <option value="default">Sort: Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Level Filter Chips */}
          {availableLevels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                Level:
              </span>
              <button
                type="button"
                onClick={() => setSelectedLevel("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedLevel === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-2 text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                All Levels
              </button>
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedLevel === lvl
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                  {lvl}
                </button>
              ))}

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 ml-auto"
                >
                  <X className="mr-1 h-3 w-3" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results Counter */}
        {!loading && !error && (
          <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground border-b border-border/40 pb-3">
            <span>
              Showing <strong className="text-foreground">{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "course" : "courses"}
            </span>
            {isFiltered && (
              <span className="text-primary font-medium">Filtered results active</span>
            )}
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[440px] animate-pulse rounded-lg bg-card/40 border border-border/60 p-6 space-y-4"
              >
                <div className="aspect-[16/10] w-full rounded bg-muted/30" />
                <div className="h-4 w-1/3 rounded bg-muted/40" />
                <div className="h-6 w-3/4 rounded bg-muted/40" />
                <div className="h-12 w-full rounded bg-muted/20" />
                <div className="h-8 w-full rounded bg-muted/30 mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center max-w-md mx-auto my-12">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-3" />
            <h3 className="text-base font-bold text-foreground">Catalog Unavailable</h3>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            <Button variant="hero" size="sm" onClick={() => void loadCourses()} className="mt-4 text-xs">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State (No Matches) */}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="rounded-lg border border-border/70 bg-card/40 p-12 text-center max-w-md mx-auto my-12">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Courses Found</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              We couldn't find any courses matching your specific search or filter criteria.
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="mt-5 text-xs">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Course Grid */}
        {!loading && !error && filteredCourses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} showEnrollButton={true} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
