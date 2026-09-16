import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Search,
  RotateCcw,
  ExternalLink,
  Award,
  Calendar,
  User,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Accept standard 36-char UUID or 8-10 char alphanumeric short code
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHORT_ID_REGEX = /^[0-9a-zA-Z]{8,12}$/;

interface VerifiedCertData {
  id: string;
  shortId?: string;
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  status: string;
  trainingHours?: string;
  issuer?: string;
}

export default function VerifyCertificate() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState<VerifiedCertData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  const fetchCertificate = async (certId: string) => {
    const rawTrimmed = certId.trim();
    const cleanId = rawTrimmed.replace(/[^a-zA-Z0-9-]/g, "");
    setSearchedId(cleanId);
    setRateLimited(false);

    if (!cleanId || (!UUID_REGEX.test(cleanId) && !SHORT_ID_REGEX.test(cleanId))) {
      setError("Please enter a valid Certificate ID (e.g. 9A0FF246 or full UUID).");
      setCertData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCertData(null);

    // 1. Try rate-limited Edge API first (/api/verify)
    try {
      const resp = await fetch(`/api/verify?id=${encodeURIComponent(cleanId)}`);
      
      if (resp.status === 429) {
        setRateLimited(true);
        setError("Too many verification attempts. Please wait 1 minute before trying again.");
        setLoading(false);
        return;
      }

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data) {
          setCertData({
            id: json.data.id,
            shortId: json.data.shortId,
            studentName: json.data.studentName,
            courseTitle: json.data.courseTitle,
            issuedAt: json.data.issuedAt,
            status: json.data.status,
            issuer: json.data.issuer || "IndustryMentor",
          });
          setLoading(false);
          return;
        }
      } else if (resp.status === 404) {
        setError("✗ Not Found — Invalid Certificate. No approved credential was found for this ID.");
        setLoading(false);
        return;
      }
    } catch {
      // Edge API unreachable or offline in local dev; continue to direct Supabase verification
    }

    // 2. Direct Supabase verification fallback
    try {
      let resolvedUuid: string | null = null;

      if (UUID_REGEX.test(cleanId)) {
        resolvedUuid = cleanId.toLowerCase();
      } else {
        // Look up by short prefix
        const prefix = cleanId.toLowerCase();
        const { data: certs } = await (supabase as any)
          .from("certificates")
          .select("id")
          .eq("status", "approved");

        const matched = (certs || []).find((c: any) =>
          c.id.replace(/-/g, "").toLowerCase().startsWith(prefix)
        );
        if (matched) {
          resolvedUuid = matched.id;
        }
      }

      if (!resolvedUuid) {
        setError("✗ Not Found — Invalid Certificate. No approved credential was found matching this ID.");
        return;
      }

      // Call secure Postgres RPC
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        "get_verified_certificate",
        { cert_id: resolvedUuid }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        const row = rpcData[0];
        setCertData({
          id: row.id,
          shortId: row.id.replace(/-/g, "").slice(0, 8).toUpperCase(),
          studentName: row.student_name,
          courseTitle: row.course_title,
          issuedAt: row.issued_at,
          status: row.status,
          issuer: "IndustryMentor (industrymentor.net)",
        });
        return;
      }

      // Fallback direct table read
      const { data, error: fetchError } = await (supabase as any)
        .from("certificates")
        .select("id, status, issued_at, courses(title), profiles(full_name)")
        .eq("id", resolvedUuid)
        .eq("status", "approved")
        .maybeSingle();

      if (fetchError || !data) {
        setError("✗ Not Found — Invalid Certificate. This credential is not authentic or has been revoked.");
        return;
      }

      setCertData({
        id: data.id,
        shortId: data.id.replace(/-/g, "").slice(0, 8).toUpperCase(),
        studentName: data.profiles?.full_name || "Verified Student",
        courseTitle: data.courses?.title || "Professional Program",
        issuedAt: data.issued_at,
        status: data.status,
        issuer: "IndustryMentor (industrymentor.net)",
      });
    } catch {
      setError("Unable to complete verification at this moment. Please check the ID or try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && id !== "search") {
      setSearchInput(id);
      void fetchCertificate(id);
    } else {
      setLoading(false);
      setCertData(null);
      setError(null);
      setSearchedId(null);
    }
  }, [id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = searchInput.trim().replace(/[^a-zA-Z0-9-]/g, "");
    if (!cleanInput) return;
    navigate(`/verify/${encodeURIComponent(cleanInput)}`);
  };

  const handleResetSearch = () => {
    setCertData(null);
    setError(null);
    setSearchedId(null);
    setSearchInput("");
    navigate("/verify");
  };

  const isVerified = certData && certData.status === "approved";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-muted/20 to-background px-4 py-12">
      <SEOHead
        title="Certificate Verification | IndustryMentor"
        description="Verify the authenticity of professional IndustryMentor certificates."
        canonicalUrl="https://industrymentor.net/verify"
      />

      <div className="w-full max-w-xl rounded-3xl bg-card border border-border/70 p-6 sm:p-10 shadow-2xl text-center backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Brand Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1D9E75] to-[#378ADD]" />

        {/* Shield Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D9E75]/15 to-[#378ADD]/15 border border-[#1D9E75]/25 shadow-xs">
          <ShieldCheck className="h-10 w-10 text-[#1D9E75]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Certificate Verification
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Official IndustryMentor registry verification. Confirm credentials issued to industry professionals.
        </p>

        {/* Loading State */}
        {loading ? (
          <div className="py-14 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-[#1D9E75]" />
            <p className="text-xs text-muted-foreground font-medium animate-pulse">
              Querying tamper-evident certificate registry...
            </p>
          </div>
        ) : isVerified ? (
          /* VERIFIED STATE */
          <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-3 fade-in duration-300">
            {/* Verified Badge Header */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center shadow-xs">
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg mb-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ✓ Verified Official Certificate
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/90 font-medium">
                This credential was officially issued by IndustryMentor and is authentic.
              </p>
            </div>

            {/* Certificate Details Card */}
            <div className="space-y-4 text-left rounded-2xl border border-border/70 bg-card/80 p-6 text-xs shadow-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  <User className="h-3.5 w-3.5 text-[#1D9E75]" />
                  Recipient Student
                </div>
                <div className="text-lg font-bold text-foreground mt-1">
                  {certData.studentName}
                </div>
              </div>

              <div className="pt-3 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                  <Award className="h-3.5 w-3.5 text-[#378ADD]" />
                  Course Completed
                </div>
                <div className="text-base font-bold text-foreground mt-1 bg-gradient-to-r from-[#1D9E75] to-[#378ADD] bg-clip-text text-transparent">
                  {certData.courseTitle}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <Calendar className="h-3 w-3" />
                    Issue Date
                  </div>
                  <div className="text-xs font-semibold text-foreground mt-1">
                    {new Date(certData.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    <Hash className="h-3 w-3" />
                    Certificate ID &amp; Serial
                  </div>
                  <div className="text-xs font-mono font-bold text-[#1D9E75] mt-1">
                    {certData.shortId || certData.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    IM-{certData.shortId || certData.id.slice(0, 8).toUpperCase()}-BD
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                <span>Training: <strong>{certData.trainingHours || "40 training hours"}</strong></span>
                <span>Issuer: <strong>IndustryMentor</strong></span>
                <span className="font-mono text-[10px] text-muted-foreground/70 truncate max-w-[180px]" title={certData.id}>
                  UUID: {certData.id.slice(0, 14)}...
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSearch}
                className="gap-2 text-xs border-border/70 hover:border-primary/50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Verify Another Certificate
              </Button>

              <Link to="/certificate-preview">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 text-xs bg-gradient-to-r from-[#0F6E56] to-[#378ADD] text-white"
                >
                  <Award className="h-3.5 w-3.5" /> Certificate Preview
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* SEARCH OR ERROR / INVALID STATE */
          <div className="mt-8 space-y-6">
            {rateLimited ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-left">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-1">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  Rate Limit Notice
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200/90 leading-relaxed">
                  Too many certificate lookup requests have been made from your connection. For security and fraud prevention, requests are limited to 10 per minute. Please try again in 60 seconds.
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-left">
                <div className="flex items-center gap-2 text-destructive font-bold text-sm mb-1">
                  <XCircle className="h-5 w-5 shrink-0" />
                  ✗ Not Found — Invalid Certificate
                </div>
                <p className="text-xs text-destructive/90 leading-relaxed">
                  {error}
                </p>
                {searchedId && (
                  <p className="text-[11px] font-mono text-muted-foreground mt-2 bg-background/60 p-2 rounded-md border border-border/40 truncate">
                    Searched ID: <strong>{searchedId}</strong>
                  </p>
                )}
              </div>
            ) : null}

            {/* Certificate Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="text-left space-y-1.5">
                <label
                  htmlFor="cert-search-input"
                  className="text-xs font-semibold text-foreground"
                >
                  Enter Certificate ID (e.g. 9A0FF246 or UUID)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cert-search-input"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="e.g. 9A0FF246 or 9a0ff246-9646-43bb-a087-073d08cd9848"
                    className="pl-9 h-10 text-xs font-mono uppercase"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-10 text-xs font-semibold gap-1.5 bg-gradient-to-r from-[#1D9E75] to-[#378ADD] hover:opacity-90 text-white"
              >
                <Search className="h-3.5 w-3.5" />
                Verify Credential
              </Button>
            </form>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border/40">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
              Back to Home <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} IndustryMentor. Tamper-Evident Credential Registry.
      </div>
    </div>
  );
}
