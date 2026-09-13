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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function VerifyCertificate() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchedId, setSearchedId] = useState<string | null>(null);

  const fetchCertificate = async (certId: string) => {
    const trimmedId = certId.trim();
    setSearchedId(trimmedId);

    if (!trimmedId || !UUID_REGEX.test(trimmedId)) {
      setError("Please enter a valid 36-character Certificate UUID.");
      setCertificate(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCertificate(null);

    try {
      // 1. Try secure RPC first
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
        "get_verified_certificate",
        { cert_id: trimmedId }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        const row = rpcData[0];
        setCertificate({
          id: row.id,
          status: row.status,
          issued_at: row.issued_at,
          profiles: { full_name: row.student_name },
          courses: { title: row.course_title },
        });
        return;
      }

      // 2. Fallback to direct read of approved certificate
      const { data, error: fetchError } = await (supabase as any)
        .from("certificates")
        .select("id, status, issued_at, courses(title), profiles(full_name)")
        .eq("id", trimmedId)
        .eq("status", "approved")
        .maybeSingle();

      if (fetchError || !data) {
        setError("Certificate not found or not yet approved. Please verify the ID.");
        return;
      }

      setCertificate(data);
    } catch {
      // Never expose internal database error details to public visitors
      setError("Certificate not found or invalid.");
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
      setCertificate(null);
      setError(null);
      setSearchedId(null);
    }
  }, [id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = searchInput.trim().replace(/\\/g, "");
    if (!cleanInput) return;
    navigate(`/verify/${encodeURIComponent(cleanInput)}`);
  };

  const handleResetSearch = () => {
    setCertificate(null);
    setError(null);
    setSearchedId(null);
    setSearchInput("");
    navigate("/verify");
  };

  const isValid = certificate && certificate.status === "approved";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/80 px-4 py-12">
      <SEOHead
        title="Certificate Verification | IndustryMentor"
        description="Verify credentials and certificates issued by IndustryMentor."
        canonicalUrl="https://industrymentor.net/verify"
      />
      <div className="w-full max-w-lg rounded-3xl bg-card border border-border/60 p-6 sm:p-10 shadow-xl text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <ShieldCheck className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Certificate Verification
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
          Verify the authenticity of professional IndustryMentor credentials issued to students.
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">
              Verifying credential with secure registry...
            </p>
          </div>
        ) : isValid ? (
          <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-3 fade-in duration-300">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base sm:text-lg mb-0.5">
                <CheckCircle2 className="h-5 w-5" />
                Authentic &amp; Valid Certificate
              </div>
              <p className="text-xs text-emerald-500/80">
                This credential was officially issued by IndustryMentor.
              </p>
            </div>

            <div className="space-y-4 text-left rounded-2xl border border-border/50 bg-muted/20 p-5 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                  Student Name
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">
                  {certificate.profiles?.full_name || "Enrolled Student"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                  Program Completed
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {certificate.courses?.title || "Professional Program"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Issue Date
                  </div>
                  <div className="text-xs font-medium text-foreground mt-0.5">
                    {new Date(certificate.issued_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    Certificate ID
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                    {certificate.id}
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSearch}
              className="gap-2 text-xs border-border/60"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Verify Another Certificate
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-left">
                <div className="flex items-center gap-2 text-destructive font-bold text-sm mb-1">
                  <XCircle className="h-4 w-4 shrink-0" />
                  Verification Notice
                </div>
                <p className="text-xs text-destructive/90">{error}</p>
                {searchedId && (
                  <p className="text-[11px] font-mono text-muted-foreground mt-1 truncate">
                    Searched: {searchedId}
                  </p>
                )}
              </div>
            )}

            {/* Certificate Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="text-left space-y-1.5">
                <label
                  htmlFor="cert-search-input"
                  className="text-xs font-semibold text-foreground"
                >
                  Enter Certificate ID (UUID)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cert-search-input"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="e.g. 1611d912-0665-40e6-af2f-a8a4863e9500"
                    className="pl-9 h-10 text-xs font-mono"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-10 text-xs font-semibold gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Verify Credential
              </Button>
            </form>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border/40">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground">
              Back to Home <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} IndustryMentor. All rights reserved.
      </div>
    </div>
  );
}
