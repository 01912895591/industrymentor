import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCourseTitle } from "@/lib/formatTitle";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  CreditCard,
  Phone,
  Mail,
  User,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  purchase_id: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  sender_phone: string | null;
  status: "pending" | "active" | "rejected" | string;
  completed: boolean;
  created_at: string;
  courses?: {
    id: string;
    title: string;
    price_cents?: number;
  };
  profiles?: {
    full_name: string | null;
    email?: string | null;
    phone?: string | null;
  };
  user_email?: string;
}

export function EnrollmentsAdmin() {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "active" | "rejected">("pending");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      // Fetch enrollments with related course information
      const { data: enrollData, error: enrollError } = await (supabase as any)
        .from("course_enrollments")
        .select(`
          id,
          user_id,
          course_id,
          purchase_id,
          payment_method,
          transaction_id,
          sender_phone,
          status,
          completed,
          created_at,
          courses (
            id,
            title,
            price_cents
          )
        `)
        .order("created_at", { ascending: false });

      if (enrollError) throw enrollError;

      // Fetch profiles to match student names and phones
      const { data: profileData } = await (supabase as any)
        .from("profiles")
        .select("user_id, full_name, phone");

      const profileMap = new Map<string, { full_name: string | null; phone: string | null }>();
      (profileData || []).forEach((p: any) => {
        profileMap.set(p.user_id, { full_name: p.full_name, phone: p.phone });
      });

      const merged: EnrollmentRecord[] = (enrollData || []).map((e: any) => ({
        ...e,
        profiles: profileMap.get(e.user_id) || { full_name: null, phone: null },
      }));

      setEnrollments(merged);
    } catch (err: any) {
      console.error("Error loading enrollments:", err);
      toast.error(err.message || "Failed to load course enrollments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEnrollments();
  }, []);

  const handleApprove = async (record: EnrollmentRecord) => {
    setBusyId(record.id);
    try {
      // 1. Update enrollment status to active
      const { error: enrollUpdateError } = await (supabase as any)
        .from("course_enrollments")
        .update({ status: "active" })
        .eq("id", record.id);

      if (enrollUpdateError) throw enrollUpdateError;

      // 2. If purchase record exists, mark as completed
      if (record.purchase_id) {
        await (supabase as any)
          .from("purchases")
          .update({ status: "completed" })
          .eq("id", record.purchase_id);
      }

      // 3. Send system notification to the student
      const courseName = record.courses?.title || "your course";
      await (supabase as any).from("notifications").insert({
        user_id: record.user_id,
        title: "Enrollment Approved! 🎉",
        message: `Your payment for "${courseName}" has been verified. You now have full access to the classroom!`,
        type: "system",
      });

      toast.success("Enrollment Approved & Activated!", {
        description: `Student now has full access to "${courseName}".`,
      });

      // Update state locally for instant feedback
      setEnrollments((prev) =>
        prev.map((item) => (item.id === record.id ? { ...item, status: "active" } : item))
      );
    } catch (err: any) {
      console.error("Error approving enrollment:", err);
      toast.error(err.message || "Failed to approve enrollment.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (record: EnrollmentRecord) => {
    if (!confirm("Are you sure you want to mark this enrollment payment as Rejected?")) {
      return;
    }

    setBusyId(record.id);
    try {
      const { error } = await (supabase as any)
        .from("course_enrollments")
        .update({ status: "rejected" })
        .eq("id", record.id);

      if (error) throw error;

      if (record.purchase_id) {
        await (supabase as any)
          .from("purchases")
          .update({ status: "failed" })
          .eq("id", record.purchase_id);
      }

      const courseName = record.courses?.title || "your course";
      await (supabase as any).from("notifications").insert({
        user_id: record.user_id,
        title: "Enrollment Verification Update",
        message: `We could not verify the payment transaction ID submitted for "${courseName}". Please check your payment details or contact support.`,
        type: "system",
      });

      toast.info("Enrollment marked as Rejected.");
      setEnrollments((prev) =>
        prev.map((item) => (item.id === record.id ? { ...item, status: "rejected" } : item))
      );
    } catch (err: any) {
      console.error("Error rejecting enrollment:", err);
      toast.error(err.message || "Failed to update enrollment status.");
    } finally {
      setBusyId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Transaction ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and search
  const filtered = enrollments.filter((item) => {
    if (filterStatus !== "all" && item.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrx = (item.transaction_id || "").toLowerCase().includes(q);
      const matchPhone = (item.sender_phone || "").toLowerCase().includes(q);
      const matchName = (item.profiles?.full_name || "").toLowerCase().includes(q);
      const matchCourse = (item.courses?.title || "").toLowerCase().includes(q);
      return matchTrx || matchPhone || matchName || matchCourse;
    }

    return true;
  });

  const pendingCount = enrollments.filter((e) => e.status === "pending").length;
  const activeCount = enrollments.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Course Enrollments &amp; Payments
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Verify manual MFS payments (bKash / Nagad / Rocket / Bank) and grant course access.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadEnrollments}
          disabled={loading}
          className="gap-2 h-9 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card/60 border border-border/60">
          <button
            onClick={() => setFilterStatus("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === "pending"
                ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filterStatus === "active"
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === "all"
                ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({enrollments.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search TrxID, phone, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs bg-card/40 border-border/60"
          />
        </div>
      </div>

      {/* Enrollments Table / Card List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Loading enrollments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border/60 rounded-3xl bg-card/20 space-y-2">
          <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/60" />
          <div className="text-sm font-bold text-foreground">No enrollments found</div>
          <p className="text-xs text-muted-foreground">
            {filterStatus === "pending"
              ? "All submitted enrollments are currently verified and up to date!"
              : "No course enrollments match your current search criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const isPending = record.status === "pending";
            const isActive = record.status === "active";
            const isRejected = record.status === "rejected";
            const isBusy = busyId === record.id;

            return (
              <div
                key={record.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isPending
                    ? "bg-amber-500/[0.03] border-amber-500/30 hover:border-amber-500/50"
                    : isActive
                    ? "bg-card/30 border-border/60 hover:border-emerald-500/30"
                    : "bg-destructive/[0.02] border-destructive/20"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student & Course Info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-foreground truncate">
                        {formatCourseTitle(record.courses?.title) || "Course"}
                      </span>
                      {isPending && (
                        <Badge variant="outline" className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                          Pending Verification
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                          Active &amp; Verified
                        </Badge>
                      )}
                      {isRejected && (
                        <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] font-bold">
                          Rejected
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-primary" />
                        <span className="font-semibold text-foreground">
                          {record.profiles?.full_name || "Student"}
                        </span>
                      </span>
                      {record.sender_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" />
                          <span className="font-mono">{record.sender_phone}</span>
                        </span>
                      )}
                      <span>
                        Enrolled {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Payment Info Box */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-background/60 border border-border/60 flex items-center gap-2.5 text-xs">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                        {record.payment_method || "MFS"}
                      </span>
                      <div className="h-3 w-px bg-border/80" />
                      <div className="font-mono font-bold text-foreground">
                        {record.transaction_id || "NO-TRX-ID"}
                      </div>
                      {record.transaction_id && (
                        <button
                          onClick={() => copyToClipboard(record.transaction_id!, record.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Copy TrxID"
                        >
                          {copiedId === record.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <>
                          <Button
                            size="sm"
                            variant="hero"
                            className="h-8 text-xs font-bold gap-1 px-3"
                            onClick={() => handleApprove(record)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve &amp; Activate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/30"
                            onClick={() => handleReject(record)}
                            disabled={isBusy}
                          >
                            Reject
                          </Button>
                        </>
                      ) : isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => handleReject(record)}
                          disabled={isBusy}
                        >
                          Revoke Access
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30"
                          onClick={() => handleApprove(record)}
                          disabled={isBusy}
                        >
                          Re-Approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
