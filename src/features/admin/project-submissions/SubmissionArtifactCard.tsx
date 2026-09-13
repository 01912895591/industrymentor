import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";

interface SubmissionArtifactCardProps {
  title: string | null;
  deliverableUrl: string | null;
  notes: string | null;
}

export function SubmissionArtifactCard({
  title,
  deliverableUrl,
  notes,
}: SubmissionArtifactCardProps) {
  const [copied, setCopied] = useState(false);

  const isValidHttps = deliverableUrl ? isValidHttpsUrl(deliverableUrl) : false;

  const handleCopyUrl = async () => {
    if (!deliverableUrl) return;
    try {
      await navigator.clipboard.writeText(deliverableUrl);
      setCopied(true);
      toast.success("Deliverable URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Title */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Submission Deliverable Title
          </span>
          <h3 className="text-base font-bold text-foreground mt-0.5">
            {title || "Untitled Submission"}
          </h3>
        </div>

        {/* Deliverable URL */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Deliverable Artifact Link
          </span>

          {deliverableUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-background/80 border border-border/60">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {isValidHttps ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                )}
                <span className="text-xs font-mono text-foreground truncate select-all">
                  {deliverableUrl}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleCopyUrl}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </Button>

                {isValidHttps ? (
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1 font-semibold"
                    asChild
                  >
                    <a
                      href={deliverableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open Link</span>
                    </a>
                  </Button>
                ) : (
                  <span className="text-[11px] text-destructive font-medium px-2">
                    Insecure URL
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/40 border border-dashed border-border text-xs text-muted-foreground">
              No deliverable URL provided.
            </div>
          )}
        </div>

        {/* Submission Notes */}
        {notes && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Student Methodology & Delivery Notes
            </span>
            <div className="rounded-lg bg-muted/30 border border-border/50 p-3 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {notes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
