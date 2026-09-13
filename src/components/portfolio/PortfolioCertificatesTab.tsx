import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  CheckCircle2,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  useEligibleApprovedCertificates,
  useAddCertificateToPortfolio,
  useRemovePortfolioItem,
} from "@/hooks/usePortfolio";
import type { PortfolioWithDetails } from "@/types/portfolio";
import { format } from "date-fns";

interface PortfolioCertificatesTabProps {
  portfolio: PortfolioWithDetails;
}

export function PortfolioCertificatesTab({
  portfolio,
}: PortfolioCertificatesTabProps) {
  const { data: eligibleCerts = [], isLoading: loadingEligible } =
    useEligibleApprovedCertificates();

  const addCertMutation = useAddCertificateToPortfolio();
  const removeItemMutation = useRemovePortfolioItem();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter items that are certificates
  const certItems = portfolio.items.filter((i) => i.certificate_id && i.certificate);
  const addedCertIds = new Set(certItems.map((i) => i.certificate_id));

  // Eligible certificates not yet added
  const unaddedEligibleCerts = eligibleCerts.filter(
    (ec) => !addedCertIds.has(ec.id)
  );

  const handleAddCert = async (certId: string) => {
    try {
      await addCertMutation.mutateAsync({
        portfolioId: portfolio.id,
        certificateId: certId,
      });
      toast.success("Verified certificate added to portfolio showcase!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add certificate to portfolio");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItemMutation.mutateAsync({ itemId });
      toast.success("Certificate removed from portfolio showcase (certificate remains valid).");
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove certificate from portfolio");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Showcase Certificates in Portfolio */}
      <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>Verified Credentials Showcase ({certItems.length})</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                These approved credentials demonstrate verified course completion on your public portfolio.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {certItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center space-y-3">
              <Award className="h-8 w-8 text-muted-foreground mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-foreground">
                  No Certificates in Showcase Yet
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Add verified course completion certificates from the eligible list below to strengthen your industry profile.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {certItems.map((item) => {
                const cert = item.certificate;
                const isDeleting = confirmDeleteId === item.id;
                const issueDate = cert?.issued_at ? new Date(cert.issued_at) : null;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-border"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground truncate">
                          {cert?.course?.title || "Professional Course Completion"}
                        </h4>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>Verified Certificate</span>
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {issueDate && (
                          <span>Issued: {format(issueDate, "MMM d, yyyy")}</span>
                        )}
                        <a
                          href={`/verify/${cert?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-mono text-[10px]"
                        >
                          <span>Verify Authenticity</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 text-xs gap-1"
                      >
                        <a
                          href={`/verify/${cert?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>

                      {isDeleting ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removeItemMutation.isPending}
                            className="h-8 text-xs font-semibold"
                          >
                            Confirm Remove
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Eligible Approved Certificates to Add */}
      <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <span>Eligible Verified Certificates ({unaddedEligibleCerts.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Only approved completion certificates issued by IndustryMentor can be added to your portfolio.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {loadingEligible ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Checking verified credentials...
            </div>
          ) : unaddedEligibleCerts.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-muted/10 p-6 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                {eligibleCerts.length === 0
                  ? "You don't have any verified course certificates yet. Complete enrolled courses to earn verified industry certificates!"
                  : "All of your verified certificates are currently showcased in your portfolio!"}
              </p>
              {eligibleCerts.length === 0 && (
                <Button size="sm" asChild className="text-xs font-bold gap-1.5 h-8">
                  <Link to="/courses">
                    <span>Explore Courses</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {unaddedEligibleCerts.map((cert) => {
                const issueDate = cert.issued_at ? new Date(cert.issued_at) : null;

                return (
                  <div
                    key={cert.id}
                    className="p-4 rounded-xl border border-border/50 bg-background/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {cert.course?.title || "Professional Course Certificate"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {issueDate && (
                          <span>Issued: {format(issueDate, "MMM d, yyyy")}</span>
                        )}
                        <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Verified Certificate
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddCert(cert.id)}
                      disabled={addCertMutation.isPending}
                      className="h-8 text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add to Showcase</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
