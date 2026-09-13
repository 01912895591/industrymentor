import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  X,
  Clock,
  Briefcase,
  Layers,
  ArrowRight,
  Sparkles,
  RotateCcw,
  AlertCircle,
  FolderKanban,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublishedProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectCardSkeleton } from "@/components/projects/ProjectCardSkeleton";

type SortOption = "order_index" | "newest" | "title_asc" | "title_desc";

export default function Projects() {
  const { data: projects = [], isLoading, isError, refetch } = usePublishedProjects();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [careerPathFilter, setCareerPathFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("order_index");

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute unique domains from published projects
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.domain) set.add(p.domain);
    });
    return Array.from(set).sort();
  }, [projects]);

  // Compute unique career paths from published projects
  const availableCareerPaths = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => {
      p.career_paths?.forEach((cp) => {
        if (cp.id && cp.title) {
          map.set(cp.id, cp.title);
        }
      });
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [projects]);

  // Filter and sort published projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search filter
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase().trim();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesDesc = p.short_description?.toLowerCase().includes(q) ?? false;
          const matchesDomain = p.domain?.toLowerCase().includes(q) ?? false;
          if (!matchesTitle && !matchesDesc && !matchesDomain) return false;
        }

        // Difficulty filter
        if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) {
          return false;
        }

        // Domain filter
        if (domainFilter !== "all" && p.domain !== domainFilter) {
          return false;
        }

        // Career Path filter
        if (careerPathFilter !== "all") {
          const matchesPath = p.career_paths?.some((cp) => cp.id === careerPathFilter);
          if (!matchesPath) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "title_asc":
            return a.title.localeCompare(b.title);
          case "title_desc":
            return b.title.localeCompare(a.title);
          case "order_index":
          default:
            if (a.order_index !== b.order_index) {
              return a.order_index - b.order_index;
            }
            return a.title.localeCompare(b.title);
        }
      });
  }, [projects, debouncedSearch, difficultyFilter, domainFilter, careerPathFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setDifficultyFilter("all");
    setDomainFilter("all");
    setCareerPathFilter("all");
    setSortBy("order_index");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    difficultyFilter !== "all" ||
    domainFilter !== "all" ||
    careerPathFilter !== "all" ||
    sortBy !== "order_index";

  return (
    <div className="min-h-screen py-12 sm:py-16">
      <SEOHead
        title="IndustryMentor Projects | Practical Industry Experience"
        description="Solve real-world industrial and factory execution challenges with verified deliverables and mentor reviews."
        canonicalUrl="https://industrymentor.net/projects"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero Section */}
        <header className="mb-12 sm:mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            PRACTICAL INDUSTRY PROJECTS
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight">
            Build Skills Through <span className="text-primary">Real Industry Problems</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
            Bridge academic theory and factory execution. Solve authentic industrial engineering,
            garment merchandising, and factory compliance challenges designed by seasoned floor leaders
            to build your professional portfolio.
          </p>
        </header>

        {/* Discovery Toolbar: Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="relative sm:col-span-2 lg:col-span-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects by title, keyword, domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 bg-card/60 border-border/70 text-foreground placeholder:text-muted-foreground/60 h-10 rounded-lg focus-visible:ring-primary text-sm"
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

            {/* Difficulty Filter */}
            <div className="lg:col-span-2">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="h-10 bg-card/60 border-border/70 text-xs sm:text-sm">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Difficulties
                  </SelectItem>
                  <SelectItem value="Foundational" className="text-xs sm:text-sm">
                    Foundational
                  </SelectItem>
                  <SelectItem value="Intermediate" className="text-xs sm:text-sm">
                    Intermediate
                  </SelectItem>
                  <SelectItem value="Advanced" className="text-xs sm:text-sm">
                    Advanced
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Domain Filter (populated dynamically from published projects) */}
            <div className="lg:col-span-2">
              <Select
                value={domainFilter}
                onValueChange={setDomainFilter}
                disabled={availableDomains.length === 0}
              >
                <SelectTrigger className="h-10 bg-card/60 border-border/70 text-xs sm:text-sm">
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Domains
                  </SelectItem>
                  {availableDomains.map((dom) => (
                    <SelectItem key={dom} value={dom} className="text-xs sm:text-sm">
                      {dom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Career Path Filter */}
            <div className="lg:col-span-2">
              <Select
                value={careerPathFilter}
                onValueChange={setCareerPathFilter}
                disabled={availableCareerPaths.length === 0}
              >
                <SelectTrigger className="h-10 bg-card/60 border-border/70 text-xs sm:text-sm">
                  <SelectValue placeholder="Career Track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">
                    All Career Tracks
                  </SelectItem>
                  {availableCareerPaths.map((cp) => (
                    <SelectItem key={cp.id} value={cp.id} className="text-xs sm:text-sm">
                      {cp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Dropdown */}
            <div className="lg:col-span-2">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                <SelectTrigger className="h-10 bg-card/60 border-border/70 text-xs sm:text-sm">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_index" className="text-xs sm:text-sm">
                    Display Order
                  </SelectItem>
                  <SelectItem value="newest" className="text-xs sm:text-sm">
                    Newest First
                  </SelectItem>
                  <SelectItem value="title_asc" className="text-xs sm:text-sm">
                    A – Z
                  </SelectItem>
                  <SelectItem value="title_desc" className="text-xs sm:text-sm">
                    Z – A
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filter Bar & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span>{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
              {projects.length > 0 && ` (of ${projects.length} available)`}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        ) : isError ? (
          <Card className="bg-card/40 backdrop-blur-xl border border-destructive/30 rounded-2xl p-8 text-center max-w-xl mx-auto">
            <CardContent className="space-y-4 p-0">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Failed to Load Projects</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We encountered an issue retrieving the practical projects catalog. Please verify
                  your connection and try again.
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          /* Empty State: 0 Published Projects in Master Database */
          <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-sm">
            <CardContent className="space-y-6 p-0">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary">
                <FolderKanban className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  Practical Projects Coming Soon
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  IndustryMentor is preparing factory-tested practical projects covering garment
                  merchandising, industrial engineering line balancing, and quality compliance. Authentic
                  challenges will be published here shortly.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button variant="default" asChild className="font-semibold gap-1.5 shadow-sm">
                  <Link to="/courses">
                    <BookOpen className="h-4 w-4" />
                    Explore Courses
                  </Link>
                </Button>
                <Button variant="outline" asChild className="gap-1.5 border-border/70">
                  <Link to="/career">
                    <Layers className="h-4 w-4" />
                    View Career Pathways
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          /* Empty State: Filters Returned 0 Results */
          <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl p-10 text-center max-w-lg mx-auto">
            <CardContent className="space-y-4 p-0">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground border border-border/50">
                <Filter className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">No Matching Projects</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No projects match your current search and filter selections. Try adjusting or
                  clearing your filters to see more projects.
                </p>
              </div>
              <Button onClick={handleResetFilters} variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
