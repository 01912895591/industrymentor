import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { formatCourseTitle } from "@/lib/formatTitle";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Star,
  ShieldCheck,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Share2,
  ChevronRight,
  AlertCircle,
  Lock,
  Phone,
  FileText,
  UserCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import courseReact from "@/assets/course-react.jpg";

interface CourseDetailData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  old_price_cents: number | null;
  cover_image_path: string | null;
  mode: string;
  rating: number;
  reviews: number;
  badge_text: string;
  instructor_heading: string;
  instructor_subheading: string;
  published: boolean;
  created_at: string;
}

interface CourseModuleItem {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  created_at: string;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [modules, setModules] = useState<CourseModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourseData = async () => {
    if (!courseId) {
      setError("Invalid course parameter.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lookup course by either UUID or slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);

      let query = supabase.from("courses").select("*").eq("published", true);

      if (isUUID) {
        query = query.or(`id.eq.${courseId},slug.eq.${courseId}`);
      } else {
        query = query.eq("slug", courseId);
      }

      const { data: courseData, error: courseError } = await query.maybeSingle();

      if (courseError) throw courseError;
      if (!courseData) {
        setCourse(null);
        setLoading(false);
        return;
      }

      setCourse(courseData as CourseDetailData);

      // Fetch curriculum modules for this course
      const { data: modulesData, error: modulesError } = await (supabase
        .from("course_modules" as any)
        .select("*")
        .eq("course_id", courseData.id)
        .order("created_at", { ascending: true })) as any;

      if (modulesError) {
        console.warn("Could not load modules:", modulesError);
      } else {
        setModules(modulesData || []);
      }
    } catch (err: any) {
      console.error("Error loading course details:", err);
      setError("Failed to load course details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCourseData();
  }, [courseId]);

  // Handlers

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Course URL copied to clipboard!");
    } else {
      toast.info("Share this URL: " + url);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Breadcrumb Skeleton */}
          <div className="h-4 w-48 animate-pulse rounded bg-muted/30 mb-8" />

          {/* Hero Skeleton */}
          <div className="space-y-4 mb-12">
            <div className="h-6 w-32 animate-pulse rounded-md bg-muted/40" />
            <div className="h-10 w-3/4 animate-pulse rounded-md bg-muted/40" />
            <div className="h-6 w-1/2 animate-pulse rounded-md bg-muted/30" />
          </div>

