import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, ShieldCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { PortfolioItemWithDetails } from "@/types/portfolio";

interface PublicCertificateCardProps {
  item: PortfolioItemWithDetails;
}

export function PublicCertificateCard({ item }: PublicCertificateCardProps) {
  const cert = item.certificate;
  if (!cert) return null;

  const issueDate = cert.issued_at ? new Date(cert.issued_at) : null;

  return (
    <Card className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/40 flex flex-col justify-between">
      <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Award className="h-5 w-5" />
            </div>

            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold gap-1"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Verified Credential</span>
            </Badge>
          </div>

          <div>
            <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug">
              {cert.course?.title || "Professional Course Completion"}
            </h4>
            {issueDate && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Issued on {format(issueDate, "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border/40">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="w-full text-xs font-semibold gap-1.5 h-8 border-border/60 hover:bg-muted"
          >
            <a
              href={`/verify/${cert.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Verify Credential Authenticity</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
