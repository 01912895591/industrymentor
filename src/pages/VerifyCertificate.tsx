import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, XCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyCertificate() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [certificate, setCertificate] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCertificate = async () => {
            if (!id) {
                setError("Invalid Certificate ID");
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await (supabase as any)
                    .from("certificates")
                    .select("*, courses(title), profiles(full_name)")
                    .eq("id", id)
                    .single();

                if (fetchError) throw fetchError;
                setCertificate(data);
            } catch (err: any) {
                console.error("Verification failed:", err);
                setError("Certificate not found or invalid.");
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const isValid = certificate && certificate.status === "approved";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                </div>

                <h1 className="mb-2 text-2xl font-black tracking-tight text-gray-900">Certificate Verification</h1>

                {isValid ? (
                    <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg mb-1">
                                <CheckCircle2 className="h-6 w-6" />
                                Valid Certificate
                            </div>
                            <p className="text-xs text-green-600/80">This document is authentic and valid.</p>
                        </div>

                        <div className="space-y-4 text-left">
                            <div>
                                <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Student Name</div>
                                <div className="text-lg font-semibold text-gray-900">{certificate.profiles?.full_name || "Unknown Student"}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Course Completed</div>
                                <div className="text-lg font-semibold text-gray-900">{certificate.courses?.title || "Unknown Course"}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Issue Date</div>
                                    <div className="text-sm font-medium">{new Date(certificate.issued_at).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Certificate ID</div>
                                    <div className="text-sm font-medium font-mono text-xs">{certificate.id.substring(0, 8)}...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                            <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-lg mb-1">
                                <XCircle className="h-6 w-6" />
                                Invalid Certificate
                            </div>
                            <p className="text-xs text-red-600/80">{error || "This certificate could not be verified."}</p>
                        </div>
                    </div>
                )}

                <div className="mt-10 pt-6 border-t border-gray-100">
                    <Link to="/">
                        <Button variant="ghost" className="gap-2">
                            Back to Home <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} IndustryMentor. All rights reserved.
            </div>
        </div>
    );
}
