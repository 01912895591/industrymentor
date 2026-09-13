import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  Compass,
  Factory,
  Layers,
  Award,
  BookOpen,
  Users,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Filter,
  RefreshCw,
  Target,
  Briefcase,
  Wrench,
  ShieldCheck,
  Database as DatabaseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CareerPathCard, type CareerPathItem } from "@/components/career/CareerPathCard";
import { SkillCard, type SkillItem } from "@/components/career/SkillCard";
import { CourseCard, type CourseData } from "@/components/courses/CourseCard";
import { MentorCard, type Mentor } from "@/components/mentors/MentorCard";
import {
  useCareerPaths,
  useSkills,
  useCareerPathSkills,
  useSkillCourses,
  useSkillMentors,
  useSkillLibraryItems,
} from "@/hooks/useCareer";

// 7-Step Pedagogical Career Learning Journey Framework
const LEARNING_JOURNEY_STEPS = [
  {
    step: "01",
    title: "Discover Career",
    subtitle: "Identify Industrial Arena",
    desc: "Map your engineering, management, or quality aspirations to high-demand factory disciplines.",
    icon: Compass,
  },
  {
    step: "02",
    title: "Identify Skills",
    subtitle: "Map Required Competencies",
    desc: "Audit specific operational capabilities demanded on modern export production floors.",
    icon: Target,
  },
  {
    step: "03",
    title: "Learn Curriculum",
    subtitle: "SOP-Grounded Training",
    desc: "Study comprehensive technical modules built by practicing factory heads and technical leads.",
    icon: BookOpen,
  },
  {
    step: "04",
    title: "Practice On-Floor",
    subtitle: "Real Factory Calculations",
    desc: "Execute actual line balancing, SMV time studies, buyer TNA calendars, and AQL audit sheets.",
    icon: Wrench,
  },
  {
    step: "05",
    title: "Get Mentored",
    subtitle: "Direct Advisory",
    desc: "Submit factory floor challenges and receive structured feedback from seasoned industry practitioners.",
    icon: Users,
  },
  {
    step: "06",
    title: "Build Portfolio",
    subtitle: "Evidence of Competence",
    desc: "Assemble documented coursework, line study reports, and audit assessments proving capability.",
    icon: Briefcase,
  },
  {
    step: "07",
    title: "Advance Professionally",
    subtitle: "Recognized Credential",
    desc: "Graduate with authenticated credentials and practical expertise respected by factory management.",
    icon: Award,
  },
];

// Verified Editorial Baseline Pathways (Used as resilient fallback)
const EDITORIAL_CAREER_PATHWAYS: CareerPathItem[] = [
  {
    id: "garment-merchandising-supply-execution",
    title: "Garment Merchandising & Supply Execution",
    domain: "Merchandising",
    icon: Briefcase,
    description:
      "Master end-to-end apparel merchandising from initial buyer tech-pack inquiry to critical order-to-shipment delivery.",
    practicalScope:
      "TNA calendar management, consumption calculations, buyer correspondence, sample approval follow-up, and production scheduling.",
    skills: [
      "Order-to-Shipment Execution & TNA",
      "Buyer Negotiation & Costing Breakdown",
    ],
    courseCount: 1,
    mentorCount: 1,
  },
  {
    id: "industrial-engineering-production-systems",
    title: "Industrial Engineering & Production Systems",
    domain: "Industrial Engineering",
    icon: Factory,
    description:
      "Lead high-efficiency sewing lines, balance operational bottlenecks, and implement data-driven production optimization.",
    practicalScope:
      "Standard Minute Value (SMV) studies, method analysis, Lean 5S implementation, Kaizen line balancing, and automated Excel reporting.",
    skills: [
      "Lean Six Sigma & Kaizen Workflows (LSSBB)",
      "Standard Minute Value (SMV) & Line Balancing",
      "Advanced Excel Production Analytics",
      "3D Drawing & Technical Layouts",
      "Executive KPI Thinking & AI Tools",
    ],
    courseCount: 1,
    mentorCount: 2,
  },
  {
    id: "garment-quality-assurance-factory-compliance",
    title: "Garment Quality Assurance & Factory Compliance",
    domain: "Quality Assurance",
    icon: ShieldCheck,
    description:
      "Transition from reactive defect inspection into proactive, systemic defect prevention and international buyer compliance.",
    practicalScope:
      "Inline and endline audit protocols, AQL sampling inspection standards, root cause defect analysis, and factory SOP governance.",
    skills: [
      "Defect Elimination & AQL Inspection Protocols",
      "Factory Floor Quality SOP Governance",
    ],
    courseCount: 1,
    mentorCount: 1,
  },
];

