import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { downloadDemoFile } from "@/features/library/download";
import { usePurchases } from "@/features/library/usePurchases";
import { useEnrollments } from "@/features/library/useEnrollments";
import { useCertificates } from "@/hooks/useCertificates";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { BookOpen, Download, User as UserIcon, Bell, LayoutDashboard, MapPin, Info, Settings, LogOut, ChevronRight, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProfileEditForm } from "@/features/dashboard/ProfileEditForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateGenerator } from "@/features/certificates/CertificateGenerator";

function CertificatesSection({ profile }: { profile: any }) {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [certRes, enrollRes] = await Promise.all([
        (supabase as any).from("certificates").select("*, courses(title)").eq("user_id", user.id),
        (supabase as any).from("course_enrollments").select("*, courses(title)").eq("user_id", user.id).eq("completed", true)
      ]);

      setCertificates(certRes.data || []);
      setCompletedEnrollments(enrollRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRequest = async (courseId: string) => {
    if (!user) return;
    setRequesting(courseId);
    try {
      const { error } = await (supabase as any).from("certificates").upsert({
        user_id: user.id,
        course_id: courseId,
        status: "pending",
        certificate_path: "" // Placeholder
      }, { onConflict: "user_id,course_id" });
      if (error) throw error;
      toast({ title: "Request Submitted", description: "Your certificate is now pending approval." });
      await fetchData();
    } catch (e: any) {
      toast({ title: "Request Failed", description: e.message, variant: "destructive" });
    } finally {
      setRequesting(null);
    }
  };



  if (loading) return <div className="p-8 text-center"><div className="h-8 w-8 animate-spin mx-auto text-primary border-2 border-primary border-t-transparent rounded-full" /></div>;

  // Filter logic
  const approvedCerts = certificates.filter(c => c.status === 'approved' || !c.status); // Handle legacy records without status as approved

  // Enrollments that are completed but don't have an approved certificate
  const pendingOrNew = completedEnrollments.filter(e => {
    const cert = certificates.find(c => c.course_id === e.course_id);
    return !cert || cert.status !== 'approved';
  });

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-border/60 bg-card/25 p-8 backdrop-blur-xl shadow-elev">
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> My Certificates
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your achievements and request certificates.</p>
      </header>

      {/* Eligible / Pending Section */}
      {pendingOrNew.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold px-2">Ready for Certificate</h3>
          <div className="grid gap-4">
            {pendingOrNew.map(enroll => {
              const cert = certificates.find(c => c.course_id === enroll.course_id);
              const isPending = cert?.status === 'pending';
              const isRejected = cert?.status === 'rejected';

              return (
                <Card key={enroll.course_id} className="rounded-3xl border-border/60 bg-card/25 shadow-elev">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{enroll.courses?.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Completed on {new Date(enroll.updated_at || enroll.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {isPending ? (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-4 py-1.5 text-xs">
                        Pending Approval
                      </Badge>
                    ) : isRejected ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Rejected</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleRequest(enroll.course_id)} disabled={!!requesting}>
                          Retry Request
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="cta"
                        size="sm"
                        onClick={() => handleRequest(enroll.course_id)}
                        disabled={!!requesting}
                      >
                        {requesting === enroll.course_id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          "Request Certificate"
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved Certificates */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold px-2">Earned Certificates</h3>
        {approvedCerts.length === 0 ? (
          <Card className="rounded-3xl border-border/60 bg-card/25 p-8 text-center shadow-elev border-dashed">
            <h3 className="text-sm font-semibold text-muted-foreground">No approved certificates yet.</h3>
          </Card>
        ) : (
          <div className="grid gap-4">
            {approvedCerts.map((cert) => (
              <Card key={cert.id} className="group overflow-hidden rounded-3xl border-border/60 bg-card/25 shadow-elev transition-all hover:bg-card/30">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold text-lg">{cert.courses?.title || "Course Certificate"}</div>
                      <div className="text-xs text-muted-foreground">Issued on {new Date(cert.issued_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <CertificateGenerator
                    studentName={profile?.full_name || "Student"}
                    courseTitle={cert.courses?.title || "Course"}
                    issueDate={new Date(cert.issued_at).toLocaleDateString()}
                    certificateId={cert.id}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { data: notifications = [], isLoading } = useNotifications();

  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-muted/20" />;

  return (
    <div className="rounded-3xl border border-border/60 bg-card/25 p-6 shadow-elev">
      <div className="flex items-center gap-2 text-lg font-extrabold">
        <Bell className="h-5 w-5 text-primary" /> Notifications
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Latest updates and messages.</p>

      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-sm text-muted-foreground">No notifications found.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border/70 bg-background/15 p-4">
              <div className="font-semibold">{n.title}</div>
              <div className="mt-1 text-sm">{n.message}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString()} • {n.type.toUpperCase()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const sidebarItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "profile", label: "My Profile", icon: UserIcon },
  { key: "courses", label: "My Courses", icon: BookOpen },
  { key: "downloads", label: "My Downloads", icon: Download },
  { key: "certificates", label: "Certificates", icon: ShieldCheck },
  { key: "notifications", label: "Notifications", icon: Bell },
] as const;

type SidebarKey = (typeof sidebarItems)[number]["key"];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<SidebarKey>("overview");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: purchases = [] } = usePurchases();
  const { data: enrollments = [] } = useEnrollments();
  const { data: certificates = [] } = useCertificates();
  const { data: profile } = useProfile();

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => p.item_type.toLowerCase() !== 'course');
  }, [purchases]);

  const fetchCertData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["certificates", user?.id] });
  };

  const fetchProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
  };

  const markAsComplete = async (enrollmentId: string, courseId: string) => {
    if (!user) return;
    setActionLoading(enrollmentId);
    try {
      // Mark enrollment as complete
      const { error: completeError } = await (supabase as any)
        .from("course_enrollments")
        .update({ completed: true })
        .eq("id", enrollmentId);

      if (completeError) throw completeError;

      toast({ title: "Course Completed!", description: "You can now request your certificate." });
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestCertificate = async (courseId: string) => {
    if (!user) return;
    setActionLoading(`cert-${courseId}`);
    try {
      const { error: certError } = await (supabase as any).from("certificates").upsert({
        user_id: user.id,
        course_id: courseId,
        status: "pending",
        certificate_path: ""
      }, { onConflict: "user_id,course_id" });

      if (certError) throw certError;

      toast({ title: "Request Submitted", description: "Your certificate is now pending approval." });
      await fetchCertData();
    } catch (e: any) {
      toast({ title: "Request Failed", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  const initials = useMemo(() => {
    const base = profile?.full_name || user?.email || "Student";
    const parts = base.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "S";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return `${a}${b}`.toUpperCase();
  }, [profile?.full_name, user?.email]);

  const studentId = useMemo(() => {
    if (!user?.id) return "IM-XXXXXX";
    return `IM-${user.id.substring(0, 8).toUpperCase()}`;
  }, [user?.id]);

  useEffect(() => {
    // Redirect admins to admin panel
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

  return (
    <AmbientSpotlight>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="h-fit rounded-3xl border border-border/60 bg-card/25 p-6 backdrop-blur-xl shadow-elev sticky top-10">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-28 w-28 rounded-full border-2 border-primary/20 p-1 group-hover:scale-105 transition-transform duration-300 relative z-10 shadow-glow">
                  <AvatarImage src={profile?.avatar_url} className="rounded-full object-cover" />
                  <AvatarFallback className="bg-gradient-brand text-3xl font-black text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -inset-2 rounded-full bg-primary/20 blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
              <div className="mt-5 text-2xl font-black tracking-tight">{profile?.full_name || "Student"}</div>
              <div className="mt-1 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                {studentId}
              </div>
              <div className="mt-3 text-xs text-muted-foreground font-medium opacity-70">{user?.email}</div>
            </div>

            <div className="mt-10 space-y-2">
              {sidebarItems.map((it) => (
                <button
                  key={it.key}
                  onClick={() => setActive(it.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3.5 text-left text-sm font-bold text-muted-foreground transition-all duration-300 hover:bg-background/40 hover:text-foreground",
                    active === it.key && "bg-background/50 border-border/50 text-foreground shadow-sm bg-gradient-brand/5",
                  )}
                >
                  <it.icon className={cn("h-4 w-4 transition-colors", active === it.key ? "text-primary" : "text-muted-foreground/50")} />
                  {it.label}
                  {active === it.key && <ChevronRight className="ml-auto h-3 w-3 text-primary animate-in fade-in slide-in-from-left-2" />}
                </button>
              ))}
              <div className="pt-4 mt-4 border-t border-border/20">
                <button
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-destructive transition-all duration-300 hover:bg-destructive/10"
                  onClick={async () => {
                    await signOut();
                    toast({ title: "Signed out", description: "Come back soon!" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            {active === "overview" && (
              <>
                <header className="rounded-3xl border border-border/60 bg-card/25 p-8 backdrop-blur-xl shadow-elev relative overflow-hidden">
                  <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Welcome back,</h1>
                    <p className="mt-2 text-lg font-medium text-primary">{profile?.full_name || "Student"}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">Premium Student</Badge>
                      <Badge variant="outline" className="bg-background/50 border-border/50 px-3 py-1">Active Enrollment</Badge>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
                </header>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="rounded-3xl border-border/60 bg-card/25 backdrop-blur-sm shadow-elev hover:bg-card/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Library Access</CardDescription>
                      <CardTitle className="text-3xl font-black tabular-nums">{filteredPurchases.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Purchased e-books and SOPs</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-border/60 bg-card/25 backdrop-blur-sm shadow-elev hover:bg-card/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardDescription className="font-bold uppercase tracking-widest text-[10px]">My Courses</CardDescription>
                      <CardTitle className="text-3xl font-black tabular-nums">{enrollments.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Active course enrollments</p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-border/60 bg-card/25 backdrop-blur-sm shadow-elev hover:bg-card/30 transition-colors">
                    <CardHeader className="pb-2">
                      <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Certificates</CardDescription>
                      <CardTitle className="text-3xl font-black tabular-nums">{certificates.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Earned achievements</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {active === "profile" && (
              <div className="space-y-6">
                <header className="rounded-3xl border border-border/60 bg-card/25 p-8 backdrop-blur-xl shadow-elev flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                      <UserIcon className="h-6 w-6 text-primary" /> My Profile
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">Manage your personal information and student credentials.</p>
                  </div>
                  <Button variant={isEditing ? "outline" : "hero"} onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                  </Button>
                </header>

                <div className="grid gap-6">
                  {isEditing ? (
                    <div className="rounded-3xl border border-border/60 bg-card/25 p-8 backdrop-blur-xl shadow-elev animate-in fade-in slide-in-from-bottom-5 duration-500">
                      <ProfileEditForm
                        userId={user!.id}
                        initialData={profile || { full_name: "", phone: "", avatar_url: "" }}
                        onSuccess={() => {
                          setIsEditing(false);
                          void fetchProfile();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Card className="rounded-3xl border-border/60 bg-card/25 shadow-elev">
                        <CardHeader>
                          <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Contact Information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Bell className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</div>
                              <div className="text-sm font-semibold break-all">{user?.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">Phone Number</div>
                              <div className="text-sm font-semibold">{profile?.phone || "Not set"}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-3xl border-border/60 bg-card/25 shadow-elev">
                        <CardHeader>
                          <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Student ID details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">Student ID</div>
                              <div className="text-sm font-black text-primary">{studentId}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[10px] uppercase font-bold text-muted-foreground">Joined Date</div>
                              <div className="text-sm font-semibold">{new Date(user?.created_at || Date.now()).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {(profile?.bio || profile?.location) && (
                        <Card className="rounded-3xl border-border/60 bg-card/25 shadow-elev sm:col-span-2">
                          <CardHeader>
                            <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Professional Summary</CardDescription>
                          </CardHeader>
                          <CardContent className="grid gap-6 sm:grid-cols-2">
                            {profile?.location && (
                              <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Location</div>
                                  <div className="text-sm font-semibold">{profile.location}</div>
                                </div>
                              </div>
                            )}
                            {profile?.bio && (
                              <div className="flex items-start gap-3 sm:col-span-2">
                                <Info className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Bio</div>
                                  <div className="text-sm text-foreground leading-relaxed mt-1">{profile.bio}</div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {active === "courses" && (
              <div className="rounded-3xl border border-border/60 bg-card/25 p-6 shadow-elev">
                <div className="flex items-center gap-2 text-lg font-extrabold">
                  <BookOpen className="h-5 w-5 text-primary" /> My Courses
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Your active course enrollments.</p>
                <div className="mt-4 space-y-3">
                  {enrollments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">You have not enrolled in any courses yet.</div>
                  ) : (
                    enrollments.map((enr: any) => (
                      <div key={enr.id} className="rounded-2xl border border-border/70 bg-background/15 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{enr.courses?.title || "Unknown Course"}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              Enrolled: {new Date(enr.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {enr.completed ? (
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-[10px] sm:text-xs bg-green-500/15 text-green-500 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)] animate-in fade-in zoom-in duration-500">
                                <ShieldCheck className="h-3 w-3" /> Course Completed
                              </div>
                              {(() => {
                                const cert = certificates.find(c => c.course_id === enr.course_id);
                                const isRequesting = actionLoading === `cert-${enr.course_id}`;

                                if (!cert && !isRequesting) {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="cta"
                                      className="h-7 text-[10px] px-3 font-bold"
                                      onClick={() => handleRequestCertificate(enr.course_id)}
                                      disabled={isRequesting}
                                    >
                                      Request for Certificate
                                    </Button>
                                  );
                                } else if (isRequesting || (cert && cert.status === 'pending')) {
                                  return (
                                    <Badge variant="outline" className="bg-yellow-500/15 text-yellow-500 border-yellow-500/30 px-2.5 py-1 text-[10px] font-bold shadow-[0_0_10px_rgba(234,179,8,0.1)] animate-pulse">
                                      Certificate Request Pending
                                    </Badge>
                                  );
                                } else if (cert && cert.status === 'rejected') {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="cta"
                                      className="h-7 text-[10px] px-3 font-bold"
                                      onClick={() => handleRequestCertificate(enr.course_id)}
                                      disabled={isRequesting}
                                    >
                                      Retry Request
                                    </Button>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-[10px] sm:text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold border border-primary/20">
                                Active
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => markAsComplete(enr.id, enr.course_id)} disabled={actionLoading === enr.id}>
                                {actionLoading === enr.id ? "Updating..." : "Mark Complete"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {active === "downloads" && (
              <div className="rounded-3xl border border-border/60 bg-card/25 p-6 shadow-elev">
                <div className="flex items-center gap-2 text-lg font-extrabold">
                  <Download className="h-5 w-5 text-primary" /> My Downloads
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Your purchased demo E-books and SOPs.</p>

                <div className="mt-4 space-y-3">
                  {filteredPurchases.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No downloads yet. Go to the Library and complete a demo payment.
                    </div>
                  ) : (
                    filteredPurchases.map((p) => (
                      <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-background/15 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{p.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {p.item_type.toUpperCase()} • ৳{(p.amount_cents / 100).toFixed(2)} (demo)
                          </div>
                        </div>
                        <Button
                          variant="cta"
                          size="sm"
                          onClick={() =>
                            downloadDemoFile(
                              `${p.item_key}.txt`,
                              `DEMO DOWNLOAD\n\n${p.title}\n\nThis is demo content. Replace with real files later.\n`,
                            )
                          }
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {active === "notifications" && (
              <NotificationsSection />
            )}

            {active === "certificates" && (
              <CertificatesSection profile={profile} />
            )}
          </section>
        </div>
      </main>
    </AmbientSpotlight>
  );
}

