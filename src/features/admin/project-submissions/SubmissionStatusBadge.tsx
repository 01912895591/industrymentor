import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock3,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { ProjectSubmissionStatus } from "@/types/projects";

interface SubmissionStatusBadgeProps {
  status: ProjectSubmissionStatus;
  className?: string;
  showIcon?: boolean;
}

export function SubmissionStatusBadge({
  status,
  className = "",
  showIcon = true,
}: SubmissionStatusBadgeProps) {
  switch (status) {
    case "submitted":
      return (
        <Badge
          variant="outline"
          className={`bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1.5 font-semibold text-xs ${className}`}
        >
          {showIcon && <Clock3 className="h-3.5 w-3.5" />}
          <span>Submitted (Pending)</span>
        </Badge>
      );
    case "in_review":
      return (
        <Badge
          variant="outline"
          className={`bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1.5 font-semibold text-xs ${className}`}
        >
          {showIcon && <Eye className="h-3.5 w-3.5" />}
          <span>In Review</span>
        </Badge>
      );
    case "approved":
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 font-semibold text-xs ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>Approved</span>
        </Badge>
      );
    case "revision_required":
      return (
        <Badge
          variant="outline"
          className={`bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1.5 font-semibold text-xs ${className}`}
        >
          {showIcon && <AlertCircle className="h-3.5 w-3.5" />}
          <span>Revision Required</span>
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-muted text-muted-foreground border-border/40 text-xs ${className}`}
        >
          <span>{status}</span>
        </Badge>
      );
  }
}