// Verified Editorial Baseline Skills (Used as resilient fallback)
const EDITORIAL_SKILLS_INVENTORY: SkillItem[] = [
  {
    id: "order-to-shipment-execution-tna",
    name: "Order-to-Shipment Execution & TNA",
    domain: "Merchandising",
    domainId: "merchandising",
    context:
      "Execution of Time & Action calendars, tracking order milestones, fabric in-house coordination, and shipment dispatch.",
    courseId: "e373dcce-54fb-4a55-8070-54543691fedb",
    courseTitle: "Garments Merchandising-from-order-to-shipment-excellence",
    mentorId: "f10828d2-3877-4c2f-a94b-130f39a75df1",
    mentorName: "M A QAIYUM TALUKDER",
    libraryTitle: "The Essentials of Supply Chain Management",
  },
  {
    id: "buyer-negotiation-costing-breakdown",
    name: "Buyer Negotiation & Costing Breakdown",
    domain: "Merchandising",
    domainId: "merchandising",
    context:
      "Accurate CM (Cost of Making) calculations, trim and fabric consumption estimation, and structured buyer correspondence.",
    courseId: "e373dcce-54fb-4a55-8070-54543691fedb",
    courseTitle: "Garments Merchandising-from-order-to-shipment-excellence",
    libraryTitle: "The Essentials of Supply Chain Management",
  },
  {
    id: "lean-six-sigma-kaizen-workflows",
    name: "Lean Six Sigma & Kaizen Workflows (LSSBB)",
    domain: "Industrial Engineering",
    domainId: "industrial-engineering",
    context:
      "Eliminating non-value-added operations, continuous improvement, and 5S workplace organization on manufacturing lines.",
    courseId: "6c926dde-3139-475b-88b1-4bed05f69dda",
    courseTitle: "Certified Elite-Performing Executive",
    mentorId: "f10828d2-3877-4c2f-a94b-130f39a75df1",
    mentorName: "M A QAIYUM TALUKDER",
    libraryTitle: "Lean six sigma & KAIZEN METHODS",
  },
  {
    id: "smv-line-balancing",
    name: "Standard Minute Value (SMV) & Line Balancing",
    domain: "Industrial Engineering",
    domainId: "industrial-engineering",
    context:
      "Time study measurement, allowance factor calculation, bottleneck resolution, and sewing pitch time optimization.",
    courseId: "6c926dde-3139-475b-88b1-4bed05f69dda",
    courseTitle: "Certified Elite-Performing Executive",
    mentorId: "a09cabea-b9e2-4b19-8f33-3fe793f20cf8",
    mentorName: "Engr. Mehedi Hasan",
    libraryTitle: "KAIZEN METHODS",
  },
  {
    id: "advanced-excel-production-analytics",
    name: "Advanced Excel Production Analytics",
    domain: "Industrial Engineering",
    domainId: "industrial-engineering",
    context:
      "Automating daily production reports, efficiency variance tracking, and operator performance data visualization.",
    courseId: "6c926dde-3139-475b-88b1-4bed05f69dda",
    courseTitle: "Certified Elite-Performing Executive",
    mentorId: "a09cabea-b9e2-4b19-8f33-3fe793f20cf8",
    mentorName: "Engr. Mehedi Hasan",
  },
  {
    id: "3d-drawing-technical-layouts",
    name: "3D Drawing & Technical Layouts",
    domain: "Industrial Engineering",
    domainId: "industrial-engineering",
    context:
      "Technical operational sketches, workstation ergonomics, and production line machinery layouts in 3D.",
    mentorId: "a09cabea-b9e2-4b19-8f33-3fe793f20cf8",
    mentorName: "Engr. Mehedi Hasan",
  },
  {
    id: "executive-kpi-thinking-ai-tools",
    name: "Executive KPI Thinking & AI Tools",
    domain: "Industrial Engineering",
    domainId: "industrial-engineering",
    context:
      "Leveraging generative AI and data metrics to drive strategic decision making and senior factory management alignment.",
    courseId: "6c926dde-3139-475b-88b1-4bed05f69dda",
    courseTitle: "Certified Elite-Performing Executive",
    mentorId: "f10828d2-3877-4c2f-a94b-130f39a75df1",
    mentorName: "M A QAIYUM TALUKDER",
  },
  {
    id: "defect-elimination-aql-inspection",
    name: "Defect Elimination & AQL Inspection Protocols",
    domain: "Quality Assurance",
    domainId: "quality-assurance",
    context:
      "Systematic root cause defect prevention, AQL 2.5/4.0 sampling tables, inline traffic light systems, and buyer compliance.",
    courseId: "4cde3695-c539-465e-830b-48eed5e46a36",
    courseTitle: "Industrial Garment Quality Certification Course",
    mentorId: "9e5c8522-0e03-46e9-8056-96b5358b40f9",
    mentorName: "Mrs Meng",
  },
  {
    id: "factory-floor-quality-sop-governance",
    name: "Factory Floor Quality SOP Governance",
    domain: "Quality Assurance",
    domainId: "quality-assurance",
    context:
      "Establishing standard operating procedures (SOPs) for cutting, sewing, finishing, and packaging to meet global buyer audits.",
    courseId: "4cde3695-c539-465e-830b-48eed5e46a36",
    courseTitle: "Industrial Garment Quality Certification Course",
    mentorId: "9e5c8522-0e03-46e9-8056-96b5358b40f9",
    mentorName: "Mrs Meng",
  },
];