          {/* Columns Skeleton */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="h-64 animate-pulse rounded-lg bg-card/60 border border-border/60" />
              <div className="h-96 animate-pulse rounded-lg bg-card/60 border border-border/60" />
            </div>
            <div className="lg:col-span-4">
              <div className="h-96 animate-pulse rounded-lg bg-card/60 border border-border/60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/courses")}>
              Back to Catalog
            </Button>
            <Button variant="hero" onClick={() => void fetchCourseData()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 404 Course Not Found
  if (!course) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <SEOHead
          title="Course Not Found — IndustryMentor"
          noindex={true}
        />
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted-foreground mb-4 border border-border">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The course you are looking for does not exist or may have been unpublished.
          </p>
          <div className="mt-6">
            <Button variant="hero" asChild>
              <Link to="/courses">
                Browse Available Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = Math.round(course.price_cents / 100).toLocaleString();
  const oldPrice = course.old_price_cents
    ? Math.round(course.old_price_cents / 100).toLocaleString()
    : null;
  const ratingVal = (course.rating ?? 5.0).toFixed(1);
  const reviewsTotal = course.reviews ?? 0;
  const coverUrl = course.cover_image_path || courseReact;
  const enrollPath = `/enroll/${course.id}`;
  const displayTitle = formatCourseTitle(course.title);

  return (
    <div className="min-h-screen pb-20">
      <SEOHead
        title={`${displayTitle} | IndustryMentor`}
        description={
          course.description ||
          "Master practical industrial skills with practitioner-led training and verifiable credentials on IndustryMentor."
        }
        canonicalUrl={`https://industrymentor.net/courses/${course.slug || course.id}`}
        ogImage={coverUrl.startsWith("http") ? coverUrl : `https://industrymentor.net${coverUrl}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: displayTitle,
          description: course.description || undefined,
          provider: {
            "@type": "Organization",
            name: "IndustryMentor",
            sameAs: "https://industrymentor.net",
          },
          offers: {
            "@type": "Offer",
            category: "Paid",
            price: (course.price_cents / 100).toFixed(2),
            priceCurrency: "BDT",
          },
        }}
      />
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-border/40 bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <Link to="/courses" className="transition-colors hover:text-foreground">Courses</Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="truncate max-w-[200px] sm:max-w-md font-medium text-foreground" aria-current="page">
              {displayTitle}
            </span>
          </nav>
        </div>
      </div>

      {/* Course Hero Banner */}
      <section className="relative border-b border-border/40 bg-card/40 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-primary/30 bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary uppercase tracking-wider">
                {course.mode || "Online"}
              </span>
              <Badge variant="outline" className="border-border/80 bg-card text-foreground text-xs font-medium py-0.5 px-2.5">
                {course.badge_text || "Professional Certification"}
              </Badge>
            </div>

            {/* H1 Title */}
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight">
              {displayTitle}
            </h1>

            {/* Subheading / Value Proposition */}
            {course.description && (
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground line-clamp-3">
                {course.description}
              </p>
            )}

            {/* Rating & Instructor Attribution */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="tabular-nums font-semibold">{ratingVal}</span>
                <span className="text-muted-foreground">({reviewsTotal} verified reviews)</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{course.instructor_heading || "Taught by Experts"}</span>
                <span className="text-muted-foreground font-normal">({course.instructor_subheading || "Industry Professionals"})</span>
              </div>
            </div>

            {/* Quality Guarantees Bar */}
            <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-muted-foreground border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Practitioner-Led</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Real Factory SOPs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Verifiable Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-start">
          
          {/* Left Column: Course Details & Curriculum */}
          <main className="space-y-10 lg:col-span-8">
            
            {/* Section: Course Overview */}
            <section aria-labelledby="overview-heading" className="rounded-lg border border-border/70 bg-card/60 p-6 sm:p-8 shadow-sm">
              <h2 id="overview-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Course Overview
              </h2>

              <div className="mt-4 space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
                <p>
                  {course.description}
                </p>
                <p>
                  This course is specifically structured by senior factory practitioners to replace generic academic theories with actionable floor execution. Every module is grounded in real production workflows, technical buyer specifications, and industry compliance benchmarks.
                </p>
              </div>

              {/* Practical Competencies Checklist */}
              <div className="mt-8 border-t border-border/50 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
                  Core Competencies You Will Build
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Real-world production documentation &amp; buyer tech-packs</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Costing, consumption, and margin calculation precision</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Standard Operating Procedures (SOP) on the production floor</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Inspection standards, AQL tolerance &amp; defect elimination</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Curriculum / Modules */}
            <section aria-labelledby="curriculum-heading" className="rounded-lg border border-border/70 bg-card/60 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div>
                  <h2 id="curriculum-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Curriculum &amp; Syllabus
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Structured step-by-step learning path validated by industry mentors.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1 text-xs font-semibold text-foreground border border-border/60 self-start sm:self-auto">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  <span>{modules.length > 0 ? `${modules.length} Modules` : "Industry Syllabus"}</span>
                </div>
              </div>

              {modules.length > 0 ? (
                <Accordion type="single" collapsible defaultValue={modules[0]?.id} className="space-y-3">
                  {modules.map((mod, index) => (
                    <AccordionItem
                      key={mod.id}
                      value={mod.id}
                      className="rounded-lg border border-border/70 bg-card/40 px-4 py-1 transition-colors hover:border-border-active"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2 text-xs font-bold text-primary border border-border/70">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-sm sm:text-base text-foreground block">
                              {mod.title}
                            </span>
                            {mod.price_cents > 0 && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                Included with full enrollment (৳{mod.price_cents / 100} individual value)
                              </span>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {mod.description ? (
                          <div className="whitespace-pre-line pl-10 border-l-2 border-primary/20 ml-3 py-1">
                            {mod.description}
                          </div>
                        ) : (
                          <p className="pl-10 text-xs italic text-muted-foreground/80">
                            Comprehensive classroom lectures, floor-tested case studies, and practical templates.
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2 pl-10 text-[11px] font-medium text-muted-foreground">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/70" />
                          <span>Content, materials, and quizzes unlock upon verified enrollment.</span>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="rounded-lg border border-border/60 bg-surface/30 p-6 text-center">
                  <Layers className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                  <h4 className="text-sm font-semibold text-foreground">Syllabus In Assembly</h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    The detailed syllabus breakdown for this course is being finalized with our industrial advisory panel. All registered learners receive complete curriculum handouts and session schedules upon enrollment.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 text-xs" asChild>
                    <Link to="/contact">Contact Academic Desk for Syllabus</Link>
                  </Button>
                </div>
              )}
            </section>

            {/* Section: Who This Course Is For */}
            <section aria-labelledby="audience-heading" className="rounded-lg border border-border/70 bg-card/60 p-6 sm:p-8 shadow-sm">
              <h2 id="audience-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Who This Course Is For
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-surface-2/40 p-4">
                  <h4 className="font-semibold text-sm text-foreground">Textile &amp; Apparel Engineers</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Engineering graduates wanting real-world merchandising, IE execution, and factory floor problem-solving skills.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-surface-2/40 p-4">
                  <h4 className="font-semibold text-sm text-foreground">Active Industry Executives</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Merchandisers, line supervisors, and quality controllers seeking promotion to senior manager and head of department roles.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-surface-2/40 p-4">
                  <h4 className="font-semibold text-sm text-foreground">Buying House Professionals</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Liason officers and sourcing specialists needing tight quality audit capabilities and costing mastery.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-surface-2/40 p-4">
                  <h4 className="font-semibold text-sm text-foreground">Career Switchers into RMG</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ambitious professionals transitioning into Bangladesh’s largest export manufacturing economy.
                  </p>
                </div>
              </div>
            </section>

            {/* Section: Verified Credential */}
            <section aria-labelledby="credential-heading" className="rounded-lg border border-border/70 bg-card/60 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 id="credential-heading" className="text-xl font-bold tracking-tight text-foreground">
                    Official IndustryMentor Certificate
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Upon successfully finishing this course and completing the required module milestones, you will be awarded an authenticated, tamper-proof IndustryMentor Certificate.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Verifiable online via public cryptographic verification URL (<code>/verify/:id</code>)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Sharable directly to LinkedIn and employer resumes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Recognized by partnering manufacturing hubs and factory leaders</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section: Grounded FAQ */}
            <section aria-labelledby="faq-heading" className="rounded-lg border border-border/70 bg-card/60 p-6 sm:p-8 shadow-sm">
              <h2 id="faq-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl mb-4">
                Frequently Asked Questions
              </h2>

              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="faq-1" className="border-border/60">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                    How do I access the course after enrollment?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Once your enrollment and payment verification are approved by our admin team, your course will automatically appear in your personalized Student Dashboard with full access to all materials.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2" className="border-border/60">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                    What payment methods are supported?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    We support direct mobile banking (bKash, Nagad, Rocket) and manual bank transfer. You submit your transaction ID on the checkout page for rapid audit and enrollment confirmation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3" className="border-border/60">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                    Can I ask questions to the mentors during the course?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Yes! Enrolled students gain direct access to mentor Q&amp;A channels and floor-case reviews to resolve industrial scenarios directly.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </main>

          {/* Right Column: Sticky Summary & Enrollment Card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="overflow-hidden rounded-lg border border-border/70 bg-card/70 shadow-elev">
              
              {/* Media Preview */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
                <img
                  src={coverUrl}
                  alt={`Cover image for ${displayTitle}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-3 top-3">
                  <span className="rounded-md border border-border/70 bg-background/90 px-2.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm">
                    COURSE PREVIEW
                  </span>
                </div>
              </div>

              {/* Price & Checkout Box */}
              <div className="p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                      Course Investment
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono text-foreground tabular-nums">
                        ৳{currentPrice}
                      </span>
                      {oldPrice && (
                        <span className="text-sm text-muted-foreground line-through decoration-destructive/70">
                          ৳{oldPrice}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    Full Access
                  </span>
                </div>

                {/* Primary CTA */}
                <Button variant="hero" size="lg" className="w-full text-sm font-bold shadow-glow" asChild>
                  <Link to={enrollPath}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enroll In Course
                  </Link>
                </Button>

                {/* Secondary CTA */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="mt-3 w-full text-xs font-medium border-border/70 hover:bg-surface-2"
                >
                  <Share2 className="mr-2 h-3.5 w-3.5" />
                  Share Course URL
                </Button>

                {/* Course Metadata Checklist */}
                <div className="mt-6 pt-6 border-t border-border/50 space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Access Duration
                    </span>
                    <span className="font-medium text-foreground">Lifetime Access</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Curriculum
                    </span>
                    <span className="font-medium text-foreground">
                      {modules.length > 0 ? `${modules.length} Modules` : "Full Curriculum"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Format
                    </span>
                    <span className="font-medium text-foreground">{course.mode || "Online"} &amp; Practical SOPs</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Certificate
                    </span>
                    <span className="font-medium text-foreground">Official Verification</span>
                  </div>
                </div>

                {/* Direct Mentorship Support */}
                <div className="mt-6 pt-6 border-t border-border/50 rounded-md bg-surface-2/40 p-3 text-center">
                  <div className="text-xs font-medium text-foreground">Questions before enrolling?</div>
                  <a
                    href="tel:+8801912895591"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    Call +8801912895591
                  </a>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
