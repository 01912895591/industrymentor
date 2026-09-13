import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  UserCheck,
} from "lucide-react";
import type { ProjectSubmissionWithDetails } from "@/types/projects";

interface SubmissionTimelineProps {
  submission: ProjectSubmissionWithDetails;
}

export function SubmissionTimeline({ submission }: SubmissionTimelineProps) {
  const submittedDate = submission.submitted_at
    ? new Date(submission.submitted_at)
    : new Date(submission.created_at);

  const reviewedDate = submission.reviewed_at
    ? new Date(submission.reviewed_at)
    : null;

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Lifecycle Timeline
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {/* Step 1: Submission */}
        <div className="relative">
          <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500 text-blue-400">
            <Clock className="h-2.5 w-2.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Delivered by Student
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {format(submittedDate, "MMM d, yyyy 'at' h:mm a")} ({formatDistanceToNow(submittedDate, { addSuffix: true })})
            </div>
          </div>
        </div>

        {/* Step 2: In Review (if past submitted) */}
        {(submission.status === "in_review" || submission.status === "approved" || submission.status === "revision_required") && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500 text-purple-400">
              <Eye className="h-2.5 w-2.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">
                Under Mentor Review
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {submission.reviewer?.full_name ? `Assigned to ${submission.reviewer.full_name}` : "Assigned to Reviewer"}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Resolution (Approved or Revision Required) */}
        {reviewedDate && submission.status === "approved" && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-400">
                Evaluation Completed: Approved
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {format(reviewedDate, "MMM d, yyyy 'at' h:mm a")}
                {submission.reviewer?.full_name ? ` by ${submission.reviewer.full_name}` : ""}
              </div>
            </div>
          </div>
        )}

        {reviewedDate && submission.status === "revision_required" && (
          <div className="relative">
            <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500 text-amber-400">
              <AlertCircle className="h-2.5 w-2.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400">
                Evaluation: Revision Requested
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {format(reviewedDate, "MMM d, yyyy 'at' h:mm a")}
                {submission.reviewer?.full_name ? ` by ${submission.reviewer.full_name}` : ""}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