const DOMAINS = [
  { id: "all", label: "All Domains" },
  { id: "merchandising", label: "Garment Merchandising" },
  { id: "industrial-engineering", label: "Industrial Engineering" },
  { id: "quality-assurance", label: "Quality Assurance" },
];

export default function Career() {
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Fetch Dynamic Database Entities using React Query hooks
  const { data: dbCareerPaths, isLoading: loadingPaths } = useCareerPaths();
  const { data: dbSkills, isLoading: loadingSkills } = useSkills();
  const { data: dbPathSkills } = useCareerPathSkills();
  const { data: dbSkillCourses } = useSkillCourses();
  const { data: dbSkillMentors } = useSkillMentors();
  const { data: dbSkillLibrary } = useSkillLibraryItems();

  // 2. Fetch Live Courses, Mentors, and Library Handbooks
  const {
    data: courses = [],
    isLoading: loadingCourses,
    error: errorCourses,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["courses", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as CourseData[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: mentors = [],
    isLoading: loadingMentors,
    refetch: refetchMentors,
  } = useQuery({
    queryKey: ["mentors", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as Mentor[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: libraryItems = [] } = useQuery({
    queryKey: ["library_items", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("id, title")
        .eq("published", true);
      if (error) return [];
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const isDatabaseDriven = !!(
    dbCareerPaths &&
    dbCareerPaths.length > 0 &&
    dbSkills &&
    dbSkills.length > 0
  );

  // 3. Resolve Career Pathways (Database-first with resilient editorial fallback)
  const careerPathways: CareerPathItem[] = useMemo(() => {
    if (dbCareerPaths && dbCareerPaths.length > 0) {
      const iconMap: Record<string, any> = {
        Briefcase,
        Factory,
        ShieldCheck,
      };

      return dbCareerPaths.map((p) => {
        const pathSkillRows = (dbPathSkills || []).filter((ps) => ps.career_path_id === p.id);
        const pathSkillIds = new Set(pathSkillRows.map((ps) => ps.skill_id));
        const skillTitles = (dbSkills || [])
          .filter((s) => pathSkillIds.has(s.id))
          .map((s) => s.title);

        const courseIdsInPath = new Set(
          (dbSkillCourses || [])
            .filter((sc) => pathSkillIds.has(sc.skill_id))
            .map((sc) => sc.course_id)
        );

        const mentorIdsInPath = new Set(
          (dbSkillMentors || [])
            .filter((sm) => pathSkillIds.has(sm.skill_id))
            .map((sm) => sm.mentor_id)
        );

        return {
          id: p.slug,
          title: p.title,
          domain: p.domain,
          icon: (p.icon_name && iconMap[p.icon_name]) || Briefcase,
          description: p.description,
          practicalScope: p.practical_scope || "",
          skills: skillTitles.length > 0 ? skillTitles : ["Operational Competency"],
          courseCount: courseIdsInPath.size || 1,
          mentorCount: mentorIdsInPath.size || 1,
        };
      });
    }

    return EDITORIAL_CAREER_PATHWAYS;
  }, [dbCareerPaths, dbPathSkills, dbSkills, dbSkillCourses, dbSkillMentors]);

  // 4. Resolve Skills Inventory (Database-first with resilient editorial fallback)
  const skillsInventory: SkillItem[] = useMemo(() => {
    if (dbSkills && dbSkills.length > 0) {
      return dbSkills.map((s) => {
        const sc =
          (dbSkillCourses || []).find((c) => c.skill_id === s.id && c.is_primary) ||
          (dbSkillCourses || []).find((c) => c.skill_id === s.id);
        const matchedCourse = sc ? courses.find((c) => c.id === sc.course_id) : undefined;

        const sm =
          (dbSkillMentors || []).find((m) => m.skill_id === s.id && m.is_lead) ||
          (dbSkillMentors || []).find((m) => m.skill_id === s.id);
        const matchedMentor = sm ? mentors.find((m) => m.id === sm.mentor_id) : undefined;

        const sli = (dbSkillLibrary || []).find((l) => l.skill_id === s.id);
        const matchedLib = sli ? libraryItems.find((l) => l.id === sli.library_item_id) : undefined;

        const domainId = s.domain.toLowerCase().includes("merchandis")
          ? "merchandising"
          : s.domain.toLowerCase().includes("quality")
          ? "quality-assurance"
          : "industrial-engineering";

        return {
          id: s.slug,
          name: s.title,
          domain: s.domain,
          domainId,
          context:
            s.description +
            (s.practical_application ? ` Practical: ${s.practical_application}` : ""),
          courseId: matchedCourse?.id,
          courseTitle: matchedCourse?.title,
          mentorId: matchedMentor?.id,
          mentorName: matchedMentor?.name,
          libraryTitle: matchedLib?.title,
        };
      });
    }

    return EDITORIAL_SKILLS_INVENTORY;
  }, [
    dbSkills,
    dbSkillCourses,
    dbSkillMentors,
    dbSkillLibrary,
    courses,
    mentors,
    libraryItems,
  ]);

  // 5. Filtered Pathways based on Domain and Search
  const filteredPathways = useMemo(() => {
    return careerPathways.filter((p) => {
      const pathwayDomainId = p.domain.toLowerCase().includes("merchandis")
        ? "merchandising"
        : p.domain.toLowerCase().includes("quality")
        ? "quality-assurance"
        : "industrial-engineering";

      const matchesDomain =
        selectedDomain === "all" ||
        p.id === selectedDomain ||
        pathwayDomainId === selectedDomain;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q));

      return matchesDomain && matchesSearch;
    });
  }, [careerPathways, selectedDomain, searchQuery]);

  // 6. Filtered Skills based on Domain and Search
  const filteredSkills = useMemo(() => {
    return skillsInventory.filter((s) => {
      const matchesDomain = selectedDomain === "all" || s.domainId === selectedDomain;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.context.toLowerCase().includes(q);

      return matchesDomain && matchesSearch;
    });
  }, [skillsInventory, selectedDomain, searchQuery]);

  // 7. Connected Courses mapped to selected domain
  const relevantCourses = useMemo(() => {
    if (selectedDomain === "all" && !searchQuery.trim()) {
      return courses;
    }

    return courses.filter((c) => {
      const text = `${c.title} ${c.description || ""}`.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || text.includes(q);

      let matchesDomain = true;
      if (selectedDomain === "merchandising") {
        matchesDomain = text.includes("merchandis") || text.includes("shipment");
      } else if (selectedDomain === "industrial-engineering") {
        matchesDomain =
          text.includes("elite") || text.includes("kpi") || text.includes("executive");
      } else if (selectedDomain === "quality-assurance") {
        matchesDomain = text.includes("quality") || text.includes("defect");
      }

      return matchesDomain && matchesSearch;
    });
  }, [courses, selectedDomain, searchQuery]);

  // 8. Connected Mentors mapped to selected domain
  const relevantMentors = useMemo(() => {
    if (selectedDomain === "all" && !searchQuery.trim()) {
      return mentors;
    }

    return mentors.filter((m) => {
      const text = `${m.name} ${m.title} ${m.bio || ""} ${(m.tags || []).join(" ")}`.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || text.includes(q);

      let matchesDomain = true;
      if (selectedDomain === "merchandising") {
        matchesDomain = text.includes("merchandis") || text.includes("consultant");
      } else if (selectedDomain === "industrial-engineering") {
        matchesDomain =
          text.includes("engineer") ||
          text.includes("lssbb") ||
          text.includes("excel") ||
          text.includes("drawing");
      } else if (selectedDomain === "quality-assurance") {
        matchesDomain =
          text.includes("quality") || text.includes("defect") || text.includes("standards");
      }

      return matchesDomain && matchesSearch;
    });
  }, [mentors, selectedDomain, searchQuery]);

  const resetFilters = () => {
    setSelectedDomain("all");
    setSearchQuery("");
  };

  const isLoading = loadingCourses || loadingMentors || loadingPaths || loadingSkills;

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <SEOHead
        title="IndustryMentor Career Paths | Build Industry-Ready Skills"
        description="Explore verified career pathways in Garment Merchandising, Industrial Engineering, and Quality Assurance with mapped operational competencies."
        canonicalUrl="https://industrymentor.net/career"
      />
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border/40 bg-gradient-to-b from-background via-surface/30 to-background">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none opacity-40" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider shadow-sm">
            <Compass className="h-3.5 w-3.5" />
            Industry Career Navigation
          </div>

          {/* H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-tight sm:leading-none">
            Build the Skills Your <br className="hidden sm:inline" />
            <span className="text-primary bg-clip-text">Industry Career Demands.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
            IndustryMentor connects practical shop-floor learning, senior expert guidance, and
            verifiable career capability. Know where you want to go. Understand what skills you
            need. Learn the right things. Build practical capability. Get industry guidance.
          </p>

          {/* Truthful Platform & Database State Indicator */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground/80 bg-background/50 border border-border/60 rounded-xl px-4 py-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>
                Real-world industrial framework built for factory professionals &amp; engineering students. No inflated claims.
              </span>
            </div>

            {isDatabaseDriven ? (
              <Badge
                variant="outline"
                className="text-[11px] font-mono tracking-wide px-3 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live Database Catalog
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[11px] font-mono tracking-wide px-3 py-1 bg-primary/10 text-primary border-primary/20 gap-1.5"
              >
                <DatabaseIcon className="h-3.5 w-3.5" />
                Verified Industrial Catalog
              </Badge>
            )}
          </div>

          {/* Action CTAs */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="hero"
              size="lg"
              onClick={() => {
                const el = document.getElementById("pathways");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="font-bold text-xs sm:text-sm h-11 px-6 gap-2"
            >
              Explore Career Paths
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="font-semibold text-xs sm:text-sm h-11 px-6 border-border/70 hover:border-primary/40"
            >
              <Link to="/courses">Explore Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. CAREER LEARNING JOURNEY (7-STAGE FRAMEWORK) */}
      <section className="py-14 sm:py-20 border-b border-border/40 bg-card/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5" />
              The Progression Framework
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              A Structured Journey From Knowledge to Industrial Leadership
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Real capability isn't acquired by passively memorizing slides. It follows a rigorous
              7-stage professional development pathway designed to prepare you for actual factory
              floor responsibilities.
            </p>
          </div>

          {/* Horizontal Journey Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
            {LEARNING_JOURNEY_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.step}
                  className="relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card/40 p-4 sm:p-5 transition-all duration-200 hover:border-primary/40 hover:bg-card/70 shadow-sm text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        STAGE {step.step}
                      </span>
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-primary">
                        <StepIcon className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-snug">
                        {step.title}
                      </h3>
                      <div className="text-[11px] font-medium text-primary/90 mt-0.5">
                        {step.subtitle}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {idx < LEARNING_JOURNEY_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-border">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. TOOLBAR: SEARCH & DOMAIN FILTERS */}
      <section id="pathways" className="scroll-mt-24 pt-12 sm:pt-16 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Compass className="h-3.5 w-3.5" /> Verified Pathways
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                Explore Industrial Career Domains
              </h2>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills, domains, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl bg-card/50 border-border/60 focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Domain Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-border/40 pb-4">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-primary" /> Filter Domain:
            </span>
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                type="button"
                onClick={() => setSelectedDomain(domain.id)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 border ${
                  selectedDomain === domain.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-surface-2/60 text-muted-foreground border-border/60 hover:text-foreground hover:border-border"
                }`}
              >
                {domain.label}
              </button>
            ))}

            {(selectedDomain !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1 ml-auto"
              >
                <RefreshCw className="h-3 w-3" /> Reset Filters
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 4. CAREER PATHWAYS GRID */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading && filteredPathways.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : filteredPathways.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border border-dashed border-border/60 bg-card/20 p-8 space-y-4">
              <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">
                No Career Pathways Match Your Filter
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try searching for another keyword or reset your domain filters to see all available pathways.
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPathways.map((pathway) => (
                <CareerPathCard
                  key={pathway.id}
                  pathway={pathway}
                  isSelected={selectedDomain === pathway.id}
                  onSelect={(pathId) => {
                    const domainMatch = pathId.includes("merchandis")
                      ? "merchandising"
                      : pathId.includes("quality")
                      ? "quality-assurance"
                      : "industrial-engineering";
                    setSelectedDomain(domainMatch);
                    const el = document.getElementById("skills-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. SKILLS DISCOVERY LAYER */}
      <section
        id="skills-section"
        className="scroll-mt-24 py-16 sm:py-20 border-t border-border/40 bg-surface/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" /> Technical Competency Matrix
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                Verified Technical Skills Demanded in Production
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
                Every skill below is grounded in actual course curriculum modules or senior mentor specializations.
              </p>
            </div>

            <div className="text-xs font-mono text-muted-foreground">
              Showing <span className="text-foreground font-bold">{filteredSkills.length}</span> verified skills
            </div>
          </div>

          {isLoading && filteredSkills.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 rounded-3xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border border-dashed border-border/60 bg-card/20 p-8 space-y-4">
              <Target className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Skills Match Your Query</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No verified technical skills found matching "{searchQuery}".
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. CONNECTED PLATFORM CURRICULUM (REAL COURSES) */}
      <section className="py-16 sm:py-20 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <BookOpen className="h-3.5 w-3.5" /> Curriculum Connection
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                Authentic Courses Supporting These Pathways
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Direct enrollment available into verified factory-oriented courses.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-primary font-bold gap-1 self-start sm:self-auto"
            >
              <Link to="/courses">
                View All Courses
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-3xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : errorCourses ? (
            <div className="text-center py-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
              <p className="text-xs text-destructive">Failed to load courses</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchCourses()}
                className="text-xs"
              >
                Retry Loading
              </Button>
            </div>
          ) : relevantCourses.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-border/40 bg-card/20 text-xs text-muted-foreground">
              No specific courses found for this filtered category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relevantCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. CONNECTED MENTORS (PRACTITIONER GUIDANCE) */}
      <section className="py-16 sm:py-20 border-t border-border/40 bg-surface/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" /> Practitioner Advisory
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                Connect With Leaders in These Career Disciplines
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Consult directly with active factory leaders and industrial engineering managers.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-primary font-bold gap-1 self-start sm:self-auto"
            >
              <Link to="/mentors">
                View All Mentors
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {loadingMentors ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 rounded-3xl bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : relevantMentors.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-border/40 bg-card/20 text-xs text-muted-foreground">
              No mentors specifically tagged with this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relevantMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. BOTTOM STRATEGIC CTA */}
      <section className="py-16 sm:py-20 border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Start Your Industrial Journey
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Bridge the Gap Between Theory and Factory Reality.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Choose your career domain, master verified practical competencies, and work directly with senior industrial leaders.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="lg" asChild className="font-bold text-xs sm:text-sm h-11 px-8">
              <Link to="/courses">Browse All Courses</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="font-semibold text-xs sm:text-sm h-11 px-8 border-border/70"
            >
              <Link to="/mentors">Meet Industry Mentors</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
