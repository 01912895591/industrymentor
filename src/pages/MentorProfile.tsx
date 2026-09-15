import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { type Mentor } from "@/components/mentors/MentorCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Linkedin,
  Share2,
  ShieldCheck,
  Briefcase,
  Layers,
  MessageSquare,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Send,
  CheckCircle2,
  Factory,
  Compass,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/components/auth/AuthProvider";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Valid email address is required").max(255),
  phone: z.string().trim().max(30).optional(),
  topic: z.string().trim().min(3, "Please specify a technical topic (min 3 characters)").max(100),
  message: z.string().trim().min(15, "Please describe your question or context (min 15 characters)").max(1200),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export default function MentorProfile() {
  const { mentorId } = useParams<{ mentorId: string }>();
  const { user } = useAuth();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<InquiryFormValues | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      topic: "",
      message: "",
    },
  });

  // Pre-fill authenticated user's email and profile name if available
  useEffect(() => {
    if (user?.email) {
      setValue("email", user.email);
    }
    if (user) {
      // Attempt to load profile name
      (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.full_name) {
            setValue("name", data.full_name);
          } else if (user.user_metadata?.full_name) {
            setValue("name", user.user_metadata.full_name);
          }
        })
        .catch(() => {
          if (user.user_metadata?.full_name) {
            setValue("name", user.user_metadata.full_name);
          }
        });
    }
  }, [user, setValue, dialogOpen]);

  useEffect(() => {
    async function loadMentor() {
      if (!mentorId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mentorId);
      if (!isUUID) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const { data, error } = await (supabase as any)
          .from("mentors")
          .select("id, name, title, bio, initials, tags, linkedin_url, image_path, created_at")
          .eq("id", mentorId)
          .maybeSingle();

        if (error || !data) {
          setNotFound(true);
        } else {
          setMentor(data);
        }
      } catch (err) {
        console.error("Error loading mentor:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    void loadMentor();
  }, [mentorId]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const onInquirySubmit = async (values: InquiryFormValues) => {
    if (!mentor || submittingInquiry) return;
    setSubmittingInquiry(true);
    try {
      const structuredMessage = [
        `[MENTORSHIP INQUIRY]`,
        `Mentor: ${mentor.name}`,
        `Mentor ID: ${mentor.id}`,
        `Topic: ${values.topic.trim()}`,
        `Phone: ${values.phone?.trim() || "Not provided"}`,
        `Requester Status: ${user ? `Authenticated (${user.id})` : "Guest / Direct Inquiry"}`,
        `--------------------------------------------------`,
        values.message.trim(),
      ].join("\n");

      const { error } = await (supabase as any).from("messages").insert([
        {
          name: values.name.trim(),
          email: values.email.trim(),
          subject: `Mentorship Inquiry: ${mentor.name}`,
          message: structuredMessage,
          status: "new",
        },
      ]);

      if (error) throw error;

      setSubmittedData(values);
      setSubmittedSuccess(true);
      toast.success("Mentorship inquiry submitted!");
    } catch (err: any) {
      console.error("Error submitting mentorship inquiry:", err);
      toast.error(err.message || "Could not submit inquiry. Please try again or contact support.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="h-6 w-32 rounded bg-muted/40 animate-pulse" />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 h-96 rounded-3xl bg-muted/20 animate-pulse" />
            <div className="lg:col-span-8 space-y-6">
              <div className="h-10 w-2/3 rounded-lg bg-muted/30 animate-pulse" />
              <div className="h-32 w-full rounded-2xl bg-muted/20 animate-pulse" />
              <div className="h-48 w-full rounded-2xl bg-muted/20 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 404 Mentor Not Found State
  if (notFound || !mentor) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 text-center">
        <SEOHead
          title="Mentor Profile Not Found — IndustryMentor"
          noindex={true}
        />
        <div className="max-w-md w-full p-8 rounded-3xl border border-border/60 bg-card/40 shadow-elev space-y-6">
          <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">Mentor Profile Not Found</h1>
            <p className="text-sm text-muted-foreground">
              The mentor profile you are looking for does not exist or may have been updated.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="hero" asChild className="w-full">
              <Link to="/mentors">Browse All Mentors</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const initials = mentor.initials || mentor.name.slice(0, 2).toUpperCase() || "IM";

  return (
    <main className="min-h-screen bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title={`${mentor.name} | IndustryMentor`}
        description={mentor.bio || `Learn directly from ${mentor.name}, ${mentor.title} at IndustryMentor.`}
        canonicalUrl={`https://industrymentor.net/mentors/${mentor.id}`}
        ogType="profile"
        ogImage={mentor.image_path?.startsWith("http") ? mentor.image_path : mentor.image_path ? `https://industrymentor.net${mentor.image_path}` : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: mentor.name,
          jobTitle: mentor.title,
          description: mentor.bio || undefined,
          image: mentor.image_path || undefined,
          sameAs: mentor.linkedin_url ? [mentor.linkedin_url] : undefined,
          worksFor: {
            "@type": "Organization",
            name: "IndustryMentor",
            url: "https://industrymentor.net",
          },
        }}
      />
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/mentors" className="hover:text-foreground transition-colors">
            Mentors
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{mentor.name}</span>
        </nav>

        {/* 2-Column Asymmetric Layout */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Column (Sticky Hero & Profile Card - 4 cols on desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <Card className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden text-center p-6 sm:p-8">
              {/* Photo & Verified Badge */}
              <div className="relative mx-auto mb-5 h-32 w-32 shrink-0 overflow-hidden rounded-full border border-border/80 ring-4 ring-primary/20 bg-surface-2 shadow-sm">
                {mentor.image_path ? (
                  <img
                    src={mentor.image_path}
                    alt={mentor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-black text-primary">{initials}</span>
                  </div>
                )}
                <div
                  className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center text-primary shadow-sm"
                  title="Verified Industry Mentor"
                >
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
              </div>

              {/* Verified Tag */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-wider mb-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Practitioner
              </div>

              {/* Name & Title */}
              <h1 className="text-2xl font-black tracking-tight text-foreground">{mentor.name}</h1>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-1 leading-snug">
                {mentor.title}
              </p>

              {/* Actions */}
              <div className="pt-6 mt-6 border-t border-border/50 space-y-3">
                {/* Mentorship Inquiry Modal Trigger */}
                <Dialog
                  open={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      setSubmittedSuccess(false);
                      setSubmittedData(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="hero" className="w-full font-bold text-sm h-10 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Request Mentorship
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg rounded-3xl border-border/60 bg-card p-6 sm:p-8">
                    {submittedSuccess && submittedData ? (
                      <div className="space-y-5 text-center py-2">
                        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary">
                          <CheckCircle2 className="h-7 w-7 text-primary" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5" /> Inquiry Logged
                          </div>
                          <DialogTitle className="text-xl font-bold text-foreground">
                            Mentorship Request Received
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
                            Your technical inquiry has been recorded and routed to our manufacturing coordination desk.
                          </DialogDescription>
                        </div>

                        {/* Structured Summary Card */}
                        <div className="rounded-2xl border border-border/60 bg-surface-2 p-4 text-left space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-border/40">
                            <span className="text-muted-foreground font-medium">Requested Mentor:</span>
                            <span className="font-semibold text-foreground">{mentor.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/40">
                            <span className="text-muted-foreground font-medium">Technical Topic:</span>
                            <span className="font-semibold text-foreground">{submittedData.topic}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/40">
                            <span className="text-muted-foreground font-medium">Contact Email:</span>
                            <span className="font-semibold text-foreground">{submittedData.email}</span>
                          </div>
                          {submittedData.phone && (
                            <div className="flex justify-between py-1 border-b border-border/40">
                              <span className="text-muted-foreground font-medium">Phone:</span>
                              <span className="font-semibold text-foreground">{submittedData.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Realistic Operational Disclaimer */}
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-left space-y-1.5">
                          <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Realistic Coordination Scope
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Our team will evaluate your technical focus area with {mentor.name} and get back to you via email with scheduling next steps.
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 italic pt-1">
                            * Submitting an inquiry does not constitute an instant calendar booking. Sessions are arranged individually based on factory shifts and practitioner availability.
                          </p>
                        </div>

                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => {
                            setDialogOpen(false);
                            setSubmittedSuccess(false);
                            setSubmittedData(null);
                            reset();
                          }}
                          className="w-full font-bold text-xs h-10"
                        >
                          Done
                        </Button>
                      </div>
                    ) : (
                      <>
                        <DialogHeader className="text-left space-y-2">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5" /> Direct Technical Advisory
                          </div>
                          <DialogTitle className="text-xl font-bold text-foreground">
                            Connect with {mentor.name}
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground">
                            Submit your technical question or career advisory request. Our coordination team will review your agenda with the mentor and respond with next steps.
                          </DialogDescription>
                        </DialogHeader>

                        {/* Non-editable Mentor Identification Banner */}
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-border/60 my-1">
                          <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-primary/30 bg-surface-2">
                            {mentor.image_path ? (
                              <img src={mentor.image_path} alt={mentor.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-xs font-bold text-primary">
                                {mentor.initials || "IM"}
                              </div>
                            )}
                          </div>
                          <div className="text-left leading-tight min-w-0">
                            <div className="text-xs font-bold text-foreground truncate">{mentor.name}</div>
                            <div className="text-[11px] text-primary font-semibold uppercase tracking-wider truncate">{mentor.title}</div>
                          </div>
                          <Badge variant="outline" className="ml-auto text-[10px] uppercase font-mono shrink-0 border-primary/30 text-primary">
                            Target Mentor
                          </Badge>
                        </div>

                        <form onSubmit={handleSubmit(onInquirySubmit)} className="space-y-4 pt-1">
                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="name" className="text-xs font-semibold">Your Full Name *</Label>
                            <Input
                              id="name"
                              placeholder="e.g. Abdullah Al Mamun"
                              {...register("name")}
                              className="h-10 text-xs rounded-xl bg-background/50"
                              disabled={submittingInquiry}
                            />
                            {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="email" className="text-xs font-semibold">Email Address *</Label>
                                {user?.email && (
                                  <span className="text-[10px] font-mono text-primary font-medium">Verified</span>
                                )}
                              </div>
                              <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                readOnly={Boolean(user?.email)}
                                {...register("email")}
                                className={`h-10 text-xs rounded-xl ${user?.email ? "bg-muted/40 cursor-not-allowed opacity-90" : "bg-background/50"}`}
                                disabled={submittingInquiry}
                              />
                              {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="phone" className="text-xs font-semibold">Phone (Optional)</Label>
                              <Input
                                id="phone"
                                placeholder="+8801..."
                                {...register("phone")}
                                className="h-10 text-xs rounded-xl bg-background/50"
                                disabled={submittingInquiry}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="topic" className="text-xs font-semibold">Technical Discipline / Focus Area *</Label>
                            <Input
                              id="topic"
                              placeholder="e.g. Industrial Engineering, Quality Inspection, Merchandising"
                              {...register("topic")}
                              className="h-10 text-xs rounded-xl bg-background/50"
                              disabled={submittingInquiry}
                            />
                            {errors.topic && <p className="text-[11px] text-destructive">{errors.topic.message}</p>}
                          </div>

                          <div className="space-y-1.5 text-left">
                            <Label htmlFor="message" className="text-xs font-semibold">Your Questions or Mentorship Goals *</Label>
                            <Textarea
                              id="message"
                              placeholder="Briefly describe what factory challenges you want to discuss or specific guidance you need..."
                              rows={4}
                              {...register("message")}
                              className="text-xs rounded-xl bg-background/50 resize-none"
                              disabled={submittingInquiry}
                            />
                            {errors.message && <p className="text-[11px] text-destructive">{errors.message.message}</p>}
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDialogOpen(false)}
                              disabled={submittingInquiry}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="cta"
                              size="sm"
                              disabled={submittingInquiry}
                              className="text-xs font-bold gap-1.5 min-w-36"
                            >
                              {submittingInquiry ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Send Inquiry
                                  <Send className="h-3.5 w-3.5" />
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </>
                    )}
                  </DialogContent>
                </Dialog>

                {mentor.linkedin_url && (
                  <Button variant="outline" size="sm" asChild className="w-full text-xs font-semibold h-9 gap-2">
                    <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 text-primary" />
                      View LinkedIn Profile
                    </a>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="w-full text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share Mentor Profile
                </Button>
              </div>

              {/* Practitioner Highlights */}
              <div className="pt-6 mt-6 border-t border-border/50 text-left space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Factory-Floor Verified
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Practitioner-Led Insights
                </div>
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Direct Technical Advisory
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column (Detailed Professional Narrative - 8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Professional Summary */}
            <section className="rounded-3xl border border-border/60 bg-card/25 p-6 sm:p-8 backdrop-blur-xl shadow-elev space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Briefcase className="h-4 w-4 text-primary" /> Professional Background & Industry Experience
              </div>

              {mentor.bio ? (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {mentor.bio}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Professional summary details are verified and on record with IndustryMentor.
                </p>
              )}
            </section>

            {/* Verified Technical Specializations */}
            {mentor.tags && mentor.tags.length > 0 && (
              <section className="rounded-3xl border border-border/60 bg-card/25 p-6 sm:p-8 backdrop-blur-xl shadow-elev space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Layers className="h-4 w-4 text-primary" /> Verified Technical Specializations
                </div>
                <p className="text-xs text-muted-foreground">
                  Core manufacturing, engineering, and quality disciplines verified for this mentor:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {mentor.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-mono px-3 py-1 bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Practical Factory Competencies */}
            <section className="rounded-3xl border border-border/60 bg-card/25 p-6 sm:p-8 backdrop-blur-xl shadow-elev space-y-5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Factory className="h-4 w-4 text-primary" /> Factory Operational Competencies
              </div>
              <p className="text-xs text-muted-foreground">
                Areas where {mentor.name} provides direct guidance to engineers, quality leaders, and merchandisers:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-4 rounded-2xl border border-border/60 bg-background/25 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Floor SOP Execution
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Standard operating procedures, critical tolerance checks, and production flow balancing.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/60 bg-background/25 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Defect Prevention & AQL
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Root cause analysis, inline/endline quality audit controls, and buyer compliance standards.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/60 bg-background/25 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Industrial Engineering Systems
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Standard minute value (SMV), line efficiency calculation, and work study implementation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/60 bg-background/25 space-y-1">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Career Navigation & Growth
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Guidance on navigating promotional tiers from executive to managerial and GM positions.
                  </p>
                </div>
              </div>
            </section>

            {/* Advisory Scope & Guidelines */}
            <section className="rounded-3xl border border-border/60 bg-card/25 p-6 sm:p-8 backdrop-blur-xl shadow-elev space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Compass className="h-4 w-4 text-primary" /> Mentorship Engagement Scope
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mentorship through IndustryMentor connects emerging professionals directly with practicing manufacturing leaders. All consultations focus on actionable technical problem-solving, factory floor realities, and industry-standard best practices.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-foreground">Ready to discuss your career or factory challenges?</div>
                  <div className="text-[11px] text-muted-foreground">Submit a structured mentorship inquiry to get started.</div>
                </div>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="shrink-0 font-bold text-xs"
                >
                  Contact Mentor
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
