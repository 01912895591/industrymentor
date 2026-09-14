import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { formatCourseTitle } from "@/lib/formatTitle";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Menu,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Clock,
  XCircle,
  FileCheck2,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  mode: string | null;
  badge_text: string | null;
  cover_image_path: string | null;
  published: boolean;
  instructor_heading: string | null;
}

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  created_at: string;
}

interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  completed: boolean;
  status: string | null;
  transaction_id?: string | null;
  payment_method?: string | null;
  sender_phone?: string | null;
  created_at: string;
}

export default function CourseLearning() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<"active" | "pending" | "rejected" | "none">("none");
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [courseNotFound, setCourseNotFound] = useState<boolean>(false);
  const [notEnrolled, setNotEnrolled] = useState<boolean>(false);
  const [completingCourse, setCompletingCourse] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // In-session completed modules set
  const [sessionCompletedModules, setSessionCompletedModules] = useState<Set<string>>(new Set());

  // Interactive practical checklist state for the active module
  const [completedChecklistItems, setCompletedChecklistItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadCourseAndAccess() {
      if (!courseId) {
        setCourseNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setCourseNotFound(false);
      setNotEnrolled(false);
      setEnrollmentStatus("none");

      try {
        // 1. Fetch course details by ID or Slug safely
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
        let query = (supabase as any)
          .from("courses")
          .select("id, title, slug, description, mode, badge_text, cover_image_path, published, instructor_heading")
          .eq("published", true);

        if (isUUID) {
          query = query.or(`id.eq.${courseId},slug.eq.${courseId}`);
        } else {
          query = query.eq("slug", courseId);
        }

        const { data: courseData, error: courseError } = await query.maybeSingle();

        if (courseError || !courseData) {
          setCourseNotFound(true);
          setLoading(false);
          return;
        }

        setCourse(courseData);

        // 2. Verify enrollment for current user (or allow admin bypass)
        if (!user) {
          setEnrollmentStatus("none");
          setNotEnrolled(true);
          setLoading(false);
          return;
        }

        const { data: enrollData, error: enrollError } = await (supabase as any)
          .from("course_enrollments")
          .select("id, course_id, user_id, completed, status, transaction_id, payment_method, sender_phone, created_at")
          .eq("course_id", courseData.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (enrollError) {
          console.error("Enrollment check error:", enrollError);
        }

        // Check if user has admin role
        let isAdmin = false;
        const { data: adminFlag } = await (supabase as any).rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });
        if (adminFlag) {
          isAdmin = true;
        }

        // Strict Access Control:
        if (isAdmin) {
          setEnrollment(enrollData || null);
          setEnrollmentStatus("active");
        } else if (!enrollData) {
          setEnrollment(null);
          setEnrollmentStatus("none");
          setNotEnrolled(true);
          setLoading(false);
          return;
        } else if (enrollData.status === "pending") {
          setEnrollment(enrollData);
          setEnrollmentStatus("pending");
          setLoading(false);
          return;
        } else if (enrollData.status === "rejected") {
          setEnrollment(enrollData);
          setEnrollmentStatus("rejected");
          setLoading(false);
          return;
        } else {
          // 'active' or legacy approved enrollment
          setEnrollment(enrollData);
          setEnrollmentStatus("active");
        }

        // 3. Fetch modules for the verified enrolled course
        const { data: modulesData, error: modulesError } = await (supabase as any)
          .from("course_modules")
          .select("id, course_id, title, description, price_cents, created_at")
          .eq("course_id", courseData.id)
          .order("created_at", { ascending: true });

        if (modulesError) {
          console.error("Modules fetch error:", modulesError);
          toast.error("Failed to load curriculum modules.");
        } else {
          const loadedModules = modulesData || [];
          setModules(loadedModules);

          // If course is already marked completed in DB, mark all modules as completed in-session
          if (enrollData?.completed) {
            setSessionCompletedModules(new Set(loadedModules.map((m: CourseModule) => m.id)));
          }
        }
      } catch (err: any) {
        console.error("Unexpected error in CourseLearning:", err);
        toast.error("An unexpected error occurred while loading the classroom.");
      } finally {
        setLoading(false);
      }
    }

    void loadCourseAndAccess();
  }, [courseId, user]);

  const activeModule = useMemo(() => {
    if (modules.length === 0) return null;
    return modules[activeModuleIndex] || modules[0];
  }, [modules, activeModuleIndex]);

  // Clean module title helper (strip leading emoji if present for cleaner numbering)
  const cleanModuleTitle = (title: string) => {
    return title.replace(/^[🔹•\s\d.:-]+/, "").trim() || title;
  };

  // Toggle in-session completion for a module
  const toggleModuleCompletion = (moduleId: string) => {
    setSessionCompletedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
        toast.info("Module unmarked as complete.");
      } else {
        next.add(moduleId);
        toast.success("Module completed!");
      }
      return next;
    });
  };

  // Toggle interactive practical checklist item
  const toggleChecklistItem = (itemKey: string) => {
    setCompletedChecklistItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  // Handle Mark Whole Course Complete
  const handleMarkCourseComplete = async () => {
    if (!enrollment || !user) {
      toast.error("Cannot mark course complete: No active enrollment record found.");
      return;
    }

    // Require all curriculum modules to be finished before course completion
    const allModulesDone =
      modules.length > 0 &&
      (sessionCompletedModules.size >= modules.length || progressPercent === 100);

    if (!allModulesDone) {
      toast.error("Course Incomplete", {
        description: `You have completed ${sessionCompletedModules.size} of ${modules.length} modules (${progressPercent}%). Please finish all chapters and practical exercises before claiming your certificate.`,
      });
      return;
    }

    setCompletingCourse(true);
    try {
      const { error } = await (supabase as any)
        .from("course_enrollments")
        .update({ completed: true })
        .eq("id", enrollment.id);

      if (error) throw error;

      setEnrollment((prev) => (prev ? { ...prev, completed: true } : null));

      toast.success("Congratulations! Course 100% Completed.", {
        description: "You are now eligible to request your verified completion certificate.",
      });
    } catch (err: any) {
      console.error("Error completing course:", err);
      toast.error(err.message || "Could not update course status. Please try again or contact support.");
    } finally {
      setCompletingCourse(false);
    }
  };

  // Practical checklist items generated for industrial application
  const practicalChecklist = useMemo(() => {
    if (!activeModule) return [];
    return [
      {
        id: `${activeModule.id}-chk-1`,
        label: "Review Factory Standard Operating Procedure (SOP) & Spec Sheets",
        description: "Cross-reference buyer technical pack requirements and measurement guidelines for this chapter.",
      },
      {
        id: `${activeModule.id}-chk-2`,
        label: "Execute Floor Measurement & Tolerance Verification",
        description: "Verify sample dimensions using calibrated steel/fiber tape on a flat industrial inspection table.",
      },
      {
        id: `${activeModule.id}-chk-3`,
        label: "Inspect Defect Categorization (Critical, Major, Minor)",
        description: "Categorize any seam slippage, shade variance, skew, or construction deviation against buyer AQL standard.",
      },
      {
        id: `${activeModule.id}-chk-4`,
        label: "Log Action Report & Sign-Off Documentation",
        description: "Record inspection findings on standard factory floor QA/IE daily execution register.",
      },
    ];
  }, [activeModule]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    if (modules.length === 0) return 0;
    if (enrollment?.completed) return 100;
    return Math.round((sessionCompletedModules.size / modules.length) * 100);
  }, [modules.length, sessionCompletedModules.size, enrollment?.completed]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Skeleton Top Bar */}
        <div className="h-16 border-b border-border/60 bg-card/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-6 w-6 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-48 rounded bg-muted/40 animate-pulse" />
          </div>
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
        </div>
        {/* Skeleton Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] p-6 gap-6 max-w-7xl mx-auto w-full">
          <div className="space-y-4">
            <div className="h-8 w-full rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-muted/20 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-muted/20 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-muted/20 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-10 w-3/4 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-48 w-full rounded-2xl bg-muted/20 animate-pulse" />
            <div className="h-32 w-full rounded-2xl bg-muted/20 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 404 Course Not Found State
  if (courseNotFound || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-2xl border border-border/60 bg-card/40 shadow-elev space-y-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Course Not Found</h1>
            <p className="text-sm text-muted-foreground">
              The requested course could not be located or may not have been published yet.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="hero" asChild className="w-full">
              <Link to="/courses">Browse All Courses</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Verification in Progress Holding Screen
  if (enrollmentStatus === "pending" && course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full p-8 sm:p-10 rounded-3xl border border-amber-500/30 bg-card/60 backdrop-blur-xl shadow-elev space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_24px_rgba(245,158,11,0.15)]">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-xs font-bold py-1 px-3">
              Payment Verification in Progress
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{course.title}</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We received your enrollment request. Our admissions team is manually verifying your payment transaction ID before unlocking full classroom access.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-4 text-left text-xs space-y-2.5 text-muted-foreground">
            <div className="flex justify-between items-center pb-2 border-b border-border/40">
              <span className="font-semibold text-foreground">Transaction ID (TrxID)</span>
              <span className="font-mono font-bold text-primary">{enrollment?.transaction_id || "Submitted"}</span>
            </div>
            {enrollment?.payment_method && (
              <div className="flex justify-between items-center pb-2 border-b border-border/40">
                <span className="font-semibold text-foreground">Payment Method</span>
                <span className="font-medium capitalize text-foreground">{enrollment.payment_method}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Verification Window</span>
              <span className="font-medium text-emerald-400">Typically within 1–2 hours</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Need urgent access or have a question? Contact our verification support desk on WhatsApp at{" "}
            <a href="https://wa.me/8801912895591" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
              +8801912895591
            </a>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" asChild className="flex-1">
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button variant="hero" asChild className="flex-1">
              <a href="https://wa.me/8801912895591?text=Hi%20IndustryMentor%20Support,%20I%20enrolled%20in%20course%20and%20waiting%20for%20verification." target="_blank" rel="noreferrer">
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Payment Verification Rejected Screen
  if (enrollmentStatus === "rejected" && course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full p-8 sm:p-10 rounded-3xl border border-destructive/30 bg-card/60 backdrop-blur-xl shadow-elev space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/20 shadow-[0_0_24px_rgba(239,68,68,0.15)]">
            <XCircle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-xs font-bold py-1 px-3">
              Verification Failed
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{course.title}</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We could not verify the transaction ID submitted for this enrollment. Please verify your payment details and re-submit.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="hero" asChild className="flex-1">
              <Link to={`/enroll/${course.id}`}>Re-Submit Payment Details</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Access Denied / Not Enrolled State (Ensures protected curriculum is NEVER leaked)
  if (notEnrolled || enrollmentStatus === "none") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full p-8 sm:p-10 rounded-3xl border border-border/60 bg-card/40 shadow-elev space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
              Enrollment Required
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{course.title}</h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You are signed in as <span className="font-semibold text-foreground">{user?.email}</span>, but this account does not have an active enrollment for this course.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-left text-xs space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Verified Classroom Access Includes:
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Full access to all practical industrial modules & SOPs</li>
              <li>Interactive factory floor checklists & defect criteria</li>
              <li>Official IndustryMentor completion certificate upon finishing</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="hero" asChild className="flex-1">
              <Link to={`/enroll/${course.id}`}>Enroll in This Course</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to={`/courses/${course.slug || course.id}`}>View Syllabus Details</Link>
            </Button>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Return to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enrolled Student Classroom View
  const displayTitle = formatCourseTitle(course?.title);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEOHead
        title={course ? `${displayTitle} — Classroom | IndustryMentor` : "Classroom | IndustryMentor"}
        noindex={true}
      />
      {/* 1. LMS Top Bar (Distraction-Free) */}
      <header className="sticky top-0 z-40 h-16 border-b border-border/60 bg-card/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Brand & Back to Dashboard */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/30"
            title="Return to Student Dashboard"
          >
            <ChevronLeft className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-[1px] bg-border/60 hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase hidden md:inline">
                IM CLASSROOM
              </span>
              {course.mode && (
                <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium bg-primary/5 text-primary border-primary/20 hidden lg:inline-flex">
                  {course.mode}
                </Badge>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold truncate text-foreground leading-tight" title={displayTitle}>
              {displayTitle}
            </h1>
          </div>
        </div>

        {/* Center: Progress Tracker */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] font-bold text-muted-foreground">
              Progress: <span className="text-foreground">{progressPercent}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80">
              {modules.length > 0 ? `Module ${activeModuleIndex + 1} of ${modules.length}` : "No modules"}
            </div>
          </div>
          <div className="w-24">
            <Progress value={progressPercent} className="h-2 bg-muted/40" />
          </div>
          {enrollment?.completed ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Completed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-bold">
              Active
            </Badge>
          )}
        </div>

        {/* Right: Mobile Drawer Toggle & Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Curriculum Drawer Trigger */}
          <div className="md:hidden">
            <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 text-xs font-semibold">
                  <Menu className="h-4 w-4 text-primary" />
                  <span>Curriculum</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-0 flex flex-col bg-card border-r border-border/60">
                <SheetHeader className="p-4 border-b border-border/60 text-left">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" /> Course Curriculum
                  </SheetTitle>
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground font-semibold mb-1">
                      <span>Overall Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5 bg-muted/40" />
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {modules.map((mod, idx) => {
                    const isActive = idx === activeModuleIndex;
                    const isCompleted = sessionCompletedModules.has(mod.id) || enrollment?.completed;

                    return (
                      <button
                        key={mod.id}
                        onClick={() => {
                          setActiveModuleIndex(idx);
                          setMobileDrawerOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all flex items-start gap-2.5 ${
                          isActive
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <div className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                              isActive ? "border-primary text-primary" : "border-border/80 text-muted-foreground"
                            }`}>
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{cleanModuleTitle(mod.title)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex h-9 text-xs font-semibold">
            <Link to="/dashboard">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5 text-primary" /> Dashboard
            </Link>
          </Button>
        </div>
      </header>

      {/* 2. LMS Main Body (Sidebar + Content Viewer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Curriculum Drawer) */}
        <aside className="hidden md:flex flex-col w-80 lg:w-96 border-r border-border/60 bg-card/25 shrink-0">
          <div className="p-5 border-b border-border/60 bg-card/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Modules ({modules.length})
              </span>
              <span className="text-xs font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-muted/40" />
            <p className="mt-2 text-[11px] text-muted-foreground">
              {sessionCompletedModules.size} of {modules.length} modules completed in this course
            </p>
          </div>

          {/* Module List */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {modules.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No curriculum modules published for this course yet.
              </div>
            ) : (
              modules.map((mod, idx) => {
                const isActive = idx === activeModuleIndex;
                const isCompleted = sessionCompletedModules.has(mod.id) || enrollment?.completed;

                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold transition-all flex items-start gap-3 border ${
                      isActive
                        ? "bg-primary/10 border-primary/40 text-foreground shadow-sm"
                        : "bg-background/20 border-border/40 text-muted-foreground hover:bg-background/40 hover:text-foreground hover:border-border/80"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? "border-primary text-primary bg-primary/10"
                              : "border-border/80 text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground text-xs leading-snug">
                        {cleanModuleTitle(mod.title)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Module {idx + 1}
                      </div>
                    </div>

                    {isActive && (
                      <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
                    )}
                  </button>
                );
              })
            )}
          </nav>

          {/* Quick Completion Footer in Sidebar */}
          <div className="p-4 border-t border-border/60 bg-card/40">
            {enrollment?.completed ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <div className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Course Completed
                </div>
                <Button variant="outline" size="sm" asChild className="w-full text-xs h-8">
                  <Link to="/dashboard">Claim Certificate</Link>
                </Button>
              </div>
            ) : sessionCompletedModules.size >= modules.length && modules.length > 0 ? (
              <Button
                variant="hero"
                size="sm"
                className="w-full text-xs h-9 font-bold"
                onClick={handleMarkCourseComplete}
                disabled={completingCourse}
              >
                {completingCourse ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                )}
                Complete Course & Get Certificate
              </Button>
            ) : (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40 text-center space-y-1">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Curriculum Progress: {sessionCompletedModules.size} / {modules.length}
                </div>
                <div className="text-[10px] text-muted-foreground/80">
                  Complete all modules to unlock your certificate
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 3. Main Content Area (Active Module Viewer) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {activeModule ? (
              <>
                {/* Module Breadcrumb & Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <span>Module {activeModuleIndex + 1} of {modules.length}</span>
                      <span>•</span>
                      <span>Practical Factory Curriculum</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                      {cleanModuleTitle(activeModule.title)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={sessionCompletedModules.has(activeModule.id) ? "outline" : "hero"}
                      size="sm"
                      className="text-xs font-bold h-9 gap-1.5"
                      onClick={() => toggleModuleCompletion(activeModule.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {sessionCompletedModules.has(activeModule.id)
                        ? "Completed (Click to Reset)"
                        : "Mark Module Complete"}
                    </Button>
                  </div>
                </div>

                {/* Module Technical Content / Syllabus */}
                <section className="rounded-3xl border border-border/60 bg-card/25 p-6 sm:p-8 backdrop-blur-xl shadow-elev space-y-6">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" /> Technical Instructions & Core Learning Objectives
                  </div>

                  {activeModule.description ? (
                    <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                      {activeModule.description}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Detailed practical guidance for this module will be covered in live sessions and factory demonstrations.
                    </p>
                  )}

                  {/* Industrial Best Practice Note */}
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="font-bold text-foreground">Factory Floor Practitioner Tip:</div>
                      <div>
                        Always confirm measurement points before cutting or sewing inspection. Discrepancies between buyer spec sheets and tech-pack amendments are the leading cause of inspection failure.
                      </div>
                    </div>
                  </div>
                </section>

                {/* Practical Factory Floor Execution Checklist */}
                <section className="rounded-3xl border border-border/60 bg-card/25 p-6 sm:p-8 backdrop-blur-xl shadow-elev space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <ClipboardCheck className="h-4 w-4 text-primary" /> Factory Floor & SOP Execution Checklist
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      Interactive Practical Companion
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Check off each operational task on the factory line as you apply this module&apos;s curriculum:
                  </p>

                  <div className="grid gap-3">
                    {practicalChecklist.map((item) => {
                      const isChecked = !!completedChecklistItems[item.id];
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? "bg-primary/10 border-primary/30 text-foreground"
                              : "bg-background/20 border-border/40 text-muted-foreground hover:bg-background/40 hover:border-border/70"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleChecklistItem(item.id)}
                            className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="space-y-0.5">
                            <div className={`text-xs font-bold ${isChecked ? "text-primary line-through opacity-80" : "text-foreground"}`}>
                              {item.label}
                            </div>
                            <div className="text-[11px] text-muted-foreground leading-snug">
                              {item.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </section>

                {/* Course Completion & Certificate Transition Banner */}
                {enrollment?.completed ? (
                  <section className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 backdrop-blur-xl shadow-elev flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">Course Completed!</h3>
                        <p className="text-xs text-muted-foreground">
                          You have fulfilled all module requirements. Head to your dashboard to generate or request your verifiable credential.
                        </p>
                      </div>
                    </div>
                    <Button variant="cta" size="sm" asChild className="shrink-0 font-bold">
                      <Link to="/dashboard">Claim My Certificate</Link>
                    </Button>
                  </section>
                ) : activeModuleIndex === modules.length - 1 ? (
                  <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6 sm:p-8 backdrop-blur-xl shadow-elev flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-left">
                      <div className="h-12 w-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Sparkles className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">Ready to Finish the Course?</h3>
                        <p className="text-xs text-muted-foreground">
                          {sessionCompletedModules.size >= modules.length - 1
                            ? "You have completed your coursework. Mark the final module complete to unlock your verified certificate."
                            : `You still have ${modules.length - sessionCompletedModules.size} unfinished modules. Please complete all preceding chapters to unlock your certificate.`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="hero"
                      size="sm"
                      className="shrink-0 font-bold"
                      onClick={() => {
                        // Mark active module complete too
                        if (activeModule) {
                          setSessionCompletedModules((prev) => new Set(prev).add(activeModule.id));
                        }
                        handleMarkCourseComplete();
                      }}
                      disabled={completingCourse || sessionCompletedModules.size < modules.length - 1}
                    >
                      {completingCourse
                        ? "Updating..."
                        : sessionCompletedModules.size >= modules.length - 1
                        ? "Complete Course & Get Certificate"
                        : `Complete All Modules First (${sessionCompletedModules.size}/${modules.length})`}
                    </Button>
                  </section>
                ) : null}

                {/* Bottom Navigation Bar */}
                <div className="flex items-center justify-between pt-6 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeModuleIndex === 0}
                    onClick={() => setActiveModuleIndex((prev) => Math.max(0, prev - 1))}
                    className="text-xs font-semibold"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous Module
                  </Button>

                  <span className="text-xs text-muted-foreground font-semibold">
                    {activeModuleIndex + 1} / {modules.length}
                  </span>

                  <Button
                    variant="hero"
                    size="sm"
                    disabled={activeModuleIndex === modules.length - 1}
                    onClick={() => {
                      // Automatically mark current module as complete in-session when proceeding
                      if (activeModule) {
                        setSessionCompletedModules((prev) => new Set(prev).add(activeModule.id));
                      }
                      setActiveModuleIndex((prev) => Math.min(modules.length - 1, prev + 1));
                    }}
                    className="text-xs font-semibold"
                  >
                    Next Module <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="h-12 w-12 rounded-full bg-muted/20 text-muted-foreground flex items-center justify-center mx-auto">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">No Modules Available</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Curriculum details are being finalized by the instructor. Please check back shortly.
                </p>
                <Button variant="outline" asChild size="sm">
                  <Link to="/dashboard">Return to Dashboard</Link>
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
