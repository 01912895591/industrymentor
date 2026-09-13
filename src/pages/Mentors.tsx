import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MentorCard, type Mentor } from "@/components/mentors/MentorCard";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, Users, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export default function Mentors() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("all");


  const fetchMentors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await (supabase as any)
        .from("mentors")
        .select("id, name, title, bio, initials, tags, linkedin_url, image_path, created_at")
        .order("created_at", { ascending: true });

      if (fetchErr) throw fetchErr;
      setMentors(data || []);
    } catch (err: any) {
      console.error("Error fetching mentors:", err);
      setError("Unable to load industry mentors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMentors();
  }, []);

  // Collect all distinct expertise tags from real data
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    mentors.forEach((m) => {
      if (Array.isArray(m.tags)) {
        m.tags.forEach((t) => {
          if (t && typeof t === "string") {
            tagSet.add(t.trim());
          }
        });
      }
    });
    return Array.from(tagSet);
  }, [mentors]);

  // Filtered mentors based on search query and selected tag
  const filteredMentors = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return mentors.filter((m) => {
      // 1. Tag filter
      if (selectedTag !== "all") {
        const matchesTag = Array.isArray(m.tags) && m.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
        if (!matchesTag) return false;
      }

      // 2. Search query filter
      if (!query) return true;

      const nameMatch = m.name?.toLowerCase().includes(query);
      const titleMatch = m.title?.toLowerCase().includes(query);
      const bioMatch = m.bio?.toLowerCase().includes(query);
      const tagsMatch = Array.isArray(m.tags) && m.tags.some((t) => t.toLowerCase().includes(query));

      return nameMatch || titleMatch || bioMatch || tagsMatch;
    });
  }, [mentors, searchQuery, selectedTag]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedTag("all");
  };

  return (
    <main className="min-h-screen bg-background text-foreground py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="IndustryMentor Mentors | Learn From Industry Practitioners"
        description="Connect with verified industry mentors and practitioners in garment manufacturing, industrial engineering, and supply chain."
        canonicalUrl="https://industrymentor.net/mentors"
      />
      <div className="mx-auto max-w-7xl space-y-12">
        {/* Header Section */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED INDUSTRY PRACTITIONERS
          </div>

          <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black tracking-tight text-foreground">
            Learn From People Who&apos;ve Done the Work.
          </h1>

          <p className="text-sm xs:text-base text-muted-foreground leading-relaxed">
            Direct, practitioner-led guidance from factory general managers, industrial engineering heads, and quality specialists across Tier-1 garment manufacturing.
          </p>
        </header>

        {/* Search & Filter Controls */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by mentor name, role, or technical discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-2xl border-border/70 bg-card/40 focus-visible:ring-primary text-sm"
              aria-label="Search mentors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Specialization Tags Filter Chips */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground font-semibold mr-1">Specialization:</span>
              <button
                type="button"
                onClick={() => setSelectedTag("all")}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all border ${
                  selectedTag === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card/70"
                }`}
              >
                All Specializations
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold transition-all border ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-card/70"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Directory Content Area */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-border/60 bg-card/25 p-7 flex flex-col items-center text-center space-y-4 shadow-elev"
              >
                <div className="h-24 w-24 rounded-full bg-muted/30 animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-muted/30 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-muted/20 animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-5 w-16 rounded-full bg-muted/20 animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-muted/20 animate-pulse" />
                </div>
                <div className="h-16 w-full rounded bg-muted/15 animate-pulse" />
                <div className="h-9 w-full rounded-lg bg-muted/30 animate-pulse pt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12 rounded-3xl border border-border/60 bg-card/30 p-8 max-w-md mx-auto space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMentors} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        ) : filteredMentors.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 rounded-3xl border border-dashed border-border/70 bg-card/25 p-8 max-w-md mx-auto space-y-4">
            <Users className="h-12 w-12 text-muted-foreground/60 mx-auto" />
            <h2 className="text-base font-bold text-foreground">No Mentors Found</h2>
            <p className="text-xs text-muted-foreground">
              We couldn&apos;t find any mentors matching &quot;{searchQuery || selectedTag}&quot;. Try adjusting your search term or filter selection.
            </p>
            <Button variant="soft" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          /* Mentors Grid */
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold mb-4 px-1">
              <span>Showing {filteredMentors.length} Verified {filteredMentors.length === 1 ? "Mentor" : "Mentors"}</span>
              {(searchQuery || selectedTag !== "all") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-primary hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map((m) => (
                <MentorCard key={m.id} mentor={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
