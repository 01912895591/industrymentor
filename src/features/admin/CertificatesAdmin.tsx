import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Copy, Check, Award } from "lucide-react";

type ProfileRow = { id: string; user_id: string; full_name: string | null; created_at: string };

type CourseRow = { id: string; title: string; slug: string };

type CertificateRow = {
  id: string;
  user_id: string;
  course_id: string;
  certificate_path: string | null;
  issued_at: string;
  created_at: string;
  status: string;
};

export function CertificatesAdmin() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [certs, setCerts] = useState<CertificateRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const load = async () => {
    setBusy(true);
    try {
      const [pRes, cRes, certRes] = await Promise.all([
        (supabase as any).from("profiles").select("id,user_id,full_name,created_at").order("created_at", { ascending: false }).limit(200),
        (supabase as any).from("courses").select("id,title,slug").order("created_at", { ascending: false }).limit(200),
        (supabase as any)
          .from("certificates")
          .select("id,user_id,course_id,certificate_path,issued_at,created_at,status")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (pRes.error) throw pRes.error;
      if (cRes.error) throw cRes.error;
      if (certRes.error) throw certRes.error;

      setProfiles(pRes.data ?? []);
      setCourses(cRes.data ?? []);
      setCerts(certRes.data ?? []);
    } catch (e: any) {
      toast({ title: "Load failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();

  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected') => {
    setBusy(true);
    try {
      const updateData: any = { status: decision };
      if (decision === 'approved') {
        updateData.issued_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from("certificates")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Send notification
      const cert = certs.find(c => c.id === id);
      if (cert) {
        const courseTitle = courses.find(c => c.id === cert.course_id)?.title || "Course";
        const message = decision === 'approved'
          ? `Congratulations! Your certificate for "${courseTitle}" has been approved.`
          : `Your certificate request for "${courseTitle}" was rejected. Please check requirements or contact support.`;

        await (supabase as any).from("notifications").insert({
          user_id: cert.user_id,
          title: decision === 'approved' ? "Certificate Approved" : "Request Rejected",
          message: message,
          type: "system"
        });
      }

      toast({ title: `Request ${decision}`, description: "Status updated and user notified." });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const issueCertificate = async () => {
    if (!selectedUserId || !selectedCourseId) {
      toast({ title: "Select user + course", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const { error } = await (supabase as any).from("certificates").upsert(
        {
          user_id: selectedUserId,
          course_id: selectedCourseId,
          status: "approved",
          issued_at: new Date().toISOString(),
          certificate_path: "" // Placeholder
        },
        { onConflict: "user_id,course_id" }
      );
      if (error) throw error;

      // Send notification
      const courseTitle = courses.find(c => c.id === selectedCourseId)?.title || "Course";
      await (supabase as any).from("notifications").insert({
        user_id: selectedUserId,
        title: "Certificate Issued",
        message: `You have been issued a certificate for "${courseTitle}".`,
        type: "system"
      });

      toast({ title: "Certificate issued", description: "User notified." });
      setSelectedUserId("");
      setSelectedCourseId("");
      await load();
    } catch (e: any) {
      toast({ title: "Issue failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Issue Certificate Card */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <div className="text-lg font-bold">Certificates</div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Issue certificates for course graduates.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Student</Label>
            <select
              className="h-10 w-full rounded-md border border-border/60 bg-background/20 px-3 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select registered student</option>
              {profiles.map((p) => (
                <option key={p.user_id || p.id} value={p.user_id || p.id}>
                  {p.full_name ? `${p.full_name} (${(p.user_id || p.id).slice(0, 8)}...)` : (p.user_id || p.id)}
                </option>
              ))}
            </select>
            <Input
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Or paste student user_id directly"
              className="h-8 text-xs bg-background/40 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <select
              className="h-10 w-full rounded-md border border-border/60 bg-background/20 px-3 text-sm"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="hero" disabled={busy} onClick={() => void issueCertificate()}>
            Issue certificate
          </Button>
          <Button variant="soft" disabled={busy} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Pending Requests Card */}
      <div className="rounded-xl border border-destructive/20 bg-background/20 p-6 shadow-xs">
        <div className="text-lg font-bold text-destructive">Pending Requests</div>
        <div className="mt-4 space-y-3">
          {certs.filter(c => c.status === 'pending').length === 0 ? (
            <div className="text-sm text-muted-foreground">No pending requests.</div>
          ) : (
            certs.filter(c => c.status === 'pending').map(c => (
              <div key={c.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-xl border border-border/70 bg-card/60 p-4">
                <div>
                  <div className="font-bold">Course: {courses.find(co => co.id === c.course_id)?.title || c.course_id}</div>
                  <div className="text-xs text-muted-foreground mt-1">User: {profiles.find(p => p.user_id === c.user_id)?.full_name || c.user_id}</div>
                  <div className="text-xs text-muted-foreground">Requested: {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="hero" onClick={() => handleDecision(c.id, 'approved')}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDecision(c.id, 'rejected')}>Reject</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Latest Certificates List */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
        <div className="text-lg font-bold">Latest Certificates</div>
        <div className="mt-4 space-y-3">
          {certs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No certificates yet.</div>
          ) : (
            certs.map((c) => {
              const courseTitle = courses.find((co) => co.id === c.course_id)?.title || `Course (${c.course_id.slice(0, 8)}...)`;
              const studentName = profiles.find((p) => p.user_id === c.user_id)?.full_name || `Student (${c.user_id.slice(0, 8)}...)`;
              const isApproved = c.status === "approved";

              return (
                <div key={c.id} className="rounded-xl border border-border/70 bg-background/20 p-4 transition-all hover:bg-background/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base text-foreground">{courseTitle}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 font-medium ${
                            isApproved
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {c.status || "approved"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Student: <strong className="text-foreground font-medium">{studentName}</strong></span>
                        <span>•</span>
                        <span className="font-mono text-[11px] flex items-center gap-1">
                          Cert ID: {c.id.slice(0, 8)}...
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(c.id);
                              setCopiedId(c.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            title="Copy full certificate UUID"
                          >
                            {copiedId === c.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </span>
                        <span>•</span>
                        <span>Issued: {c.issued_at ? new Date(c.issued_at).toLocaleDateString() : new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
