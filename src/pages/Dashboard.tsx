import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/seo/SEOHead";
import { useQueryClient } from "@tanstack/react-query";
import { downloadDemoFile } from "@/features/library/download";
import { usePurchases } from "@/features/library/usePurchases";
import { useEnrollments } from "@/features/library/useEnrollments";
import { useCertificates } from "@/hooks/useCertificates";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { useStudentPortfolio } from "@/hooks/usePortfolio";
import { formatCourseTitle } from "@/lib/formatTitle";
import {
  BookOpen,
  Download,
  User as UserIcon,
  Bell,
  LayoutDashboard,
  MapPin,
  Info,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Award,
  Lock,
  ArrowUpRight,
  MessageCircle,
  FolderKanban,
  GraduationCap,
  AlertTriangle,
  PlayCircle,
  Share2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditForm } from "@/features/dashboard/ProfileEditForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CertificateGenerator } from "@/features/certificates/CertificateGenerator";

// Sub-component: Certificates Section
function CertificatesSection({
  profile,
  enrollments,
  certificates,
  onRefresh,
}: {
  profile: any;
  enrollments: any[];
  certificates: any[];
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState<string | null>(null);

  const studentDisplayName = useMemo(() => {
    if (profile?.full_name && profile.full_name.trim()) {
      return profile.full_name.trim();
    }
    if (user?.user_metadata?.full_name && String(user.user_metadata.full_name).trim()) {
      return String(user.user_metadata.full_name).trim();
    }
    if (user?.user_metadata?.name && String(user.user_metadata.name).trim()) {
      return String(user.user_metadata.name).trim();
    }
    if (user?.email) {
      const prefix = user.email.split("@")[0].replace(/[._-]/g, " ").trim();
      return prefix
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
    return "Valued Student";
  }, [profile?.full_name, user?.user_metadata, user?.email]);

  const approvedCerts = useMemo(() => {
    return certificates.filter((c) => c.status === "approved" || !c.status);
  }, [certificates]);

  const pendingCerts = useMemo(() => {
    return certificates.filter((c) => c.status === "pending");
  }, [certificates]);

  // Courses that are 100% completed but don't have an approved certificate yet
  const eligibleCourses = useMemo(() => {
    return enrollments.filter((e) => {
      if (!e.completed) return false;
      const cert = certificates.find((c) => c.course_id === e.course_id);
      return !cert || cert.status !== "approved";
    });
  }, [enrollments, certificates]);

  // Active in-progress courses (certificates locked)
  const inProgressCourses = useMemo(() => {
    return enrollments.filter((e) => !e.completed && e.status === "active");
  }, [enrollments]);

  const handleRequestCertificate = async (courseId: string) => {
    if (!user) return;

    // Security verify: ensure the enrollment is completed
    const targetEnrollment = enrollments.find((e) => e.course_id === courseId);
    if (!targetEnrollment || !targetEnrollment.completed) {
      toast({
        title: "Course Not Completed",
        description: "You must complete 100% of all curriculum lessons inside the classroom before claiming your certificate.",
        variant: "destructive",
      });
      return;
    }

    setRequesting(courseId);
    try {
      const { error } = await (supabase as any).from("certificates").upsert(
        {
          user_id: user.id,
          course_id: courseId,
          status: "pending",
          certificate_path: "",
        },
        { onConflict: "user_id,course_id" },
      );

      if (error) throw error;
      toast({
        title: "Request Submitted Successfully",
        description: "Your official certificate is now pending admin verification.",
      });
      onRefresh();
    } catch (e: any) {
      toast({
        title: "Request Failed",
        description: e.message || "Failed to submit certificate request.",
        variant: "destructive",
      });
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
            <Award className="h-3.5 w-3.5" /> Official Credentials
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            Certificates & Achievements
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
            IndustryMentor verified credentials with unique cryptographic IDs and instant online verification for your CV & LinkedIn.
          </p>
        </div>
      </header>

      {/* Eligible / Pending Approval Section */}
      {eligibleCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Eligible for Certificate Claim</h3>
          </div>
          <div className="grid gap-4">
            {eligibleCourses.map((enroll) => {
              const cert = certificates.find((c) => c.course_id === enroll.course_id);
              const isPending = cert?.status === "pending";
              const isRejected = cert?.status === "rejected";

              return (
                <Card
                  key={enroll.course_id}
                  className="rounded-xl border-border/60 bg-card/60 backdrop-blur-xs shadow-xs transition-all hover:border-primary/30"
                >
                  <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-base text-foreground">
                          {formatCourseTitle(enroll.courses?.title) || "Completed Course"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Curriculum 100% Completed
                        </div>
                      </div>
                    </div>

                    <div>
                      {isPending ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 border-amber-500/30 px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Clock className="h-3.5 w-3.5" /> Verification in Review
                        </Badge>
                      ) : isRejected ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            Rejected
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestCertificate(enroll.course_id)}
                            disabled={requesting === enroll.course_id}
                          >
                            Retry Claim
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="hero"
                          size="sm"
                          className="h-9 px-4 text-xs font-bold gap-1.5 shadow-xs"
                          onClick={() => handleRequestCertificate(enroll.course_id)}
                          disabled={requesting === enroll.course_id}
                        >
                          {requesting === enroll.course_id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <>
                              <Award className="h-3.5 w-3.5" />
                              Claim Certificate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Earned & Approved Certificates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-foreground">
            Earned Certificates ({approvedCerts.length})
          </h3>
        </div>

        {approvedCerts.length === 0 ? (
          <Card className="rounded-xl border-dashed border-border/70 bg-card/25 p-8 text-center shadow-none">
            <div className="h-12 w-12 rounded-xl bg-muted/30 mx-auto flex items-center justify-center text-muted-foreground mb-3">
              <Award className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">No approved certificates yet</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Finish 100% of your course modules inside the classroom to unlock your official IndustryMentor certificate.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {approvedCerts.map((cert) => (
              <Card
                key={cert.id}
                className="group overflow-hidden rounded-xl border-border/60 bg-card/60 backdrop-blur-xs shadow-xs transition-all hover:border-emerald-500/30 hover:shadow-xs"
              >
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-foreground">
                        {formatCourseTitle(cert.courses?.title) || "Certified Graduate"}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
                        <span>Issued: {new Date(cert.issued_at || Date.now()).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] bg-muted/40 px-2 py-0.5 rounded border border-border/40">
                          ID: {cert.id.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-semibold gap-1.5"
                      asChild
                    >
                      <Link to={`/verify/${cert.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" /> Verify Online
                      </Link>
                    </Button>

                    <CertificateGenerator
                      studentName={studentDisplayName}
                      courseTitle={cert.courses?.title || "Industry Specialization"}
                      issueDate={new Date(cert.issued_at || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      certificateId={cert.id}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* In-Progress Milestones (Locked Certificates) */}
      {inProgressCourses.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center gap-2 px-1">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-base font-bold text-muted-foreground">Milestones in Progress</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {inProgressCourses.map((enr) => {
              const progress = enr.progress_percent || 0;
              return (
                <div
                  key={enr.id}
                  className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-2.5 backdrop-blur-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground line-clamp-1">
                      {formatCourseTitle(enr.courses?.title) || "Enrolled Course"}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-muted/30 shrink-0">
                      Locked
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Curriculum Progress</span>
                      <span className="font-semibold text-primary">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Complete 100% of lessons in classroom to unlock this certificate.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Notifications Section
function NotificationsSection() {
  const { data: notifications = [], isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-xl bg-muted/20" />
        <div className="h-20 animate-pulse rounded-xl bg-muted/20" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" /> Notifications & Alerts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Account updates, payment verifications, and system announcements.
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          {notifications.length} Total
        </Badge>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            You're all caught up! No unread notifications.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5 transition-all hover:bg-background/60 hover:border-primary/30 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-foreground">{n.title}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
                  {n.type || "INFO"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Sub-component: Projects & Portfolio Section
function PortfolioProjectsSection({
  portfolio,
  enrollments,
}: {
  portfolio: any;
  enrollments: any[];
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-3">
          <FolderKanban className="h-3.5 w-3.5" /> Career Showcase
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Industrial Projects & Portfolio
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">
          Stand out to tech recruiters and clients. Complete real-world industrial projects, get mentor reviews, and showcase your verified work on your personal IndustryMentor portfolio.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Portfolio Showcase Card */}
        <Card className="rounded-xl border-border/60 bg-card/50 backdrop-blur-xs shadow-xs flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Live Public Profile
              </span>
              {portfolio?.is_published ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                  Published
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  Draft
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl font-bold mt-2">Personal Industry Portfolio</CardTitle>
            <CardDescription className="text-xs">
              {portfolio?.slug
                ? `industrymentor.net/portfolio/${portfolio.slug}`
                : "Create your branded portfolio link to share with hiring managers."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Showcase Items:</span>
                <span className="font-bold text-foreground">{portfolio?.items?.length || 0} Projects</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Domain Track:</span>
                <span className="font-bold text-foreground">
                  {portfolio?.career_path?.title || (portfolio ? "General Industrial Track" : "Not Configured")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="hero"
                size="sm"
                className="flex-1 text-xs font-bold h-9"
                onClick={() => navigate("/portfolio")}
              >
                Manage Portfolio
              </Button>
              {portfolio?.slug && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold h-9"
                  asChild
                >
                  <Link to={`/portfolio/${portfolio.slug}`} target="_blank">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Industrial Projects Library Card */}
        <Card className="rounded-xl border-border/60 bg-card/50 backdrop-blur-xs shadow-xs flex flex-col justify-between">
          <CardHeader>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Hands-on Experience
            </span>
            <CardTitle className="text-xl font-bold mt-2">Real-World Industry Projects</CardTitle>
            <CardDescription className="text-xs">
              Work on production-grade briefs designed by senior mentors to bridge academic knowledge with industry demands.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/20 border border-border/40 text-xs space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Production architectural patterns
              </div>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Code reviews & mentor feedback
              </div>
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Direct integration into your portfolio
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold h-9 gap-1.5"
              onClick={() => navigate("/projects")}
            >
              Explore Industrial Projects <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const sidebarItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "courses", label: "My Courses", icon: BookOpen },
  { key: "certificates", label: "Certificates", icon: ShieldCheck },
  { key: "portfolio", label: "Projects & Portfolio", icon: FolderKanban },
  { key: "downloads", label: "My Downloads", icon: Download },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile & Account", icon: UserIcon },
] as const;

type SidebarKey = (typeof sidebarItems)[number]["key"];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<SidebarKey>("overview");
  const [courseFilter, setCourseFilter] = useState<"all" | "active" | "pending" | "completed">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: purchases = [] } = usePurchases();
  const { data: enrollments = [], refetch: refetchEnrollments } = useEnrollments();
  const { data: certificates = [], refetch: refetchCertificates } = useCertificates();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: portfolio } = useStudentPortfolio();

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => p.item_type.toLowerCase() !== "course");
  }, [purchases]);

  const [isEditing, setIsEditing] = useState(false);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const initials = useMemo(() => {
    const base = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Student";
    const parts = base.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "S";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return `${a}${b}`.toUpperCase();
  }, [profile?.full_name, user?.user_metadata, user?.email]);

  const studentId = useMemo(() => {
    if (!user?.id) return "IM-XXXXXX";
    return `IM-${user.id.substring(0, 8).toUpperCase()}`;
  }, [user?.id]);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast({
        title: `${label} Copied!`,
        description: text,
      });
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Status partitions
  const activeEnrollments = useMemo(() => {
    return enrollments.filter((e: any) => e.status === "active" && !e.completed);
  }, [enrollments]);

  const pendingEnrollments = useMemo(() => {
    return enrollments.filter((e: any) => e.status === "pending");
  }, [enrollments]);

  const completedEnrollments = useMemo(() => {
    return enrollments.filter((e: any) => Boolean(e.completed));
  }, [enrollments]);

  const approvedCertificates = useMemo(() => {
    return certificates.filter((c: any) => c.status === "approved" || !c.status);
  }, [certificates]);

  const eligibleCourses = useMemo(() => {
    return enrollments.filter((e: any) => {
      if (!e.completed) return false;
      const cert = certificates.find((c: any) => c.course_id === e.course_id);
      return !cert || cert.status !== "approved";
    });
  }, [enrollments, certificates]);

  // Filtered courses based on current pill
  const visibleEnrollments = useMemo(() => {
    if (courseFilter === "active") return activeEnrollments;
    if (courseFilter === "pending") return pendingEnrollments;
    if (courseFilter === "completed") return completedEnrollments;
    return enrollments;
  }, [courseFilter, enrollments, activeEnrollments, pendingEnrollments, completedEnrollments]);

  // Admin redirect check
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data: adminFlag } = await (supabase as any).rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (adminFlag) {
        navigate("/admin", { replace: true });
      }
    };
    void checkAdmin();
  }, [user]);

  const refreshAll = () => {
    refetchEnrollments();
    refetchCertificates();
    refetchProfile();
  };

  return (
    <AmbientSpotlight>
      <SEOHead title="Student Dashboard | IndustryMentor" noindex={true} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Modern Sidebar */}
          <aside className="h-fit rounded-xl border border-border/60 bg-card/40 p-5 sm:p-6 backdrop-blur-xl shadow-xs sticky top-6 space-y-6">
            {/* Student Profile Card in Sidebar */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group cursor-pointer" onClick={() => setActive("profile")}>
                <Avatar className="h-24 w-24 rounded-full border-2 border-primary/30 p-1 group-hover:scale-105 transition-all duration-300 relative z-10 shadow-xs">
                  <AvatarImage src={profile?.avatar_url} className="rounded-full object-cover" />
                  <AvatarFallback className="bg-gradient-brand text-2xl font-bold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="mt-4 text-xl font-bold tracking-tight text-foreground line-clamp-1">
                {profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Student"}
              </div>

              {/* Student ID pill with copy button */}
              <button
                onClick={() => copyToClipboard(studentId, "Student ID")}
                title="Click to copy Student ID"
                className="mt-2 flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1 text-[11px] font-mono font-bold text-primary transition-colors cursor-pointer"
              >
                <span>{studentId}</span>
                {copiedId === studentId ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3 opacity-70" />
                )}
              </button>

              <div className="mt-2 text-xs text-muted-foreground truncate max-w-[200px]">
                {user?.email}
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5 pt-2 border-t border-border/40">
              {sidebarItems.map((it) => {
                const isActive = active === it.key;
                return (
                  <button
                    key={it.key}
                    onClick={() => setActive(it.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 border-primary/25 text-primary shadow-xs font-semibold"
                        : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <it.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/60",
                      )}
                    />
                    <span className="flex-1">{it.label}</span>
                    {it.key === "courses" && pendingEnrollments.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    )}
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-primary animate-in fade-in" />
                    )}
                  </button>
                );
              })}

              <div className="pt-4 border-t border-border/40">
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold text-destructive transition-all duration-200 hover:bg-destructive/10"
                  onClick={async () => {
                    await signOut();
                    toast({ title: "Signed out successfully", description: "See you next time!" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Dashboard Panel */}
          <section className="space-y-6">
            {/* OVERVIEW TAB */}
            {active === "overview" && (
              <>
                {/* Hero Banner */}
                <header className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-2">
                      <Sparkles className="h-3.5 w-3.5" /> Student Workspace
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                      {greeting}, {profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || user?.user_metadata?.name?.split(" ")[0] || "Student"}!
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                      Welcome to your learning dashboard. Access courses, track your curriculum progress, manage verified certificates, and build your industrial portfolio.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5 items-center">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 px-3 py-1 text-xs">
                        Verified Learner
                      </Badge>
                      <button
                        onClick={() => copyToClipboard(studentId, "Student ID")}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted/40 hover:bg-muted/70 border border-border/40 text-xs font-mono text-muted-foreground transition-colors cursor-pointer"
                      >
                        <span>ID: {studentId}</span>
                        {copiedId === studentId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-60" />
                        )}
                      </button>
                    </div>
                  </div>
                </header>

                {/* Dynamic Next Recommended Action Card */}
                <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> Next Recommended Action
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {eligibleCourses.length > 0
                        ? "Congratulations! You have completed a course curriculum and your official certificate is ready to claim."
                        : activeEnrollments.length > 0
                          ? `Continue your learning journey with ${formatCourseTitle(activeEnrollments[0]?.courses?.title) || "your active course"} (${activeEnrollments[0]?.progress_percent || 0}% completed).`
                          : pendingEnrollments.length > 0
                            ? "Your course enrollment payment is under review. Our admin team will verify it shortly (usually within 1–2 hours)."
                            : "Start your practical engineering journey with an industry-standard curriculum designed by mentors."}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {eligibleCourses.length > 0 ? (
                      <Button
                        size="sm"
                        variant="hero"
                        className="h-8 text-xs font-bold gap-1.5"
                        onClick={() => setActive("certificates")}
                      >
                        <Award className="h-3.5 w-3.5" /> Claim Certificate
                      </Button>
                    ) : activeEnrollments.length > 0 ? (
                      <Button
                        size="sm"
                        variant="hero"
                        className="h-8 text-xs font-bold gap-1.5"
                        onClick={() =>
                          navigate(`/learn/${activeEnrollments[0]?.courses?.slug || activeEnrollments[0]?.course_id}`)
                        }
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Continue Learning
                      </Button>
                    ) : pendingEnrollments.length > 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300"
                        onClick={() => {
                          setActive("courses");
                          setCourseFilter("pending");
                        }}
                      >
                        <Clock className="h-3.5 w-3.5" /> View Status
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="hero"
                        className="h-8 text-xs font-bold gap-1.5"
                        onClick={() => navigate("/courses")}
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Browse Courses
                      </Button>
                    )}
                  </div>
                </div>

                {/* 4 Metric KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Card 1: Active Courses */}
                  <Card className="rounded-xl border-border/60 bg-card/50 backdrop-blur-xs shadow-xs hover:border-primary/30 transition-all">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                        In Progress
                      </CardDescription>
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                        {activeEnrollments.length}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">In-progress classrooms</p>
                    </CardContent>
                  </Card>

                  {/* Card 2: Pending Verifications */}
                  <Card
                    className={cn(
                      "rounded-xl border-border/60 bg-card/50 backdrop-blur-xs shadow-xs transition-all",
                      pendingEnrollments.length > 0 && "border-amber-500/40 bg-amber-500/[0.03]",
                    )}
                  >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                        Verification Pending
                      </CardDescription>
                      <div
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center",
                          pendingEnrollments.length > 0
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-muted/40 text-muted-foreground",
                        )}
                      >
                        <Clock className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                          {pendingEnrollments.length}
                        </CardTitle>
                        {pendingEnrollments.length > 0 && (
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                            Reviewing
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pendingEnrollments.length > 0 ? "Under admin review (1–2h)" : "All verified"}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 3: Completed Courses */}
                  <Card className="rounded-xl border-border/60 bg-card/50 backdrop-blur-xs shadow-xs hover:border-emerald-500/30 transition-all">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                        Completed
                      </CardDescription>
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                        {completedEnrollments.length}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">100% Curriculums finished</p>
                    </CardContent>
                  </Card>

                  {/* Card 4: Certificates */}
                  <Card className="rounded-xl border-border/60 bg-card/50 backdrop-blur-xs shadow-xs hover:border-primary/30 transition-all">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                        Certificates
                      </CardDescription>
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                        {approvedCertificates.length}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Official verified credentials</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Verification Notice Banner (if any) */}
                {pendingEnrollments.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 backdrop-blur-xs space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm sm:text-base text-foreground">
                          Payment Verification in Progress ({pendingEnrollments.length} Course)
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your MFS transaction ID has been safely submitted. Our admin team will verify the payment within 1–2 hours. Once approved, your classroom will unlock automatically.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2.5 items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 font-semibold border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        onClick={() => {
                          setActive("courses");
                          setCourseFilter("pending");
                        }}
                      >
                        View Verification Details
                      </Button>
                      <a
                        href={`https://wa.me/8801973300407?text=Hello%20IndustryMentor%20Admin,%20please%20verify%20my%20course%20enrollment.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold ml-2"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support
                      </a>
                    </div>
                  </div>
                )}

                {/* Resume Learning Section */}
                {activeEnrollments.length > 0 ? (
                  <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <PlayCircle className="h-5 w-5 text-primary" /> Resume Learning
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary font-bold hover:bg-primary/10"
                        onClick={() => {
                          setActive("courses");
                          setCourseFilter("active");
                        }}
                      >
                        View All Active ({activeEnrollments.length})
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {activeEnrollments.slice(0, 2).map((enr: any) => {
                        const progress = enr.progress_percent || 0;
                        return (
                          <div
                            key={enr.id}
                            className="p-5 rounded-xl border border-border/60 bg-background/40 flex flex-col justify-between gap-4 hover:border-primary/40 transition-all hover:bg-background/60 shadow-xs"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                  In Progress
                                </span>
                                <span className="text-xs font-bold text-primary">{progress}%</span>
                              </div>
                              <div className="font-bold text-base text-foreground line-clamp-1">
                                {formatCourseTitle(enr.courses?.title) || "Enrolled Course"}
                              </div>
                              <Progress value={progress} className="h-1.5" />
                              <div className="text-[11px] text-muted-foreground">
                                Enrolled {new Date(enr.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="hero"
                              className="w-full text-xs font-bold h-9 gap-1.5"
                              onClick={() =>
                                navigate(`/learn/${enr.courses?.slug || enr.course_id}`)
                              }
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              Continue Learning
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <Card className="rounded-xl border border-dashed border-border/70 bg-card/25 p-8 text-center shadow-none">
                    <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                    <h3 className="font-bold text-sm text-foreground">No active course in progress</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Explore industry-aligned courses taught by experienced practitioners to boost your career.
                    </p>
                    <Button
                      size="sm"
                      variant="hero"
                      className="mt-4 text-xs font-bold"
                      onClick={() => navigate("/courses")}
                    >
                      Browse Courses
                    </Button>
                  </Card>
                )}

                {/* Quick Shortcuts to Portfolio & Library */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    onClick={() => setActive("portfolio")}
                    className="group cursor-pointer rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur-xs hover:border-primary/40 transition-all hover:bg-card/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <FolderKanban className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="mt-4 font-bold text-base text-foreground">Industrial Portfolio</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Publish real projects, get code reviews, and share your verified portfolio with employers.
                    </p>
                  </div>

                  <div
                    onClick={() => setActive("downloads")}
                    className="group cursor-pointer rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur-xs hover:border-primary/40 transition-all hover:bg-card/60"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                        <Download className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="mt-4 font-bold text-base text-foreground">Resource Downloads</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Access all your purchased E-books, architecture templates, and industry standard SOPs.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* MY COURSES TAB */}
            {active === "courses" && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" /> My Courses
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your active classrooms, verification statuses, and completed courses.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-border/40 pb-4">
                  <button
                    onClick={() => setCourseFilter("all")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                      courseFilter === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    All ({enrollments.length})
                  </button>
                  <button
                    onClick={() => setCourseFilter("active")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                      courseFilter === "active"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    Active Learning ({activeEnrollments.length})
                  </button>
                  <button
                    onClick={() => setCourseFilter("pending")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5",
                      courseFilter === "pending"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    Pending Verification ({pendingEnrollments.length})
                    {pendingEnrollments.length > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </button>
                  <button
                    onClick={() => setCourseFilter("completed")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer",
                      courseFilter === "completed"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground",
                    )}
                  >
                    Completed ({completedEnrollments.length})
                  </button>
                </div>

                {/* Course List */}
                <div className="space-y-4">
                  {visibleEnrollments.length === 0 ? (
                    <Card className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground shadow-none">
                      No courses found in this category.
                    </Card>
                  ) : (
                    visibleEnrollments.map((enr: any) => {
                      const isPending = enr.status === "pending";
                      const isCompleted = Boolean(enr.completed);
                      const progress = isCompleted ? 100 : enr.progress_percent || 0;
                      const cert = certificates.find((c: any) => c.course_id === enr.course_id);

                      return (
                        <div
                          key={enr.id}
                          className={cn(
                            "rounded-xl border bg-background/40 p-5 sm:p-6 transition-all hover:bg-background/60 space-y-4",
                            isPending
                              ? "border-amber-500/30 hover:border-amber-500/50"
                              : isCompleted
                                ? "border-emerald-500/30 hover:border-emerald-500/50"
                                : "border-border/60 hover:border-primary/40",
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-base sm:text-lg text-foreground truncate">
                                  {formatCourseTitle(enr.courses?.title) || "Enrolled Course"}
                                </span>

                                {isPending ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                                  >
                                    <Clock className="h-3 w-3" /> Pending Verification
                                  </Badge>
                                ) : isCompleted ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 shrink-0"
                                  >
                                    <ShieldCheck className="h-3 w-3" /> Completed 100%
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-primary/10 text-primary border-primary/25 text-[11px] font-semibold shrink-0"
                                  >
                                    Active Classroom
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Enrolled on {new Date(enr.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            {/* Actions on right */}
                            <div className="flex items-center flex-wrap gap-2.5 sm:self-center">
                              {isPending ? (
                                <a
                                  href={`https://wa.me/8801973300407?text=Hello%20IndustryMentor%20Admin,%20please%20verify%20my%20course%20enrollment.%20TrxID:%20${enr.transaction_id || "N/A"}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 text-xs font-bold transition-colors"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Support
                                </a>
                              ) : isCompleted ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-bold gap-1.5"
                                    onClick={() =>
                                      navigate(`/learn/${enr.courses?.slug || enr.course_id}`)
                                    }
                                  >
                                    <BookOpen className="h-3.5 w-3.5" />
                                    Review Material
                                  </Button>
                                  {cert ? (
                                    <Button
                                      size="sm"
                                      variant="hero"
                                      className="h-8 text-xs font-bold gap-1.5"
                                      onClick={() => setActive("certificates")}
                                    >
                                      <Award className="h-3.5 w-3.5" /> View Certificate
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="hero"
                                      className="h-8 text-xs font-bold gap-1.5"
                                      onClick={() => setActive("certificates")}
                                    >
                                      <Award className="h-3.5 w-3.5" /> Claim Certificate
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="hero"
                                  className="h-8 text-xs font-bold gap-1.5"
                                  onClick={() =>
                                    navigate(`/learn/${enr.courses?.slug || enr.course_id}`)
                                  }
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  Continue Learning
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Detail panel for pending vs active */}
                          {isPending ? (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-muted-foreground space-y-2">
                              <div className="flex flex-wrap items-center gap-4 text-foreground font-semibold">
                                <div>
                                  Payment Method:{" "}
                                  <span className="font-mono text-primary uppercase font-bold">
                                    {enr.payment_method || "MFS"}
                                  </span>
                                </div>
                                {enr.transaction_id && (
                                  <div className="flex items-center gap-1.5">
                                    <span>TrxID:</span>
                                    <span className="font-mono font-bold text-foreground">
                                      {enr.transaction_id}
                                    </span>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(enr.transaction_id, "Transaction ID")
                                      }
                                      className="text-primary hover:text-primary/80"
                                      title="Copy TrxID"
                                    >
                                      {copiedId === enr.transaction_id ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                )}
                                {enr.sender_phone && (
                                  <div>
                                    Sender:{" "}
                                    <span className="font-mono font-bold text-foreground">
                                      {enr.sender_phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] leading-relaxed">
                                Our admin team verifies transactions within 1–2 hours. As soon as verified, you will receive full access to the video classroom, quizzes, and code projects.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Curriculum Progress</span>
                                <span className="font-bold text-primary">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* CERTIFICATES TAB */}
            {active === "certificates" && (
              <CertificatesSection
                profile={profile}
                enrollments={enrollments}
                certificates={certificates}
                onRefresh={refreshAll}
              />
            )}

            {/* PROJECTS & PORTFOLIO TAB */}
            {active === "portfolio" && (
              <PortfolioProjectsSection portfolio={portfolio} enrollments={enrollments} />
            )}

            {/* DOWNLOADS TAB */}
            {active === "downloads" && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Download className="h-6 w-6 text-primary" /> My Resource Downloads
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Access your purchased technical E-books, industry checklists, and SOPs.
                  </p>
                </div>

                <div className="space-y-3">
                  {filteredPurchases.length === 0 ? (
                    <Card className="rounded-xl border border-dashed border-border/70 bg-card/25 p-8 text-center shadow-none">
                      <Download className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                      <h4 className="text-sm font-bold text-foreground">No downloads in your library yet</h4>
                      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                        Access official technical E-books, architecture templates, and industry standard SOPs.
                      </p>
                      <Button
                        size="sm"
                        variant="hero"
                        className="mt-4 text-xs font-bold"
                        onClick={() => navigate("/library")}
                      >
                        Explore Resource Library
                      </Button>
                    </Card>
                  ) : (
                    filteredPurchases.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5 transition-all hover:bg-background/60 hover:border-primary/40 shadow-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-base text-foreground truncate">
                            {p.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {p.item_type.toUpperCase()} • ৳{(p.amount_cents / 100).toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="hero"
                          size="sm"
                          className="h-8 text-xs font-bold gap-1.5"
                          onClick={() =>
                            downloadDemoFile(
                              `${p.item_key}.txt`,
                              `RESOURCE DOCUMENT\n\n${p.title}\n\nIndustryMentor Official Technical Document.\n`,
                            )
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download File
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {active === "notifications" && <NotificationsSection />}

            {/* PROFILE TAB */}
            {active === "profile" && (
              <div className="space-y-6">
                <header className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                      <UserIcon className="h-6 w-6 text-primary" /> Student Profile & Account
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Manage your public profile, contact details, and student credentials.
                    </p>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "hero"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                  </Button>
                </header>

                {isEditing ? (
                  <div className="rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
                    <ProfileEditForm
                      key={profile?.updated_at || profile?.id || user!.id}
                      userId={user!.id}
                      initialData={
                        profile || {
                          full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || "",
                          phone: "",
                          avatar_url: "",
                          location: "",
                          bio: "",
                        }
                      }
                      onSuccess={() => {
                        setIsEditing(false);
                        refetchProfile();
                        queryClient.invalidateQueries({ queryKey: ["profile"] });
                      }}
                    />
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Card className="rounded-xl border-border/60 bg-card/50 shadow-xs">
                      <CardHeader>
                        <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                          Contact Information
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              Full Name
                            </div>
                            <div className="text-sm font-semibold truncate text-foreground">
                              {profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "Not set"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              Email Address
                            </div>
                            <div className="text-sm font-semibold truncate text-foreground">
                              {user?.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              Phone Number
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {profile?.phone || "Not set"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border/60 bg-card/50 shadow-xs">
                      <CardHeader>
                        <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                          Student Credentials
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              Student ID
                            </div>
                            <div className="text-sm font-bold text-primary font-mono">
                              {studentId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <LayoutDashboard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground">
                              Member Since
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {(profile?.bio || profile?.location) && (
                      <Card className="rounded-xl border-border/60 bg-card/50 shadow-xs sm:col-span-2">
                        <CardHeader>
                          <CardDescription className="font-bold uppercase tracking-wider text-[10px]">
                            About Me
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                          {profile?.location && (
                            <div className="flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                              <div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Location
                                </div>
                                <div className="text-sm font-semibold text-foreground">
                                  {profile.location}
                                </div>
                              </div>
                            </div>
                          )}
                          {profile?.bio && (
                            <div className="flex items-start gap-3 sm:col-span-2">
                              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                              <div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Bio
                                </div>
                                <div className="text-sm text-foreground leading-relaxed mt-1">
                                  {profile.bio}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </AmbientSpotlight>
  );
}
